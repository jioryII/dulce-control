const pool = require('../../config/db');

class ReportesService {
  static async getVentas(desde, hasta, userId) {
    let query = `
      SELECT DATE(v.created_at) as fecha, SUM(v.total) as total, COUNT(*) as num_ventas 
      FROM ventas v
      JOIN jornadas j ON v.jornada_id = j.id
      WHERE v.estado = 'completada' AND j.created_by = $1
    `;
    const params = [userId];

    if (desde && hasta) {
      query += ` AND DATE(v.created_at) BETWEEN $2 AND $3`;
      params.push(desde, hasta);
    }

    query += ` GROUP BY DATE(v.created_at) ORDER BY fecha DESC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getProduccion(desde, hasta, userId) {
    let query = `
      SELECT p_base.nombre as producto, SUM(p.cantidad) as total 
      FROM produccion p 
      JOIN productos p_base ON p.producto_id = p_base.id
      JOIN jornadas j ON p.jornada_id = j.id 
      WHERE j.created_by = $1
    `;
    const params = [userId];

    if (desde && hasta) {
      query += ` AND j.fecha BETWEEN $2 AND $3`;
      params.push(desde, hasta);
    }

    query += ` GROUP BY p_base.nombre ORDER BY total DESC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getCierresCaja(desde, hasta, userId) {
    let query = `
      SELECT c.*, j.fecha 
      FROM cuadre_caja c 
      JOIN jornadas j ON c.jornada_id = j.id
      WHERE j.created_by = $1
    `;
    const params = [userId];

    if (desde && hasta) {
      query += ` AND j.fecha BETWEEN $2 AND $3`;
      params.push(desde, hasta);
    }

    query += ` ORDER BY j.fecha DESC`;
    const { rows } = await pool.query(query, params);
    return rows;
  }

  static async getStockCritico(userId) {
    const { rows } = await pool.query(`
      SELECT p.nombre, COALESCE(s.stock_actual, 0) as stock 
      FROM productos p 
      LEFT JOIN stock_diario s ON p.id = s.producto_id 
      AND s.jornada_id = (SELECT id FROM jornadas WHERE fecha = CURRENT_DATE AND created_by = $1 LIMIT 1)
      WHERE p.activo = TRUE AND (s.stock_actual <= 5 OR s.stock_actual IS NULL) AND p.creado_por = $1
      ORDER BY stock ASC
    `, [userId]);
    return rows;
  }

  static async getVentasMesActual(userId) {
    // Ventas directas y vehiculos por día del mes actual
    const { rows } = await pool.query(`
      SELECT 
          j.fecha as fecha,
          COALESCE(SUM(v.total) FILTER (WHERE v.estado = 'completada'), 0) + 
          COALESCE((
            SELECT SUM(vl.total_vendido) 
            FROM vehiculo_liquidaciones vl
            JOIN vehiculo_envios ve ON vl.envio_id = ve.id
            WHERE ve.jornada_id = j.id
          ), 0) as total
      FROM jornadas j
      LEFT JOIN ventas v ON v.jornada_id = j.id
      WHERE j.created_by = $1 
        AND EXTRACT(MONTH FROM j.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM j.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
      GROUP BY j.id, j.fecha
      ORDER BY j.fecha ASC
    `, [userId]);
    return rows;
  }
}

module.exports = ReportesService;
