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
 * Determina la URL del backend según el entorno
 */
export function getBackendUrl() {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal
    ? 'http://localhost:3001'
    : (localStorage.getItem('backendUrl') || 'http://localhost:3001');
}

/**
 * Obtiene la API key almacenada para autenticación con el backend
 */
export function getApiKey() {
  return localStorage.getItem('apiKey') || '';
}
