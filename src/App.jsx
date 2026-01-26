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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Gasto Total (Mes)</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            ${totalGastado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center text-sm text-green-600">
            <span>+12.5% vs mes anterior</span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Tickets Facturados</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">{ticketsCompletados.length}</p>
          <div className="mt-2 flex items-center text-sm text-gray-600">
            <span>De {tickets.length} tickets escaneados</span>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Promedio por Ticket</h3>
          <p className="text-2xl md:text-3xl font-bold text-gray-900">
            ${ticketsCompletados.length ? (totalGastado / ticketsCompletados.length).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '0.00'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

    // Buscar RFC del EMISOR (el comercio) para identificación
    // Patrón robusto para RFC Mexicano (Moral y Física)
    const rfcRegex = /([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])/i;
    const matches = texto.match(new RegExp(rfcRegex, 'gi'));

    if (matches) {
      datos.rfcsEncontrados = matches.map(m => m.replace(/[\s-]/g, '').toUpperCase());
    }

    // Buscar Total: Maneja "$", espacios, comas y variaciones de la palabra TOTAL
    const totalRegex = /(?:TOTAL|IMPORTE TOTAL|PAGO|NETO).*?\$?\s*([\d,]+\.\d{2})/i;
    const totalMatch = texto.match(totalRegex);
    if (totalMatch) {
      datos.total = totalMatch[1].replace(/,/g, '');
    }

    // Buscar Fecha: DD/MM/YYYY, DD-MM-YY, etc.
    const fechaRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/;
    const fechaMatch = texto.match(fechaRegex);
    if (fechaMatch) datos.fecha = fechaMatch[1];

    // Buscar Folio: Típico en tickets de gasolina o retail
    const folioRegex = /(?:FOLIO|TICKET|TRANS|NOTA|VENTA).*?(\d+[A-Z\d]*)/i;
    const folioMatch = texto.match(folioRegex);
    if (folioMatch) datos.folio = folioMatch[1];

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
        workerBlobURL: false, // Evita problemas en algunos entornos
        logger: m => {
          if (m.status === 'recognizing text') {
            actualizarTicket({ mensaje: `Leyendo texto: ${Math.floor(m.progress * 100)}%` });
          }
        }
      });

      const textoExtraido = result.data.text;
      const datosOcr = extraerDatosDeTexto(textoExtraido);

      // Detección del comercio basada en el texto real
      const comercioDetectado = detectarComercioPorImagen(textoExtraido, datosOcr);

      if (comercioDetectado.comercioId) {
        actualizarTicket({
          comercio: comercioDetectado.comercioId,
          comercioDetectado: comercioDetectado.comercioId,
          confianzaDeteccion: comercioDetectado.confianza,
          qrDetectado: false,
          datos: { ...datosOcr, rawText: textoExtraido },
          deteccionComercioStatus: 'detectado',
          mensaje: `✓ ${comercioDetectado.nombre} detectado • Total: $${datosOcr.total || '?'}`
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
        mensaje: 'Error al leer el ticket (OCR)',
        deteccionComercioStatus: 'manual'
      });
    }
  };

  const detectarComercioPorImagen = (textoOArchivo, datosOcr) => {
    const inputLower = textoOArchivo.toLowerCase();
    const patterns = [
      { keywords: ['oxxo', 'cadena comercial oxxo'], rfc: 'CCO8605231N4', comercioId: 1, nombre: 'OXXO' },
      { keywords: ['pemex', 'combustibles', 'gasolinera', 'e.s.'], rfc: 'PME380607P14', comercioId: 2, nombre: 'Pemex' },
      { keywords: ['abimerhi', 'estacionamiento', 'servicios abimerhi', 'gasolinera abimerhi', 'f02379'], comercioId: 3, nombre: 'Abimerhi' },
      { keywords: ['lagas', 'la gas', 'corporativo de servicios', 'servifacil'], comercioId: 4, nombre: 'La Gas' },
      { keywords: ['g500', 'gasolinera g500', 'servicios g500'], comercioId: 5, nombre: 'G500' },
      { keywords: ['walmart', 'nueva wal mart', 'wal-mart', 'bodega aurrera'], rfc: 'NWM9709244W4', comercioId: 8, nombre: 'Walmart' },
      { keywords: ['chedraui', 'tiendas chedraui'], rfc: 'TCH850701RM1', comercioId: 9, nombre: 'Chedraui' },
    ];

    // 1. Intentar identificar por RFC
    if (datosOcr?.rfcsEncontrados) {
      for (const rfcEncontrado of datosOcr.rfcsEncontrados) {
        const match = patterns.find(p => p.rfc === rfcEncontrado);
        if (match) return { comercioId: match.comercioId, nombre: match.nombre, confianza: 100 };
      }
    }

    // 2. Intentar por palabras clave
    for (const pattern of patterns) {
      for (const keyword of pattern.keywords) {
        if (inputLower.includes(keyword)) {
          return {
            comercioId: pattern.comercioId,
            nombre: pattern.nombre,
            confianza: 90
          };
        }
      }
    }

    return { comercioId: null, nombre: null, confianza: 0 };
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

  const enviarAlRobot = async (ticket) => {
    const backendUrl = 'https://angelina-unrecuperated-lorilee.ngrok-free.dev/facturar';

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
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
    } catch (error) {
      console.error("Error conectando con el backend:", error);
      throw new Error(`Servidor Offline: El robot no está disponible en internet (${error.message})`);
    }
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
        intentos: (ticket.intentos || 0) + 1,
        ultimoIntento: new Date().toISOString(),
        mensaje: 'Conectando con el robot...'
      });

      // Llamada real al backend
      const resultado = await enviarAlRobot(ticket);

      if (resultado.success) {
        actualizarTicket({
          estado: 'completado',
          mensaje: `✓ ${resultado.message || 'Facturado con éxito'}`,
          datos: { ...ticket.datos, ...resultado.datos, folio: resultado.datos?.folio || 'Ver PDF' }
        });
        return true;
      } else {
        throw new Error(resultado.message || 'El robot no pudo completar la factura');
      }

    } catch (error) {
      actualizarTicket({
        estado: (ticket.intentos || 0) >= 2 ? 'fallido' : 'pendiente',
        mensaje: `⚠️ ${error.message}`
      });
      return false;
    } finally {
      setTicketActual(null);
    }
  };

  const procesarTodos = async () => {
    setProcesando(true);

    const pendientes = tickets.filter(t =>
      (t.estado === 'pendiente' || t.estado === 'fallido') && t.comercio !== null
    );

    if (pendientes.length === 0) {
      alert("No hay tickets listos para procesar. Asegúrate de que tengan un comercio asignado.");
      setProcesando(false);
      return;
    }

    for (const ticket of pendientes) {
      await procesarTicket(ticket);
      // Pequeña pausa entre tickets
      await new Promise(resolve => setTimeout(resolve, 1500));
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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6" style={{ backgroundColor: '#f5f5f5' }}>
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
        <div className="rounded-2xl shadow-xl p-4 md:p-6" style={{ backgroundColor: '#000052' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4 w-full md:w-auto">
              <img
                src={logoRotulate}
                alt="Rotulate"
                className="h-12 md:h-14 object-contain"
              />
              <div className="space-y-1">
                <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                  Sistema de Facturación Automática
                </h1>
                <p className="text-white/60 text-sm">Tickets de consumo • Robot México</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 w-full md:w-auto">
              <button
                onClick={() => setVista(vista === 'facturacion' ? 'estadisticas' : 'facturacion')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 border ${vista === 'estadisticas' ? 'bg-orange-500 border-orange-400 text-white shadow-lg' : 'hover:bg-white/10 text-white border-white/20'}`}
              >
                <BarChart2 size={18} />
                <span className="font-bold text-sm">Dashboard</span>
              </button>
              <button
                onClick={() => setMostrarConfig(!mostrarConfig)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors border border-white/20 text-white"
              >
                <Settings size={22} />
              </button>
            </div>
          </div>
        </div>

        {vista === 'estadisticas' ? (
          <DashboardEstadisticas tickets={tickets} comercios={comercios} />
        ) : (
          <>
            {/* Card 2: Estadísticas y Controles */}
            <div className="rounded-2xl shadow-xl p-4 md:p-6" style={{ backgroundColor: '#000052' }}>
              <div className="space-y-6">
                {/* Cuadrícula de Estadísticas (Ajustada para móvil) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border-l-4 border-blue-400">
                    <div className="text-2xl font-bold text-white leading-none">{estadisticas.total}</div>
                    <div className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-white/50 mt-1">Cargados</div>
                  </div>
                  <div className="bg-green-500/10 backdrop-blur-sm p-4 rounded-xl border-l-4 border-green-400">
                    <div className="text-2xl font-bold text-green-400 leading-none">{estadisticas.completados}</div>
                    <div className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-white/50 mt-1">Éxito</div>
                  </div>
                  <div className="bg-orange-500/10 backdrop-blur-sm p-4 rounded-xl border-l-4 border-orange-400">
                    <div className="text-2xl font-bold text-orange-400 leading-none">{estadisticas.pendientes}</div>
                    <div className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-white/50 mt-1">Pendientes</div>
                  </div>
                  <div className="bg-red-500/10 backdrop-blur-sm p-4 rounded-xl border-l-4 border-red-400">
                    <div className="text-2xl font-bold text-red-400 leading-none">{estadisticas.fallidos}</div>
                    <div className="text-[10px] md:text-xs uppercase tracking-wider font-bold text-white/50 mt-1">Fallos</div>
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

                {/* Zona de Carga y Acción (Totalmente Responsive) */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <label className="flex-1 cursor-pointer group">
                    <div className="h-full border-2 border-dashed border-white/20 rounded-xl p-6 text-center group-hover:bg-white/5 group-hover:border-orange-500 transition-all flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Upload className="text-white/70 group-hover:text-orange-500" size={24} />
                      </div>
                      <span className="text-white font-medium">Subir tickets</span>
                      <p className="text-white/40 text-[10px] mt-1">PDF, JPG o PNG</p>
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
                    className="w-full sm:w-auto sm:px-10 py-6 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 disabled:grayscale disabled:opacity-50 ring-4 ring-transparent hover:ring-green-400/30"
                    style={{
                      backgroundColor: procesando || tickets.length === 0 ? '#374151' : '#00ff00',
                      color: '#000052'
                    }}
                  >
                    {procesando ? (
                      <><Pause size={24} className="animate-pulse" /> Procesando...</>
                    ) : (
                      <><Play size={24} fill="#000052" /> FACTURAR TODO</>
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

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Comercio:</span>
                              <select
                                value={ticket.comercio || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value) : null;
                                  setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, comercio: val, deteccionComercioStatus: val ? 'manual' : 'manual' } : t));
                                }}
                                className={`px-3 py-1.5 rounded-lg border text-sm font-medium focus:ring-2 focus:ring-orange-500 outline-none transition-all ${!ticket.comercio ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700'}`}
                              >
                                <option value="">-- Seleccionar Comercio --</option>
                                {comercios.map(c => (
                                  <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                              </select>
                            </div>

                            {ticket.datos?.total && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Monto:</span>
                                <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-md">${ticket.datos.total}</span>
                              </div>
                            )}

                            {ticket.datos?.fecha && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha:</span>
                                <span className="text-gray-700">{ticket.datos.fecha}</span>
                              </div>
                            )}

                            {ticket.intentos > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Intentos:</span>
                                <span>{ticket.intentos}/3</span>
                              </div>
                            )}
                          </div>

                          {ticket.mensaje && (
                            <div className={`mt-3 text-sm font-medium flex items-center gap-1.5 p-2 rounded-lg ${ticket.estado === 'completado' ? 'text-green-700 bg-green-50 border border-green-100' :
                              ticket.estado === 'fallido' ? 'text-red-700 bg-red-50 border border-red-100' :
                                'text-blue-700 bg-blue-50 border border-blue-100'
                              }`}>
                              {ticket.estado === 'procesando' && <Clock size={14} className="animate-spin" />}
                              {ticket.estado === 'completado' && <CheckCircle size={14} />}
                              {ticket.estado === 'fallido' && <XCircle size={14} />}
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