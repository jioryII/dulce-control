const express = require('express');
const router = express.Router();
const ventaController = require('./venta.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', ventaController.registrar);
router.get('/', ventaController.getByJornada);

module.exports = router;
