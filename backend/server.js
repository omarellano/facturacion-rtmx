const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const ngrok = require('@ngrok/ngrok');
const { facturarOXXO } = require('./robots/oxxo');
const { facturarGasolina } = require('./robots/gasolina');

dotenv.config();

const app = express();

// CORS restringido a orígenes conocidos
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    /\.github\.io$/,
    /\.ngrok-free\.app$/
];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requests sin origin (como curl en desarrollo)
        if (!origin) return callback(null, true);
        const allowed = allowedOrigins.some(o =>
            o instanceof RegExp ? o.test(origin) : o === origin
        );
        if (allowed) return callback(null, true);
        callback(new Error('Origen no permitido por CORS'));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3001;
const API_KEY = process.env.API_KEY;

// Middleware de autenticación por API Key
const autenticar = (req, res, next) => {
    if (!API_KEY) {
        console.warn('⚠️  API_KEY no configurada en .env - endpoint desprotegido');
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${API_KEY}`) {
        return res.status(401).json({
            success: false,
            message: 'No autorizado. Incluye el header Authorization: Bearer <API_KEY>'
        });
    }
    next();
};

// Rate limiting básico por IP
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const RATE_LIMIT_MAX = 10; // máximo 10 requests por minuto

const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const record = requestCounts.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

    if (now > record.resetAt) {
        record.count = 0;
        record.resetAt = now + RATE_LIMIT_WINDOW;
    }

    record.count++;
    requestCounts.set(ip, record);

    if (record.count > RATE_LIMIT_MAX) {
        return res.status(429).json({
            success: false,
            message: 'Demasiadas solicitudes. Espera un momento antes de reintentar.'
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
};

app.get('/status', (req, res) => {
    res.json({
        status: 'Robot Online',
        version: '2.0.0',
        robots_disponibles: Object.keys(robots).length,
        autenticacion: !!API_KEY
    });
});

// Endpoint principal para facturación (protegido)
app.post('/facturar', autenticar, rateLimiter, async (req, res) => {
    const { ticket, config, credenciales } = req.body;

    // Validación de entrada
    if (!ticket || !ticket.comercio) {
        return res.status(400).json({
            success: false,
            message: 'Datos incompletos: se requiere ticket con comercio.'
        });
    }

    if (!config || !config.rfc) {
        return res.status(400).json({
            success: false,
            message: 'Datos incompletos: se requiere configuración fiscal (RFC).'
        });
    }

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
    console.log(`Servidor de automatización v2.0.0`);
    console.log(`Puerto: ${PORT}`);
    console.log(`Autenticación: ${API_KEY ? 'ACTIVA' : '⚠️ DESACTIVADA'}`);

    try {
        const session = await ngrok.forward({
            addr: PORT,
            authtoken: process.env.NGROK_AUTHTOKEN
        });
        console.log(`Acceso Remoto ACTIVO`);
        console.log(`URL Pública: ${session.url()}`);
        console.log(`=========================================`);
    } catch (err) {
        console.error("No se pudo iniciar ngrok:", err.message);
        console.log(`Estado: Solo Local (Puerto ${PORT})`);
        console.log(`=========================================`);
    }
});
