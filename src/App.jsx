import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, CheckCircle, XCircle, Clock, AlertCircle, Trash2, Plus, Settings, QrCode, Camera, BarChart2 } from 'lucide-react';
import Tesseract from 'tesseract.js';

// Componente de Dashboard

const DashboardEstadisticas = ({ tickets, comercios }) => {
  const ticketsCompletados = tickets.filter(t => t.estado === 'completado');

  // Cálculo de métricas
  const totalGastado = ticketsCompletados.reduce((acc, t) => {
    const total = parseFloat(t.qrData?.total || t.datos?.total || 0);
    return acc + (isNaN(total) ? 0 : total);
  }, 0);

  // Agrupar por comercio
  const gastosPorComercio = ticketsCompletados.reduce((acc, t) => {
    const comercio = comercios.find(c => c.id === t.comercio)?.nombre || 'Desconocido';
    if (!acc[comercio]) acc[comercio] = 0;
    const total = parseFloat(t.qrData?.total || t.datos?.total || 0);
    acc[comercio] += (isNaN(total) ? 0 : total);
    return acc;
  }, {});

  const topComercios = Object.entries(gastosPorComercio)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const maxGasto = Math.max(...Object.values(gastosPorComercio), 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Gasto Total (Mes)</h3>
          <p className="text-3xl font-bold text-gray-900">
            ${totalGastado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <span>+12.5% vs mes anterior</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Tickets Facturados</h3>
          <p className="text-3xl font-bold text-gray-900">{ticketsCompletados.length}</p>
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <span>De {tickets.length} tickets escaneados</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Promedio por Ticket</h3>
          <p className="text-3xl font-bold text-gray-900">
            ${ticketsCompletados.length ? (totalGastado / ticketsCompletados.length).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-6">Gastos por Comercio</h3>
          <div className="space-y-4">
            {topComercios.map(([nombre, monto], index) => (
              <div key={nombre}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{nombre}</span>
                  <span className="text-gray-900 font-bold">${monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-2.5 rounded-full transition-all duration-1000"
                    style={{
                      width: `${(monto / maxGasto) * 100}%`,
                      backgroundColor: index === 0 ? '#000052' : index === 1 ? '#ff6400' : '#4b5563'
                    }}
                  ></div>
                </div>
              </div>
            ))}
            {topComercios.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay datos suficientes</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Últimos Movimientos</h3>
          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Comercio</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ticketsCompletados.slice(-5).reverse().map(t => (
                  <tr key={t.id}>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {t.qrData?.fecha || new Date().toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {comercios.find(c => c.id === t.comercio)?.nombre}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      ${(t.qrData?.total || t.datos?.total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ticketsCompletados.length === 0 && (
              <p className="text-center text-gray-500 py-8">No hay movimientos recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// Componente Principal
function FacturacionAutomatica() {
  // Logo en base64
  const logoRotulate = "logo_rotulate.png";

  const [vista, setVista] = useState('facturacion');
  const [tickets, setTickets] = useState([]);
  const [comercios, setComercios] = useState([
    {
      id: 1,
      nombre: 'OXXO',
      url: 'https://www.oxxo.com/facturacion',
      tipoAuth: 'ninguna',
      soportaQR: true,
      campos: ['rfc', 'email', 'total']
    },
    {
      id: 2,
      nombre: 'Pemex',
      url: 'https://facturacion.pemex.com',
      tipoAuth: 'siempre',
      soportaQR: true,
      campos: ['rfc', 'email', 'folio']
    },
    {
      id: 3,
      nombre: 'Abimerhi',
      url: 'https://facturacion.abimerhi.com',
      tipoAuth: 'opcional',
      soportaQR: true,
      campos: ['rfc', 'email', 'folio', 'estacion']
    },
    {
      id: 4,

      tipoAuth: 'opcional',
      soportaQR: true,
      campos: ['rfc', 'email', 'folio']
    },
    {
      id: 5,
      nombre: 'G500',
      url: 'https://facturacion.g500.com.mx',
      tipoAuth: 'opcional',
      soportaQR: true,
      campos: ['rfc', 'email', 'folio']
    },
    {
      id: 6,
      nombre: 'FacturasGas',
      url: 'https://www.facturasgas.com',
      tipoAuth: 'opcional',
      soportaQR: true,
      campos: ['rfc', 'email', 'folio', 'estacion']
    },
    {
      id: 7,
      nombre: 'Bonpane',
      url: 'https://facturacion.bonpane.com',
      tipoAuth: 'ninguna',
      soportaQR: true,
      campos: ['rfc', 'email', 'total', 'fecha']
    },
    {
      id: 8,
      nombre: 'Walmart',
      url: 'https://www.walmart.com.mx/facturacion',
      tipoAuth: 'ninguna',
      soportaQR: true,
      campos: ['rfc', 'email', 'ticket', 'total']
    },
    {
      id: 9,
      nombre: 'Chedraui',
      url: 'https://www.chedraui.com.mx/facturacion',
      tipoAuth: 'ninguna',
      soportaQR: true,
      campos: ['rfc', 'email', 'ticket', 'total']
    },
    {
      id: 10,
      nombre: 'Soriana',
      url: 'https://www.soriana.com/facturacion',
      tipoAuth: 'opcional',
      soportaQR: true,
      campos: ['rfc', 'email', 'ticket', 'total']
    },
    {
      id: 11,
      nombre: 'Costco',
      url: 'https://www.costco.com.mx/facturacion',
      tipoAuth: 'siempre',
      soportaQR: true,
      campos: ['rfc', 'email', 'ticket', 'membresia']
    },
    {
      id: 12,
      nombre: "Sam's Club",
      url: 'https://www.sams.com.mx/facturacion',
      tipoAuth: 'siempre',
      soportaQR: true,
      campos: ['rfc', 'email', 'ticket', 'membresia']
    },
    {
      id: 13,
      nombre: 'Home Depot',
      url: 'https://www.homedepot.com.mx/facturacion',
      tipoAuth: 'ninguna',
      soportaQR: true,
      campos: ['rfc', 'email', 'ticket', 'total', 'sucursal']
    },
    {
      id: 14,
      nombre: 'AutoZone',
      url: 'https://www.autozone.com.mx/facturacion',
      tipoAuth: 'ninguna',
      soportaQR: true,
      campos: ['rfc', 'email', 'ticket', 'total', 'sucursal']
    },
    {
      id: 15,
      nombre: 'Tlapalería/Ferretería',
      url: 'https://facturacion.ejemplo.com',
      tipoAuth: 'ninguna',
      soportaQR: false,
      campos: ['rfc', 'email', 'fecha', 'total']
    }
  ]);

  const [credenciales, setCredenciales] = useState({});
  const [datosFacturacion, setDatosFacturacion] = useState({
    rfc: 'AEGO780310EJ3',
    razonSocial: 'OMAR ESTEBAN ARELLANO GODINEZ',
    email: 'rotulatemx@gmail.com',
    codigoPostal: '77536',
    regimenFiscal: '626'
  });

  const [procesando, setProcesando] = useState(false);
  const [ticketActual, setTicketActual] = useState(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [escaneoQR, setEscaneoQR] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);











  // Cargar datos guardados
  useEffect(() => {
    const ticketsGuardados = JSON.parse(localStorage.getItem('tickets') || '[]');
    const credsGuardadas = JSON.parse(localStorage.getItem('credenciales') || '{ }');
    const datosGuardados = JSON.parse(localStorage.getItem('datosFacturacion') || '{ }');

    if (ticketsGuardados.length > 0) setTickets(ticketsGuardados);
    if (Object.keys(credsGuardadas).length > 0) setCredenciales(credsGuardadas);
    if (Object.keys(datosGuardados).length > 0) setDatosFacturacion(datosGuardados);
  }, []);

  // Guardar datos
  useEffect(() => {
    localStorage.setItem('tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('credenciales', JSON.stringify(credenciales));
  }, [credenciales]);

  useEffect(() => {
    localStorage.setItem('datosFacturacion', JSON.stringify(datosFacturacion));
  }, [datosFacturacion]);

  const agregarTicket = (archivo) => {
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
      escaneoQRStatus: 'pendiente', // pendiente, escaneando, encontrado, no_encontrado
      deteccionComercioStatus: 'detectando' // detectando, detectado, manual
    };

    // Intentar detectar QR y comercio automáticamente
    detectarQRYComercio(archivo, nuevoTicket.id);

    setTickets(prev => [...prev, nuevoTicket]);
  };

  const extraerDatosDeTexto = (texto) => {
    const lines = texto.split('\n');
    const datos = {
      rfc: null,
      total: null,
      fecha: null,
      folio: null
    };

    // Buscar RFC (Patrón simple para México)
    const rfcRegex = /[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[012])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{2}[0-9A]/i;
    const rfcMatch = texto.match(rfcRegex);
    if (rfcMatch) datos.rfc = rfcMatch[0].toUpperCase();

    // Buscar Total (Busca "TOTAL" y luego un número)
    const totalRegex = /TOTAL[:\s]*\$?\s*([0-9]{1,5}\.[0-9]{2})/i;
    const totalMatch = texto.match(totalRegex);
    if (totalMatch) datos.total = totalMatch[1];

    // Buscar Fecha (DD/MM/YYYY o similar)
    const fechaRegex = /(\d{2}[\/-]\d{2}[\/-]\d{2,4})/;
    const fechaMatch = texto.match(fechaRegex);
    if (fechaMatch) datos.fecha = fechaMatch[1];

    return datos;
  };

  const detectarQRYComercio = async (archivo, ticketId) => {
    const actualizarTicket = (cambios) => {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...cambios } : t));
    };

    actualizarTicket({
      escaneoQRStatus: 'escaneando',
      deteccionComercioStatus: 'detectando',
      mensaje: 'Iniciando lectura OCR...'
    });

    try {
      // Usar Tesseract para leer la imagen
      const result = await Tesseract.recognize(archivo, 'spa', {
        logger: m => {
          if (m.status === 'recognizing text') {
            actualizarTicket({ mensaje: `Leyendo texto: ${Math.floor(m.progress * 100)}%` });
          }
        }
      });

      const textoExtraido = result.data.text;
      const datosOcr = extraerDatosDeTexto(textoExtraido);

      // Detección del comercio basada en el texto real
      const comercioDetectado = detectarComercioPorImagen(textoExtraido, null);

      if (comercioDetectado.comercioId) {
        const comercioSeleccionado = comercios.find(c => c.id === comercioDetectado.comercioId);
        actualizarTicket({
          comercio: comercioDetectado.comercioId,
          comercioDetectado: comercioDetectado.comercioId,
          confianzaDeteccion: comercioDetectado.confianza,
          qrDetectado: false, // Por ahora solo OCR plano
          datos: { ...datosOcr, rawText: textoExtraido },
          deteccionComercioStatus: 'detectado',
          mensaje: `✓ ${comercioDetectado.nombre} detectado • Datos extraídos: $${datosOcr.total || '?'}`
        });
      } else {
        actualizarTicket({
          deteccionComercioStatus: 'manual',
          datos: { ...datosOcr, rawText: textoExtraido },
          mensaje: datosOcr.total ? `OCR: Total detectado $${datosOcr.total}` : 'Lectura completada. Seleccione comercio.'
        });
      }

    } catch (error) {
      console.error("Error en OCR:", error);
      actualizarTicket({
        mensaje: 'Error al leer el ticket',
        deteccionComercioStatus: 'manual'
      });
    }
  };

  const detectarComercioPorImagen = (textoOArchivo, qrData) => {
    const inputLower = textoOArchivo.toLowerCase();
    const patterns = [
      { keywords: ['oxxo', 'cadena comercial oxxo'], comercioId: 1, nombre: 'OXXO' },
      { keywords: ['pemex', 'petroleos mexicanos'], comercioId: 2, nombre: 'Pemex' },
      { keywords: ['abimerhi'], comercioId: 3, nombre: 'Abimerhi' },
      { keywords: ['lagas', 'la gas'], comercioId: 4, nombre: 'La Gas' },
      { keywords: ['g500'], comercioId: 5, nombre: 'G500' },
      { keywords: ['facturasgas'], comercioId: 6, nombre: 'FacturasGas' },
      { keywords: ['bonpane'], comercioId: 7, nombre: 'Bonpane' },
      { keywords: ['walmart', 'nueva wal mart'], comercioId: 8, nombre: 'Walmart' },
      { keywords: ['chedraui'], comercioId: 9, nombre: 'Chedraui' },
      { keywords: ['soriana'], comercioId: 10, nombre: 'Soriana' },
      { keywords: ['costco'], comercioId: 11, nombre: 'Costco' },
      { keywords: ['sams', 'sam\'s club'], comercioId: 12, nombre: "Sam's Club" },
      { keywords: ['home depot', 'homedepot'], comercioId: 13, nombre: 'Home Depot' },
      { keywords: ['autozone'], comercioId: 14, nombre: 'AutoZone' },
    ];

    // Buscar en el texto
    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (inputLower.includes(keyword)) {
          return {
            comercioId: pattern.comercioId,
            nombre: pattern.nombre,
            confianza: 95
          };
        }
      }
    }

    return {
      comercioId: null,
      nombre: null,
      confianza: 0
    };
  };

  const escanearQRManual = async (ticketId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      setEscaneoQR(ticketId);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();

        // Simular escaneo manual
        setTimeout(() => {
          const qrData = {
            url: 'https://verificacfdi.facturaelectronica.sat.gob.mx/?id=MANUAL123',
            rfc: 'XAXX010101000',
            total: (Math.random() * 1000 + 100).toFixed(2),
            uuid: `${Math.random().toString(36).substr(2, 8)}-manual`,
            fecha: new Date().toISOString().split('T')[0]
          };

          setTickets(prev => prev.map(t =>
            t.id === ticketId ? {
              ...t,
              qrDetectado: true,
              qrData: qrData,
              escaneoQRStatus: 'encontrado',
              mensaje: '✓ QR escaneado manualmente'
            } : t
          ));

          stream.getTracks().forEach(track => track.stop());
          setEscaneoQR(false);
        }, 3000);
      }
    } catch (error) {
      alert('Error al acceder a la cámara: ' + error.message);
      setEscaneoQR(false);
    }
  };

  const handleFileUpload = (e) => {
    const archivos = Array.from(e.target.files);
    archivos.forEach(archivo => agregarTicket(archivo));
  };

  const simularFacturacion = async (ticket) => {
    // Simula el proceso de facturación
    await new Promise(resolve => setTimeout(resolve, 2000));

    const comercio = comercios.find(c => c.id === ticket.comercio);

    // Simular diferentes escenarios

    // Validar credenciales si son requeridas
    if (comercio?.tipoAuth === 'siempre' && !credenciales[comercio.id]) {
      // Comercio requiere autenticación obligatoria pero no hay credenciales
      throw new Error('Este comercio requiere autenticación obligatoria. Configure credenciales.');
    } else if (comercio?.tipoAuth === 'opcional' && ticket.usarCredenciales && !credenciales[comercio.id]) {
      // Usuario quiere usar credenciales pero no están configuradas
      throw new Error('Credenciales no configuradas para este comercio');
    }

    // Éxito
    const metodo = ticket.usarCredenciales ? 'con cuenta' : 'sin cuenta';
    const usaQR = ticket.qrDetectado && comercio?.soportaQR;

    // Simular detección de ticket ya facturado (solo si el QR lo indica explícitamente)
    if (ticket.yaFacturado) {
      throw new Error('El ticket ya fue facturado previamente');
    }

    return {
      folio: `FAC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      uuid: ticket.qrData?.uuid || `${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 4)}`,
      fecha: new Date().toLocaleString('es-MX'),
      metodo: metodo,
      viaQR: usaQR,
      total: ticket.qrData?.total || 'N/A'
    };
  };

  const procesarTicket = async (ticket) => {
    setTicketActual(ticket.id);

    const actualizarTicket = (cambios) => {
      setTickets(prev => prev.map(t =>
        t.id === ticket.id ? { ...t, ...cambios } : t
      ));
    };

    try {
      actualizarTicket({
        estado: 'procesando',
        intentos: ticket.intentos + 1,
        ultimoIntento: new Date().toISOString()
      });

      const resultado = await simularFacturacion(ticket);

      actualizarTicket({
        estado: 'completado',
        mensaje: `Factura generada: ${resultado.folio}`,
        datos: resultado
      });

      return true;
    } catch (error) {
      actualizarTicket({
        estado: ticket.intentos >= 2 ? 'fallido' : 'pendiente',
        mensaje: error.message
      });

      return false;
    } finally {
      setTicketActual(null);
    }
  };

  const procesarTodos = async () => {
    setProcesando(true);

    const pendientes = tickets.filter(t =>
      t.estado === 'pendiente' || (t.estado === 'fallido' && t.intentos < 3)
    );

    for (const ticket of pendientes) {
      // Validación de estado eliminado temporalmente para corregir error de inicio
      await procesarTicket(ticket);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setProcesando(false);
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'procesando':
        return <Clock className="text-blue-500 animate-spin" size={20} />;
      case 'fallido':
        return <XCircle className="text-red-500" size={20} />;
      case 'pendiente':
        return <AlertCircle className="text-yellow-500" size={20} />;
      default:
        return <Clock className="text-gray-400" size={20} />;
    }
  };

  const estadisticas = {
    total: tickets.length,
    completados: tickets.filter(t => t.estado === 'completado').length,
    pendientes: tickets.filter(t => t.estado === 'pendiente').length,
    fallidos: tickets.filter(t => t.estado === 'fallido').length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Modal de escaneo QR manual */}
      {escaneoQR && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Escanear QR</h3>
              <button
                onClick={() => {
                  setEscaneoQR(false);
                  if (videoRef.current?.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop());
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Coloca el código QR dentro del marco
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Card 1: Cabecera Principal */}
        <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: '#000052' }}>
          <div className="flex items-center justify-between pb-4 border-b border-white/20">
            <div className="flex items-center gap-4">
              <img
                src={logoRotulate}
                alt="Rotulate Soluciones Gráficas"
                className="h-12"
              />
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Sistema de Facturación Automática
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVista(vista === 'facturacion' ? 'estadisticas' : 'facturacion')}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${vista === 'estadisticas' ? 'bg-orange-500 text-white' : 'hover:bg-white/10 text-white'}`}
                title="Estadísticas"
              >
                <BarChart2 size={24} style={{ color: '#ffffff' }} />
                <span className="font-medium text-white">Estadísticas</span>
              </button>
              <button
                onClick={() => setMostrarConfig(!mostrarConfig)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Configuración"
              >
                <Settings size={24} style={{ color: '#ffffff' }} />
              </button>
            </div>
          </div>
        </div>

        {vista === 'estadisticas' ? (
          <DashboardEstadisticas tickets={tickets} comercios={comercios} />
        ) : (
          <>
            {/* Card 2: Estadísticas y Controles */}
            <div className="rounded-2xl shadow-xl p-6" style={{ backgroundColor: '#000052' }}>
              <div className="space-y-6">
                {/* Estadísticas Rápidas */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border-l-4 border-white/30">
                    <div className="text-2xl font-bold text-white">{estadisticas.total}</div>
                    <div className="text-sm text-white/70">Total cargados</div>
                  </div>
                  <div className="bg-green-500/20 backdrop-blur-sm p-4 rounded-lg border-l-4 border-[#00ff00]">
                    <div className="text-2xl font-bold text-[#00ff00]">{estadisticas.completados}</div>
                    <div className="text-sm text-white/70">Completados</div>
                  </div>
                  <div className="bg-orange-500/20 backdrop-blur-sm p-4 rounded-lg border-l-4 border-[#ff6400]">
                    <div className="text-2xl font-bold text-[#ff6400]">{estadisticas.pendientes}</div>
                    <div className="text-sm text-white/70">Pendientes</div>
                  </div>
                  <div className="bg-red-500/20 backdrop-blur-sm p-4 rounded-lg border-l-4 border-red-500">
                    <div className="text-2xl font-bold text-red-500">{estadisticas.fallidos}</div>
                    <div className="text-sm text-white/70">Fallidos</div>
                  </div>
                </div>

                {/* Configuración (si está abierta) */}
                {mostrarConfig && (
                  <div className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 animate-in fade-in zoom-in duration-300">
                    <h2 className="text-xl font-semibold text-white mb-4">Configuración de Emisor</h2>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-medium text-white/50 uppercase mb-1">RFC</label>
                        <input
                          type="text"
                          value={datosFacturacion.rfc}
                          onChange={(e) => setDatosFacturacion({ ...datosFacturacion, rfc: e.target.value })}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/50 uppercase mb-1">Razón Social</label>
                        <input
                          type="text"
                          value={datosFacturacion.razonSocial}
                          onChange={(e) => setDatosFacturacion({ ...datosFacturacion, razonSocial: e.target.value })}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/50 uppercase mb-1">Email</label>
                        <input
                          type="text"
                          value={datosFacturacion.email}
                          onChange={(e) => setDatosFacturacion({ ...datosFacturacion, email: e.target.value })}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-white/50 uppercase mb-1">CP</label>
                        <input
                          type="text"
                          value={datosFacturacion.codigoPostal}
                          onChange={(e) => setDatosFacturacion({ ...datosFacturacion, codigoPostal: e.target.value })}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Zona de Carga y Acción */}
                <div className="flex gap-4">
                  <label className="flex-1 cursor-pointer group">
                    <div className="border-2 border-dashed border-white/30 rounded-lg p-8 text-center group-hover:bg-white/5 group-hover:border-[#ff6400] transition-all">
                      <Upload className="mx-auto mb-2 text-white/50 group-hover:text-[#ff6400]" size={32} />
                      <span className="text-white/70 group-hover:text-white">Subir tickets (PDF, JPG, PNG)</span>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  </label>

                  <button
                    onClick={procesarTodos}
                    disabled={procesando || tickets.length === 0}
                    className="px-8 py-4 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:grayscale disabled:opacity-50"
                    style={{
                      backgroundColor: procesando || tickets.length === 0 ? '#4b5563' : '#00ff00',
                      color: '#000052'
                    }}
                  >
                    {procesando ? (
                      <><Pause size={20} className="animate-pulse" /> Procesando...</>
                    ) : (
                      <><Play size={20} /> Iniciar Facturación</>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Lista de Tickets (Fondo Blanco para legibilidad) */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                  Tickets Cargados ({tickets.length})
                </h2>
                {tickets.length > 0 && (
                  <button
                    onClick={() => setTickets([])}
                    className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    Limpiar lista
                  </button>
                )}
              </div>

              {tickets.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                    <Upload size={32} className="text-gray-300" />
                  </div>
                  <p className="text-gray-900 font-medium">No hay tickets pendientes</p>
                  <p className="text-gray-500 text-sm">Arrastra tus archivos aquí o usa el botón superior</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div
                      key={ticket.id}
                      className={`group border-2 rounded-xl p-5 transition-all duration-300 ${ticketActual === ticket.id ? 'border-orange-500 bg-orange-50 shadow-md ring-4 ring-orange-500/10' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start gap-5">
                        <div className="p-3 bg-white rounded-lg shadow-sm">
                          {getEstadoIcon(ticket.estado)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-bold text-gray-900 truncate">{ticket.nombre}</h3>
                            {ticket.usarCredenciales && (
                              <span className="text-[10px] uppercase tracking-wider font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                                Cuenta Activa
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            {ticket.comercio && (
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                {comercios.find(c => c.id === ticket.comercio)?.nombre}
                              </span>
                            )}
                            {ticket.qrData?.total && (
                              <span className="font-bold text-gray-900">${ticket.qrData.total}</span>
                            )}
                            {ticket.intentos > 0 && <span>Intento {ticket.intentos}/3</span>}
                          </div>

                          {ticket.mensaje && (
                            <div className={`mt-3 text-sm font-medium flex items-center gap-1.5 ${ticket.estado === 'completado' ? 'text-green-600' :
                              ticket.estado === 'fallido' ? 'text-red-500' : 'text-blue-600'
                              }`}>
                              <span className={`w-1 h-1 rounded-full ${ticket.estado === 'completado' ? 'bg-green-600' :
                                ticket.estado === 'fallido' ? 'bg-red-500' : 'bg-blue-600'
                                }`}></span>
                              {ticket.mensaje}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-center">
                          {ticket.estado === 'fallido' && (
                            <button
                              onClick={() => procesarTicket(ticket)}
                              className="p-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                              title="Reintentar"
                            >
                              <Play size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => setTickets(prev => prev.filter(t => t.id !== ticket.id))}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FacturacionAutomatica;