import { useState, useEffect } from 'react';
import { getBackendUrl } from '../utils/helpers';

/**
 * Hook para monitorear el estado de conexión con el servidor backend
 */
export function useServerStatus(intervalMs = 30000) {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const baseUrl = getBackendUrl();
        const response = await fetch(`${baseUrl}/status`, {
          cache: 'no-store',
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        setStatus(response.ok ? 'online' : 'offline');
      } catch {
        setStatus('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return [status, setStatus];
}
