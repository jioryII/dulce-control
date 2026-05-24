const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const authMiddleware = require('../../middleware/auth.middleware');

router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.patch('/perfil', authMiddleware, authController.updateProfile);
router.get('/users', authMiddleware, authController.getUsers);

module.exports = router;
