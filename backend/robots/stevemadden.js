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
    const buttons = await page.$$('button, input[type="button"], input[type="submit"], a.btn, [role="button"], .btn');
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

async function seleccionarOpcion(page, selectores, valorBuscado) {
    for (const selector of selectores) {
        try {
            const el = await page.$(selector);
            if (el) {
                const opciones = await page.$$eval(`${selector} option`, opts =>
                    opts.map(o => ({ value: o.value, text: o.textContent.trim() }))
                );
                const match = opciones.find(o =>
                    o.text.toLowerCase().includes(valorBuscado.toLowerCase()) ||
                    o.value.toLowerCase().includes(valorBuscado.toLowerCase())
                );
                if (match) {
                    await page.select(selector, match.value);
                    console.log(`  Select llenado: ${selector} = ${match.text}`);
                    return true;
                }
            }
        } catch (e) {
            continue;
        }
    }
    return false;
}

async function facturarSteveMadden(ticket, config) {
    let lastError = null;

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
        await page.setViewport({ width: 1280, height: 900 });

        try {
            if (intento > 0) {
                console.log(`Reintento ${intento}/${MAX_RETRIES} para Steve Madden...`);
                await new Promise(r => setTimeout(r, RETRY_DELAY * intento));
            }

            const { folio, total } = ticket.datos;
            const { rfc, razonSocial, email, codigoPostal, regimenFiscal } = config;

            console.log("Navegando al portal de Steve Madden (FiscalPop)...");
            await page.goto('https://stevemadden.fiscalpop.com', {
                waitUntil: 'networkidle2',
                timeout: 45000
            });

            await new Promise(r => setTimeout(r, 2000));

            // === PASO 1: Buscar ticket (folio + total) ===
            console.log("Paso 1: Ingresando datos del ticket...");

            if (folio) {
                await esperarYLlenar(page, [
                    'input[name*="ticket" i]',
                    'input[name*="folio" i]',
                    'input[name*="transaccion" i]',
                    'input[id*="ticket" i]',
                    'input[id*="folio" i]',
                    'input[placeholder*="ticket" i]',
                    'input[placeholder*="folio" i]',
                    'input[placeholder*="numero" i]',
                    'input[placeholder*="Número" i]',
                    'input[aria-label*="ticket" i]',
                    'input[aria-label*="folio" i]'
                ], folio);
            }

            if (total) {
                await esperarYLlenar(page, [
                    'input[name*="total" i]',
                    'input[name*="monto" i]',
                    'input[name*="importe" i]',
                    'input[id*="total" i]',
                    'input[id*="monto" i]',
                    'input[placeholder*="total" i]',
                    'input[placeholder*="monto" i]',
                    'input[placeholder*="importe" i]'
                ], total);
            }

            await new Promise(r => setTimeout(r, 500));

            // Buscar/Validar ticket
            await clickBoton(page, ['buscar', 'validar', 'consultar', 'verificar', 'siguiente', 'continuar']);
            await new Promise(r => setTimeout(r, 3000));

            // Verificar si hubo error en paso 1
            let bodyText = await page.evaluate(() => document.body.innerText);
            if (/no se encontr|no existe|ticket inv|datos incorrectos/i.test(bodyText)) {
                const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
                await browser.close();
                return {
                    success: false,
                    message: 'Steve Madden: No se encontró el ticket. Verifica el folio y total.',
                    evidencia: `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`,
                    datos: { folio: folio || 'N/A', status_portal: 'Ticket no encontrado' }
                };
            }

            // === PASO 2: Datos fiscales ===
            console.log("Paso 2: Ingresando datos fiscales...");

            if (rfc) {
                await esperarYLlenar(page, [
                    'input[name*="rfc" i]',
                    'input[id*="rfc" i]',
                    'input[placeholder*="RFC" i]',
                    'input[aria-label*="RFC" i]',
                    '#rfc'
                ], rfc);
            }

            await new Promise(r => setTimeout(r, 1000));

            if (razonSocial) {
                await esperarYLlenar(page, [
                    'input[name*="razon" i]',
                    'input[name*="nombre" i]',
                    'input[id*="razon" i]',
                    'input[id*="nombre" i]',
                    'input[placeholder*="raz" i]',
                    'input[placeholder*="nombre" i]',
                    'input[aria-label*="raz" i]'
                ], razonSocial);
            }

            if (codigoPostal) {
                await esperarYLlenar(page, [
                    'input[name*="postal" i]',
                    'input[name*="cp" i]',
                    'input[name*="codigo" i]',
                    'input[id*="postal" i]',
                    'input[id*="cp" i]',
                    'input[placeholder*="postal" i]',
                    'input[placeholder*="C.P" i]',
                    'input[placeholder*="código" i]'
                ], codigoPostal);
            }

            if (email) {
                await esperarYLlenar(page, [
                    'input[name*="email" i]',
                    'input[name*="correo" i]',
                    'input[type="email"]',
                    'input[id*="email" i]',
                    'input[id*="correo" i]',
                    'input[placeholder*="email" i]',
                    'input[placeholder*="correo" i]'
                ], email);
            }

            // Regimen fiscal (dropdown)
            if (regimenFiscal) {
                await seleccionarOpcion(page, [
                    'select[name*="regimen" i]',
                    'select[id*="regimen" i]',
                    'select[name*="fiscal" i]',
                    '#regimenFiscal',
                    '#regimen'
                ], regimenFiscal);
            }

            // Uso de CFDI - seleccionar "Gastos en general" (G03) por defecto
            await seleccionarOpcion(page, [
                'select[name*="cfdi" i]',
                'select[name*="uso" i]',
                'select[id*="cfdi" i]',
                'select[id*="uso" i]',
                '#usoCFDI',
                '#uso'
            ], 'G03');

            await new Promise(r => setTimeout(r, 1000));

            // === PASO 3: Generar factura ===
            console.log("Paso 3: Generando factura...");
            await clickBoton(page, ['facturar', 'generar', 'timbrar', 'emitir', 'solicitar', 'enviar']);
            await new Promise(r => setTimeout(r, 5000));

            // Captura de evidencia
            const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
            const screenshotBase64 = screenshotBuffer.toString('base64');

            bodyText = await page.evaluate(() => document.body.innerText);
            const exito = /éxito|exitosa|completo|generada|timbrada|descargar|enviada|folio fiscal|factura lista/i.test(bodyText);
            const error = /error|inválido|incorrecto|no encontrado|rechazad|falló/i.test(bodyText);

            await browser.close();

            return {
                success: exito || !error,
                message: exito
                    ? 'Steve Madden: Factura generada con éxito.'
                    : error
                        ? 'Steve Madden: El portal reportó un error. Verifique los datos.'
                        : 'Steve Madden: Datos ingresados en el portal. Verifique la captura.',
                evidencia: `data:image/jpeg;base64,${screenshotBase64}`,
                datos: {
                    folio: folio || 'N/A',
                    status_portal: exito ? 'Factura generada' : 'Interacción enviada'
                }
            };

        } catch (error) {
            lastError = error;
            console.error(`Error en robot Steve Madden (intento ${intento + 1}):`, error.message);
            await browser.close();

            if (intento < MAX_RETRIES) continue;
        }
    }

    return {
        success: false,
        message: `Error en Portal Steve Madden después de ${MAX_RETRIES + 1} intentos: ${lastError?.message}`
    };
}

module.exports = { facturarSteveMadden };
