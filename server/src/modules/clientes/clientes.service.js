const pool = require('../../config/db');

class ClienteService {
  static async getAll() {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE activo = TRUE ORDER BY nombre ASC');
    return rows;
  }

  static async getById(id) {
    const { rows } = await pool.query('SELECT * FROM clientes WHERE id = $1 AND activo = TRUE', [id]);
    return rows[0];
  }

  static async create(data) {
    const { nombre, telefono, direccion, tipo, observacion } = data;
    const { rows } = await pool.query(
      'INSERT INTO clientes (nombre, telefono, direccion, tipo, observacion) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nombre, telefono, direccion, tipo || 'variable', observacion]
    );
    return rows[0].id;
  }

  static async update(id, data) {
    const { nombre, telefono, direccion, tipo, observacion } = data;
    await pool.query(
      'UPDATE clientes SET nombre = $1, telefono = $2, direccion = $3, tipo = $4, observacion = $5 WHERE id = $6',
      [nombre, telefono, direccion, tipo, observacion, id]
    );
  }

  static async delete(id) {
    await pool.query('UPDATE clientes SET activo = FALSE WHERE id = $1', [id]);
  }
}

module.exports = ClienteService;
