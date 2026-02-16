const { getBrowser } = require('../utils/browser');

/**
 * Robot para Steve Madden (Trendy Imports)
 */
async function facturarSteveMadden(ticket, config) {
    const { total, fecha, folio } = ticket.datos;

    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        console.log(`Iniciando robot para Steve Madden (Trendy Imports)...`);
        let url = 'https://facturacion.trendyimports.com.mx/';
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Intentar detectar si hay un enlace directo que diga "Facturación" o similar
        const links = await page.$$('a');
        for (const link of links) {
            const text = await page.evaluate(el => el.innerText || '', link);
            if (/factur/i.test(text)) {
                await link.click();
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => { });
                break;
            }
        }

        // Lógica de llenado genérica basada en palabras clave
        const inputs = [
            { tipo: 'rfc', selectors: ['input[name*="rfc" i]', '#rfc', '.rfc', 'input[placeholder*="rfc" i]'] },
            { tipo: 'folio', selectors: ['input[name*="folio" i]', 'input[name*="ticket" i]', '#folio', '#ticket', 'input[placeholder*="ticket" i]'] },
            { tipo: 'total', selectors: ['input[name*="total" i]', 'input[name*="monto" i]', '#total', '#monto', 'input[placeholder*="total" i]'] },
            { tipo: 'fecha', selectors: ['input[name*="fecha" i]', '#fecha', '.fecha', 'input[placeholder*="fecha" i]'] }
        ];

        for (const inputDef of inputs) {
            const val = inputDef.tipo === 'rfc' ? config.rfc : ticket.datos[inputDef.tipo];
            if (!val) continue;

            for (const selector of inputDef.selectors) {
                const el = await page.$(selector);
                if (el) {
                    await el.click({ clickCount: 3 });
                    await el.press('Backspace');
                    await el.type(String(val), { delay: 50 });
                    break;
                }
            }
        }

        // Buscar botón de enviar/siguiente
        const buttons = await page.$$('button, input[type="button"], input[type="submit"]');
        for (const btn of buttons) {
            const text = await page.evaluate(e => e.innerText || e.value || '', btn);
            if (/siguiente|continuar|enviar|facturar|aceptar/i.test(text)) {
                await btn.click();
                await new Promise(r => setTimeout(r, 2000));
                break;
            }
        }

        const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
        const screenshotBase64 = screenshotBuffer.toString('base64');
        const bodyText = await page.evaluate(() => document.body.innerText);
        const exito = /éxito|completo|generada|descargar|enviada|folio fiscal|terminar/i.test(bodyText);

        return {
            success: true,
            message: exito
                ? '✓ FACTURACIÓN COMPLETADA: Steve Madden.'
                : 'Robot en Portal Steve Madden: Datos ingresados. Revise la captura.',
            evidencia: `data:image/jpeg;base64,${screenshotBase64}`,
            datos: {
                folio: folio || 'N/A',
                total: total || '0.00',
                status: exito ? 'Completado' : 'Pendiente Manual'
            }
        };

    } catch (error) {
        console.error("Error en robot Steve Madden:", error);
        return { success: false, message: `Error en portal Steve Madden: ${error.message}` };
    } finally {
        await browser.close();
    }
}

module.exports = { facturarSteveMadden };
