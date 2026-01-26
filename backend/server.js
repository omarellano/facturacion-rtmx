const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get('/status', (req, res) => {
    res.json({ status: 'Robot Online', version: '1.0.0' });
});

// Endpoint principal para facturación
app.post('/facturar', async (req, res) => {
    const { ticket, config } = req.body;

    console.log(`Iniciando facturación para: ${ticket.nombre} con el comercio ID: ${ticket.comercio}`);

    try {
        // Aquí es donde llamaremos a los robots específicos
        // Por ahora devolvemos un éxito simulado para probar la conexión
        setTimeout(() => {
            res.json({
                success: true,
                message: 'Robot recibió el comando. Implementando lógica específica...',
                datos: {
                    metodo: 'Automatizado (Robot)',
                    total: ticket.datos?.total || 'N/A'
                }
            });
        }, 2000);

    } catch (error) {
        console.error('Error en el robot:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor de automatización corriendo en puerto ${PORT}`);
});
