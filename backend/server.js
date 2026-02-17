const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { facturarOXXO } = require('./robots/oxxo');
const { facturarGasolina } = require('./robots/gasolina');

dotenv.config();

const app = express();

// Configuración de CORS - restringir orígenes en producción
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3001'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        // Permitir túneles de Cloudflare (trycloudflare.com)
        if (origin.endsWith('.trycloudflare.com')) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;

// Rate limiting simple (sin dependencia externa)
const requestCounts = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto
const RATE_LIMIT_MAX = 20; // máx 20 requests por minuto

const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }

    const timestamps = requestCounts.get(ip).filter(t => t > windowStart);
    timestamps.push(now);
    requestCounts.set(ip, timestamps);

    if (timestamps.length > RATE_LIMIT_MAX) {
        return res.status(429).json({
            success: false,
            message: 'Demasiadas solicitudes. Intente de nuevo en un minuto.'
        });
    }
    next();
};

// Limpiar rate limit map cada 5 minutos para evitar memory leak
setInterval(() => {
    const windowStart = Date.now() - RATE_LIMIT_WINDOW_MS;
    for (const [ip, timestamps] of requestCounts.entries()) {
        const valid = timestamps.filter(t => t > windowStart);
        if (valid.length === 0) requestCounts.delete(ip);
        else requestCounts.set(ip, valid);
    }
}, 5 * 60 * 1000);

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
        version: '1.5.0',
        robots_disponibles: Object.keys(robots).length
    });
});

// Endpoint principal para facturación (con rate limiting y validación)
app.post('/facturar', rateLimiter, async (req, res) => {
    const { ticket, config, credenciales } = req.body;

    // Validación de input
    if (!ticket || typeof ticket !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Falta el campo "ticket" en la solicitud.'
        });
    }
    if (!ticket.comercio || !robots[ticket.comercio]) {
        return res.status(400).json({
            success: false,
            message: `Comercio inválido o no soportado: ${ticket.comercio}`
        });
    }
    if (!ticket.nombre || typeof ticket.nombre !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'El ticket debe incluir un "nombre" válido.'
        });
    }
    if (!config || typeof config !== 'object') {
        return res.status(400).json({
            success: false,
            message: 'Falta el campo "config" (datos fiscales) en la solicitud.'
        });
    }

    console.log(`[${new Date().toLocaleTimeString()}] Solicitud para: ${ticket.nombre} (Comercio ID: ${ticket.comercio})`);

    try {
        const robot = robots[ticket.comercio];

        // Ejecutar el robot
        const resultado = await robot(ticket, config, credenciales);

        res.json(resultado);

    } catch (error) {
        console.error(`[${new Date().toLocaleTimeString()}] Error crítico en robot (Comercio ${ticket.comercio}):`, error.message);
        res.status(500).json({
            success: false,
            message: `Error interno en el robot: ${error.message}`
        });
    }
});

let server;

server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Servidor de automatización CORRIENDO`);
    console.log(`Puerto: ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`-----------------------------------------`);
    console.log(`Para acceso remoto ejecuta en otra terminal:`);
    console.log(`  cloudflared tunnel --url http://localhost:${PORT}`);
    console.log(`=========================================`);
});

// Graceful shutdown
const shutdown = (signal) => {
    console.log(`\n[${signal}] Cerrando servidor...`);
    server.close(() => {
        console.log('Servidor cerrado correctamente.');
        process.exit(0);
    });
    // Forzar cierre después de 10 segundos
    setTimeout(() => {
        console.error('Cierre forzado por timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
