const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { facturarOXXO } = require('./robots/oxxo');
const { facturarGasolina } = require('./robots/gasolina');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

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
        version: '1.1.0',
        robots_disponibles: Object.keys(robots).length
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

app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Servidor de automatización CORRIENDO`);
    console.log(`Puerto: ${PORT}`);
    console.log(`Estado: Online`);
    console.log(`=========================================`);
});
