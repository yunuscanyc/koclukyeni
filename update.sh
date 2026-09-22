#!/bin/bash
cd /var/www/koc_app
echo "Güncellemeler çekiliyor..."
git pull origin main
npm install
npm run build
pm2 restart koc_app
echo "Portal başarıyla güncellendi!"
