const puppeteer = require('puppeteer');

/**
 * Lanza una instancia de browser optimizada para entornos de nube (Railway/Linux)
 */
async function getBrowser() {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // Útil en entornos con poca RAM como Railway Starter
            '--disable-gpu'
        ]
    });
}

module.exports = { getBrowser };
