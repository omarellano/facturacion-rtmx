import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { procesarTicketImagen } from '../utils/ocr';
import { getBackendUrl, getApiKey } from '../utils/helpers';

/**
 * Hook central para gestionar el estado de tickets
 */
export function useTickets() {
  const [tickets, setTickets] = useLocalStorage('tickets', []);
  const [procesando, setProcesando] = useState(false);
  const [ticketActual, setTicketActual] = useState(null);

  const actualizarTicket = useCallback((ticketId, cambios) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...cambios } : t));
  }, [setTickets]);

  const agregarTicket = useCallback((archivo) => {
    const nuevoTicket = {
      id: Date.now(),
      nombre: archivo.name,
      archivo: archivo,
      comercio: null,
      comercioDetectado: null,
      confianzaDeteccion: 0,
      usarCredenciales: false,
      estado: 'pendiente',
      intentos: 0,
      ultimoIntento: null,
      mensaje: '',
      datos: {},
      qrDetectado: false,
      qrData: null,
      escaneoQRStatus: 'pendiente',
      deteccionComercioStatus: 'detectando'
    };

    setTickets(prev => [...prev, nuevoTicket]);

    // Procesar imagen en background
    procesarTicketImagen(archivo, (mensaje) => {
      actualizarTicket(nuevoTicket.id, {
        escaneoQRStatus: 'escaneando',
        deteccionComercioStatus: 'detectando',
        mensaje
      });
    }).then(resultado => {
      const { datos, qrData, comercio } = resultado;

      if (comercio.comercioId || qrData) {
        actualizarTicket(nuevoTicket.id, {
          comercio: comercio.comercioId,
          comercioDetectado: comercio.comercioId,
          confianzaDeteccion: comercio.confianza || 100,
          qrDetectado: !!qrData,
          qrData,
          datos,
          deteccionComercioStatus: 'detectado',
          mensaje: `✓ ${comercio.nombre || 'Detectado'} • $${datos.total || '?'}`
        });
      } else {
        actualizarTicket(nuevoTicket.id, {
          deteccionComercioStatus: 'manual',
          datos,
          mensaje: datos.total ? `Total: $${datos.total}` : 'Datos listos para verificar.'
        });
      }
    }).catch(() => {
      actualizarTicket(nuevoTicket.id, {
        mensaje: 'Lectura con dificultades. Revise campos.',
        deteccionComercioStatus: 'manual'
      });
    });
  }, [setTickets, actualizarTicket]);

  const eliminarTicket = useCallback((ticketId) => {
    setTickets(prev => prev.filter(t => t.id !== ticketId));
  }, [setTickets]);

  const limpiarTickets = useCallback(() => {
    setTickets([]);
  }, [setTickets]);

  const enviarAlRobot = async (ticket, datosFacturacion, credenciales) => {
    const backendUrl = `${getBackendUrl()}/facturar`;
    const apiKey = getApiKey();

    const headers = {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(backendUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ticket: {
          id: ticket.id,
          nombre: ticket.nombre,
          comercio: ticket.comercio,
          datos: ticket.datos,
          qrData: ticket.qrData
        },
        config: datosFacturacion,
        credenciales: credenciales[ticket.comercio] || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error en el servidor de automatización');
    }

    return await response.json();
  };

  const procesarTicket = useCallback(async (ticket, datosFacturacion, credenciales) => {
    setTicketActual(ticket.id);

    try {
      actualizarTicket(ticket.id, {
        estado: 'procesando',
        intentos: (ticket.intentos || 0) + 1,
        ultimoIntento: new Date().toISOString(),
        mensaje: 'Conectando con el robot...'
      });

      const resultado = await enviarAlRobot(ticket, datosFacturacion, credenciales);

      if (resultado.success) {
        actualizarTicket(ticket.id, {
          estado: 'completado',
          mensaje: `✓ ${resultado.message || 'Facturado con éxito'}`,
          evidencia: resultado.evidencia,
          datos: { ...ticket.datos, ...resultado.datos, folio: resultado.datos?.folio || 'Ver PDF' }
        });
        return true;
      } else {
        throw new Error(resultado.message || 'El robot no pudo completar la factura');
      }
    } catch (error) {
      actualizarTicket(ticket.id, {
        estado: (ticket.intentos || 0) >= 2 ? 'fallido' : 'pendiente',
        mensaje: `⚠️ ${error.message}`
      });
      return false;
    } finally {
      setTicketActual(null);
    }
  }, [actualizarTicket]);

  const procesarTodos = useCallback(async (datosFacturacion, credenciales) => {
    setProcesando(true);

    const pendientes = tickets.filter(t =>
      (t.estado === 'pendiente' || t.estado === 'fallido') && t.comercio !== null
    );

    if (pendientes.length === 0) {
      const completados = tickets.filter(t => t.estado === 'completado' && t.comercio !== null);
      if (completados.length > 0) {
        if (confirm("Todos los tickets ya están completados. ¿Deseas volver a procesarlos?")) {
          for (const ticket of completados) {
            await procesarTicket(ticket, datosFacturacion, credenciales);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
      } else {
        alert("No hay tickets listos. Asegúrate de seleccionar un comercio para cada ticket.");
      }
      setProcesando(false);
      return;
    }

    for (const ticket of pendientes) {
      await procesarTicket(ticket, datosFacturacion, credenciales);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    setProcesando(false);
  }, [tickets, procesarTicket]);

  const estadisticas = {
    total: tickets.length,
    completados: tickets.filter(t => t.estado === 'completado').length,
    pendientes: tickets.filter(t => t.estado === 'pendiente').length,
    fallidos: tickets.filter(t => t.estado === 'fallido').length
  };

  return {
    tickets,
    setTickets,
    procesando,
    ticketActual,
    estadisticas,
    agregarTicket,
    eliminarTicket,
    limpiarTickets,
    actualizarTicket,
    procesarTicket,
    procesarTodos
  };
}
