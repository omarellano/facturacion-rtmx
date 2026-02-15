export const COMERCIOS_DEFAULT = [
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
    nombre: 'Tlapaleria/Ferreteria',
    url: 'https://facturacion.ejemplo.com',
    tipoAuth: 'ninguna',
    soportaQR: false,
    campos: ['rfc', 'email', 'fecha', 'total']
  },
  {
    id: 16,
    nombre: 'Steve Madden',
    url: 'https://stevemadden.fiscalpop.com',
    tipoAuth: 'ninguna',
    soportaQR: true,
    campos: ['rfc', 'email', 'folio', 'total']
  }
];

// Patrones para detección automática de comercio por OCR
export const DETECCION_PATTERNS = [
  { keywords: ['oxxo', 'cadena comercial oxxo'], rfc: 'CCO8605231N4', comercioId: 1, nombre: 'OXXO' },
  { keywords: ['pemex', 'combustibles', 'gasolinera', 'e.s.'], rfc: 'PME380607P14', comercioId: 2, nombre: 'Pemex' },
  { keywords: ['abimerhi', 'estacionamiento', 'servicios abimerhi', 'gasolinera abimerhi', 'f02379'], comercioId: 3, nombre: 'Abimerhi' },
  { keywords: ['lagas', 'la gas', 'corporativo de servicios', 'servifacil'], comercioId: 4, nombre: 'La Gas' },
  { keywords: ['g500', 'gasolinera g500', 'servicios g500'], comercioId: 5, nombre: 'G500' },
  { keywords: ['walmart', 'nueva wal mart', 'wal-mart', 'bodega aurrera'], rfc: 'NWM9709244W4', comercioId: 8, nombre: 'Walmart' },
  { keywords: ['chedraui', 'tiendas chedraui'], rfc: 'TCH850701RM1', comercioId: 9, nombre: 'Chedraui' },
  { keywords: ['steve madden', 'stevemadden', 'fiscalpop', 'steve maden'], comercioId: 16, nombre: 'Steve Madden' },
];
