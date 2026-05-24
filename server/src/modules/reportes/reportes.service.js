const pool = require('../../config/db');

class ReportesService {
  static async getVentas(desde, hasta) {
    let query = `
      SELECT DATE(created_at) as fecha, SUM(total) as total, COUNT(*) as num_ventas 
      FROM ventas 
      WHERE estado = 'completada'
    `;
    const params = [];

    if (desde && hasta) {
      query += ` AND DATE(created_at) BETWEEN $1 AND $2`;
      params.push(desde, hasta);
    }

    query += ` GROUP BY DATE(created_at) ORDER BY fecha DESC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getProduccion(desde, hasta) {
    let query = `
      SELECT p_base.nombre as producto, SUM(p.cantidad) as total 
      FROM produccion p 
      JOIN productos p_base ON p.producto_id = p_base.id
    `;
    const params = [];

    if (desde && hasta) {
      query += ` JOIN jornadas j ON p.jornada_id = j.id WHERE j.fecha BETWEEN $1 AND $2`;
      params.push(desde, hasta);
    }

    query += ` GROUP BY p_base.nombre ORDER BY total DESC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getCierresCaja(desde, hasta) {
    let query = `
      SELECT c.*, j.fecha 
      FROM cuadre_caja c 
      JOIN jornadas j ON c.jornada_id = j.id
    `;
    const params = [];

    if (desde && hasta) {
      query += ` WHERE j.fecha BETWEEN $1 AND $2`;
      params.push(desde, hasta);
    }

    query += ` ORDER BY j.fecha DESC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getStockCritico() {
    const { rows } = await pool.query(`
      SELECT p.nombre, COALESCE(s.stock_actual, 0) as stock 
      FROM productos p 
      LEFT JOIN stock_diario s ON p.id = s.producto_id 
      AND s.jornada_id = (SELECT id FROM jornadas WHERE fecha = CURRENT_DATE LIMIT 1)
      WHERE p.activo = TRUE AND (s.stock_actual <= 5 OR s.stock_actual IS NULL)
      ORDER BY stock ASC
    `);
    return rows;
  }
}

module.exports = ReportesService;
