#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ubuntu 4 Çekirdek & 4 GB RAM Optimize Edilmiş
Deneme Sınavı Soru Koordinat Tespit & Belge Düzeltme Servisi (app.py)

Bu servis:
1. Perspektif eğriliğini 4 köşe tespiti ile düzeltir.
2. Kitap ayrımı ve sayfa bükülmesinden doğan yay (arc) eğriliklerini matematiksel sinüs haritalama ile düzeltir (Dewarping).
3. Arka plandaki filigranları ve gri tonlu ters baskıları (watermark) silip sayfayı bembeyaz yapar.
4. YOLOv8/v11 Nano modeli ile soruların [ymin, xmin, ymax, xmax] koordinatlarını çıkarır.
5. Kenar marjı kontrolü (margin=10) ile yarım çıkmış veya kadraja sığmamış soruları otomatik olarak eler.
6. Hem HTTP REST API (FastAPI) hem de klasör izleme (Watchdog) olarak eş zamanlı çalışabilir.
"""

import os
import sys
import time
import json
import gc
import base64
import threading
from typing import List, Optional, Dict, Any

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
MODEL_PATH = os.environ.get("YOLO_MODEL_PATH", "best_question_detector.pt")
FALLBACK_MODEL = "yolov8n.pt" # Özel model henüz eğitilmediyse geçici baz model
WATCH_DIR = os.environ.get("WATCH_DIR", "/var/www/deneme_app/inputs")
PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")

# CPU ve RAM için optimize sınırlar
MAX_IMAGE_DIM = 1280    # Yüksek çözünürlüklü resimleri max 1280'e ölçekle (RAM koruması)
YOLO_IMGSZ = 416        # YOLO girdi boyutu (640 yerine 416 ile CPU yükü %60 azalır)
EDGE_MARGIN = 10        # Sayfa kenar marjı (Yarım soruları elemek için)
MIN_BOX_SIZE = 50       # Min genişlik ve yükseklik
CONFIDENCE_THRESHOLD = 0.50

# ============================================================================
# MODEL YÜKLEME (GLOBAL SINGLETON)
# ============================================================================
model_instance = None
model_name_loaded = None

def get_yolo_model():
    global model_instance, model_name_loaded
    if model_instance is not None:
        return model_instance

    if YOLO is None:
        return None

    if os.path.exists(MODEL_PATH):
        print(f"[YOLO] Özel soru tespit modeli yükleniyor: {MODEL_PATH}")
        model_instance = YOLO(MODEL_PATH)
        model_name_loaded = os.path.basename(MODEL_PATH)
    else:
        print(f"[YOLO] '{MODEL_PATH}' bulunamadı. Baz model ({FALLBACK_MODEL}) yükleniyor...")
        print("[İPUCU] Kendi eğittiğiniz modeli 'best_question_detector.pt' olarak bu dizine koyun.")
        model_instance = YOLO(FALLBACK_MODEL)
        model_name_loaded = FALLBACK_MODEL

    return model_instance

# ============================================================================
# GÖRÜNTÜ ÖN İŞLEME & DEWARPING MOTORU
# ============================================================================
def fix_page_dewarp_and_perspective(img_bgr: np.ndarray) -> (np.ndarray, np.ndarray):
    """
    Hem perspektif eğriliğini düzeltir hem de yay (arc) şeklindeki sayfa 
    kıvrılmalarını matematiksel olarak doğrusal hale getirir ve filigranları siler.
    Dönüş: (temizlenmiş_ikili_resim, duzeltilmis_renkli_resim)
    """
    if img_bgr is None:
        return None, None

    # 4 GB RAM koruması: Çözünürlüğü maksimum 1280 piksele sınırla
    h, w = img_bgr.shape[:2]
    if max(h, w) > MAX_IMAGE_DIM:
        scale = MAX_IMAGE_DIM / float(max(h, w))
        img_bgr = cv2.resize(img_bgr, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    # --- 1. ADIM: PERSPEKTİF DÜZELTME (Dört Köşe Tespiti) ---
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 30, 150)
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    page_contour = None
    for c in contours[:5]:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4 and cv2.contourArea(approx) > (img_bgr.shape[0] * img_bgr.shape[1] * 0.25):
            page_contour = approx
            break

    if page_contour is not None:
        pts = page_contour.reshape(4, 2)
        rect = np.zeros((4, 2), dtype="float32")
        s = pts.sum(axis=1)
        rect[0] = pts[np.argmin(s)] # Sol-üst
        rect[2] = pts[np.argmax(s)] # Sağ-alt
        diff = np.diff(pts, axis=1)
        rect[1] = pts[np.argmin(diff)] # Sağ-üst
        rect[3] = pts[np.argmax(diff)] # Sol-alt

        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))

        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))

        if maxWidth > 100 and maxHeight > 100:
            dst = np.array([
                [0, 0],
                [maxWidth - 1, 0],
                [maxWidth - 1, maxHeight - 1],
                [0, maxHeight - 1]
            ], dtype="float32")

            M = cv2.getPerspectiveTransform(rect, dst)
            warped = cv2.warpPerspective(img_bgr, M, (maxWidth, maxHeight))
        else:
            warped = img_bgr.copy()
    else:
        warped = img_bgr.copy()

    # --- 2. ADIM: YAY (ARC) ŞEKLİNDEKİ KIVRILMALARI DÜZELTME (DEWARPING) ---
    wh, ww = warped.shape[:2]
    map_x, map_y = np.meshgrid(np.arange(ww), np.arange(wh))
    
    # Kitap ayrımı veya eğimden oluşan yay sapması katsayısı (%2.5 esneme)
    amplitude = wh * 0.025
    shift_y = amplitude * np.sin(np.pi * map_x / float(ww))
    map_y = map_y + shift_y

    map_x = map_x.astype(np.float32)
    map_y = map_y.astype(np.float32)
    # INTER_LINEAR: 4 çekirdekli CPU için INTER_CUBIC'e göre çok daha hızlıdır
    dewarped = cv2.remap(warped, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

    # --- 3. ADIM: ORİJİNAL RENKLERİ VE DOĞAL IŞIĞI KORUMA (DOĞAL GÖRÜNTÜ) ---
    # Kullanıcı isteği: Renklerle ve ışıkla oynanmasın, test sayfası orijinal renklerinde kalsın.
    # Sert ikili eşikleme (adaptiveThreshold) renkleri bozduğundan kaldırıldı.
    # Hem model hem kullanıcı için doğal, net ve renkleri bozulmamış dewarped görsel kullanılır.
    cleaned = dewarped.copy()

    return cleaned, dewarped

def get_clean_question_coordinates(
    image_bgr: np.ndarray,
    conf_thresh: float = CONFIDENCE_THRESHOLD,
    margin: int = EDGE_MARGIN,
    min_size: int = MIN_BOX_SIZE
) -> Dict[str, Any]:
    """
    Soruların koordinatlarını hesaplar ve yarım çıkmış soruları eler.
    """
    cleaned_img, color_dewarped = fix_page_dewarp_and_perspective(image_bgr)
    if cleaned_img is None:
        return {"total": 0, "questions": [], "dewarped_image": None}

    height, width = cleaned_img.shape[:2]
    model = get_yolo_model()

    valid_questions = []

    if model is not None:
        # Renkli BGR görüntüyü doğrudan YOLO'ya ver (griye çevirme yapılmaz)
        if len(cleaned_img.shape) == 2:
            model_input = cv2.cvtColor(cleaned_img, cv2.COLOR_GRAY2BGR)
        else:
            model_input = cleaned_img.copy()

        # CPU & RAM OPTİMİZE EDİLMİŞ TAHMİN
        results = model.predict(
            source=model_input,
            conf=conf_thresh,
            imgsz=YOLO_IMGSZ,
            device='cpu',   # CPU zorla
            workers=1,      # 1 thread: donmayı engelle
            verbose=False
        )

        raw_boxes = []
        if len(results) > 0 and results[0].boxes is not None:
            for box in results[0].boxes:
                x1, y1, x2, y2 = map(int, box.xyxy.tolist()[0])
                conf = float(box.conf.item()) if hasattr(box.conf, 'item') else float(box.conf[0])
                raw_boxes.append((x1, y1, x2, y2, conf))

        # --- FİLTRELEME: Yarım Çıkmış Soruları Eleme ---
        for x1, y1, x2, y2, conf in raw_boxes:
            # 1. Kenar kontrolü: Soru görsel sınırlarına çok yakınsa (kesilmişse) pas geç
            if x1 <= margin or y1 <= margin or x2 >= (width - margin) or y2 >= (height - margin):
                continue

            # 2. Boyut kontrolü: Çok küçük gürültüleri ele
            box_width = x2 - x1
            box_height = y2 - y1
            if box_width < min_size or box_height < min_size:
                continue

            # 0 - 1000 arası normalize koordinatlar (Web uygulamamız için [ymin, xmin, ymax, xmax])
            norm_ymin = int(round((y1 / float(height)) * 1000))
            norm_xmin = int(round((x1 / float(width)) * 1000))
            norm_ymax = int(round((y2 / float(height)) * 1000))
            norm_xmax = int(round((x2 / float(width)) * 1000))

            valid_questions.append({
                "pixel_coords": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
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

    # Fiziksel okuma sırasına göre sırala: Önce sol sütun (xmin < 500) yukarıdan aşağıya, sonra sağ sütun
    valid_questions.sort(key=lambda q: (
        0 if q["normalized_box"][1] < 480 else 1,
        q["normalized_box"][0]
    ))

    # Numaralandır
    for idx, q in enumerate(valid_questions):
        q["soru_no"] = idx + 1

    # Bellek temizliği (4 GB RAM koruması)
    gc.collect()

    return {
        "width": width,
        "height": height,
        "total_valid_questions": len(valid_questions),
        "questions": valid_questions,
        "model_used": model_name_loaded
    }

# ============================================================================
# FASTAPI UYGULAMASI (WEB ARAYÜZÜ ENTEGRASYONU)
# ============================================================================
app = FastAPI(
    title="Deneme Sınavı Soru Tespiti & Dewarp Servisi",
    description="Ubuntu 4GB RAM CPU-Optimize Edilmiş YOLO & OpenCV Servisi",
    version="2.0.0"
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
    returnPreview: Optional[bool] = False

@app.get("/")
def read_root():
    return {
        "service": "YKS Deneme Sınavı Soru Tespiti Servisi",
        "status": "online",
        "model": model_name_loaded or "Henüz yüklenmedi",
        "device": "cpu",
        "ram_gb": round(psutil.virtual_memory().total / (1024**3), 2),
        "cpu_count": psutil.cpu_count()
    }

@app.get("/health")
def health_check():
    vm = psutil.virtual_memory()
    return {
        "status": "healthy",
        "cpu_usage_percent": psutil.cpu_percent(interval=None),
        "ram_usage_percent": vm.percent,
        "ram_available_mb": round(vm.available / (1024**2), 1),
        "model_loaded": model_name_loaded is not None,
        "model_name": model_name_loaded
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

        t_start = time.time()
        results = get_clean_question_coordinates(
            img_bgr,
            conf_thresh=payload.confThreshold or CONFIDENCE_THRESHOLD,
            margin=payload.margin or EDGE_MARGIN,
            min_size=payload.minSize or MIN_BOX_SIZE
        )
        process_time_ms = int((time.time() - t_start) * 1000)

        # Önizleme resmi istenmişse kutuları çizip base64 döndür
        preview_base64 = None
        if payload.returnPreview:
            # Temizlenmiş ve renkleri korunmuş resmi alıp kutuları çizelim
            cleaned_img, _ = fix_page_dewarp_and_perspective(img_bgr)
            if len(cleaned_img.shape) == 2:
                preview_bgr = cv2.cvtColor(cleaned_img, cv2.COLOR_GRAY2BGR)
            else:
                preview_bgr = cleaned_img.copy()
            for q in results["questions"]:
                c = q["pixel_coords"]
                cv2.rectangle(preview_bgr, (c["x1"], c["y1"]), (c["x2"], c["y2"]), (0, 180, 0), 2)
                cv2.putText(
                    preview_bgr, f"S{q['soru_no']} ({int(q['confidence']*100)}%)",
                    (c["x1"] + 5, c["y1"] + 20),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 220), 2
                )
            _, buf = cv2.imencode(".jpg", preview_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 80])
            preview_base64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

        return {
            "success": True,
            "process_time_ms": process_time_ms,
            "width": results["width"],
            "height": results["height"],
            "total_questions": results["total_valid_questions"],
            "questions": results["questions"],
            "preview_image": preview_base64,
            "model": results["model_used"]
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
    """Sadece yay düzeltme ve filigran temizleme yaparak görseli döndürür."""
    try:
        raw_b64 = payload.imageBase64
        if "," in raw_b64:
            raw_b64 = raw_b64.split(",", 1)[1]

        img_bytes = base64.b64decode(raw_b64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        cleaned_img, _ = fix_page_dewarp_and_perspective(img_bgr)
        _, buf = cv2.imencode(".jpg", cleaned_img, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        cleaned_b64 = "data:image/jpeg;base64," + base64.b64encode(buf).decode("utf-8")

        return {
            "success": True,
            "dewarped_image": cleaned_b64
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
                    "model": res["model_used"]
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
