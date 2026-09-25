#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Deneme Sınavı Soru Tespiti - YOLO Model Eğitimi & Veri Seti Yöneticisi (train.py)

Bu script ile:
  1. Yeni verilerinizi eskilerin ÜZERİNE EKLEYEBİLİR (Fine-tuning / Birleştirme)
  2. Veya eskileri SİLİP sadece yeni verilerle sıfırdan eğitebilirsiniz.
  3. YOLO etiket önbelleklerini (*.cache) otomatik temizler, yeni eklenen hiçbir veriyi kaçırmaz.
  4. Eğitilen en iyi modeli 'best_question_detector.pt' olarak hazır hale getirir.
"""

import os
import sys
import shutil
import glob
import time
from datetime import datetime

IMAGE_EXTS = ('.jpg', '.jpeg', '.png', '.bmp', '.webp')

def clear_yolo_caches(dataset_dir):
    """Ultralytics YOLO etiket önbelleklerini (*.cache) temizler."""
    cache_files = glob.glob(os.path.join(dataset_dir, "**", "*.cache"), recursive=True)
    count = 0
    for f in cache_files:
        try:
            os.remove(f)
            count += 1
        except Exception:
            pass
    if count > 0:
        print(f"🧹 {count} adet eski etiket önbelleği (*.cache) temizlendi.")

def count_dataset_files(dataset_dir):
    train_img = os.path.join(dataset_dir, "train", "images")
    train_lbl = os.path.join(dataset_dir, "train", "labels")
    val_img = os.path.join(dataset_dir, "val", "images")
    val_lbl = os.path.join(dataset_dir, "val", "labels")

    os.makedirs(train_img, exist_ok=True)
    os.makedirs(train_lbl, exist_ok=True)
    os.makedirs(val_img, exist_ok=True)
    os.makedirs(val_lbl, exist_ok=True)

    n_train_img = len([f for f in os.listdir(train_img) if f.lower().endswith(IMAGE_EXTS)])
    n_train_lbl = len([f for f in os.listdir(train_lbl) if f.lower().endswith('.txt')])
    n_val_img = len([f for f in os.listdir(val_img) if f.lower().endswith(IMAGE_EXTS)])
    n_val_lbl = len([f for f in os.listdir(val_lbl) if f.lower().endswith('.txt')])

    return {
        "train_img": n_train_img,
        "train_lbl": n_train_lbl,
        "val_img": n_val_img,
        "val_lbl": n_val_lbl,
        "total_img": n_train_img + n_val_img
    }

def backup_dataset(dataset_dir):
    """Eski veri setini tarihli bir klasöre güvenle yedekler."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(dataset_dir, "backups", f"backup_{timestamp}")
    os.makedirs(backup_dir, exist_ok=True)

    train_dir = os.path.join(dataset_dir, "train")
    val_dir = os.path.join(dataset_dir, "val")

    if os.path.exists(train_dir):
        shutil.copytree(train_dir, os.path.join(backup_dir, "train"), dirs_exist_ok=True)
    if os.path.exists(val_dir):
        shutil.copytree(val_dir, os.path.join(backup_dir, "val"), dirs_exist_ok=True)

    print(f"📦 Eski veri seti güvenle yedeklendi: {backup_dir}")
    return backup_dir

def clean_dataset_folders(dataset_dir):
    """Mevcut train ve val klasörlerindeki görselleri ve etiketleri temizler."""
    for split in ["train", "val"]:
        for sub in ["images", "labels"]:
            p = os.path.join(dataset_dir, split, sub)
            if os.path.exists(p):
                for item in os.listdir(p):
                    item_path = os.path.join(p, item)
                    try:
                        if os.path.isfile(item_path):
                            os.remove(item_path)
                        elif os.path.isdir(item_path):
                            shutil.rmtree(item_path)
                    except Exception as e:
                        print(f"[UYARI] {item_path} silinemedi: {e}")
    clear_yolo_caches(dataset_dir)
    print("🗑️ Önceki veri seti klasörleri temizlendi.")

def import_from_directory(source_dir, dataset_dir, mode="append"):
    """
    Belirtilen harici klasörden (içinde görseller ve .txt etiketleri olan)
    veri setine aktarım yapar.
    mode: 'append' (üzerine ekle) veya 'overwrite' (öncekileri sil)
    """
    if not os.path.exists(source_dir):
        print(f"[HATA] '{source_dir}' klasörü bulunamadı!")
        return False

    if mode == "overwrite":
        backup_dataset(dataset_dir)
        clean_dataset_folders(dataset_dir)

    train_img_dir = os.path.join(dataset_dir, "train", "images")
    train_lbl_dir = os.path.join(dataset_dir, "train", "labels")

    os.makedirs(train_img_dir, exist_ok=True)
    os.makedirs(train_lbl_dir, exist_ok=True)

    # Klasördeki tüm dosyaları tara
    found_imgs = []
    for root, _, files in os.walk(source_dir):
        for f in files:
            if f.lower().endswith(IMAGE_EXTS):
                img_path = os.path.join(root, f)
                base_name, _ = os.path.splitext(f)
                # İlgili .txt etiketini bul
                possible_lbl = os.path.join(root, f"{base_name}.txt")
                lbl_in_labels_sub = os.path.join(root, "..", "labels", f"{base_name}.txt")
                
                lbl_path = None
                if os.path.exists(possible_lbl):
                    lbl_path = possible_lbl
                elif os.path.exists(lbl_in_labels_sub):
                    lbl_path = lbl_in_labels_sub

                found_imgs.append((img_path, lbl_path, f))

    if not found_imgs:
        print(f"[UYARI] '{source_dir}' içinde aktarılacak görsel bulunamadı!")
        return False

    copied_count = 0
    for img_src, lbl_src, fname in found_imgs:
        # İsim çakışması olmaması için timestamp veya hash eklenebilir
        base_name, ext = os.path.splitext(fname)
        target_img_name = fname
        target_lbl_name = f"{base_name}.txt"

        if mode == "append" and os.path.exists(os.path.join(train_img_dir, target_img_name)):
            ts = int(time.time() * 1000) % 100000
            target_img_name = f"{base_name}_new_{ts}{ext}"
            target_lbl_name = f"{base_name}_new_{ts}.txt"

        target_img_path = os.path.join(train_img_dir, target_img_name)
        target_lbl_path = os.path.join(train_lbl_dir, target_lbl_name)

        shutil.copy2(img_src, target_img_path)
        if lbl_src and os.path.exists(lbl_src):
            shutil.copy2(lbl_src, target_lbl_path)
        else:
            # Boş etiket dosyası oluştur (arkaplan / negatif örnek)
            with open(target_lbl_path, "w", encoding="utf-8") as lf:
                pass
        copied_count += 1

    clear_yolo_caches(dataset_dir)
    print(f"✅ {copied_count} adet yeni görsel ve etiket başarıyla veri setine aktarıldı.")
    return True

def auto_split_val(dataset_dir, val_ratio=0.2):
    """Eğer val klasöründe görsel yoksa train klasöründeki verilerin %20'sini val'a taşır."""
    train_img_dir = os.path.join(dataset_dir, "train", "images")
    train_lbl_dir = os.path.join(dataset_dir, "train", "labels")
    val_img_dir = os.path.join(dataset_dir, "val", "images")
    val_lbl_dir = os.path.join(dataset_dir, "val", "labels")

    train_imgs = [f for f in os.listdir(train_img_dir) if f.lower().endswith(IMAGE_EXTS)]
    val_imgs = [f for f in os.listdir(val_img_dir) if f.lower().endswith(IMAGE_EXTS)]

    if len(val_imgs) == 0 and len(train_imgs) >= 5:
        num_to_move = max(1, int(len(train_imgs) * val_ratio))
        import random
        random.seed(42)
        selected_for_val = random.sample(train_imgs, num_to_move)

        for img_f in selected_for_val:
            base_name, _ = os.path.splitext(img_f)
            txt_f = f"{base_name}.txt"

            shutil.move(os.path.join(train_img_dir, img_f), os.path.join(val_img_dir, img_f))
            lbl_src = os.path.join(train_lbl_dir, txt_f)
            if os.path.exists(lbl_src):
                shutil.move(lbl_src, os.path.join(val_lbl_dir, txt_f))

        clear_yolo_caches(dataset_dir)
        print(f"📊 {num_to_move} adet veri doğrulama (val) kümesine ayrıldı.")

def interactive_dataset_manager(dataset_dir):
    """
    Kullanıcıya veri setiyle ilgili soru sorar:
    - Yeni verileri eski verilerin üzerine mi ekleyeyim?
    - Yoksa eski verileri silip sıfırdan mı başlayayım?
    """
    stats = count_dataset_files(dataset_dir)
    
    print("\n" + "=" * 64)
    print("📁 [1/3] VERİ SETİ (DATASET) YÖNETİMİ & SEÇİMİ")
    print("=" * 64)
    print(f"📊 Mevcut Veri Durumu:")
    print(f"   • Eğitim Kümesi   (Train): {stats['train_img']} görsel, {stats['train_lbl']} etiket")
    print(f"   • Doğrulama Kümesi (Val)  : {stats['val_img']} görsel, {stats['val_lbl']} etiket")
    print(f"   • Toplam Görsel          : {stats['total_img']} adet")
    print("-" * 64)

    # Kullanıcıya net seçenek sunuyoruz
    print("Yeni ekleyeceğiniz veya mevcut veriler için ne yapmak istersiniz?")
    print("  [1] ➕ Önceki verilerin ÜZERİNE EKLE (Eski + Yeni veriler birleştirilir - Önerilen)")
    print("  [2] 🗑️ Önceki verileri SİL (Eski veriler temizlenir, sadece yeni verilerle eğitilir)")
    print("  [3] 📂 Harici bir klasörden yeni verileri içeri aktar (Üzerine ekle veya Değiştir)")
    print("  [4] ⏩ Mevcut verileri olduğu gibi koru ve eğitime geç")
    
    secim = input("\n👉 Seçiminiz (1, 2, 3 veya 4, Varsayılan: 1): ").strip()
    
    if secim == "2":
        confirm = input("⚠️ DİKKAT: Eski veriler silinecek (önce yedeklenecek). Onaylıyor musunuz? (e/h, varsayılan e): ").strip().lower()
        if confirm in ('', 'e', 'evet', 'y', 'yes'):
            backup_dataset(dataset_dir)
            clean_dataset_folders(dataset_dir)
            print("\n📥 Şimdi yeni fotoğraflarınızı ve .txt etiketlerinizi şu klasörlere yerleştiriniz:")
            print(f"   • Görseller : {os.path.join(dataset_dir, 'train', 'images')}")
            print(f"   • Etiketler : {os.path.join(dataset_dir, 'train', 'labels')}")
            input("Dosyaları kopyaladıktan sonra ENTER tuşuna basarak devam edin...")
    
    elif secim == "3":
        src_path = input("Yeni görsellerin ve etiketlerin bulunduğu klasörün yolu: ").strip()
        mod_secim = input("Bu veriler eskilerin [1] ÜZERİNE Mİ EKLENSİN, yoksa [2] ESKİLER SİLİNSİN Mİ? (1/2, varsayılan 1): ").strip()
        mode = "overwrite" if mod_secim == "2" else "append"
        import_from_directory(src_path, dataset_dir, mode=mode)

    elif secim == "1" or secim == "" or secim == "4":
        print("✅ Mevcut veriler korundu. Yeni eklenen tüm dosyalar önceki verilerin ÜZERİNE eklenecek.")
        clear_yolo_caches(dataset_dir)

    # Otomatik val ayırımı
    auto_split_val(dataset_dir)

    # Güncel durumu tekrar kontrol et
    updated_stats = count_dataset_files(dataset_dir)
    print(f"\n✨ Güncel Eğitim Verisi: {updated_stats['train_img']} train + {updated_stats['val_img']} val = {updated_stats['total_img']} görsel.")
    
    if updated_stats['total_img'] == 0:
        print("[UYARI] Eğitim klasöründe henüz görsel bulunamadı!")
        print(f"Lütfen fotoğraflarınızı '{os.path.join(dataset_dir, 'train', 'images')}' klasörüne koyunuz.")
        cont = input("Yine de temel modelle devam edilsin mi? (e/h): ").strip().lower()
        if cont != 'e':
            sys.exit(1)

    return updated_stats

def interactive_model_selection(base_model="yolov8n.pt"):
    """
    Model ağırlıklarını seçer:
    - Önceki eğitilmiş modelin üzerine mi devam etsin (Fine-tuning)?
    - Yoksa temel yolov8n.pt ile sıfırdan mı başlasın?
    """
    print("\n" + "=" * 64)
    print("🧠 [2/3] MODEL AĞIRLIĞI & EĞİTİM YÖNTEMİ")
    print("=" * 64)

    saved_weights = "best_question_detector.pt"
    if os.path.exists(saved_weights):
        print(f"💡 Daha önce eğitilmiş özel modeliniz bulundu: '{saved_weights}'")
        print("  [1] ⚡ Önceki modelin ÜZERİNE DEVAM ET (Fine-Tuning / Ağırlıkları koru - Önerilen)")
        print(f"  [2] 🔄 Sıfırdan TEMİZ EĞİTİM başlat (Temel '{base_model}' ile)")
        
        m_secim = input("\n👉 Model Seçiminiz (1 veya 2, Varsayılan: 1): ").strip()
        if m_secim == "2":
            print(f"👉 Sıfırdan temel modelle ({base_model}) eğitim başlatılacak.")
            return base_model
        else:
            print(f"👉 Önceki modelin ('{saved_weights}') tecrübesi korunarak fine-tuning başlatılacak.")
            return saved_weights
    else:
        print(f"ℹ️ Henüz özel eğitilmiş bir model bulunamadı. Temel model ({base_model}) kullanılacak.")
        return base_model

def start_training(
    dataset_yaml="dataset/dataset.yaml",
    base_model="yolov8n.pt",   # En hafif ve hızlı nano model
    epochs=80,                 # Soru tespiti için 50-100 arası idealdir
    imgsz=640,                 # Eğitim çözünürlüğü
    batch_size=16,             # Ekran kartı / bellek optimizasyonu
    device="0"                 # '0' (GPU) veya 'cpu'
):
    print("=" * 64)
    print("🎓 DENEME KİTAPÇIĞI SORU TESPİTİ - GELİŞMİŞ YOLO MODEL EĞİTİMİ")
    print("=" * 64)

    dataset_dir = os.path.dirname(os.path.abspath(dataset_yaml))
    
    # 1. Adım: Veri Seti Yönetimi (Eskinin üzerine ekleme / Silme sorusu)
    interactive_dataset_manager(dataset_dir)

    # 2. Adım: Model Ağırlığı Seçimi (Fine-tuning / Sıfırdan)
    weights_to_load = interactive_model_selection(base_model)

    # 3. Adım: Ultralytics YOLO'yu yükle ve başlat
    print("\n" + "=" * 64)
    print("🚀 [3/3] YOLO MODEL EĞİTİMİ BAŞLATILIYOR")
    print("=" * 64)
    print(f"• Kullanılan Ağırlık  : {weights_to_load}")
    print(f"• Veri Seti Dosyası   : {dataset_yaml}")
    print(f"• Epoch Sayısı        : {epochs}")
    print(f"• Çözünürlük (imgsz)  : {imgsz}x{imgsz}")
    print(f"• Donanım (Device)    : {device}")
    print("-" * 64)

    from ultralytics import YOLO

    clear_yolo_caches(dataset_dir)

    print(f"\n[1/3] Model yükleniyor: {weights_to_load} ...")
    model = YOLO(weights_to_load)

    print(f"[2/3] Eğitim başlıyor. Lütfen bekleyin...")
    try:
        results = model.train(
            data=dataset_yaml,
            epochs=epochs,
            imgsz=imgsz,
            batch=batch_size,
            device=device,
            workers=2,
            save=True,
            project="runs/question_detector",
            name="deneme_yolo",
            exist_ok=True,
            verbose=True
        )
    except Exception as e:
        print(f"\n[HATA] Eğitim sırasında hata oluştu: {e}")
        # CUDA out of memory hatası olursa CPU veya küçük batch öner
        if "CUDA out of memory" in str(e):
            print("💡 İPUCU: Ekran kartı belleğiniz yetersiz geldi. batch=8 veya imgsz=416 deneyebilirsiniz.")
        sys.exit(1)

    # 4. Adım: En iyi ağırlıkları ana klasöre kaydet
    best_weight_path = os.path.join("runs", "question_detector", "deneme_yolo", "weights", "best.pt")
    target_output_path = "best_question_detector.pt"

    print("\n" + "=" * 64)
    print("🎉 MODEL EĞİTİMİ BAŞARIYLA TAMAMLANDI!")
    print("=" * 64)
    if os.path.exists(best_weight_path):
        shutil.copy(best_weight_path, target_output_path)
        print(f"✅ Özel modeliniz hazırlandı: {os.path.abspath(target_output_path)}")
        print(f"📌 Bu dosyayı Ubuntu sunucunuzdaki servis klasörüne kopyalayarak hemen kullanabilirsiniz.")
    else:
        print(f"[BİLGİ] Çıktılar 'runs/question_detector/' klasöründe saklanmaktadır.")

if __name__ == "__main__":
    # GPU / CPU tespiti
    try:
        import torch
        default_device = 0 if torch.cuda.is_available() else "cpu"
        device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "İşlemci (CPU)"
    except Exception:
        default_device = "cpu"
        device_name = "CPU"

    print(f"💻 Tespit Edilen Donanım: {device_name}")
    start_training(device=default_device)
