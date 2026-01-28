const { getBrowser } = require('../utils/browser');

/**
 * Robot genérico para Gasolineras (Pemex, La Gas, G500, etc.)
 */
async function facturarGasolina(ticket, config) {
    const { total, fecha, folio } = ticket.datos;

    const browser = await getBrowser();

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
                    const el = await page.$('input[name*="folio"], #folio, .folio, input[placeholder*="folio" i], input[placeholder*="ticket" i]');
                    if (el) {
                        await el.click({ clickCount: 3 });
                        await el.press('Backspace');
                        await el.type(folio, { delay: 50 });
                    }
                }
                if (webid) {
                    const el = await page.$('input[name*="webid"], #webid, .webid, input[name*="referencia"], input[placeholder*="webid" i], input[placeholder*="clave" i]');
                    if (el) {
                        await el.click({ clickCount: 3 });
                        await el.press('Backspace');
                        await el.type(webid, { delay: 50 });
                    }
                }

                // Intentar presionar el botón de Continuar/Facturar para validar
                const nextButtons = await page.$$('button, input[type="button"], input[type="submit"], a.btn');
                let clicked = false;
                for (const btn of nextButtons) {
                    const txt = await page.evaluate(e => e.innerText || e.value || '', btn);
                    if (/siguiente|continuar|consultar|facturar|enviar|buscar|validar/i.test(txt.trim())) {
                        await btn.click();
                        console.log(`Botón presionado: ${txt.trim()}`);
                        clicked = true;
                        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {
                            console.log("Navegación lenta o no requerida...");
                        });
                        break;
                    }
                }

                if (!clicked) {
                    // Intento desesperado: buscar por clase común o ID
                    const primaryBtn = await page.$('.btn-primary, #btnSiguiente, .next');
                    if (primaryBtn) await primaryBtn.click();
                }

                await new Promise(r => setTimeout(r, 3000));
            } catch (e) {
                console.log("Aviso: No se pudo avanzar automáticamente (" + e.message + ")");
            }
        }

        // Tomar captura de pantalla de evidencia final
        const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
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
