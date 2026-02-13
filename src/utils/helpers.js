/**
 * Normaliza fecha para input type="date" (requiere YYYY-MM-DD)
 */
export function formatFechaParaInput(fechaStr) {
  if (!fechaStr) return '';
  if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) return fechaStr;

  const parts = fechaStr.split(/[\/-]/);
  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (d.length === 4) return `${d}-${m.padStart(2, '0')}-${y.padStart(2, '0')}`;
    const anio = y.length === 2 ? `20${y}` : y;
    return `${anio}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}

/**
 * Determina la URL del backend segun el entorno.
 * En Railway, frontend y backend estan en el mismo dominio (rutas relativas).
 * En desarrollo local, el backend corre en puerto 3001.
 */
export function getBackendUrl() {
  // Si hay URL custom configurada, usarla
  const customUrl = localStorage.getItem('backendUrl');
  if (customUrl) return customUrl;

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // En local con Vite dev server (puerto 5173), apuntar al backend en 3001
  if (isLocal && window.location.port === '5173') {
    return 'http://localhost:3001';
  }

  // En produccion (Railway) o local sirviendo desde Express: rutas relativas
  return '';
}

/**
 * Obtiene la API key almacenada para autenticación con el backend
 */
export function getApiKey() {
  return localStorage.getItem('apiKey') || '';
}
