const puppeteer = require('puppeteer');

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

async function esperarYLlenar(page, selectores, valor, opciones = {}) {
    const { delay = 50, limpiar = true } = opciones;
    for (const selector of selectores) {
        try {
            const el = await page.$(selector);
            if (el) {
                if (limpiar) {
                    await el.click({ clickCount: 3 });
                    await el.press('Backspace');
                }
                await el.type(valor, { delay });
                console.log(`  Campo llenado con selector: ${selector}`);
                return true;
            }
        } catch (e) {
            continue;
        }
    }
    return false;
}

async function clickBoton(page, textos) {
    const buttons = await page.$$('button, input[type="button"], input[type="submit"], a.btn, [role="button"]');
    for (const btn of buttons) {
        const txt = await page.evaluate(e => (e.innerText || e.value || e.getAttribute('aria-label') || '').trim(), btn);
        for (const texto of textos) {
            if (txt.toLowerCase().includes(texto.toLowerCase())) {
                await btn.click();
                console.log(`  Boton presionado: "${txt}"`);
                return true;
            }
        }
    }
    return false;
}

async function facturarOXXO(ticket, config) {
    let lastError = null;

    for (let intento = 0; intento <= MAX_RETRIES; intento++) {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        try {
            if (intento > 0) {
                console.log(`Reintento ${intento}/${MAX_RETRIES} para OXXO...`);
                await new Promise(r => setTimeout(r, RETRY_DELAY * intento));
            }

            console.log("Navegando al portal de OXXO...");
            await page.goto('https://www3.oxxo.com/facturacion', {
                waitUntil: 'networkidle2',
                timeout: 45000
            });

            const { total, folio } = ticket.datos;
            const { rfc } = config;

            // Buscar y clickear boton de inicio
            await clickBoton(page, ['comenzar', 'iniciar', 'facturar', 'continuar']);
            await new Promise(r => setTimeout(r, 2000));

            // Llenar RFC
            if (rfc) {
                await esperarYLlenar(page, [
                    'input[name*="rfc" i]',
                    'input[id*="rfc" i]',
                    'input[placeholder*="RFC" i]',
                    'input[aria-label*="RFC" i]',
                    '#rfc'
                ], rfc);
            }

            // Llenar Folio
            if (folio) {
                await esperarYLlenar(page, [
                    'input[name*="folio" i]',
                    'input[name*="ticket" i]',
                    'input[id*="folio" i]',
                    'input[id*="ticket" i]',
                    'input[placeholder*="folio" i]',
                    'input[placeholder*="ticket" i]',
                    'input[aria-label*="folio" i]'
                ], folio);
            }

            // Llenar total si existe campo
            if (total) {
                await esperarYLlenar(page, [
                    'input[name*="total" i]',
                    'input[name*="monto" i]',
                    'input[id*="total" i]',
                    'input[placeholder*="total" i]'
                ], total);
            }

            await new Promise(r => setTimeout(r, 1000));

            // Intentar enviar
            await clickBoton(page, ['facturar', 'generar', 'enviar', 'siguiente', 'continuar']);
            await new Promise(r => setTimeout(r, 3000));

            const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
            const screenshotBase64 = screenshotBuffer.toString('base64');

            const bodyText = await page.evaluate(() => document.body.innerText);
            const exito = /éxito|completo|generada|descargar|enviada|folio fiscal/i.test(bodyText);
            const error = /error|invalido|incorrecto|no encontrado/i.test(bodyText);

            await browser.close();

            return {
                success: !error,
                message: exito
                    ? 'OXXO: Factura generada con exito.'
                    : error
                        ? `OXXO: El portal reporto un error. Verifique los datos.`
                        : 'OXXO: Portal cargado y datos ingresados. Verifique la captura.',
                evidencia: `data:image/jpeg;base64,${screenshotBase64}`,
                datos: {
                    folio: ticket.datos?.folio || 'N/A',
                    status_portal: exito ? 'Factura generada' : 'Interaccion enviada'
                }
            };

        } catch (error) {
            lastError = error;
            console.error(`Error en robot OXXO (intento ${intento + 1}):`, error.message);
            await browser.close();

            if (intento < MAX_RETRIES) continue;
        }
    }

    return {
        success: false,
        message: `Error en Portal OXXO despues de ${MAX_RETRIES + 1} intentos: ${lastError?.message}`
    };
}

module.exports = { facturarOXXO };
