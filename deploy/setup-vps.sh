#!/bin/bash
# ============================================
# Setup VPS para Facturación RTMX
# Ejecutar como root en Ubuntu 22.04
# ============================================

set -e

echo "========================================"
echo " Setup VPS - Facturación Rotulate"
echo "========================================"

# 1. Actualizar sistema
echo "[1/8] Actualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar Node.js 20 LTS
echo "[2/8] Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Instalar Chromium para Puppeteer
echo "[3/8] Instalando Chromium y dependencias..."
apt install -y chromium-browser \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils

# 4. Instalar Nginx
echo "[4/8] Instalando Nginx..."
apt install -y nginx

# 5. Instalar PM2
echo "[5/8] Instalando PM2..."
npm install -g pm2

# 6. Instalar Certbot para SSL
echo "[6/8] Instalando Certbot..."
apt install -y certbot python3-certbot-nginx

# 7. Crear directorios
echo "[7/8] Creando directorios..."
mkdir -p /var/www/facturacion
mkdir -p /var/www/facturacion-api
mkdir -p /var/log/facturacion

# 8. Configurar Firewall
echo "[8/8] Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "========================================"
echo " Setup completado!"
echo "========================================"
echo ""
echo "Pasos siguientes:"
echo ""
echo "1. Configurar DNS en Hostinger:"
echo "   - facturacion.rotulatepublicidad.com → $(curl -s ifconfig.me)"
echo "   - api.rotulatepublicidad.com → $(curl -s ifconfig.me)"
echo ""
echo "2. Clonar repositorio:"
echo "   cd /var/www && git clone <tu-repo> facturacion-repo"
echo ""
echo "3. Ejecutar deploy.sh:"
echo "   bash /var/www/facturacion-repo/deploy/deploy.sh"
echo ""
echo "4. Configurar SSL:"
echo "   certbot --nginx -d facturacion.rotulatepublicidad.com -d api.rotulatepublicidad.com"
echo ""
echo "5. Configurar PM2 para iniciar con el sistema:"
echo "   pm2 startup systemd"
echo "   pm2 save"
echo ""
