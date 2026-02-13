const puppeteer = require('puppeteer');

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

const URLS_POR_COMERCIO = {
    2: 'https://facturacion.pemex.com',
    3: 'https://www.abimerhigasolineras.com/facturacion/',
    4: 'https://lagas.com.mx/facturacion/',
    5: 'https://facturacion.g500.com.mx',
    6: 'https://www.facturasgas.com'
};

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

async function facturarGasolina(ticket, config) {
    let lastError = null;
    const url = URLS_POR_COMERCIO[ticket.comercio] || 'https://facturacion.pemex.com';

    for (let intento = 0; intento <= MAX_RETRIES; intento++) {
        const launchOptions = {
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
        };
        if (process.env.CHROME_PATH) {
            launchOptions.executablePath = process.env.CHROME_PATH;
        }
        const browser = await puppeteer.launch(launchOptions);

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        try {
            if (intento > 0) {
                console.log(`Reintento ${intento}/${MAX_RETRIES} para gasolina (comercio ${ticket.comercio})...`);
                await new Promise(r => setTimeout(r, RETRY_DELAY * intento));
            }

            console.log(`Navegando a: ${url}`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

            const folio = ticket.datos?.folio;
            const webid = ticket.datos?.webid;
            const estacion = ticket.datos?.estacion;
            const { rfc } = config;

            // Llenar RFC si hay campo
            if (rfc) {
                await esperarYLlenar(page, [
                    'input[name*="rfc" i]',
                    'input[id*="rfc" i]',
                    'input[placeholder*="RFC" i]',
                    'input[aria-label*="RFC" i]'
                ], rfc);
            }

            // Llenar folio
            if (folio) {
                await esperarYLlenar(page, [
                    'input[name*="folio" i]',
                    'input[name*="ticket" i]',
                    'input[name*="nota" i]',
                    'input[id*="folio" i]',
                    'input[id*="ticket" i]',
                    'input[placeholder*="folio" i]',
                    'input[placeholder*="ticket" i]',
                    'input[aria-label*="folio" i]',
                    'input[aria-label*="ticket" i]'
                ], folio);
            }

            // Llenar WebID
            if (webid) {
                await esperarYLlenar(page, [
                    'input[name*="webid" i]',
                    'input[name*="referencia" i]',
                    'input[name*="clave" i]',
                    'input[name*="codigo" i]',
                    'input[id*="webid" i]',
                    'input[id*="referencia" i]',
                    'input[placeholder*="webid" i]',
                    'input[placeholder*="clave" i]',
                    'input[placeholder*="referencia" i]',
                    'input[placeholder*="codigo" i]',
                    'input[aria-label*="referencia" i]',
                    'input[aria-label*="clave" i]'
                ], webid);
            }

            // Llenar Estacion
            if (estacion) {
                await esperarYLlenar(page, [
                    'input[name*="estacion" i]',
                    'input[name*="station" i]',
                    'input[id*="estacion" i]',
                    'input[placeholder*="estacion" i]',
                    'input[placeholder*="E.S." i]',
                    'input[aria-label*="estacion" i]'
                ], estacion);
            }

            // Intentar avanzar
            const clicked = await clickBoton(page, [
                'siguiente', 'continuar', 'consultar', 'facturar',
                'enviar', 'buscar', 'validar', 'generar'
            ]);

            if (clicked) {
                await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }).catch(() => {
                    console.log("Navegacion lenta o no requerida...");
                });
            } else {
                // Fallback: buscar por clase
                const primaryBtn = await page.$('.btn-primary, .btn-success, [type="submit"]');
                if (primaryBtn) await primaryBtn.click();
            }

            await new Promise(r => setTimeout(r, 3000));

            const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
            const screenshotBase64 = screenshotBuffer.toString('base64');

            const bodyText = await page.evaluate(() => document.body.innerText);
            const exito = /éxito|completo|generada|descargar|enviada|folio fiscal|terminar/i.test(bodyText);
            const error = /error|invalido|incorrecto|no encontrado|no existe/i.test(bodyText);

            await browser.close();

            return {
                success: !error,
                message: exito
                    ? 'FACTURACION COMPLETADA: Revise la evidencia para descargar.'
                    : error
                        ? 'El portal reporto un error. Verifique los datos del ticket.'
                        : 'Robot en Portal: Datos ingresados. Revise la captura para el siguiente paso.',
                evidencia: `data:image/jpeg;base64,${screenshotBase64}`,
                datos: {
                    folio: ticket.datos?.folio || 'No cargado',
                    webid: ticket.datos?.webid || 'No cargado',
                    estacion: ticket.datos?.estacion || 'No cargado',
                    url_portal: url,
                    status_portal: exito ? 'Factura generada' : 'Interaccion enviada'
                }
            };

        } catch (error) {
            lastError = error;
            console.error(`Error en robot gasolina (intento ${intento + 1}):`, error.message);
            await browser.close();

            if (intento < MAX_RETRIES) continue;
        }
    }

    return {
        success: false,
        message: `Error en portal de gasolina despues de ${MAX_RETRIES + 1} intentos: ${lastError?.message}`
    };
}

module.exports = { facturarGasolina };
