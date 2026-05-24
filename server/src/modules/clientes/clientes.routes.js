const express = require('express');
const router = express.Router();
const ClienteController = require('./clientes.controller');
const auth = require('../../middleware/auth.middleware');

router.get('/', auth, ClienteController.getAll);
router.get('/:id', auth, ClienteController.getById);
router.post('/', auth, ClienteController.create);
router.put('/:id', auth, ClienteController.update);
router.delete('/:id', auth, ClienteController.remove);

module.exports = router;
