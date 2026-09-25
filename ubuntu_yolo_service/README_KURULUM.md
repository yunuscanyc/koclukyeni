# 📚 Deneme Sınavı Soru Tespiti, Dewarp & YOLOv8/v11 Entegrasyon Rehberi

Bu paket, deneme sınavı sayfalarındaki yay (arc) bükülmelerini ve filigranları temizleyip, yalnızca **tam ve eksiksiz soruların koordinatlarını** çıkaran özel YOLO mimarisini içerir.

---

## 🏛️ Mimari Özeti

```
[Deneme Sayfası Fotoğrafı]
         │
         ▼
[1. Perspektif Düzeltme] ──► 4 köşe tespiti & dikleştirme (OpenCV)
         │
         ▼
[2. Yay (Arc) Dewarping] ──► Silindirik/sayfa kıvrımını sinüs haritalama ile düzeltme
         │
         ▼
[3. Filigran Temizleme] ───► Adaptive Thresholding ile gri gölgeleri & filigranları silme
         │
         ▼
[4. YOLOv8n / v11n] ───────► Eğitilmiş soru dedektörü ile [ymin, xmin, ymax, xmax] tespiti
         │
         ▼
[5. Yarım Soru Filtresi] ──► Kenarlara yapışık (margin ≤ 10) ve yarım soruları eleme
         │
         ▼
[Web Uygulaması / JSON] ───► Sisteme kusursuz soru kutuları aktarılır
```

---

## 🛠️ ADIM 1: Kendi Bilgisayarınızda Soruları Etiketleme

1. **Görselleri Toplayın:**
   - 50 - 100 adet telefonla çekilmiş deneme kitapçığı sayfası fotoğrafı çekin (filigranlı, eğri, düz karışık).
2. **LabelImg Kurulumu (Ücretsiz):**
   ```bash
   pip install labelImg
   labelImg
   ```
3. **Etiketleme Kuralı (ÇOK ÖNEMLİ):**
   - Görseldeki **yalnızca tam, eksiksiz görünen soruları** dikdörtgen içine alın ve `question` adıyla etiketleyin.
   - Sayfa kenarında yarım çıkmış, şıkları kesilmiş soruları **kesinlikle etiketlemeyin**.
   - Formatı sol panelden **YOLO** olarak seçin.
4. **Dosyaları Yerleştirin:**
   - Resimleri `dataset/train/images/` klasörüne,
   - Oluşan `.txt` dosyalarını `dataset/train/labels/` klasörüne koyun.
   - Resimlerin %20'sini test için `dataset/val/images/` ve `dataset/val/labels/` içine taşıyın.

---

## 🚀 ADIM 2: Kendi Bilgisayarınızda Modeli Eğitme (train.py)

Kendi bilgisayarınızda (GPU veya güçlü CPU):

```bash
# 1. Gerekli kütüphaneleri kurun
pip install ultralytics torch opencv-python-headless

# 2. Eğitimi başlatın
python train.py
```

`train.py` çalıştırıldığında size iki temel soru sorar:
1. **📁 Veri Seti Seçimi:** 
   - `[1] ➕ Önceki verilerin ÜZERİNE EKLE:` Mevcut etiketlenmiş sayfalarınızı korur, yenileriyle birleştirir (Önerilen).
   - `[2] 🗑️ Önceki verileri SİL:` Eski sayfaları güvenle `dataset/backups/` klasörüne yedekler ve temizleyerek sadece yeni verilerle eğitim yapar.
   - `[3] 📂 Harici klasörden aktar:` Farklı bir klasördeki yeni fotoğrafları otomatik olarak içeri aktarır.
2. **🧠 Model Ağırlığı (Fine-Tuning):**
   - `[1] ⚡ Önceki modelin ÜZERİNE DEVAM ET:` Daha önce eğittiğiniz `best_question_detector.pt` dosyasının tecrübesini koruyarak yeni verileri üzerine ekler.
   - `[2] 🔄 Sıfırdan TEMİZ EĞİTİM başlat:` Temel YOLOv8 ağırlıklarıyla sıfırdan eğitir.

---

## 🔄 BİRDEN FAZLA EĞİTİM VERME (Fine-Tuning & Veri Seti Birleştirme)

**Evet! Modeli istediğiniz kadar eğitebilir ve veri setinizi sürekli büyütebilirsiniz.**

Zamanla yeni deneme kitapçıkları, farklı yazı tipleri veya yeni formatlar çıktığında:
1. Yeni etiketlediğiniz sayfaları `dataset/train/images` ve `dataset/train/labels` içine ekleyin (veya başka bir klasörden aktarın).
2. `python train.py` komutunu çalıştırın.
3. Script size **"Önceki verilerin üzerine mi ekleyeyim yoksa eskileri sileyim mi?"** ve **"Önceki model ağırlığının üzerine mi devam edeyim?"** diye soracaktır.
4. `[1]` seçerek mevcut verilerin ve modelin üzerine ekleyerek modelinizin başarı oranını %99'un üzerine çıkarabilirsiniz.

---

## 🖥️ ADIM 3: 4 GB RAM'li Ubuntu Bilgisayarınıza Kurulum

Ubuntu sunucunuzda (4 çekirdek, 4 GB RAM, ekran kartı yok):

### Kolay Otomatik Kurulum:
```bash
# Servis paketini sunucuya kopyalayın ve içine girin
cd ubuntu_yolo_service

# Eğittiğiniz modeli buraya kopyalayın
cp /yol/best_question_detector.pt .

# Kurulum betiğini çalıştırın
chmod +x setup_ubuntu.sh
./setup_ubuntu.sh
```

### Manuel Kurulum Adımları:
```bash
sudo apt update && sudo apt install -y python3-pip libgl1
pip3 install -r requirements.txt

# Servisi systemd'ye ekle
sudo cp deneme_soru.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable deneme_soru.service
sudo systemctl start deneme_soru.service
```

---

## 🌐 ADIM 4: Web Uygulamamıza Entegre Etme

1. Web uygulamamızdaki **"⚙️ Yerel YOLO (Ubuntu) Ayarları"** menüsünü açın.
2. Ubuntu sunucunuzun IP adresini girin:
   - Örnek: `http://192.168.1.50:8000` veya `http://localhost:8000`
3. **"Bağlantıyı Test Et"** butonuna basın. Durum **"Çevrimiçi"** olduğunda kutucuğu işaretleyin.
4. Artık yüklediğiniz tüm deneme sayfaları doğrudan bu Ubuntu servisinizden geçerek taranacaktır!
