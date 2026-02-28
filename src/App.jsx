import React, { useState, useEffect, useRef } from 'react';
import { Upload, Play, Pause, CheckCircle, XCircle, Clock, AlertCircle, Trash2, Plus, Settings, QrCode, Camera, BarChart2 } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { Html5Qrcode } from "html5-qrcode";

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
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>{ticketsCompletados.length} tickets facturados</span>
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
      nombre: 'La Gas',
      url: 'https://lagas.com.mx/facturacion/',
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
  const [evidenciaModal, setEvidenciaModal] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking'); // checking, online, offline
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

  // Obtener la URL base del backend desde variables de entorno
  const getBackendBaseUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  };

  const getApiKey = () => {
    return import.meta.env.VITE_API_KEY || '';
  };

  // Verificar conexión con el robot periódicamente
  useEffect(() => {
    const checkStatus = async () => {
      const baseUrl = getBackendBaseUrl();
      try {
        const response = await fetch(`${baseUrl}/status`, {
          cache: 'no-store',
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          setServerStatus('online');
        } else {
          setServerStatus('offline');
        }
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Función principal para extraer datos por OCR (Mejorada para ser más agresiva)
  const extraerDatosDeTexto = (texto) => {
    // Limpieza de ruido común en OCR
    const textoLimpio = texto.replace(/[|¦]/g, 'I').replace(/[°º]/g, '');

    const datos = {
      rfc: null,
      total: null,
      fecha: null,
      folio: null,
      webid: null,
      estacion: null
    };

    // 1. Buscador de RFC (Más agresivo)
    const rfcRegex = /([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])/gi;
    const rfcMatches = textoLimpio.match(rfcRegex);
    if (rfcMatches) {
      datos.rfcsEncontrados = rfcMatches.map(m => m.replace(/[\s-]/g, '').toUpperCase());
    }

    // 2. Buscador de Total (Múltiples anclas y flexibilidad decimal)
    const totalPatterns = [
      /(?:TOTAL|IMPORTE|NETO|PAGAR|MONTO|PAGO|VENTA)[\s\S]{0,40}?\$?\s*([\d,]+\.\d{2})/i,
      /(?:TOTAL)\s*:?\s*\$?\s*([\d,]+\.\d{2})/i,
      /\$?\s*([\d,]+\.\d{2})\s*(?:MXN|PESOS|M\.N\.)/i,
      /([\d,]+\.\d{2})\s*$/m // Último número con decimales al final de una línea suele ser el total
    ];

    for (const pattern of totalPatterns) {
      const match = textoLimpio.match(pattern);
      if (match) {
        datos.total = match[1].replace(/,/g, '');
        break;
      }
    }

    // 3. Buscador de Fecha
    const fechaRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/;
    const fechaMatch = textoLimpio.match(fechaRegex);
    if (fechaMatch) datos.fecha = fechaMatch[1];

    // 4. Folio / Ticket (Muy agresivo para Pemex/Oxxo/etc)
    const folioPatterns = [
      /(?:FOLIO|TICKET|TRANS|NOTA|VENTA|NO\.?T|F:|F\s|DOC|REF|REFERENCIA)[\s\S]{0,20}?\s*#?([A-Z0-9-]{4,20})/i,
      /TICKET\s*#?\s*(\d{4,15})/i,
      /FOLIO\s*:?\s*([A-Z0-9]{4,15})/i,
      /\b([A-Z]{1,2}\d{4,10})\b/
    ];

    for (const pattern of folioPatterns) {
      const match = textoLimpio.match(pattern);
      if (match && !/total|monto|fecha|id|web|mex|rfc/i.test(match[0])) {
        const candidate = match[1].trim();
        if (candidate.length > 3) {
          datos.folio = candidate;
          break;
        }
      }
    }

    // 5. WebID / Código de Facturación (Crítico para auto-facturación)
    const webidPatterns = [
      /(?:WEBID|WEB ID|CLAVE|CODIGO|FACT|REF|KEY|ID|FACTURACION|FACTURAR)[\s\S]{0,25}?\s*([A-Z0-9]{8,35})/i,
      /FACTURAR\s+(?:EN|CON)?[\s\S]{0,20}?([A-Z0-9]{8,35})/i,
      /\b([A-Z0-9]{12,32})\b/i, // Bloques largos de alfanuméricos suelen ser el WebID
      /ID\s*:\s*([A-Z0-9]{8,})/i
    ];

    for (const pattern of webidPatterns) {
      const match = textoLimpio.match(pattern);
      if (match) {
        const candidate = match[1].trim();
        // Validar que no sea el folio o el rfc
        if (candidate !== datos.folio && !/total|monto|fecha|mex|rfc/i.test(candidate)) {
          datos.webid = candidate;
          break;
        }
      }
    }

    // 6. Estación (Pemex E01234 o CRE)
    const estacionPatterns = [
      /(?:ESTACION|E\.?S\.?|ES|CRE|PERMISO|EST|PERM)[\s\S]{0,20}?\s*(E\s*\d{4,6}|PL\/\d+\/EXP\/ES\/\d{4})/i,
      /(E\s*\d{5})/i,
      /(PL\/\d{4,}\/EXP\/ES\/\d{4})/i
    ];

    for (const pattern of estacionPatterns) {
      const match = textoLimpio.match(pattern);
      if (match) {
        datos.estacion = match[1].replace(/\s/g, '').toUpperCase();
        break;
      }
    }

    return datos;
  };

  const detectarQRYComercio = async (archivo, ticketId) => {
    const actualizarTicket = (cambios) => {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, ...cambios } : t));
    };

    actualizarTicket({
      escaneoQRStatus: 'escaneando',
      deteccionComercioStatus: 'detectando',
      mensaje: 'Buscando QR y leyendo datos...'
    });

    try {
      // 1. CARGAR IMAGEN EN CANVAS PARA PRE-PROCESAMIENTO
      const reader = new FileReader();
      const originalDataUrl = await new Promise((resolve) => {
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(archivo);
      });

      // 2. INTENTAR LEER QR (Estrategia más fiable)
      const html5QrCode = new Html5Qrcode("qr-reader-hidden");
      let qrDataFound = null;

      try {
        const qrResult = await html5QrCode.scanFile(archivo, false);
        if (qrResult) {
          console.log("QR Detectado:", qrResult);

          // Intentar parsear como URL del SAT (CFDI)
          if (qrResult.includes('verificacfdi') || qrResult.includes('sat.gob.mx')) {
            try {
              const url = new URL(qrResult);
              const params = new URLSearchParams(url.search);
              qrDataFound = {
                tipo: 'SAT',
                url: qrResult,
                uuid: params.get('id'),
                rfcEmisor: params.get('re'),
                rfcReceptor: params.get('rr'),
                total: params.get('tt')
              };
            } catch (e) { }
          }

          // Si no es URL del SAT, extraer datos de gasolinera
          if (!qrDataFound) {
            // Los QR de gasolineras suelen contener el WebID directamente
            // Formato común: números de 8-15 dígitos o alfanuméricos
            const webidMatch = qrResult.match(/([A-Z0-9]{8,20})/i);
            const estacionMatch = qrResult.match(/(E\d{4,6}|\d{5})/i);

            qrDataFound = {
              tipo: 'GASOLINERA',
              raw: qrResult,
              webid: webidMatch ? webidMatch[1] : qrResult.replace(/\s/g, ''),
              estacion: estacionMatch ? estacionMatch[1] : null
            };
            console.log("QR de gasolinera parseado:", qrDataFound);
          }

          actualizarTicket({ mensaje: '✓ QR detectado! Extrayendo datos...' });
        }
      } catch (qrError) {
        console.log("No se encontró QR legible, usando OCR...", qrError.message);
      } finally {
        await html5QrCode.clear();
      }

      // 3. PRE-PROCESAR IMAGEN PARA OCR (Mejorar contraste/nitidez)
      const processedDataUrl = await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;

          // Filtros para mejorar la lectura de texto (Grayscale + Contraste)
          ctx.filter = 'contrast(1.4) brightness(1.1) grayscale(1)';
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = originalDataUrl;
      });

      // 4. OCR CON TESSERACT USANDO IMAGEN MEJORADA
      const result = await Tesseract.recognize(processedDataUrl, 'spa', {
        workerBlobURL: false,
        logger: m => {
          if (m.status === 'recognizing text') {
            actualizarTicket({ mensaje: `Analizando ticket: ${Math.floor(m.progress * 100)}%` });
          }
        }
      });

      const textoExtraido = result.data.text;
      const datosOcr = extraerDatosDeTexto(textoExtraido);

      // Combinar datos del QR (si existen) con el OCR - Priorizar QR
      const datosFinales = {
        ...datosOcr,
        total: qrDataFound?.total || datosOcr.total,
        folio: qrDataFound?.uuid ? qrDataFound.uuid.split('-')[0] : datosOcr.folio,
        webid: qrDataFound?.webid || datosOcr.webid,
        estacion: qrDataFound?.estacion || datosOcr.estacion,
        rfc: qrDataFound?.rfcEmisor || datosOcr.rfc
      };

      // Detección del comercio
      const comercioDetectado = detectarComercioPorImagen(textoExtraido, datosFinales);

      if (comercioDetectado.comercioId || qrDataFound) {
        actualizarTicket({
          comercio: comercioDetectado.comercioId,
          comercioDetectado: comercioDetectado.comercioId,
          confianzaDeteccion: comercioDetectado.confianza || 100,
          qrDetectado: !!qrDataFound,
          qrData: qrDataFound,
          datos: { ...datosFinales, rawText: textoExtraido },
          deteccionComercioStatus: 'detectado',
          mensaje: `✓ ${comercioDetectado.nombre || 'Detectado'} • $${datosFinales.total || '?'}`
        });
      } else {
        actualizarTicket({
          deteccionComercioStatus: 'manual',
          datos: { ...datosFinales, rawText: textoExtraido },
          mensaje: datosFinales.total ? `Total: $${datosFinales.total}` : 'Datos listos para verificar.'
        });
      }

    } catch (error) {
      console.error("Error en procesamiento:", error);
      // fallback final si todo falla pero la imagen cargó
      actualizarTicket({
        mensaje: 'Lectura con dificultades. Revise campos.',
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

  // Helper para normalizar la fecha para el input type="date" (requiere YYYY-MM-DD)
  const formatFechaParaInput = (fechaStr) => {
    if (!fechaStr) return '';
    // Si ya viene como YYYY-MM-DD
    if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) return fechaStr;

    // Si viene como DD/MM/YYYY o DD-MM-YYYY
    const parts = fechaStr.split(/[\/-]/);
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (d.length === 4) return `${d}-${m.padStart(2, '0')}-${y.padStart(2, '0')}`;
      const anio = y.length === 2 ? `20${y}` : y;
      return `${anio}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    return '';
  };

  const handleFileUpload = (e) => {
    const archivos = Array.from(e.target.files);
    archivos.forEach(archivo => agregarTicket(archivo));
  };

  const enviarAlRobot = async (ticket) => {
    // Si estamos en localhost usar puerto directo, si no usar túnel
    const backendUrl = `${getBackendBaseUrl()}/facturar`;

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': getApiKey()
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
          evidencia: resultado.evidencia,
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
      // Si todos están completados, preguntar si quiere re-procesar todos
      const completados = tickets.filter(t => t.estado === 'completado' && t.comercio !== null);
      if (completados.length > 0) {
        if (confirm("Todos los tickets ya están marcados como completados. ¿Deseas volver a procesarlos todos?")) {
          for (const ticket of completados) {
            await procesarTicket(ticket);
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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 overflow-x-hidden" style={{ backgroundColor: '#f5f5f5' }}>
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

      {/* Modal de Evidencia (Screenshot del Robot) */}
      {evidenciaModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 lg:p-20">
          <div className="relative bg-white rounded-3xl overflow-hidden max-w-5xl w-full max-h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Evidencia del Proceso</h3>
                <p className="text-sm text-gray-500">Captura de pantalla real generada por el robot en el portal oficial.</p>
              </div>
              <button
                onClick={() => setEvidenciaModal(null)}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-200 flex items-center justify-center">
              <img
                src={evidenciaModal}
                alt="Evidencia del Robot"
                className="max-w-full shadow-2xl rounded-lg"
              />
            </div>
            <div className="p-6 bg-gray-50 border-t text-center">
              <button
                onClick={() => setEvidenciaModal(null)}
                className="px-10 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
              >
                Entendido
              </button>
            </div>
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
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">
                    Sistema de Facturación
                  </h1>
                  <button
                    onClick={() => setServerStatus('checking')}
                    className={`w-3 h-3 rounded-full shrink-0 ${serverStatus === 'online' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : serverStatus === 'offline' ? 'bg-red-500' : 'bg-gray-400'} animate-pulse`}
                    title="Refrescar conexión"
                  ></button>
                </div>
                <p className="text-white/60 text-xs md:text-sm">Robot México • {serverStatus === 'online' ? 'Conexión Activa' : 'Sin conexión'}</p>
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

            {/* Card 3: Lista de Tickets */}
            <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                  Tickets Cargados ({tickets.length})
                </h2>
                {tickets.length > 0 && (
                  <button
                    onClick={() => setTickets([])}
                    className="text-[10px] sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center justify-center gap-1 bg-orange-50 px-2 py-1.5 rounded-lg transition-colors w-max"
                  >
                    <Trash2 size={14} />
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
                      className={`group border-2 rounded-xl p-3 sm:p-5 transition-all duration-300 ${ticketActual === ticket.id ? 'border-orange-500 bg-orange-50 shadow-md ring-4 ring-orange-500/10' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex flex-col lg:flex-row items-stretch gap-6">
                        {/* Previsualización del Ticket (VITAL PARA PC) */}
                        <div className="lg:w-1/3 shrink-0 group/img relative">
                          <div className="h-full min-h-[150px] lg:h-[280px] bg-gray-100 rounded-2xl border-2 border-gray-100 overflow-hidden shadow-inner flex items-center justify-center cursor-zoom-in"
                            onClick={() => setEvidenciaModal(URL.createObjectURL(ticket.archivo))}>
                            {ticket.archivo ? (
                              <img
                                src={URL.createObjectURL(ticket.archivo)}
                                alt="Ticket"
                                className="w-full h-full object-contain hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <Camera size={40} className="text-gray-300" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                              CLIC PARA AMPLIAR
                            </div>
                          </div>
                          <div className="absolute top-3 left-3 flex items-center gap-2">
                            <div className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-sm">
                              {getEstadoIcon(ticket.estado)}
                            </div>
                            {ticket.tempImageUrl && (
                              <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg animate-bounce">
                                OCR ACTIVO
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Formulario de Datos (DERECHA EN PC) */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <h3 className="font-bold text-gray-900 text-base lg:text-lg truncate flex items-center gap-2">
                              <div className="w-1.5 h-4 bg-orange-400 rounded-full"></div>
                              {ticket.nombre}
                            </h3>
                            {ticket.datos?.total && (
                              <span className="shrink-0 font-black text-white bg-orange-600 px-3 py-1 rounded-xl text-sm shadow-md">
                                ${ticket.datos.total}
                              </span>
                            )}
                          </div>

                          {ticket.usarCredenciales && (
                            <div className="mb-4">
                              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                Emisión Automática Activa
                              </span>
                            </div>
                          )}

                          <div className="mt-4 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comercio:</span>
                              <select
                                value={ticket.comercio || ''}
                                onChange={(e) => {
                                  const val = e.target.value ? parseInt(e.target.value) : null;
                                  setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, comercio: val, deteccionComercioStatus: val ? 'manual' : 'manual' } : t));
                                }}
                                className={`w-full sm:w-auto px-4 py-2 rounded-xl border text-sm font-bold focus:ring-2 focus:ring-orange-500 outline-none transition-all ${!ticket.comercio ? 'border-red-300 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700'}`}
                              >
                                <option value="">-- Seleccionar Comercio --</option>
                                {comercios.map(c => (
                                  <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                              </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-gray-50/80 rounded-2xl border border-gray-100 w-full">
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Monto ($)</label>
                                <input
                                  type="text"
                                  value={ticket.datos?.total || ''}
                                  placeholder="0.00"
                                  onChange={(e) => setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, datos: { ...t.datos, total: e.target.value } } : t))}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest pl-1">Folio / Ticket</label>
                                <input
                                  type="text"
                                  value={ticket.datos?.folio || ''}
                                  placeholder="Folio"
                                  onChange={(e) => setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, datos: { ...t.datos, folio: e.target.value } } : t))}
                                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest pl-1">WebID / Referencia</label>
                                <input
                                  type="text"
                                  value={ticket.datos?.webid || ''}
                                  placeholder="Código"
                                  onChange={(e) => setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, datos: { ...t.datos, webid: e.target.value } } : t))}
                                  className="w-full px-4 py-3 bg-white border border-orange-100 rounded-xl text-sm font-mono font-bold text-orange-700 shadow-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest pl-1">Estación (ES)</label>
                                <input
                                  type="text"
                                  value={ticket.datos?.estacion || ''}
                                  placeholder="E12345"
                                  onChange={(e) => setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, datos: { ...t.datos, estacion: e.target.value } } : t))}
                                  className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl text-sm font-bold text-blue-700 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                />
                              </div>

                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest pl-1">Fecha (Clic para Calendario)</label>
                                <div className="relative">
                                  <input
                                    type="date"
                                    value={formatFechaParaInput(ticket.datos?.fecha)}
                                    onClick={(e) => e.target.showPicker?.()}
                                    onChange={(e) => setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, datos: { ...t.datos, fecha: e.target.value } } : t))}
                                    className="w-full px-4 py-3 bg-white border border-emerald-100 rounded-xl text-sm font-medium text-gray-700 shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {ticket.mensaje && (
                            <div className={`mt-4 text-xs md:text-sm font-bold flex items-start gap-2.5 p-3 rounded-xl border ${ticket.estado === 'completado' ? 'text-green-800 bg-green-50 border-green-100' :
                              ticket.estado === 'fallido' ? 'text-red-800 bg-red-50 border-red-100' :
                                'text-blue-800 bg-blue-50 border-blue-100'
                              }`}>
                              <span className="mt-0.5 shrink-0">
                                {ticket.estado === 'procesando' && <Clock size={16} className="animate-spin" />}
                                {ticket.estado === 'completado' && <CheckCircle size={16} />}
                                {ticket.estado === 'fallido' && <XCircle size={16} />}
                              </span>
                              <span className="leading-relaxed">{ticket.mensaje}</span>
                            </div>
                          )}

                          {ticket.evidencia && (
                            <button
                              onClick={() => setEvidenciaModal(ticket.evidencia)}
                              className="mt-2 text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 transition-all active:scale-95"
                            >
                              <Camera size={14} />
                              Ver Evidencia del Robot
                            </button>
                          )}
                        </div>

                        {/* Botones de Acción (Vertical en PC, Horizontal en Móvil) */}
                        <div className="flex flex-row lg:flex-col items-center justify-center gap-4 lg:border-l lg:pl-6 border-gray-100">
                          {ticket.estado !== 'procesando' && (
                            <button
                              onClick={() => procesarTicket(ticket)}
                              className="w-full lg:w-16 h-12 lg:h-16 bg-orange-100 text-orange-700 rounded-2xl hover:bg-orange-600 hover:text-white transition-all shadow-sm active:scale-90 flex items-center justify-center gap-2 lg:gap-0 font-bold lg:font-normal"
                              title="Facturar este ticket"
                            >
                              <Play size={28} fill="currentColor" />
                              <span className="lg:hidden">FACTURAR</span>
                            </button>
                          )}
                          <button
                            onClick={() => setTickets(prev => prev.filter(t => t.id !== ticket.id))}
                            className="w-full lg:w-16 h-12 lg:h-16 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-colors flex items-center justify-center gap-2 lg:gap-0 font-bold lg:font-normal"
                            title="Eliminar"
                          >
                            <Trash2 size={24} />
                            <span className="lg:hidden">ELIMINAR</span>
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
      {/* Lector QR oculto para procesamiento de archivos */}
      <div id="qr-reader-hidden" style={{ display: 'none' }}></div>
    </div>
  );
}

export default FacturacionAutomatica;