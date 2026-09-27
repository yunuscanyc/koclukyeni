#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ubuntu 4 Çekirdek & 4 GB RAM Optimize Edilmiş
Deneme Sınavı Soru Koordinat Tespit, Sayfa Dikleştirme & Gelişmiş Dewarp Servisi (app.py)

Bu servis:
1. 90°, 180°, 270° dönük ve eğik fotoğrafları otomatik algılar ve dikleştirir (Auto-Rotate & Fine Deskew).
2. Kitap ayrımı ve sayfa bükülmesinden doğan yay (arc) eğriliklerini çok bantlı regresyon ile cetvel gibi düzleştirir (Multi-Band Dewarping).
3. YOLOv8/v11 Nano modeli (best.pt / best_question_detector.pt) ile soruların kesin koordinatlarını çıkarır.
4. Çift sütunlu deneme sınavı fiziksel okuma sırasına (Sol Sütun -> Sağ Sütun) göre soru numaralandırır.
5. Canlı görsel testinde döndürme, dikleştirme, yay düzeltme ve soru kutusu etiketlerini renkli ve net çizer.
"""

import os
import sys
import time
import json
import gc
import base64
import threading
from typing import List, Optional, Dict, Any, Tuple

import cv2
import numpy as np
import psutil
from fastapi import FastAPI, File, UploadFile, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Ultralytics YOLO kütüphanesi
try:
    from ultralytics import YOLO
except ImportError:
    print("[UYARI] ultralytics kütüphanesi bulunamadı. Lütfen 'pip install ultralytics' komutunu çalıştırın.")
    YOLO = None

# Watchdog
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    Observer = None
    FileSystemEventHandler = object

# ============================================================================
# YAPILANDIRMA VE SABİTLER (4 GB RAM & 4 CPU ÖZEL AYARLARI)
# ============================================================================
MODEL_PATH = os.environ.get("YOLO_MODEL_PATH", "")
FALLBACK_MODEL = "yolov8n.pt" # Özel model henüz eğitilmediyse geçici baz model
WATCH_DIR = os.environ.get("WATCH_DIR", "/var/www/deneme_app/inputs")
PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")

# CPU ve RAM için optimize sınırlar
MAX_IMAGE_DIM = 1280    # Yüksek çözünürlüklü resimleri max 1280'e ölçekle (RAM koruması)
YOLO_IMGSZ = 800        # Optimize YOLO girdi boyutu (800 boyutu küçük matematik formülleri ve şıkları yakalar)
EDGE_MARGIN = 0         # Sayfa kenar marjı (Yakın çekim soruların elenmesini önlemek için 0)
MIN_BOX_SIZE = 35       # Min genişlik ve yükseklik
CONFIDENCE_THRESHOLD = 0.22 # Varsayılan güven eşiği (Hassas ve eksiksiz tespit için 0.22 idealdir)

# ============================================================================
# MODEL YÜKLEME (GLOBAL SINGLETON)
# ============================================================================
model_instance = None
model_name_loaded = None

def find_available_model_path():
    """Özel eğitilmiş YOLO modelini otomatik bulur (best.pt veya best_question_detector.pt)."""
    candidates = [
        MODEL_PATH,
        "best_question_detector.pt",
        "best.pt",
        os.path.join("runs", "question_detector", "deneme_yolo", "weights", "best.pt"),
        os.path.join("runs", "detect", "train", "weights", "best.pt"),
        "model.pt",
        "last.pt"
    ]
    for c in candidates:
        if c and os.path.exists(c) and os.path.isfile(c):
            return c
    return None

def get_yolo_model():
    global model_instance, model_name_loaded
    if model_instance is not None:
        return model_instance

    if YOLO is None:
        return None

    resolved_path = find_available_model_path()

    if resolved_path:
        print(f"[YOLO] Özel soru tespit modeli yükleniyor: {resolved_path}")
        model_instance = YOLO(resolved_path)
        model_name_loaded = os.path.basename(resolved_path)
    else:
        print(f"[YOLO] Özel model (best.pt / best_question_detector.pt) henüz bulunamadı. Baz model ({FALLBACK_MODEL}) yükleniyor...")
        print("[İPUCU] Eğittiğiniz 'best.pt' dosyasını bu servis klasörüne atmanız yeterlidir.")
        model_instance = YOLO(FALLBACK_MODEL)
        model_name_loaded = FALLBACK_MODEL

    return model_instance

# ============================================================================
# 1. OTOMATİK DİKLEŞTİRME VE DÖNDÜRME (90°, 180°, 270° & İNCE DESKEW)
# ============================================================================
def measure_orientation_scores(gray_img: np.ndarray) -> Dict[str, Any]:
    """
    Belgedeki yatay metin satırlarının (horizontal) ve dikey sütunların (vertical)
    morfolojik ve gradyan belirginliğini ölçer.
    """
    if gray_img is None or gray_img.size == 0:
        return {"score_h": 1.0, "score_v": 1.0, "is_vertical_text": False}

    h, w = gray_img.shape[:2]
    scale = 600.0 / max(h, w) if max(h, w) > 600 else 1.0
    small = cv2.resize(gray_img, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA) if scale < 1.0 else gray_img
    sh, sw = small.shape[:2]

    # Otsu binarizasyon (metin = 255)
    _, bin_inv = cv2.threshold(small, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # 1. Yatay Morfoloji (Kelimeleri satır bantlarına birleştirir)
    kh = cv2.getStructuringElement(cv2.MORPH_RECT, (int(max(14, sw * 0.04)), 1))
    morph_h = cv2.morphologyEx(bin_inv, cv2.MORPH_CLOSE, kh)
    row_sum = np.sum(morph_h, axis=1, dtype=np.float32)
    var_row = float(np.var(row_sum))

    # 2. Dikey Morfoloji (Dikey sütunları birleştirir)
    kv = cv2.getStructuringElement(cv2.MORPH_RECT, (1, int(max(14, sh * 0.04))))
    morph_v = cv2.morphologyEx(bin_inv, cv2.MORPH_CLOSE, kv)
    col_sum = np.sum(morph_v, axis=0, dtype=np.float32)
    var_col = float(np.var(col_sum))

    # 3. Sobel Gradyanları
    grad_y = np.abs(cv2.Sobel(small, cv2.CV_32F, 0, 1, ksize=3))
    grad_x = np.abs(cv2.Sobel(small, cv2.CV_32F, 1, 0, ksize=3))
    var_sobel_y = float(np.var(np.mean(grad_y, axis=1))) # Yatay satırlarda tepe yapar
    var_sobel_x = float(np.var(np.mean(grad_x, axis=0))) # Dikey satırlarda tepe yapar

    score_h = var_row * (var_sobel_y + 1e-4)
    score_v = var_col * (var_sobel_x + 1e-4)

    return {
        "score_h": score_h,
        "score_v": score_v,
        "is_vertical_text": score_v > (score_h * 1.08)
    }

def calculate_text_orientation_score(gray_img: np.ndarray) -> float:
    """Yatay metin satır belirginlik skoru."""
    res = measure_orientation_scores(gray_img)
    return res["score_h"]

def detect_coarse_rotation_fast(img_bgr: np.ndarray) -> Tuple[np.ndarray, int, str]:
    """
    HIZLI VE KESİN YÖN TESPİTİ (0°, 90°, 180°, 270°):
    YOLO modeli 180° ters yazılara da kutu çizebildiği için YOLO KESİNLİKLE yön tespitinde referans alınmaz!
    Yön tespiti doğrudan belgenin fiziksel/tipografik özellikleri ve hafif Tesseract OSD ile <200ms içinde yapılır.
    """
    if img_bgr is None:
        return img_bgr, 0, "Görsel yok"

    h, w = img_bgr.shape[:2]

    # 1. HIZ VE RAM KORUMASI: Analiz için görüntüyü 600px küçük kopyaya küçült (0.01 sn sürer)
    scale = 600.0 / max(h, w)
    thumb = cv2.resize(img_bgr, (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    thumb_gray = cv2.cvtColor(thumb, cv2.COLOR_BGR2GRAY)
    th, tw = thumb_gray.shape[:2]

    # 2. ADIM: Tesseract OSD (Orientation and Script Detection) - Varsa ultra hızlı (100ms)
    try:
        import pytesseract
        # OSD sadece yön tespiti yapar, tam OCR yapmadığı için CPU'da anında döner
        osd_out = pytesseract.image_to_osd(thumb_gray, config='--psm 0')
        rot_found = None
        conf_found = 0.0
        for line in osd_out.splitlines():
            line_str = line.strip()
            if line_str.startswith("Rotate:"):
                rot_found = int(line_str.split(":")[1].strip())
            elif line_str.startswith("Orientation confidence:"):
                conf_found = float(line_str.split(":")[1].strip())

        if rot_found is not None and conf_found >= 1.5:
            if rot_found == 90:
                print(f"[OSD Yön] Tesseract OSD {rot_found}° dönüş tespit etti (Güven: {conf_found})")
                return cv2.rotate(img_bgr, cv2.ROTATE_90_CLOCKWISE), 90, f"OSD: 90° Sağa Çevrildi"
            elif rot_found == 180:
                print(f"[OSD Yön] Tesseract OSD 180° baş aşağı tespit etti (Güven: {conf_found})")
                return cv2.rotate(img_bgr, cv2.ROTATE_180), 180, f"OSD: 180° Baş Aşağı Düzeltildi"
            elif rot_found == 270:
                print(f"[OSD Yön] Tesseract OSD {rot_found}° dönüş tespit etti (Güven: {conf_found})")
                return cv2.rotate(img_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE), 270, f"OSD: 90° Sola (270°) Çevrildi"
            elif rot_found == 0:
                return img_bgr, 0, "OSD: Sayfa Düzgün (0°)"
    except Exception:
        # Tesseract veya OSD yoksa fiziksel belge analizine geç
        pass

    # 3. ADIM: FİZİKSEL BELGE VE TİPOGRAFİ ANALİZİ (Tesseract olmadan 5ms içinde çalışır)
    is_landscape = (w > h * 1.05)

    if is_landscape:
        # Fotoğraf yatay çekilmiş (2 aday var: 90° saat yönü veya 270° saat yönünün tersi)
        # Biri düz dikey A4, diğeri ise 180° baş aşağı dikey A4 olacaktır.
        # Hangi yönün başlık/üst kısmı yukarı getirdiğini hesaplayalım:
        # 90° saat yönü döndürüldüğünde: Orijinal görselin SOL kenarı ÜST kenar olur.
        # 270° döndürüldüğünde: Orijinal görselin SAĞ kenarı ÜST kenar olur.
        strip_sz = int(tw * 0.22)
        left_strip = thumb_gray[:, :strip_sz]
        right_strip = thumb_gray[:, -strip_sz:]

        # Koyu mürekkep piksellerini say (luminance < 140)
        left_dark = np.sum(left_strip < 140)
        right_dark = np.sum(right_strip < 140)

        # Başlık ve satır varyansı (başlıkların olduğu bölgede gradyan yüksektir)
        left_grad = float(np.var(np.mean(cv2.Sobel(left_strip, cv2.CV_32F, 0, 1), axis=1)))
        right_grad = float(np.var(np.mean(cv2.Sobel(right_strip, cv2.CV_32F, 0, 1), axis=1)))

        score_left = float(left_dark) * (left_grad + 1e-3)
        score_right = float(right_dark) * (right_grad + 1e-3)

        if score_left > score_right * 1.08:
            print("[Fiziksel Yön] Yatay görselde başlık SOLDA tespit edildi -> 90° saat yönünde dikleştirildi.")
            return cv2.rotate(img_bgr, cv2.ROTATE_90_CLOCKWISE), 90, "90° Sağa Dikleştirildi (Başlık Üstte)"
        else:
            print("[Fiziksel Yön] Yatay görselde başlık SAĞDA tespit edildi -> 270° dikleştirildi.")
            return cv2.rotate(img_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE), 270, "270° Sola Dikleştirildi (Başlık Üstte)"

    else:
        # Fotoğraf zaten dikey (A4 portrait). 0° mi yoksa 180° baş aşağı mı?
        # A4 test sayfasında üst %18 (başlık, test adı, 1. soru) ile alt %18 (sayfa altı boşluğu) karşılaştırılır:
        top_sz = int(th * 0.18)
        top_strip = thumb_gray[:top_sz, :]
        bot_strip = thumb_gray[-top_sz:, :]

        top_dark = np.sum(top_strip < 140)
        bot_dark = np.sum(bot_strip < 140)

        # Eğer alt kısımda üst kısma göre belirgin bir yoğunluk fazlası varsa sayfa 180° terstir
        if bot_dark > (top_dark * 1.60):
            print("[Fiziksel Yön] Dikey sayfa baş aşağı tespit edildi -> 180° çevrildi.")
            return cv2.rotate(img_bgr, cv2.ROTATE_180), 180, "180° Baş Aşağı Düzeltildi"

        return img_bgr, 0, "Dikey & Düzgün"

def detect_coarse_rotation(img_bgr: np.ndarray, model=None) -> Tuple[np.ndarray, int]:
    """Geriye uyumluluk için alias."""
    res_img, deg, _ = detect_coarse_rotation_fast(img_bgr)
    return res_img, deg

def detect_fine_deskew_angle(img_bgr: np.ndarray) -> float:
    """
    ±25 dereceye kadar olan ince çekim eğriliklerini (deskew) hassasça hesaplar.
    Hough çizgi dönüşümü ve yatay izdüşüm profil varyansı birleşimini kullanır.
    """
    if img_bgr is None:
        return 0.0

    h, w = img_bgr.shape[:2]
    scale = 1.0
    if max(h, w) > 900:
        scale = 900.0 / max(h, w)
        small_gray = cv2.resize(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY), (0, 0), fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    else:
        small_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    sh, sw = small_gray.shape[:2]

    # Otsu binarizasyon
    _, thresh = cv2.threshold(small_gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # 1. YÖNTEM: Hough Çizgileri ile Metin Satırları ve Dikey Sütun Çizgilerini Yakala
    edges = cv2.Canny(thresh, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180.0, threshold=90, minLineLength=int(sw * 0.15), maxLineGap=12)

    angles = []
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            dx = x2 - x1
            dy = y2 - y1
            if dx == 0:
                continue
            deg = np.degrees(np.arctan2(dy, dx))
            # Yatay satırlar (-25° ile +25° arası)
            if -25.0 <= deg <= 25.0:
                angles.append(deg)
            # Dikey sütun çizgileri (65° ile 115° arası -> 90° farkı al)
            elif 65.0 <= deg <= 115.0:
                vert_tilt = deg - 90.0
                angles.append(vert_tilt)
            elif -115.0 <= deg <= -65.0:
                vert_tilt = deg + 90.0
                angles.append(vert_tilt)

    if len(angles) >= 5:
        # Aşırı uçları at ve medyan al
        median_angle = float(np.median(angles))
        if abs(median_angle) >= 0.4 and abs(median_angle) <= 25.0:
            return round(median_angle, 2)

    # 2. YÖNTEM: Morfolojik Metin Bantları İle İzdüşüm Taraması
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 2))
    dilated = cv2.dilate(thresh, kernel, iterations=2)
    contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    box_angles = []
    for c in contours:
        area = cv2.contourArea(c)
        if area > 100:
            rect = cv2.minAreaRect(c)
            bw, bh = rect[1]
            b_angle = rect[2]
            if bw < bh:
                b_angle = b_angle + 90.0
            if -25.0 <= b_angle <= 25.0 and abs(b_angle) > 0.4:
                box_angles.append(b_angle)

    if len(box_angles) >= 6:
        med = float(np.median(box_angles))
        if abs(med) >= 0.4 and abs(med) <= 25.0:
            return round(med, 2)

    return 0.0

def detect_and_fix_orientation(
    img_bgr: np.ndarray,
    force_orientation: Optional[int] = None,
    model=None
) -> Tuple[np.ndarray, int, float, str]:
    """
    Tam otomatik veya zorunlu yön düzeltici:
    1. 90°, 180°, 270° kaba döndürme (Fiziksel tipografi / Tesseract OSD veya istemci zorlaması)
    2. ±25° ince açı doğrultma (Deskew)
    Dönüş: (diklestirilmis_resim, kaba_aci, ince_aci, aciklama)
    """
    if img_bgr is None:
        return img_bgr, 0, 0.0, "Görsel yok"

    # 1. Kaba Dönüş (0, 90, 180, 270)
    if force_orientation is not None:
        coarse_rot = int(force_orientation) % 360
        if coarse_rot == 90:
            rotated_img = cv2.rotate(img_bgr, cv2.ROTATE_90_CLOCKWISE)
        elif coarse_rot == 180:
            rotated_img = cv2.rotate(img_bgr, cv2.ROTATE_180)
        elif coarse_rot == 270:
            rotated_img = cv2.rotate(img_bgr, cv2.ROTATE_90_COUNTERCLOCKWISE)
        else:
            rotated_img = img_bgr.copy()
            coarse_rot = 0
        rot_desc = f"Manuel Seçim: {coarse_rot}°"
    else:
        rotated_img, coarse_rot, rot_desc = detect_coarse_rotation_fast(img_bgr)

    # 2. İnce Açı Tespiti (Deskew)
    fine_angle = detect_fine_deskew_angle(rotated_img)

    result_img = rotated_img
    h, w = rotated_img.shape[:2]

    if abs(fine_angle) >= 0.4:
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, fine_angle, 1.0)
        # Kenarları temiz beyaz ile doldurarak döndür
        result_img = cv2.warpAffine(
            rotated_img, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(255, 255, 255)
        )

    parts = []
    if coarse_rot != 0:
        parts.append(f"{coarse_rot}° Döndürüldü")
    if abs(fine_angle) >= 0.4:
        parts.append(f"İnce Açı: {fine_angle}° Dikleştirildi")
    if not parts:
        parts.append("Düzgün (Döndürme gerekmedi)")

    desc = ", ".join(parts)
    return result_img, coarse_rot, fine_angle, desc

# ============================================================================
# 2. AKILLI ÇOK BANTLI YAY (ARC / SPINE DEWARPING) DÜZELTİCİ
# ============================================================================
def adaptive_page_dewarp(warped: np.ndarray) -> Tuple[np.ndarray, bool, int, float]:
    """
    Çok Bantlı Kitap Kıvrımı ve Yay (Arc) Düzeltici:
    Kitabın orta cildinden veya elle tutulmasından kaynaklı bükülen sayfayı
    birden fazla yatay banttan tarar. Yay eğriliğini modelleyip cetvel gibi düzleştirir.
    Dönüş: (duzeltilmis_resim, uygulandi_mi, sag_piksel, sag_yuzde)
    """
    if warped is None:
        return warped, False, 0, 0.0

    wh, ww = warped.shape[:2]
    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)

    # Başlık ve dipnot boşluklarını atlayarak %15 ile %85 arasındaki 5 farklı yatay bandı analiz et
    band_ratios = [(0.15, 0.30), (0.30, 0.45), (0.45, 0.60), (0.60, 0.75), (0.75, 0.88)]
    band_curves = []

    # Otsu eşikleme ile metin pikselleri
    _, bin_inv = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    # Metin satırlarını sürekli yatay bantlara bağla
    morph_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (35, 3))
    text_bands = cv2.morphologyEx(bin_inv, cv2.MORPH_CLOSE, morph_kernel)

    step_x = max(2, ww // 45)

    for (top_r, bot_r) in band_ratios:
        y1 = int(wh * top_r)
        y2 = int(wh * bot_r)
        band = text_bands[y1:y2, :]

        pts_x = []
        pts_y = []

        for x in range(0, ww, step_x):
            col = band[:, x]
            whites = np.where(col > 0)[0]
            if len(whites) >= 2:
                # Kolondaki medyan y konumu
                pts_x.append(float(x))
                pts_y.append(float(y1 + np.median(whites)))

        if len(pts_x) >= 15:
            try:
                poly = np.polyfit(pts_x, pts_y, 2)
                a, b, c = poly
                fit_y = a * (np.array(pts_x)**2) + b * np.array(pts_x) + c
                sag = float(np.max(fit_y) - np.min(fit_y))
                # Makul bir yay eğriliği mi? (Sayfa yüksekliğinin %0.7'si ile %16'sı arası)
                if (wh * 0.007) <= sag <= (wh * 0.16):
                    band_curves.append((a, b, c, sag))
            except Exception:
                continue

    # Eğer güvenilir yay eğriliği bulunamadıysa sayfa zaten düzdür, dokunma!
    if len(band_curves) == 0:
        return warped, False, 0, 0.0

    # Medyan eğrilik katsayılarını seç
    band_curves.sort(key=lambda item: item[3])
    median_curve = band_curves[len(band_curves) // 2]
    a, b, c, sag = median_curve

    sag_px = int(round(sag))
    sag_percent = round((sag / float(wh)) * 100, 2)

    try:
        # Sayfa genişliği boyunca eğrilik ofset haritası hesapla
        xs = np.arange(ww, dtype=np.float32)
        curve_y = a * (xs**2) + b * xs + c

        # Uç noktaları bağlayan doğrusal referans çizgisi
        baseline_y = np.linspace(curve_y[0], curve_y[-1], ww, dtype=np.float32)
        # Her dikey kolondaki sapma miktarı (Delta Y)
        dy_profile = curve_y - baseline_y

        # Görüntü dönüşüm haritaları (Remap)
        map_x, map_y = np.meshgrid(np.arange(ww, dtype=np.float32), np.arange(wh, dtype=np.float32))

        # Her pikseli eğriliğin tersi yönünde yukarı/aşağı kaydır
        # dy_profile'ı tüm satırlara genişlet
        dy_grid = np.tile(dy_profile, (wh, 1))
        map_y = map_y - dy_grid

        map_x = np.clip(map_x, 0, ww - 1).astype(np.float32)
        map_y = np.clip(map_y, 0, wh - 1).astype(np.float32)

        # Temiz beyaz kenarlıkla düzelt
        dewarped = cv2.remap(
            warped,
            map_x, map_y,
            interpolation=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_CONSTANT,
            borderValue=(255, 255, 255)
        )
        return dewarped, True, sag_px, sag_percent

    except Exception as e:
        print(f"[UYARI] Dewarp hesaplanırken hata oluştu: {e}")
        return warped, False, 0, 0.0

# ============================================================================
# 3. KAPSAMLI ÖN İŞLEME & PERSPEKTİF DOĞRULTMA PİPELINE
# ============================================================================
def fix_page_dewarp_and_perspective(
    img_bgr: np.ndarray,
    auto_rotate: bool = True,
    auto_dewarp: bool = True,
    force_orientation: Optional[int] = None,
    model=None
) -> Tuple[np.ndarray, Dict[str, Any]]:
    """
    1. 90/180/270 derece dikleştirme (Fiziksel tipografi / Tesseract OSD veya Manuel)
    2. İnce açı deskew doğrultması
    3. Perspektif 4 köşe düzeltme (Eğer net sayfa konturu varsa)
    4. Akıllı çok bantlı yay (arc) düzeltmesi
    """
    if img_bgr is None:
        return None, {}

    # Çözünürlüğü RAM koruması ve hız için 1280 sınırında tut
    h, w = img_bgr.shape[:2]
    if max(h, w) > MAX_IMAGE_DIM:
        scale = MAX_IMAGE_DIM / float(max(h, w))
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    info = {
        "coarse_rot": 0,
        "fine_angle": 0.0,
        "rotation_desc": "Uygulanmadı",
        "dewarp_applied": False,
        "sag_px": 0,
        "sag_percent": 0.0,
        "perspective_applied": False
    }

    processed = img_bgr.copy()

    # 1. Otomatik veya Zorunlu Dikleştirme (90/180/270 dönüklük & Deskew)
    if auto_rotate or force_orientation is not None:
        processed, coarse_rot, fine_deg, rot_desc = detect_and_fix_orientation(
            processed,
            force_orientation=force_orientation,
            model=model
        )
        info["coarse_rot"] = coarse_rot
        info["fine_angle"] = fine_deg
        info["rotation_desc"] = rot_desc

    # 2. Perspektif Dört Köşe Düzeltme (Yalnızca belirgin ve düzgün 4 köşe varsa)
    gray = cv2.cvtColor(processed, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 30, 150)
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    page_contour = None
    for c in contours[:5]:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and cv2.contourArea(approx) > (processed.shape[0] * processed.shape[1] * 0.40):
            page_contour = approx
            break

    if page_contour is not None:
        try:
            pts = page_contour.reshape(4, 2)
            rect = np.zeros((4, 2), dtype="float32")
            s = pts.sum(axis=1)
            rect[0] = pts[np.argmin(s)]
            rect[2] = pts[np.argmax(s)]
            diff = np.diff(pts, axis=1)
            rect[1] = pts[np.argmin(diff)]
            rect[3] = pts[np.argmax(diff)]

            (tl, tr, br, bl) = rect
            widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
            widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
            maxWidth = max(int(widthA), int(widthB))

            heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
            heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
            maxHeight = max(int(heightA), int(heightB))

            if maxWidth > 200 and maxHeight > 200:
                dst = np.array([
                    [0, 0],
                    [maxWidth - 1, 0],
                    [maxWidth - 1, maxHeight - 1],
                    [0, maxHeight - 1]
                ], dtype="float32")

                M = cv2.getPerspectiveTransform(rect, dst)
                processed = cv2.warpPerspective(processed, M, (maxWidth, maxHeight), borderValue=(255, 255, 255))
                info["perspective_applied"] = True
        except Exception:
            pass

    # 3. Akıllı Çok Bantlı Yay (Arc) Düzeltme
    if auto_dewarp:
        processed, dewarp_done, sag_px, sag_pct = adaptive_page_dewarp(processed)
        info["dewarp_applied"] = dewarp_done
        info["sag_px"] = sag_px
        info["sag_percent"] = sag_pct

    return processed, info

# ============================================================================
# 4. HASSAS VE GÜÇLÜ SORU TESPİTİ (YOLO + MULTI-SCALE + ADAPTIVE FALLBACK)
# ============================================================================
def calculate_iou(boxA, boxB):
    """İki kutu arasındaki Intersection over Union (IoU) oranını hesaplar."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

    if float(boxAArea + boxBArea - interArea) <= 0:
        return 0.0
    return interArea / float(boxAArea + boxBArea - interArea)

def filter_and_deduplicate_boxes(boxes: List[Tuple[int, int, int, int, float]], iou_thresh: float = 0.50):
    """Çakışan kutuları eler, yüksek güven skoruna sahip olanı korur (NMS)."""
    if len(boxes) == 0:
        return []

    boxes = sorted(boxes, key=lambda b: b[4], reverse=True)
    kept = []

    for b in boxes:
        overlap = False
        for k in kept:
            if calculate_iou(b[:4], k[:4]) > iou_thresh:
                overlap = True
                break
        if not overlap:
            kept.append(b)

    return kept

def get_clean_question_coordinates(
    image_bgr: np.ndarray,
    conf_thresh: float = CONFIDENCE_THRESHOLD,
    margin: int = EDGE_MARGIN,
    min_size: int = MIN_BOX_SIZE,
    auto_dewarp: bool = True,
    auto_rotate: bool = True,
    force_orientation: Optional[int] = None
) -> Dict[str, Any]:
    """
    Soruların koordinatlarını hesaplar.
    Gelişmiş döndürme, yay düzeltme, adaptif güven düşürme ve çift sütun okuma sıralaması içerir.
    YOLO modeli 180° ters yazılara da kutu çizebildiği için YOLO KESİNLİKLE sayfa yönünü belirlemede kullanılmaz!
    """
    model = get_yolo_model()

    # 1. Görüntüyü Dikleştir ve Yayları Düzelt (YOLO'dan önce kesin olarak yapılır)
    cleaned_img, prep_info = fix_page_dewarp_and_perspective(
        image_bgr,
        auto_rotate=auto_rotate,
        auto_dewarp=auto_dewarp,
        force_orientation=force_orientation,
        model=model
    )

    if cleaned_img is None:
        return {
            "total": 0,
            "questions": [],
            "processed_image": None,
            "width": 0,
            "height": 0,
            "prep_info": prep_info
        }

    height, width = cleaned_img.shape[:2]
    valid_questions = []

    if model is not None:
        if len(cleaned_img.shape) == 2:
            model_input = cv2.cvtColor(cleaned_img, cv2.COLOR_GRAY2BGR)
        else:
            model_input = cleaned_img.copy()

        # 1. AŞAMA: BİRİNCİL TAHMİN (imgsz=800 ile yüksek hassasiyet)
        results = model.predict(
            source=model_input,
            conf=conf_thresh,
            imgsz=YOLO_IMGSZ,
            device='cpu',
            workers=1,
            verbose=False
        )

        raw_boxes = []
        if len(results) > 0 and results[0].boxes is not None:
            for box in results[0].boxes:
                coords = box.xyxy.tolist()[0]
                x1, y1, x2, y2 = int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])
                conf = float(box.conf.item()) if hasattr(box.conf, 'item') else float(box.conf[0])
                raw_boxes.append((x1, y1, x2, y2, conf))

        # 2. AŞAMA: HASSASİYET YEDEKLEMESİ (CONFIDENCE FALLBACK)
        # Kullanıcının eşiği yüksek kalmışsa ve hala 0 veya 1 soru varsa eşiği 0.15'e kadar düşür
        if len(raw_boxes) <= 1 and conf_thresh > 0.16:
            fb_res = model.predict(
                source=model_input,
                conf=0.15,
                imgsz=YOLO_IMGSZ,
                device='cpu',
                workers=1,
                verbose=False
            )
            if len(fb_res) > 0 and fb_res[0].boxes is not None and len(fb_res[0].boxes) > len(raw_boxes):
                raw_boxes = []
                for box in fb_res[0].boxes:
                    coords = box.xyxy.tolist()[0]
                    x1, y1, x2, y2 = int(coords[0]), int(coords[1]), int(coords[2]), int(coords[3])
                    conf = float(box.conf.item()) if hasattr(box.conf, 'item') else float(box.conf[0])
                    raw_boxes.append((x1, y1, x2, y2, conf))
                print(f"[YOLO Fallback] Güven eşiği 0.15'e çekilerek {len(raw_boxes)} soru bulundu.")

        # Çakışan kutuları IoU NMS ile temizle
        raw_boxes = filter_and_deduplicate_boxes(raw_boxes, iou_thresh=0.45)

        # 3. AŞAMA: FİLTRELEME & NORMALİZASYON
        for x1, y1, x2, y2, conf in raw_boxes:
            cx1 = max(0, min(width - 1, x1))
            cy1 = max(0, min(height - 1, y1))
            cx2 = max(0, min(width, x2))
            cy2 = max(0, min(height, y2))

            box_width = cx2 - cx1
            box_height = cy2 - cy1

            if box_width < min_size or box_height < min_size:
                continue

            if margin > 0:
                is_touching_left = cx1 < margin
                is_touching_right = cx2 > (width - margin)
                is_touching_top = cy1 < margin
                is_touching_bottom = cy2 > (height - margin)

                is_full_page_question = (box_width > width * 0.40) and (box_height > height * 0.18)
                is_narrow_cutoff = (box_width < 90 and (is_touching_left or is_touching_right)) or \
                                   (box_height < 60 and (is_touching_top or is_touching_bottom))

                if is_narrow_cutoff and not is_full_page_question:
                    continue

            norm_ymin = int(round((cy1 / float(height)) * 1000))
            norm_xmin = int(round((cx1 / float(width)) * 1000))
            norm_ymax = int(round((cy2 / float(height)) * 1000))
            norm_xmax = int(round((cx2 / float(width)) * 1000))

            valid_questions.append({
                "pixel_coords": {
                    "x1": cx1,
                    "y1": cy1,
                    "x2": cx2,
                    "y2": cy2,
                    "width": box_width,
                    "height": box_height
                },
                "normalized_box": [
                    max(0, min(1000, norm_ymin)),
                    max(0, min(1000, norm_xmin)),
                    max(0, min(1000, norm_ymax)),
                    max(0, min(1000, norm_xmax))
                ],
                "confidence": round(conf, 3)
            })

    # Fiziksel okuma sırasına göre sırala: Önce sol sütun (yukardan aşağı), sonra sağ sütun (yukardan aşağı)
    valid_questions.sort(key=lambda q: (
        0 if q["normalized_box"][1] < 490 else 1,
        q["normalized_box"][0]
    ))

    for idx, q in enumerate(valid_questions):
        q["soru_no"] = idx + 1

    gc.collect()

    return {
        "width": width,
        "height": height,
        "total_valid_questions": len(valid_questions),
        "questions": valid_questions,
        "model_used": model_name_loaded,
        "processed_image": cleaned_img,
        "prep_info": prep_info
    }

# ============================================================================
# FASTAPI UYGULAMASI (WEB ARAYÜZÜ ENTEGRASYONU)
# ============================================================================
app = FastAPI(
    title="Deneme Sınavı Soru Tespiti & Gelişmiş Dewarp Servisi",
    description="Ubuntu 4GB RAM CPU-Optimize Edilmiş YOLO, Dikleştirme & Çok Bantlı Dewarping Servisi",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DetectRequest(BaseModel):
    imageBase64: str
    confThreshold: Optional[float] = CONFIDENCE_THRESHOLD
    margin: Optional[int] = EDGE_MARGIN
    minSize: Optional[int] = MIN_BOX_SIZE
    autoDewarp: Optional[bool] = True
    autoRotate: Optional[bool] = True
    forceOrientation: Optional[int] = None
    returnPreview: Optional[bool] = False

@app.on_event("startup")
def startup_event():
    print("[BAŞLATMA] YOLO modeli taranıyor ve RAM'e alınıyor...")
    get_yolo_model()

@app.get("/")
def read_root():
    get_yolo_model()
    return {
        "service": "YKS Deneme Sınavı Soru Tespiti & Dewarp Servisi",
        "status": "online",
        "model": model_name_loaded or "best.pt",
        "device": "cpu",
        "ram_gb": round(psutil.virtual_memory().total / (1024**3), 2),
        "cpu_count": psutil.cpu_count(),
        "features": {
            "auto_rotate": "90/180/270 derece + İnce Deskew",
            "adaptive_dewarp": "Çok Bantlı Akıllı Yay Düzeltme",
            "yolo_detector": model_name_loaded or "best.pt"
        }
    }

@app.get("/health")
def health_check():
    get_yolo_model()
    vm = psutil.virtual_memory()
    return {
        "status": "healthy",
        "cpu_usage_percent": psutil.cpu_percent(interval=None),
        "ram_usage_percent": vm.percent,
        "ram_available_mb": round(vm.available / (1024**2), 1),
        "model_loaded": model_instance is not None,
        "model_name": model_name_loaded or "best.pt",
        "features": {
            "auto_rotate": True,
            "adaptive_dewarp": True
        }
    }

@app.post("/api/detect-questions")
async def detect_questions_endpoint(payload: DetectRequest):
    try:
        # Base64 decode
        raw_b64 = payload.imageBase64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        img_bytes = base64.b64decode(raw_b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Geçersiz görsel verisi!")

        use_dewarp = payload.autoDewarp if payload.autoDewarp is not None else True
        use_rotate = payload.autoRotate if payload.autoRotate is not None else True

        t_start = time.time()
        results = get_clean_question_coordinates(
            img_bgr,
            conf_thresh=payload.confThreshold or CONFIDENCE_THRESHOLD,
            margin=payload.margin if payload.margin is not None else EDGE_MARGIN,
            min_size=payload.minSize or MIN_BOX_SIZE,
            auto_dewarp=use_dewarp,
            auto_rotate=use_rotate,
            force_orientation=payload.forceOrientation
        )
        process_time_ms = int((time.time() - t_start) * 1000)
        prep = results.get("prep_info", {})

        # Önizleme resmi istenmişse doğrudan işlenmiş dikey tuval üzerine kutuları çiz
        preview_base64 = None
        if payload.returnPreview:
            proc_img = results.get("processed_image")
            if proc_img is None:
                proc_img = img_bgr.copy()

            if len(proc_img.shape) == 2:
                preview_bgr = cv2.cvtColor(proc_img, cv2.COLOR_GRAY2BGR)
            else:
                preview_bgr = proc_img.copy()

            pw_h, pw_w = preview_bgr.shape[:2]

            # 1. BİLGİ ŞERİDİ (Görselin en üstüne şık durum rozeti)
            rot_txt = prep.get("rotation_desc", "Düz")
            sag_px = prep.get("sag_px", 0)
            dewarp_txt = f"Yay Düzeltildi: {sag_px}px (%{prep.get('sag_percent', 0)}%)" if prep.get("dewarp_applied") else "Yay: Düz"
            status_bar = f" {rot_txt}  |  {dewarp_txt}  |  Model: {results['model_used']}  |  {results['total_valid_questions']} Soru Bulundu "

            bar_h = 32
            cv2.rectangle(preview_bgr, (0, 0), (pw_w, bar_h), (20, 24, 38), -1)
            cv2.putText(
                preview_bgr, status_bar,
                (12, 21),
                cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 1, cv2.LINE_AA
            )

            # 2. SORU KUTULARI VE ETİKETLERİ
            for q in results["questions"]:
                c = q["pixel_coords"]
                # Canlı zümrüt yeşili kalın çerçeve (3px)
                cv2.rectangle(preview_bgr, (c["x1"], c["y1"]), (c["x2"], c["y2"]), (0, 215, 80), 3)

                label_txt = f"S{q['soru_no']} (%{int(q['confidence']*100)})"
                (tw, th), _ = cv2.getTextSize(label_txt, cv2.FONT_HERSHEY_SIMPLEX, 0.60, 2)
                bx1 = max(0, c["x1"])
                by1 = max(bar_h + 2, c["y1"] - th - 8)
                bx2 = min(pw_w - 1, bx1 + tw + 12)
                by2 = max(bar_h + 2, c["y1"])
                cv2.rectangle(preview_bgr, (bx1, by1), (bx2, by2), (0, 190, 70), -1)
                cv2.putText(
                    preview_bgr, label_txt,
                    (bx1 + 6, by1 + th + 3),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.58, (0, 0, 0), 2, cv2.LINE_AA
                )

            # Eğer 0 soru tespit edildiyse ortada uyarı rozeti göster
            if len(results["questions"]) == 0:
                warn_txt = "Bu gorselde soru tespit edilemedi (Guven esigini %15'e indirin veya modeli egitin)"
                (wtw, wth), _ = cv2.getTextSize(warn_txt, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 2)
                wx1 = max(10, (pw_w - wtw) // 2 - 15)
                wy1 = max(50, pw_h // 2 - 25)
                wx2 = min(pw_w - 10, wx1 + wtw + 30)
                wy2 = wy1 + wth + 30
                cv2.rectangle(preview_bgr, (wx1, wy1), (wx2, wy2), (0, 0, 180), -1)
                cv2.putText(
                    preview_bgr, warn_txt,
                    (wx1 + 15, wy1 + wth + 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA
                )

            _, buf = cv2.imencode(".jpg", preview_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 88])
            preview_base64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

        return {
            "success": True,
            "process_time_ms": process_time_ms,
            "width": results["width"],
            "height": results["height"],
            "total_questions": results["total_valid_questions"],
            "count": results["total_valid_questions"],
            "questions": results["questions"],
            "preview_image": preview_base64,
            "preview_image_base64": preview_base64,
            "model": results["model_used"],
            "rotation_applied": prep.get("coarse_rot", 0),
            "deskew_angle": prep.get("fine_angle", 0.0),
            "rotation_desc": prep.get("rotation_desc", "Düz"),
            "dewarp_applied": prep.get("dewarp_applied", False),
            "dewarp_sag_px": prep.get("sag_px", 0),
            "dewarp_sag_percent": prep.get("sag_percent", 0.0)
        }

    except Exception as e:
        print(f"[HATA] Soru tespiti başarısız: {e}")
        return {
            "success": False,
            "error": str(e),
            "questions": []
        }

@app.post("/api/dewarp-image")
async def dewarp_image_endpoint(payload: DetectRequest):
    """Görseli dikleştirir, yayını düzeltir ve işlenmiş saf görseli döndürür."""
    try:
        raw_b64 = payload.imageBase64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        img_bytes = base64.b64decode(raw_b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Geçersiz görsel verisi!")

        use_dewarp = payload.autoDewarp if payload.autoDewarp is not None else True
        use_rotate = payload.autoRotate if payload.autoRotate is not None else True

        model = get_yolo_model()
        cleaned_img, prep = fix_page_dewarp_and_perspective(
            img_bgr,
            auto_rotate=use_rotate,
            auto_dewarp=use_dewarp,
            model=model
        )

        _, buf = cv2.imencode(".jpg", cleaned_img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
        cleaned_b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

        return {
            "success": True,
            "dewarped_image": cleaned_b64,
            "rotation_applied": prep.get("coarse_rot", 0),
            "deskew_angle": prep.get("fine_angle", 0.0),
            "rotation_desc": prep.get("rotation_desc", "Düz"),
            "dewarp_applied": prep.get("dewarp_applied", False),
            "dewarp_sag_px": prep.get("sag_px", 0)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

# ============================================================================
# WATCHDOG KLASÖR İZLEME DAEMON'I
# ============================================================================
class NewImageHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory and event.src_path.lower().endswith(('.png', '.jpg', '.jpeg')):
            print(f"\n[DAEMON] Yeni deneme sayfası algılandı: {event.src_path}")
            time.sleep(1.2) # Dosya yazımının bitmesini bekle

            try:
                img = cv2.imread(event.src_path)
                if img is None:
                    return

                res = get_clean_question_coordinates(img)
                json_path = os.path.splitext(event.src_path)[0] + ".json"

                output_data = {
                    "image_path": event.src_path,
                    "processed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "total_valid_questions": res["total_valid_questions"],
                    "questions": res["questions"],
                    "model": res["model_used"],
                    "rotation_applied": res.get("prep_info", {}).get("coarse_rot", 0),
                    "deskew_angle": res.get("prep_info", {}).get("fine_angle", 0.0),
                    "dewarp_applied": res.get("prep_info", {}).get("dewarp_applied", False)
                }

                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(output_data, f, ensure_ascii=False, indent=4)

                print(f"[BAŞARILI] {res['total_valid_questions']} soru tespit edildi -> {json_path}")
            except Exception as e:
                print(f"[HATA] Görsel işlenirken hata oluştu: {e}")

def start_watchdog_thread(watch_path: str):
    if Observer is None:
        print("[UYARI] Watchdog kurulu değil, klasör dinleyici başlatılamadı.")
        return

    os.makedirs(watch_path, exist_ok=True)
    event_handler = NewImageHandler()
    observer = Observer()
    observer.schedule(event_handler, path=watch_path, recursive=False)
    observer.start()
    print(f"[DAEMON] Klasör izleyici aktif: {watch_path}")

# ============================================================================
# BAŞLATMA
# ============================================================================
if __name__ == "__main__":
    # Modeli erkenden RAM'e al
    get_yolo_model()

    # Klasör izlemeyi arka plan iş parçacığı olarak başlat
    watch_thread = threading.Thread(target=start_watchdog_thread, args=(WATCH_DIR,), daemon=True)
    watch_thread.start()

    # FastAPI Uvicorn sunucusunu başlat
    import uvicorn
    print(f"[HTTP] REST API başlatılıyor: http://{HOST}:{PORT}")
    uvicorn.run(app, host=HOST, port=PORT, access_log=False)
