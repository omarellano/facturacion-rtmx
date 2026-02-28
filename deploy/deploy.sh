#!/bin/bash
# ============================================
# Script de Despliegue - Facturación RTMX
# Ejecutar desde la raíz del repositorio
# ============================================

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="/var/www/facturacion"
BACKEND_DIR="/var/www/facturacion-api"
NGINX_DIR="/etc/nginx/sites-available"

echo "========================================"
echo " Deploy - Facturación Rotulate"
echo " Repo: $REPO_DIR"
echo "========================================"

# 1. Pull últimos cambios
echo "[1/6] Actualizando código..."
cd "$REPO_DIR"
git pull origin main

# 2. Build del frontend
echo "[2/6] Compilando frontend..."
npm install
npm run build
rm -rf "$FRONTEND_DIR"/*
cp -r dist/* "$FRONTEND_DIR/"
echo "  Frontend desplegado en $FRONTEND_DIR"

# 3. Instalar dependencias del backend
echo "[3/6] Instalando dependencias del backend..."
cd "$REPO_DIR/backend"
npm install --production

# 4. Copiar backend
echo "[4/6] Desplegando backend..."
rsync -av --exclude='node_modules' --exclude='.env' "$REPO_DIR/backend/" "$BACKEND_DIR/"
cd "$BACKEND_DIR"
npm install --production

# 5. Copiar configs de Nginx (solo si no existen)
echo "[5/6] Configurando Nginx..."
if [ ! -f "$NGINX_DIR/facturacion.conf" ]; then
    cp "$REPO_DIR/deploy/nginx/facturacion.conf" "$NGINX_DIR/"
    ln -sf "$NGINX_DIR/facturacion.conf" /etc/nginx/sites-enabled/
    echo "  Config frontend de Nginx instalada"
fi
if [ ! -f "$NGINX_DIR/api.conf" ]; then
    cp "$REPO_DIR/deploy/nginx/api.conf" "$NGINX_DIR/"
    ln -sf "$NGINX_DIR/api.conf" /etc/nginx/sites-enabled/
    echo "  Config API de Nginx instalada"
fi
nginx -t && systemctl reload nginx

# 6. Reiniciar backend con PM2
echo "[6/6] Reiniciando backend..."
cd "$BACKEND_DIR"
if pm2 describe facturacion-api > /dev/null 2>&1; then
    pm2 restart facturacion-api
    echo "  PM2: facturacion-api reiniciado"
else
    pm2 start ecosystem.config.js
    echo "  PM2: facturacion-api iniciado"
fi
pm2 save

echo ""
echo "========================================"
echo " Deploy completado!"
echo "========================================"
echo ""
echo " Frontend: https://facturacion.rotulatepublicidad.com"
echo " API:      https://api.rotulatepublicidad.com/status"
echo ""
