const puppeteer = require('puppeteer');

/**
 * Lanza una instancia de browser optimizada para entornos de nube (Railway/Linux)
 */
async function getBrowser() {
    return await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null, // Permitir override en Railway
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
            '--font-render-hinting=none', // Evitar problemas de fuentes en Linux
        ]
    });
}

module.exports = { getBrowser };
