const express = require('express');
const router = express.Router();
const ReportesController = require('./reportes.controller');
const auth = require('../../middleware/auth.middleware');

router.use(auth);

router.get('/ventas', ReportesController.getVentas);
router.get('/ventas/mes-actual', ReportesController.getVentasMesActual);
router.get('/produccion', ReportesController.getProduccion);
router.get('/caja', ReportesController.getCierresCaja);
router.get('/stock', ReportesController.getStockCritico);

module.exports = router;
