const pool = require('../../config/db');

class ClienteService {
  static async getAll(userId) {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE activo = TRUE AND creado_por = $1 ORDER BY nombre ASC', [userId]);
    return rows;
  }

  static async getById(id, userId) {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1 AND activo = TRUE AND creado_por = $2', [id, userId]);
    return rows[0];
  }

  static async create(data, userId) {
    const { nombre, telefono, direccion, tipo, observacion } = data;
    const { rows } = await pool.query(
      'INSERT INTO clientes (nombre, telefono, direccion, tipo, observacion, creado_por) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [nombre, telefono, direccion, tipo || 'variable', observacion, userId]
    );
    return rows[0].id;
  }

  static async update(id, data, userId) {
    const { nombre, telefono, direccion, tipo, observacion } = data;
    await pool.query(
      'UPDATE clientes SET nombre = $1, telefono = $2, direccion = $3, tipo = $4, observacion = $5 WHERE id = $6 AND creado_por = $7',
      [nombre, telefono, direccion, tipo, observacion, id, userId]
    );
  }

  static async delete(id, userId) {
    await pool.query('UPDATE clientes SET activo = FALSE WHERE id = $1 AND creado_por = $2', [id, userId]);
  }
}

module.exports = ClienteService;
