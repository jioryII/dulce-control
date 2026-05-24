const pool = require('../../config/db');
const bcrypt = require('bcryptjs');

class UserService {
  static async findByEmail(email) {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND activo = TRUE', [email]);
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await pool.query('SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = $1', [id]);
    return rows[0];
  }

  static async create(userData) {
    const { nombre, email, password, rol } = userData;
    const hashedPassword = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre, email, hashedPassword, rol]
    );
    return rows[0].id;
  }

  static async update(id, userData) {
    const { nombre, email } = userData;
    await pool.query(
      'UPDATE usuarios SET nombre = $1, email = $2 WHERE id = $3',
      [nombre, email, id]
    );
  }

  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE usuarios SET password = $1 WHERE id = $2',
      [hashedPassword, id]
    );
  }

  static async getAll() {
    const { rows } = await pool.query('SELECT id, nombre, email, rol, activo FROM usuarios ORDER BY nombre ASC');
    return rows;
  }
}

module.exports = UserService;
