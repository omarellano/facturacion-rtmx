const puppeteer = require('puppeteer');

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000;

/**
 * Espera a que un elemento exista en la página (para SPAs React)
 */
async function esperarElemento(page, selectores, timeout = 10000) {
    const inicio = Date.now();
    while (Date.now() - inicio < timeout) {
        for (const selector of selectores) {
            try {
                const el = await page.$(selector);
                if (el) return el;
            } catch (e) { /* continuar */ }
        }
        await new Promise(r => setTimeout(r, 500));
    }
    return null;
}

/**
 * Llena un campo de texto con reintentos para SPAs
 */
async function esperarYLlenar(page, selectores, valor, opciones = {}) {
    const { delay = 50, limpiar = true, timeout = 10000 } = opciones;

    // Primero esperar a que el elemento exista
    const el = await esperarElemento(page, selectores, timeout);
    if (!el) {
        console.log(`  No se encontro campo con selectores: ${selectores.join(', ')}`);
        return false;
    }

    try {
        if (limpiar) {
            await el.click({ clickCount: 3 });
            await el.press('Backspace');
        }
        await el.type(valor, { delay });
        console.log(`  Campo llenado con valor: ${valor}`);
        return true;
    } catch (e) {
        console.log(`  Error llenando campo: ${e.message}`);
        return false;
    }
}

/**
 * Llena un campo de texto buscando por label visible (ideal para React/Material UI)
 */
async function llenarCampoPorLabel(page, labelTextos, valor, opciones = {}) {
    const { delay = 50, limpiar = true } = opciones;

    const input = await page.evaluate((labels) => {
        // Buscar labels que contengan el texto
        for (const labelText of labels) {
            const lower = labelText.toLowerCase();

            // Estrategia 1: Buscar <label> con texto y su "for" asociado
            const allLabels = document.querySelectorAll('label');
            for (const label of allLabels) {
                if (label.innerText.toLowerCase().includes(lower)) {
                    const forId = label.getAttribute('for');
                    if (forId) {
                        const input = document.getElementById(forId);
                        if (input) return forId;
                    }
                    // Buscar input dentro del mismo contenedor padre
                    const parent = label.closest('.form-group, .MuiFormControl-root, .field, div');
                    if (parent) {
                        const input = parent.querySelector('input, textarea');
                        if (input && input.id) return input.id;
                    }
                }
            }

            // Estrategia 2: Buscar placeholders
            const inputs = document.querySelectorAll('input, textarea');
            for (const input of inputs) {
                const ph = (input.placeholder || '').toLowerCase();
                const aria = (input.getAttribute('aria-label') || '').toLowerCase();
                if (ph.includes(lower) || aria.includes(lower)) {
                    if (input.id) return input.id;
                    // Marcar con un ID temporal
                    const tempId = `_fp_temp_${Math.random().toString(36).substr(2, 5)}`;
                    input.id = tempId;
                    return tempId;
                }
            }

            // Estrategia 3: Buscar por texto cercano (span, p, div con texto)
            const spans = document.querySelectorAll('span, p, div');
            for (const span of spans) {
                if (span.children.length === 0 && span.innerText.toLowerCase().includes(lower)) {
                    const parent = span.closest('.form-group, .MuiFormControl-root, .field, div');
                    if (parent) {
                        const input = parent.querySelector('input, textarea');
                        if (input) {
                            if (!input.id) {
                                input.id = `_fp_temp_${Math.random().toString(36).substr(2, 5)}`;
                            }
                            return input.id;
                        }
                    }
                }
            }
        }
        return null;
    }, labelTextos);

    if (input) {
        const selector = `#${input}`;
        const el = await page.$(selector);
        if (el) {
            if (limpiar) {
                await el.click({ clickCount: 3 });
                await el.press('Backspace');
            }
            await el.type(valor, { delay });
            console.log(`  Campo llenado por label: "${labelTextos[0]}" = ${valor}`);
            return true;
        }
    }

    return false;
}

/**
 * Click en botón buscando por texto visible
 */
async function clickBoton(page, textos) {
    const buttons = await page.$$('button, input[type="button"], input[type="submit"], a.btn, [role="button"], .btn, a[class*="btn"], div[class*="btn"]');
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

/**
 * Selecciona una opción de un <select> o dropdown de React/Material UI
 */
async function seleccionarOpcion(page, selectores, valorBuscado) {
    // Intentar con <select> nativo
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

    // Intentar con dropdown de React (click para abrir, luego seleccionar opción)
    const clicked = await page.evaluate((valorBuscado) => {
        const divs = document.querySelectorAll('[class*="select"], [class*="dropdown"], [role="listbox"], [role="combobox"]');
        for (const div of divs) {
            div.click();
        }
        return divs.length > 0;
    }, valorBuscado);

    if (clicked) {
        await new Promise(r => setTimeout(r, 500));
        // Buscar opción visible
        const options = await page.$$('[role="option"], li[class*="option"], li[class*="item"], .MuiMenuItem-root');
        for (const opt of options) {
            const txt = await page.evaluate(e => e.innerText.trim(), opt);
            if (txt.toLowerCase().includes(valorBuscado.toLowerCase())) {
                await opt.click();
                console.log(`  Dropdown seleccionado: ${txt}`);
                return true;
            }
        }
    }

    return false;
}

/**
 * Selecciona un dropdown buscando por label visible (para React/FiscalPop)
 */
async function seleccionarDropdownPorLabel(page, labelTextos, valorBuscado) {
    // Buscar el contenedor del dropdown por su label
    const found = await page.evaluate((labels, valor) => {
        for (const labelText of labels) {
            const lower = labelText.toLowerCase();

            // Buscar labels
            const allLabels = document.querySelectorAll('label, span, p');
            for (const label of allLabels) {
                if (label.innerText.toLowerCase().includes(lower)) {
                    const parent = label.closest('.form-group, .MuiFormControl-root, .field, div');
                    if (parent) {
                        const select = parent.querySelector('select');
                        if (select) {
                            // Seleccionar opción por texto
                            for (const opt of select.options) {
                                if (opt.text.toLowerCase().includes(valor.toLowerCase()) ||
                                    opt.value.toLowerCase().includes(valor.toLowerCase())) {
                                    select.value = opt.value;
                                    select.dispatchEvent(new Event('change', { bubbles: true }));
                                    return true;
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    }, labelTextos, valorBuscado);

    if (found) {
        console.log(`  Dropdown por label "${labelTextos[0]}" = ${valorBuscado}`);
    }
    return found;
}

/**
 * Llena el primer input visible en la página (fallback para SPAs)
 */
async function llenarPrimerInput(page, valor) {
    const filled = await page.evaluate((val) => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], input:not([type])');
        for (const input of inputs) {
            if (input.offsetParent !== null && !input.disabled && !input.readOnly) {
                input.focus();
                input.value = '';
                // Simular escritura nativa de React
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype, 'value'
                ).set;
                nativeInputValueSetter.call(input, val);
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                return true;
            }
        }
        return false;
    }, valor);

    if (filled) {
        console.log(`  Primer input visible llenado con: ${valor}`);
    }
    return filled;
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

            // Esperar a que React renderice la app
            await new Promise(r => setTimeout(r, 3000));

            // === PASO 1: Buscar ticket por número ===
            // FiscalPop dice: "Usa el numero de ticket para buscar tu compra"
            console.log(`Paso 1: Ingresando numero de ticket: ${folio}...`);

            if (folio) {
                // Intentar múltiples estrategias para llenar el campo de ticket
                let llenado = await esperarYLlenar(page, [
                    'input[name*="ticket" i]',
                    'input[name*="folio" i]',
                    'input[name*="transaccion" i]',
                    'input[name*="nota" i]',
                    'input[id*="ticket" i]',
                    'input[id*="folio" i]',
                    'input[placeholder*="ticket" i]',
                    'input[placeholder*="folio" i]',
                    'input[placeholder*="numero" i]',
                    'input[placeholder*="Número" i]',
                    'input[placeholder*="buscar" i]',
                    'input[aria-label*="ticket" i]',
                    'input[aria-label*="folio" i]',
                    'input[aria-label*="buscar" i]'
                ], folio);

                // Si no encontró por selector, intentar por label
                if (!llenado) {
                    llenado = await llenarCampoPorLabel(page, [
                        'ticket', 'folio', 'número de ticket', 'numero', 'buscar', 'nota de venta'
                    ], folio);
                }

                // Último recurso: primer input visible
                if (!llenado) {
                    llenado = await llenarPrimerInput(page, folio);
                }
            }

            await new Promise(r => setTimeout(r, 1000));

            // Buscar el ticket
            let buscado = await clickBoton(page, ['buscar', 'consultar', 'verificar', 'validar', 'siguiente', 'continuar', 'search']);

            // Si no hay botón de texto, intentar con iconos de búsqueda o submit
            if (!buscado) {
                await page.keyboard.press('Enter');
                console.log('  Enter presionado para buscar');
            }

            await new Promise(r => setTimeout(r, 4000));

            // Captura después del paso 1
            const screenshot1 = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });

            // Verificar si hubo error en paso 1
            let bodyText = await page.evaluate(() => document.body.innerText);
            if (/no se encontr|no existe|ticket inv|datos incorrectos|no hay resultado|sin resultado/i.test(bodyText)) {
                await browser.close();
                return {
                    success: false,
                    message: 'Steve Madden: No se encontró el ticket. Verifica el número de folio.',
                    evidencia: `data:image/jpeg;base64,${screenshot1.toString('base64')}`,
                    datos: { folio: folio || 'N/A', status_portal: 'Ticket no encontrado' }
                };
            }

            // === PASO 2: Datos fiscales ===
            console.log("Paso 2: Ingresando datos fiscales...");
            await new Promise(r => setTimeout(r, 1500));

            // RFC
            if (rfc) {
                let llenado = await esperarYLlenar(page, [
                    'input[name*="rfc" i]',
                    'input[id*="rfc" i]',
                    'input[placeholder*="RFC" i]',
                    'input[aria-label*="RFC" i]',
                    '#rfc'
                ], rfc);

                if (!llenado) {
                    await llenarCampoPorLabel(page, ['RFC', 'rfc'], rfc);
                }
            }

            await new Promise(r => setTimeout(r, 1500));

            // Razón Social / Nombre
            if (razonSocial) {
                let llenado = await esperarYLlenar(page, [
                    'input[name*="razon" i]',
                    'input[name*="nombre" i]',
                    'input[name*="receptor" i]',
                    'input[id*="razon" i]',
                    'input[id*="nombre" i]',
                    'input[placeholder*="raz" i]',
                    'input[placeholder*="nombre" i]',
                    'input[aria-label*="raz" i]',
                    'input[aria-label*="nombre" i]'
                ], razonSocial);

                if (!llenado) {
                    await llenarCampoPorLabel(page, [
                        'razón social', 'razon social', 'nombre', 'receptor'
                    ], razonSocial);
                }
            }

            // Código Postal
            if (codigoPostal) {
                let llenado = await esperarYLlenar(page, [
                    'input[name*="postal" i]',
                    'input[name*="cp" i]',
                    'input[name*="codigo" i]',
                    'input[name*="zip" i]',
                    'input[id*="postal" i]',
                    'input[id*="cp" i]',
                    'input[placeholder*="postal" i]',
                    'input[placeholder*="C.P" i]',
                    'input[placeholder*="código" i]',
                    'input[placeholder*="codigo" i]'
                ], codigoPostal);

                if (!llenado) {
                    await llenarCampoPorLabel(page, [
                        'código postal', 'codigo postal', 'C.P.', 'CP'
                    ], codigoPostal);
                }
            }

            // Email
            if (email) {
                let llenado = await esperarYLlenar(page, [
                    'input[type="email"]',
                    'input[name*="email" i]',
                    'input[name*="correo" i]',
                    'input[id*="email" i]',
                    'input[id*="correo" i]',
                    'input[placeholder*="email" i]',
                    'input[placeholder*="correo" i]'
                ], email);

                if (!llenado) {
                    await llenarCampoPorLabel(page, [
                        'email', 'correo', 'correo electrónico', 'e-mail'
                    ], email);
                }
            }

            // Régimen Fiscal (dropdown)
            if (regimenFiscal) {
                let seleccionado = await seleccionarOpcion(page, [
                    'select[name*="regimen" i]',
                    'select[id*="regimen" i]',
                    'select[name*="fiscal" i]',
                    '#regimenFiscal',
                    '#regimen'
                ], regimenFiscal);

                if (!seleccionado) {
                    await seleccionarDropdownPorLabel(page, [
                        'régimen', 'regimen', 'régimen fiscal', 'regimen fiscal'
                    ], regimenFiscal);
                }
            }

            // Uso de CFDI - "Gastos en general" (G03) por defecto
            let usoCfdiSeleccionado = await seleccionarOpcion(page, [
                'select[name*="cfdi" i]',
                'select[name*="uso" i]',
                'select[id*="cfdi" i]',
                'select[id*="uso" i]',
                '#usoCFDI',
                '#uso'
            ], 'G03');

            if (!usoCfdiSeleccionado) {
                usoCfdiSeleccionado = await seleccionarOpcion(page, [
                    'select[name*="cfdi" i]',
                    'select[name*="uso" i]',
                    'select[id*="cfdi" i]',
                    'select[id*="uso" i]',
                    '#usoCFDI',
                    '#uso'
                ], 'gastos en general');

                if (!usoCfdiSeleccionado) {
                    await seleccionarDropdownPorLabel(page, [
                        'uso', 'uso cfdi', 'uso de cfdi', 'uso del cfdi'
                    ], 'G03');
                }
            }

            await new Promise(r => setTimeout(r, 1500));

            // === PASO 3: Generar factura ===
            console.log("Paso 3: Generando factura...");
            await clickBoton(page, ['facturar', 'generar', 'timbrar', 'emitir', 'solicitar', 'enviar', 'crear factura']);
            await new Promise(r => setTimeout(r, 6000));

            // Captura de evidencia final
            const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
            const screenshotBase64 = screenshotBuffer.toString('base64');

            bodyText = await page.evaluate(() => document.body.innerText);
            const exito = /éxito|exitosa|exitosamente|completo|completada|generada|timbrada|descargar|descarga|enviada|folio fiscal|factura lista|factura emitida|pdf|xml/i.test(bodyText);
            const error = /error|inválido|invalido|incorrecto|no encontrad|rechazad|falló|fallo|no se pudo|problema/i.test(bodyText);

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
