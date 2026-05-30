const pool = require('../../config/db');

class ProductService {
  static async getAll(userId) {
    const { rows } = await pool.query(`
      SELECT p.*, COALESCE(s.stock_actual, 0) as stock_actual 
      FROM productos p 
      LEFT JOIN stock_diario s ON p.id = s.producto_id 
      AND s.jornada_id = (SELECT id FROM jornadas WHERE fecha = CURRENT_DATE AND created_by = $1 LIMIT 1)
      WHERE p.activo = TRUE AND p.creado_por = $1
      ORDER BY p.nombre ASC
    `, [userId]);
    return rows;
  }

  static async create(data, userId) {
    const { nombre, categoria, precio } = data;
    const { rows } = await pool.query(
      'INSERT INTO productos (nombre, categoria, precio, creado_por) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre, categoria, precio, userId]
    );
    return rows[0].id;
  }

  static async update(id, data, userId) {
    const { nombre, categoria, precio, activo } = data;
    await pool.query(
      'UPDATE productos SET nombre = $1, categoria = $2, precio = $3, activo = $4 WHERE id = $5 AND creado_por = $6',
      [nombre, categoria, precio, activo !== undefined ? activo : true, id, userId]
    );
  }

  static async delete(id, userId) {
    await pool.query('UPDATE productos SET activo = FALSE WHERE id = $1 AND creado_por = $2', [id, userId]);
  }
}

module.exports = ProductService;
