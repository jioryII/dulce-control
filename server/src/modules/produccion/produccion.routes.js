const express = require('express');
const router = express.Router();
const produccionController = require('./produccion.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/:jornada_id', produccionController.getByJornada);
router.post('/', produccionController.registrar);
router.delete('/:id', produccionController.eliminar);

module.exports = router;
