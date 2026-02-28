# Plan de Acción: Migración a VPS Hostinger

## Resumen del Proyecto Actual

**Facturación RTMX** - App PWA móvil para facturación automática de tickets mexicanos.

| Componente | Estado |
|---|---|
| Frontend (React + Vite) | Funcional, 1296 líneas en un solo App.jsx |
| Backend (Express + Puppeteer) | Funcional, robots OXXO + 5 gasolineras |
| Robots disponibles | OXXO, Pemex, Abimerhi, La Gas, G500, FacturasGas |
| Deploy actual | Solo local + túneles temporales de Cloudflare |
| Base de datos | Ninguna (usa localStorage) |
| Autenticación | Ninguna |
| SSL | No |

## Arquitectura Objetivo

```
facturacion.rotulatepublicidad.com  →  Nginx  →  /var/www/facturacion (archivos estáticos)
api.rotulatepublicidad.com          →  Nginx  →  localhost:3001 (Express + Puppeteer)
```

Ambos subdominios en el **mismo VPS de Hostinger** con:
- **Nginx** como reverse proxy
- **PM2** para gestión del proceso Node.js
- **Let's Encrypt** para SSL (HTTPS)
- **Chromium** instalado para Puppeteer

---

## FASE 1: Preparar el código para producción

### 1.1 Variables de entorno para el frontend
- Crear archivo `.env.production` con `VITE_API_URL=https://api.rotulatepublicidad.com`
- Modificar `getBackendBaseUrl()` en App.jsx para usar `import.meta.env.VITE_API_URL`
- Eliminar la lógica del túnel (tunnelUrl ya no es necesario)
- Cambiar `vite.config.js`: `base: '/'` (ya no es subruta, es raíz del subdominio)

### 1.2 Configurar CORS del backend para producción
- Actualizar `backend/.env` con `ALLOWED_ORIGINS=https://facturacion.rotulatepublicidad.com`
- Eliminar la excepción de `.trycloudflare.com` en server.js
- Endurecer CORS: rechazar orígenes no autorizados en lugar de `callback(null, true)` al final

### 1.3 Agregar API Key simple para proteger el backend
- Generar un API key aleatorio
- Backend valida header `X-API-Key` en las peticiones POST a `/facturar`
- Frontend envía el key desde variable de entorno `VITE_API_KEY`

### 1.4 Refactorizar App.jsx (1296 líneas → componentes)
- Extraer: QRScanner, TicketList, TicketForm, DatosFiscales, ConfigPanel, StatusIndicator
- Crear carpeta `src/components/`
- Crear `src/hooks/useBackend.js` para la lógica de conexión al API
- Mantener la misma funcionalidad, solo separar responsabilidades

---

## FASE 2: Archivos de despliegue (crear en el repo)

### 2.1 Configuración de Nginx
- Crear `deploy/nginx/facturacion.conf` - vhost para el frontend
- Crear `deploy/nginx/api.conf` - reverse proxy para el backend
- Incluir headers de seguridad, gzip, y caché de estáticos

### 2.2 Configuración de PM2
- Crear `backend/ecosystem.config.js` (PM2 process config)
- Configurar restart automático, logs, y variables de entorno

### 2.3 Script de despliegue
- Crear `deploy/setup-vps.sh` - script para configurar VPS desde cero
  - Instalar Node.js 20 LTS, Nginx, Chromium, PM2, Certbot
  - Configurar firewall (UFW)
  - Crear usuario de servicio
- Crear `deploy/deploy.sh` - script para actualizar la app
  - Pull de git, build frontend, restart PM2

### 2.4 Dockerfile (opcional, para futuro)
- Crear `Dockerfile` y `docker-compose.yml` como alternativa de despliegue

---

## FASE 3: Configuración del VPS Hostinger (manual, con guía)

### 3.1 Contratar y configurar VPS
- Plan KVM 1 de Hostinger (~$5-7 USD/mes, 1 vCPU, 4GB RAM)
- Ubuntu 22.04 LTS
- Acceso SSH con llave pública

### 3.2 Configurar DNS en Hostinger
- Agregar registro A: `facturacion.rotulatepublicidad.com` → IP del VPS
- Agregar registro A: `api.rotulatepublicidad.com` → IP del VPS

### 3.3 Ejecutar script de setup
- Correr `deploy/setup-vps.sh` en el VPS
- Configurar SSL con Certbot para ambos subdominios
- Verificar que Chromium funciona: `chromium-browser --headless --no-sandbox --dump-dom https://google.com`

### 3.4 Primer despliegue
- Clonar repo en el VPS
- Build del frontend, copiar a `/var/www/facturacion`
- Iniciar backend con PM2
- Verificar ambos subdominios

---

## FASE 4: Mejoras post-despliegue (opcionales)

### 4.1 CI/CD con GitHub Actions
- Crear `.github/workflows/deploy.yml`
- On push to main: build + deploy automático al VPS via SSH

### 4.2 Monitoreo
- PM2 monit para métricas del proceso
- Agregar endpoint `/health` más detallado

### 4.3 Base de datos (futuro)
- Migrar de localStorage a SQLite o PostgreSQL
- Historial de facturas en el servidor
- Sincronización entre dispositivos

---

## Cambios de código específicos (Fase 1)

### Archivos a modificar:
1. `vite.config.js` - Cambiar base path
2. `src/App.jsx` - Refactorizar + nueva lógica de API URL
3. `backend/server.js` - CORS + API Key + eliminar referencia a cloudflared
4. `backend/.env` - Variables de producción
5. `backend/.env.example` - Documentar variables

### Archivos nuevos a crear:
1. `.env.production` - Variables del frontend para producción
2. `src/components/*.jsx` - Componentes extraídos de App.jsx
3. `src/hooks/useBackend.js` - Hook de conexión al API
4. `backend/ecosystem.config.js` - Config de PM2
5. `deploy/nginx/facturacion.conf` - Nginx frontend
6. `deploy/nginx/api.conf` - Nginx backend
7. `deploy/setup-vps.sh` - Script de setup del VPS
8. `deploy/deploy.sh` - Script de despliegue

---

## Orden de ejecución

| Paso | Descripción | Dependencia |
|------|-------------|-------------|
| 1 | Variables de entorno frontend (.env.production) | - |
| 2 | Refactorizar getBackendBaseUrl() | Paso 1 |
| 3 | Cambiar base path en vite.config.js | - |
| 4 | Agregar API Key al backend | - |
| 5 | Corregir CORS en server.js | - |
| 6 | Refactorizar App.jsx en componentes | Paso 2 |
| 7 | Crear configs Nginx | - |
| 8 | Crear config PM2 | - |
| 9 | Crear scripts de despliegue | Pasos 7-8 |
| 10 | Contratar VPS + DNS (manual) | - |
| 11 | Ejecutar setup en VPS | Pasos 9-10 |
| 12 | Deploy y verificar | Paso 11 |
