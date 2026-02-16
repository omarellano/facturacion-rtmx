const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const ngrok = require('@ngrok/ngrok');
const { facturarOXXO } = require('./robots/oxxo');
const { facturarGasolina } = require('./robots/gasolina');
const { facturarSteveMadden } = require('./robots/stevemadden');

dotenv.config();

const app = express();

// Configuración de CORS robusta
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'ngrok-skip-browser-warning', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Servir archivos estáticos del frontend (dist)
app.use(express.static(path.join(__dirname, '../dist')));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY || 'SECRET_KEY_PROD'; // Clave por defecto si no hay env

// Middleware de Autenticación
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token || token !== API_KEY) {
        console.warn(`[${new Date().toLocaleTimeString()}] Intento de acceso no autorizado desde: ${req.ip}`);
        return res.status(401).json({
            success: false,
            message: 'No autorizado. Verifique su API Key en la configuración del frontend.'
        });
    }
    next();
};

// Registro de robots disponibles
const robots = {
    1: facturarOXXO,     // OXXO
    2: facturarGasolina, // Pemex
    3: facturarGasolina, // Abimerhi
    4: facturarGasolina, // La Gas
    5: facturarGasolina, // G500
    6: facturarGasolina, // FacturasGas
    16: facturarSteveMadden, // Steve Madden
};

app.get('/status', (req, res) => {
    res.json({
        status: 'Robot Online',
        version: '2.1.0 (Sync PROD)',
        robots_disponibles: Object.keys(robots).length,
        autenticacion: true
    });
});

// Endpoint principal para facturación (Protegido)
app.post('/facturar', authMiddleware, async (req, res) => {
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

// Ruta comodín para SPA (React) - Debe ir al final de las rutas de la API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(`Servidor de automatización CORRIENDO`);
    console.log(`Puerto: ${PORT}`);

    // Solo usar ngrok si hay un token (útil para desarrollo local)
    if (process.env.NGROK_AUTHTOKEN && process.env.NODE_ENV !== 'production') {
        try {
            const session = await ngrok.forward({
                addr: PORT,
                authtoken: process.env.NGROK_AUTHTOKEN
            });
            console.log(`Acceso Remoto (ngrok) ACTIVO`);
            console.log(`URL Pública: ${session.url()}`);
        } catch (err) {
            console.error("No se pudo iniciar ngrok:", err.message);
        }
    } else {
        console.log(`Modo: Producción/Nube (Sin ngrok)`);
    }
    console.log(`=========================================`);
});
