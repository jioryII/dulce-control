const express = require('express');
const router = express.Router();
const contingenciasController = require('./contingencias.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', contingenciasController.getByJornada);
router.post('/', contingenciasController.registrar);
router.delete('/:id', contingenciasController.eliminar);

module.exports = router;
