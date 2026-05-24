const express = require('express');
const router = express.Router();
const jornadaController = require('./jornada.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/hoy', jornadaController.getHoy);
router.get('/stats/hoy', jornadaController.getStats);
router.post('/abrir', jornadaController.abrir);
router.put('/:id/cerrar', jornadaController.cerrar);

module.exports = router;
