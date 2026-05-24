const pool = require('../../config/db');

class ProductService {
  static async getAll() {
    const { rows } = await pool.query(`
      SELECT p.*, COALESCE(s.stock_actual, 0) as stock_actual 
      FROM productos p 
      LEFT JOIN stock_diario s ON p.id = s.producto_id 
      AND s.jornada_id = (SELECT id FROM jornadas WHERE fecha = CURRENT_DATE LIMIT 1)
      WHERE p.activo = TRUE 
      ORDER BY p.nombre ASC
    `);
    return rows;
  }

  static async create(data) {
    const { nombre, categoria, precio } = data;
    const { rows } = await pool.query(
      'INSERT INTO productos (nombre, categoria, precio) VALUES ($1, $2, $3) RETURNING id',
      [nombre, categoria, precio]
    );
    return rows[0].id;
  }

  static async update(id, data) {
    const { nombre, categoria, precio, activo } = data;
    await pool.query(
      'UPDATE productos SET nombre = $1, categoria = $2, precio = $3, activo = $4 WHERE id = $5',
      [nombre, categoria, precio, activo, id]
    );
  }

  static async delete(id) {
    await pool.query('UPDATE productos SET activo = FALSE WHERE id = $1', [id]);
  }
}

module.exports = ProductService;
