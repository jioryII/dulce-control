const pool = require('../config/db');

class JornadaService {
  static async getHoy() {
    const { rows } = await pool.query('SELECT * FROM jornadas WHERE fecha = CURRENT_DATE');
    return rows[0];
  }

  static async abrir(userId) {
    const { rows } = await pool.query(
      'INSERT INTO jornadas (fecha, created_by) VALUES (CURRENT_DATE, $1) RETURNING id',
      [userId]
    );
    return rows[0].id;
  }

  static async cerrar(id) {
    await pool.query("UPDATE jornadas SET estado = 'cerrada' WHERE id = $1", [id]);
  }

  static async getStats() {
    // 1. Ventas del día
    const { rows: ventas } = await pool.query(
      "SELECT SUM(total) as total FROM ventas WHERE DATE(created_at) = CURRENT_DATE AND estado = 'completada'"
    );

    // 2. Pedidos/Producción Activa (conteo de items horneados hoy)
    const { rows: produccion } = await pool.query(
      'SELECT SUM(cantidad) as total FROM produccion p JOIN jornadas j ON p.jornada_id = j.id WHERE j.fecha = CURRENT_DATE'
    );

    // 3. Clientes Nuevos hoy
    const { rows: clientes } = await pool.query(
      'SELECT COUNT(*) as total FROM clientes WHERE DATE(created_at) = CURRENT_DATE AND activo = TRUE'
    );

    return {
      ventas: ventas[0].total || 0,
      produccion: produccion[0].total || 0,
      clientes: clientes[0].total || 0,
      crecimiento: '+12%' // Placeholder por ahora
    };
  }
}

module.exports = JornadaService;
