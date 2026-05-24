const express = require('express');
const router = express.Router();
const StockController = require('./stock.controller');
const auth = require('../../middleware/auth.middleware');

router.get('/bajo', auth, StockController.getBajoStock);
router.get('/:jornadaId', auth, StockController.getByJornada);

module.exports = router;
