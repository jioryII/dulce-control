const express = require('express');
const router = express.Router();
const VehiculoController = require('./vehiculo.controller');
const auth = require('../../middleware/auth.middleware');

router.get('/', auth, VehiculoController.getAll);
router.get('/:id/historial', auth, VehiculoController.getHistorial);
router.get('/envios/activos/:jornadaId', auth, VehiculoController.getEnviosActivos);
router.post('/envios', auth, VehiculoController.registrarEnvio);
router.post('/liquidaciones', auth, VehiculoController.liquidarEnvio);
router.post('/', auth, VehiculoController.create);
router.put('/:id', auth, VehiculoController.update);
router.delete('/:id', auth, VehiculoController.remove);

module.exports = router;
