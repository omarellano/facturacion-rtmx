const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ngrok = require('@ngrok/ngrok');
const { facturarOXXO } = require('./robots/oxxo');
const { facturarGasolina } = require('./robots/gasolina');

dotenv.config();

const app = express();

// Configuración de CORS robusta
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning', 'Authorization']
}));

app.use(express.json({ limit: '50mb' })); // Aumentar límite para imágenes/evidencia

const PORT = process.env.PORT || 3001;
let ngrokPublicUrl = null; // Se actualiza al conectar ngrok

// Registro de robots disponibles
const robots = {
    1: facturarOXXO,     // OXXO
    2: facturarGasolina, // Pemex
    3: facturarGasolina, // Abimerhi
    4: facturarGasolina, // La Gas
    5: facturarGasolina, // G500
    6: facturarGasolina, // FacturasGas
};

app.get('/status', (req, res) => {
    res.json({
        status: 'Robot Online',
        version: '1.3.0 (auto-ngrok)',
        robots_disponibles: Object.keys(robots).length,
        ngrokUrl: ngrokPublicUrl
    });
});

// Endpoint principal para facturación
app.post('/facturar', async (req, res) => {
    const { ticket, config, credenciales } = req.body;

    console.log(`[${new Date().toLocaleTimeString()}] Solicitud para: ${ticket.nombre} (Comercio ID: ${ticket.comercio})`);

    try {
        const robot = robots[ticket.comercio];

        if (!robot) {
            return res.status(400).json({
                success: false,
                message: `El comercio ID ${ticket.comercio} aún no tiene un robot programado.`
            });
        }

        // Ejecutar el robot
        const resultado = await robot(ticket, config, credenciales);

        res.json(resultado);

    } catch (error) {
        console.error('Error crítico en el robot:', error);
        res.status(500).json({
            success: false,
            message: `Error interno en el robot: ${error.message}`
        });
    }
});

app.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(`Servidor de automatización CORRIENDO`);
    console.log(`Puerto: ${PORT}`);

    try {
        // Para usar ngrok necesitas un authtoken de ngrok.com (es gratis)
        // Puedes ponerlo en el archivo .env como NGROK_AUTHTOKEN
        const session = await ngrok.forward({
            addr: PORT,
            authtoken: process.env.NGROK_AUTHTOKEN
        });
        ngrokPublicUrl = session.url();
        console.log(`Acceso Remoto ACTIVO`);
        console.log(`URL Pública: ${ngrokPublicUrl}`);
        console.log(`=========================================`);
    } catch (err) {
        console.error("No se pudo iniciar ngrok:", err.message);
        console.log(`Estado: Solo Local (Puerto ${PORT})`);
        console.log(`=========================================`);
    }
});
