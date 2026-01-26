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

    // Configuración de visualización para ver lo que hace el robot (opcional)
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log(`Iniciando robot de gasolina para Comercio ID: ${ticket.comercio}...`);

        let url = 'https://facturacion.pemex.com';
        if (ticket.comercio === 4) url = 'https://lagas.com.mx/facturacion/';
        if (ticket.comercio === 3) url = 'https://www.abimerhigasolineras.com/facturacion/';

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Lógica de llenado para Abimerhi / La Gas
        console.log(`Página cargada: ${url}`);

        if (ticket.comercio === 3 || ticket.comercio === 4) {
            try {
                const folio = ticket.datos?.folio;
                const webid = ticket.datos?.webid;

                if (folio) {
                    const el = await page.$('input[name*="folio"], #folio, .folio');
                    if (el) await el.type(folio, { delay: 50 });
                }
                if (webid) {
                    const el = await page.$('input[name*="webid"], #webid, .webid, input[name*="referencia"]');
                    if (el) await el.type(webid, { delay: 50 });
                }

                // Intentar presionar el botón de Continuar/Facturar para validar
                const nextButtons = await page.$$('button, input[type="button"], input[type="submit"]');
                for (const btn of nextButtons) {
                    const txt = await page.evaluate(e => e.innerText || e.value, btn);
                    if (/siguiente|continuar|consultar|facturar|enviar/i.test(txt)) {
                        await btn.click();
                        console.log(`Botón presionado: ${txt}`);
                        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }).catch(() => { });
                        break;
                    }
                }

                await new Promise(r => setTimeout(r, 2000));
            } catch (e) {
                console.log("Aviso: No se pudo avanzar automáticamente (" + e.message + ")");
            }
        }

        // Tomar captura de pantalla de evidencia final
        const screenshotBuffer = await page.screenshot({ fullPage: false });
        const screenshotBase64 = screenshotBuffer.toString('base64');

        // Escanear la página final buscando palabras de éxito
        const bodyText = await page.evaluate(() => document.body.innerText);
        const exito = /éxito|completo|generada|descargar|enviada|folio fiscal|terminar/i.test(bodyText);

        return {
            success: true,
            message: exito
                ? '✓ FACTURACIÓN COMPLETADA: Revise la evidencia para descargar.'
                : 'Robot en Portal: Datos ingresados. Revise la captura para el siguiente paso.',
            evidencia: `data:image/png;base64,${screenshotBase64}`,
            datos: {
                folio: ticket.datos?.folio || 'No cargado',
                webid: ticket.datos?.webid || 'No cargado',
                estacion: ticket.datos?.estacion || 'No cargado',
                url_portal: url
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
