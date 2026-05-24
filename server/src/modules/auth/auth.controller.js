const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserService = require('./auth.service');
const config = require('../../config/env');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, rol: user.rol },
      config.jwt.secret,
      { expiresIn: config.jwt.expires }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await UserService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    await UserService.update(req.user.id, { nombre, email });
    
    if (password) {
      await UserService.changePassword(req.user.id, password);
    }
    
    const updatedUser = await UserService.findById(req.user.id);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const users = await UserService.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  login,
  getMe,
  updateProfile,
  getUsers
};
