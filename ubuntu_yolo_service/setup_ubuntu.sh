#!/bin/bash
# ==============================================================================
# Ubuntu 4GB RAM 4 CPU Soru Tespit Servisi Hızlı Kurulum Betiği
# ==============================================================================

set -e

echo "🚀 Ubuntu Soru Tespiti & Dewarp Servisi Kurulumu Başlatılıyor..."

# 1. Dizinleri oluştur
TARGET_DIR="/var/www/deneme_app"
echo "📁 Servis dizini oluşturuluyor: $TARGET_DIR"
sudo mkdir -p "$TARGET_DIR"
sudo mkdir -p "$TARGET_DIR/inputs"
sudo chown -R $USER:$USER "$TARGET_DIR"

# 2. Sistem paketlerini güncelle ve Python ortamını kur
echo "📦 Gerekli sistem kütüphaneleri yükleniyor..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv libgl1 libglib2.0-0

# 3. Dosyaları kopyala
echo "📋 Kodlar servis klasörüne aktarılıyor..."
cp app.py "$TARGET_DIR/"
cp requirements.txt "$TARGET_DIR/"
if [ -f "best_question_detector.pt" ]; then
    cp best_question_detector.pt "$TARGET_DIR/"
    echo "✅ Özel eğitilmiş best_question_detector.pt kopyalandı."
else
    echo "ℹ️ best_question_detector.pt bulunamadı, başlangıçta baz nano model kullanılacak."
fi

# 4. Python paketlerini yükle
echo "🐍 Python gereksinimleri yükleniyor (ultralytics, opencv, fastapi)..."
pip3 install -r requirements.txt

# 5. Systemd servisini yapılandır
echo "⚙️ Systemd servisi ayarlanıyor..."
sudo cp deneme_soru.service /etc/systemd/system/deneme_soru.service
sudo sed -i "s|User=ubuntu|User=$USER|g" /etc/systemd/system/deneme_soru.service
sudo sed -i "s|/usr/bin/python3|$(which python3)|g" /etc/systemd/system/deneme_soru.service

sudo systemctl daemon-reload
sudo systemctl enable deneme_soru.service
sudo systemctl restart deneme_soru.service

echo ""
echo "======================================================================"
echo "🎉 TEBRİKLER! Servis başarıyla kuruldu ve başlatıldı!"
echo "• Servis Durumu: sudo systemctl status deneme_soru.service"
echo "• API Adresi: http://$(hostname -I | awk '{print $1}'):8000"
echo "• Sağlık Kontrolü: curl http://localhost:8000/health"
echo "• İzlenen Klasör: $TARGET_DIR/inputs"
echo "======================================================================"
