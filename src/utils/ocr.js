import Tesseract from 'tesseract.js';
import { Html5Qrcode } from 'html5-qrcode';
import { DETECCION_PATTERNS } from '../data/comercios';

/**
 * Extrae datos estructurados de texto OCR de un ticket
 */
export function extraerDatosDeTexto(texto) {
  const textoLimpio = texto.replace(/[|¦]/g, 'I').replace(/[°º]/g, '');

  const datos = {
    rfc: null,
    total: null,
    fecha: null,
    folio: null,
    webid: null,
    estacion: null
  };

  // 1. RFC
  const rfcRegex = /([A-ZN&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])/gi;
  const rfcMatches = textoLimpio.match(rfcRegex);
  if (rfcMatches) {
    datos.rfcsEncontrados = rfcMatches.map(m => m.replace(/[\s-]/g, '').toUpperCase());
  }

  // 2. Total
  const totalPatterns = [
    /(?:TOTAL|IMPORTE|NETO|PAGAR|MONTO|PAGO|VENTA)[\s\S]{0,40}?\$?\s*([\d,]+\.\d{2})/i,
    /(?:TOTAL)\s*:?\s*\$?\s*([\d,]+\.\d{2})/i,
    /\$?\s*([\d,]+\.\d{2})\s*(?:MXN|PESOS|M\.N\.)/i,
    /([\d,]+\.\d{2})\s*$/m
  ];

  for (const pattern of totalPatterns) {
    const match = textoLimpio.match(pattern);
    if (match) {
      datos.total = match[1].replace(/,/g, '');
      break;
    }
  }

  // 3. Fecha
  const fechaRegex = /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/;
  const fechaMatch = textoLimpio.match(fechaRegex);
  if (fechaMatch) datos.fecha = fechaMatch[1];

  // 4. Folio
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

  // 5. WebID
  const webidPatterns = [
    /(?:WEBID|WEB ID|CLAVE|CODIGO|FACT|REF|KEY|ID|FACTURACION|FACTURAR)[\s\S]{0,25}?\s*([A-Z0-9]{8,35})/i,
    /FACTURAR\s+(?:EN|CON)?[\s\S]{0,20}?([A-Z0-9]{8,35})/i,
    /\b([A-Z0-9]{12,32})\b/i,
    /ID\s*:\s*([A-Z0-9]{8,})/i
  ];

  for (const pattern of webidPatterns) {
    const match = textoLimpio.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      if (candidate !== datos.folio && !/total|monto|fecha|mex|rfc/i.test(candidate)) {
        datos.webid = candidate;
        break;
      }
    }
  }

  // 6. Estacion
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
}

/**
 * Detecta el comercio a partir del texto OCR y datos extraídos
 */
export function detectarComercioPorImagen(textoOArchivo, datosOcr) {
  const inputLower = textoOArchivo.toLowerCase();

  // 1. Por RFC
  if (datosOcr?.rfcsEncontrados) {
    for (const rfcEncontrado of datosOcr.rfcsEncontrados) {
      const match = DETECCION_PATTERNS.find(p => p.rfc === rfcEncontrado);
      if (match) return { comercioId: match.comercioId, nombre: match.nombre, confianza: 100 };
    }
  }

  // 2. Por keywords
  for (const pattern of DETECCION_PATTERNS) {
    for (const keyword of pattern.keywords) {
      if (inputLower.includes(keyword)) {
        return { comercioId: pattern.comercioId, nombre: pattern.nombre, confianza: 90 };
      }
    }
  }

  return { comercioId: null, nombre: null, confianza: 0 };
}

/**
 * Pre-procesa una imagen para mejorar la legibilidad OCR
 */
function preprocesarImagen(originalDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.filter = 'contrast(1.4) brightness(1.1) grayscale(1)';
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = originalDataUrl;
  });
}

/**
 * Intenta leer un código QR de un archivo de imagen
 */
async function leerQR(archivo) {
  const html5QrCode = new Html5Qrcode("qr-reader-hidden");
  try {
    const qrResult = await html5QrCode.scanFile(archivo, false);
    if (!qrResult) return null;

    // SAT CFDI
    if (qrResult.includes('verificacfdi') || qrResult.includes('sat.gob.mx')) {
      try {
        const url = new URL(qrResult);
        const params = new URLSearchParams(url.search);
        return {
          tipo: 'SAT',
          url: qrResult,
          uuid: params.get('id'),
          rfcEmisor: params.get('re'),
          rfcReceptor: params.get('rr'),
          total: params.get('tt')
        };
      } catch { /* no es URL válida */ }
    }

    // Gasolinera
    const webidMatch = qrResult.match(/([A-Z0-9]{8,20})/i);
    const estacionMatch = qrResult.match(/(E\d{4,6}|\d{5})/i);
    return {
      tipo: 'GASOLINERA',
      raw: qrResult,
      webid: webidMatch ? webidMatch[1] : qrResult.replace(/\s/g, ''),
      estacion: estacionMatch ? estacionMatch[1] : null
    };
  } catch {
    return null;
  } finally {
    await html5QrCode.clear();
  }
}

/**
 * Pipeline completo: QR + OCR + detección de comercio
 * @param {File} archivo - Archivo de imagen del ticket
 * @param {function} onProgress - Callback para reportar progreso
 * @returns {Object} Datos extraídos del ticket
 */
export async function procesarTicketImagen(archivo, onProgress) {
  onProgress?.('Buscando QR y leyendo datos...');

  // 1. Leer archivo como DataURL
  const originalDataUrl = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(archivo);
  });

  // 2. Intentar QR
  const qrDataFound = await leerQR(archivo);
  if (qrDataFound) {
    onProgress?.('QR detectado! Extrayendo datos...');
  }

  // 3. Pre-procesar imagen y OCR
  const processedDataUrl = await preprocesarImagen(originalDataUrl);

  const result = await Tesseract.recognize(processedDataUrl, 'spa', {
    workerBlobURL: false,
    logger: m => {
      if (m.status === 'recognizing text') {
        onProgress?.(`Analizando ticket: ${Math.floor(m.progress * 100)}%`);
      }
    }
  });

  const textoExtraido = result.data.text;
  const datosOcr = extraerDatosDeTexto(textoExtraido);

  // 4. Combinar QR + OCR (QR tiene prioridad)
  const datosFinales = {
    ...datosOcr,
    total: qrDataFound?.total || datosOcr.total,
    folio: qrDataFound?.uuid ? qrDataFound.uuid.split('-')[0] : datosOcr.folio,
    webid: qrDataFound?.webid || datosOcr.webid,
    estacion: qrDataFound?.estacion || datosOcr.estacion,
    rfc: qrDataFound?.rfcEmisor || datosOcr.rfc,
    rawText: textoExtraido
  };

  // 5. Detectar comercio
  const comercioDetectado = detectarComercioPorImagen(textoExtraido, datosFinales);

  return {
    datos: datosFinales,
    qrData: qrDataFound,
    comercio: comercioDetectado
  };
}
