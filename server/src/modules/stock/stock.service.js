const pool = require('../../config/db');

class StockService {
  static async getStockActual(jornadaId) {
    const { rows } = await pool.query(
      `SELECT s.*, p.nombre as producto_nombre, p.categoria 
       FROM stock_diario s 
       JOIN productos p ON s.producto_id = p.id 
       WHERE s.jornada_id = $1`,
      [jornadaId]
    );
    return rows;
  }

  static async getBajoStock() {
    const { rows } = await pool.query(
      `SELECT s.*, p.nombre as producto_nombre, p.categoria 
       FROM stock_diario s 
       JOIN productos p ON s.producto_id = p.id 
       WHERE s.stock_actual <= 5 
       AND s.jornada_id = (SELECT id FROM jornadas WHERE fecha = CURRENT_DATE LIMIT 1)`
    );
    return rows;
  }

  static async getStockHistorico(fecha) {
    const { rows } = await pool.query(
      `SELECT s.*, p.nombre as producto_nombre, p.categoria, j.fecha 
       FROM stock_diario s 
       JOIN productos p ON s.producto_id = p.id 
       JOIN jornadas j ON s.jornada_id = j.id 
       WHERE j.fecha = $1`,
      [fecha]
    );
    return rows;
  }
}

module.exports = StockService;
