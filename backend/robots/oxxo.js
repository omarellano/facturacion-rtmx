const { getBrowser } = require('../utils/browser');

/**
 * Robot para facturación en OXXO
 * @param {Object} ticket Datos del ticket (folio, total, etc)
 * @param {Object} config Datos fiscales (RFC, CP, etc)
 */
async function facturarOXXO(ticket, config) {
    const browser = await getBrowser();

    const page = await browser.newPage();

    try {
        console.log("Navegando al portal de OXXO...");
        await page.goto('https://www3.oxxo.com/facturacion', { waitUntil: 'networkidle2', timeout: 45000 });

        // Intentar autollenado básico si los campos son detectables
        try {
            const { total, folio, fecha } = ticket.datos;
            const { rfc } = config;

            // OXXO suele tener un botón de "Comenzar" o similar primero
            const startBtn = await page.$('button, .btn-primary, #btnFacturar');
            if (startBtn) await startBtn.click();
            await new Promise(r => setTimeout(r, 2000));

            // Intentar llenar RFC
            if (rfc) {
                const rfcInput = await page.$('input[name*="rfc" i], #rfc, .rfc');
                if (rfcInput) await rfcInput.type(rfc, { delay: 50 });
            }

            // Intentar llenar Datos del ticket
            if (folio) {
                const folioInput = await page.$('input[name*="folio" i], #ticket, #folio');
                if (folioInput) await folioInput.type(folio, { delay: 50 });
            }

            // Tomar captura de lo que se llenó
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.log("Aviso: Interacción limitada en OXXO (" + e.message + ")");
        }

        const screenshotBuffer = await page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
        const screenshotBase64 = screenshotBuffer.toString('base64');

        const bodyText = await page.evaluate(() => document.body.innerText);
        const exito = /éxito|completo|generada|descargar|enviada|folio fiscal/i.test(bodyText);

        return {
            success: true,
            message: exito
                ? '✓ OXXO: Factura generada con éxito.'
                : 'OXXO: Portal cargado y datos ingresados. Verifique la captura.',
            evidencia: `data:image/jpeg;base64,${screenshotBase64}`,
            datos: {
                folio: ticket.datos?.folio || 'N/A',
                status_portal: 'Interacción enviada'
            }
        };

    } catch (error) {
        console.error("Error en robot OXXO:", error);
        return {
            success: false,
            message: `Error en Portal OXXO: ${error.message}`
        };
    } finally {
        await browser.close();
    }
}

module.exports = { facturarOXXO };
