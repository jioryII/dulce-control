const express = require('express');
const router = express.Router();
const CajaController = require('./caja.controller');
const auth = require('../../middleware/auth.middleware');

router.get('/resumen/:jornadaId', auth, CajaController.getResumen);
router.post('/cerrar', auth, CajaController.cerrarCaja);

module.exports = router;
