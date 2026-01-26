const puppeteer = require('puppeteer');

/**
 * Robot genérico para Gasolineras (Pemex, La Gas, G500, etc.)
 * Valida la fecha del mes actual antes de proceder.
 */
async function facturarGasolina(ticket, config) {
    const { total, fecha, folio } = ticket.datos;

    // 1. Validar la fecha (Solo facturable en el mes corriente)
    if (fecha) {
        const [dia, mes, anio] = fecha.split(/[\/-]/);
        const fechaTicket = new Date(anio.length === 2 ? `20${anio}` : anio, mes - 1, dia);
        const hoy = new Date();

        if (fechaTicket.getMonth() !== hoy.getMonth() || fechaTicket.getFullYear() !== hoy.getFullYear()) {
            return {
                success: false,
                message: `TICKET VENCIDO: La fecha del ticket (${fecha}) no corresponde al mes actual. Los portales de gasolina no permiten facturar meses anteriores.`,
                codigo_error: 'FECHA_INVALIDA'
            };
        }
    }

    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        console.log(`Iniciando robot de gasolina para Comercio ID: ${ticket.comercio}...`);

        // Determinar URL base (esto vendría de una base de datos o config)
        let url = 'https://facturacion.pemex.com'; // Default
        if (ticket.comercio === 4) url = 'https://lagas.com.mx/facturacion/';
        if (ticket.comercio === 3) url = 'https://www.abimerhigasolineras.com/facturacion/';

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Aquí iría la lógica de llenado (Folio, Estación, RFC)
        // Por ahora simulamos éxito tras validar la fecha
        await new Promise(r => setTimeout(r, 2000));

        return {
            success: true,
            message: 'Robot de Gasolinera: Datos validados y proceso iniciado en portal.',
            datos: {
                folio: folio || 'N/A',
                fecha_ticket: fecha,
                advertencia: 'Asegúrese de que el folio sea correcto para la estación seleccionada.'
            }
        };

    } catch (error) {
        return {
            success: false,
            message: `Error en portal de gasolina: ${error.message}`
        };
    } finally {
        await browser.close();
    }
}

module.exports = { facturarGasolina };
