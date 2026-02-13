/**
 * Validación de RFC mexicano según reglas del SAT
 * Soporta tanto persona física (13 chars) como moral (12 chars)
 */

const TABLA_CARACTERES = {
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'A': 10, 'B': 11, 'C': 12, 'D': 13, 'E': 14, 'F': 15, 'G': 16, 'H': 17,
  'I': 18, 'J': 19, 'K': 20, 'L': 21, 'M': 22, 'N': 23, '&': 24, 'O': 25,
  'P': 26, 'Q': 27, 'R': 28, 'S': 29, 'T': 30, 'U': 31, 'V': 32, 'W': 33,
  'X': 34, 'Y': 35, 'Z': 36, ' ': 37, 'Ñ': 38
};

/**
 * Valida la estructura básica del RFC
 * @param {string} rfc
 * @returns {{ valido: boolean, tipo: string|null, errores: string[] }}
 */
export function validarRFC(rfc) {
  const errores = [];

  if (!rfc || typeof rfc !== 'string') {
    return { valido: false, tipo: null, errores: ['RFC vacío o inválido'] };
  }

  const rfcLimpio = rfc.trim().toUpperCase();

  // Longitud: 12 para moral, 13 para física
  if (rfcLimpio.length !== 12 && rfcLimpio.length !== 13) {
    errores.push(`Longitud incorrecta: ${rfcLimpio.length} caracteres (se esperan 12 o 13)`);
    return { valido: false, tipo: null, errores };
  }

  const esPersonaFisica = rfcLimpio.length === 13;
  const tipo = esPersonaFisica ? 'fisica' : 'moral';

  // Estructura de persona física: 4 letras + 6 dígitos (fecha) + 3 homoclave
  // Estructura de persona moral: 3 letras/& + 6 dígitos (fecha) + 3 homoclave
  const regexFisica = /^[A-ZÑ&]{4}\d{6}[A-Z\d]{3}$/;
  const regexMoral = /^[A-ZÑ&]{3}\d{6}[A-Z\d]{3}$/;

  const regex = esPersonaFisica ? regexFisica : regexMoral;
  if (!regex.test(rfcLimpio)) {
    errores.push('Formato de RFC inválido');
    return { valido: false, tipo, errores };
  }

  // Validar fecha dentro del RFC
  const fechaOffset = esPersonaFisica ? 4 : 3;
  const anio = parseInt(rfcLimpio.substring(fechaOffset, fechaOffset + 2));
  const mes = parseInt(rfcLimpio.substring(fechaOffset + 2, fechaOffset + 4));
  const dia = parseInt(rfcLimpio.substring(fechaOffset + 4, fechaOffset + 6));

  if (mes < 1 || mes > 12) {
    errores.push(`Mes inválido en RFC: ${mes}`);
  }
  if (dia < 1 || dia > 31) {
    errores.push(`Día inválido en RFC: ${dia}`);
  }

  // Verificar dígito verificador
  const digitoCalculado = calcularDigitoVerificador(rfcLimpio);
  const digitoReal = rfcLimpio[rfcLimpio.length - 1];

  if (digitoCalculado && digitoCalculado !== digitoReal) {
    errores.push(`Dígito verificador incorrecto: esperado '${digitoCalculado}', recibido '${digitoReal}'`);
  }

  return {
    valido: errores.length === 0,
    tipo,
    errores
  };
}

/**
 * Calcula el dígito verificador del RFC
 */
function calcularDigitoVerificador(rfc) {
  const rfcSinDigito = rfc.substring(0, rfc.length - 1);

  // Para persona moral (12 chars), agregar espacio al inicio para normalizar a 12 chars
  const cadena = rfcSinDigito.length === 11 ? ' ' + rfcSinDigito : rfcSinDigito;

  let suma = 0;
  for (let i = 0; i < cadena.length; i++) {
    const char = cadena[i];
    const valor = TABLA_CARACTERES[char];
    if (valor === undefined) return null;
    suma += valor * (13 - i);
  }

  const residuo = suma % 11;

  if (residuo === 0) return '0';
  if (residuo === 1) return 'A'; // En algunos casos se usa 'A' en lugar de '10'

  const digito = 11 - residuo;
  return digito === 10 ? 'A' : digito.toString();
}

/**
 * Formatea un RFC limpiando espacios y guiones
 */
export function formatearRFC(rfc) {
  if (!rfc) return '';
  return rfc.trim().replace(/[\s-]/g, '').toUpperCase();
}
