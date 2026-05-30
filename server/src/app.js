const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/env');
const path = require('path');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.startsWith('http://localhost:')) {
      callback(null, true);
    } else {
      callback(null, config.frontendUrl);
    }
  }
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/productos', require('./modules/produccion/product.routes'));
app.use('/api/jornada', require('./modules/jornada.routes'));
app.use('/api/produccion', require('./modules/produccion/produccion.routes'));
app.use('/api/ventas', require('./modules/ventas/venta.routes'));
app.use('/api/clientes', require('./modules/clientes/clientes.routes'));
app.use('/api/vehiculos', require('./modules/vehiculos/vehiculo.routes'));
app.use('/api/stock', require('./modules/stock/stock.routes'));
app.use('/api/caja', require('./modules/caja/caja.routes'));
app.use('/api/contingencias', require('./modules/contingencias/contingencias.routes'));
app.use('/api/reportes', require('./modules/reportes/reportes.routes'));
app.use('/api/admin', require('./modules/admin/admin.routes'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Dulce Control',
    timestamp: new Date().toISOString()
  });
});

// Servir frontend en producción
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Manejar cualquier otra ruta con el index.html del frontend (SPA)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Basic Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start Server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Dulce Control API running on port ${PORT}`);
});

module.exports = app;
