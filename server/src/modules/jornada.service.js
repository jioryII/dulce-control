const pool = require('../config/db');

class JornadaService {
  static async getHoy(userId) {
    const { rows } = await pool.query(
      'SELECT * FROM jornadas WHERE fecha = CURRENT_DATE AND created_by = $1',
      [userId]
    );
    return rows[0];
  }

  static async abrir(userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insertar jornada
      const { rows } = await client.query(
        'INSERT INTO jornadas (fecha, created_by) VALUES (CURRENT_DATE, $1) RETURNING id',
        [userId]
      );
      const newJornadaId = rows[0].id;

      // Buscar jornada anterior de ESTE usuario para hacer carryover de stock
      const { rows: prevJornada } = await client.query(
        `SELECT id FROM jornadas 
         WHERE fecha < CURRENT_DATE AND created_by = $1 
         ORDER BY fecha DESC LIMIT 1`,
        [userId]
      );

      if (prevJornada.length > 0) {
        const prevId = prevJornada[0].id;
        // Traer stock_actual que sobró ayer y crear registros para hoy
        const { rows: stockAnterior } = await client.query(
          `SELECT producto_id, stock_actual 
           FROM stock_diario 
           WHERE jornada_id = $1 AND stock_actual > 0`,
          [prevId]
        );

        for (const row of stockAnterior) {
          await client.query(
            `INSERT INTO stock_diario (jornada_id, producto_id, stock_inicial, stock_actual)
             VALUES ($1, $2, $3, $3)
             ON CONFLICT (jornada_id, producto_id) DO NOTHING`,
            [newJornadaId, row.producto_id, row.stock_actual]
          );
        }
      }

      await client.query('COMMIT');
      return newJornadaId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async cerrar(id, userId) {
    const { rows } = await pool.query(
      'SELECT id FROM jornadas WHERE id = $1 AND created_by = $2',
      [id, userId]
    );
    if (rows.length === 0) throw new Error('Jornada no encontrada');
    await pool.query(
      "UPDATE jornadas SET estado = 'cerrada' WHERE id = $1",
      [id]
    );
  }

  static async getStats(userId) {
    // Jornada de hoy de este usuario
    const { rows: jornadaRows } = await pool.query(
      'SELECT id FROM jornadas WHERE fecha = CURRENT_DATE AND created_by = $1',
      [userId]
    );
    const jornadaId = jornadaRows[0]?.id || null;

    if (!jornadaId) {
      return { ventas: 0, ventas_directas: 0, ventas_vehiculos: 0, produccion: 0, clientes: 0, crecimiento: '0%' };
    }

    // 1. Ventas directas del día
    const { rows: ventasDirectas } = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as total 
       FROM ventas 
       WHERE jornada_id = $1 AND estado = 'completada'`,
      [jornadaId]
    );

    // 2. Ventas vehiculos liquidados del día
    const { rows: ventasVehiculos } = await pool.query(
      `SELECT COALESCE(SUM(vl.total_vendido), 0) as total
       FROM vehiculo_liquidaciones vl
       JOIN vehiculo_envios ve ON vl.envio_id = ve.id
       WHERE ve.jornada_id = $1`,
      [jornadaId]
    );

    // 3. Producción del día
    const { rows: produccion } = await pool.query(
      `SELECT COALESCE(SUM(cantidad), 0) as total 
       FROM produccion 
       WHERE jornada_id = $1`,
      [jornadaId]
    );

    // 4. Clientes nuevos hoy (de este usuario)
    const { rows: clientes } = await pool.query(
      `SELECT COUNT(*) as total 
       FROM clientes 
       WHERE DATE(created_at) = CURRENT_DATE AND activo = TRUE AND creado_por = $1`,
      [userId]
    );

    // 5. Crecimiento: comparar total de hoy vs total de ayer
    const { rows: jornadaAyer } = await pool.query(
      `SELECT id FROM jornadas 
       WHERE fecha = CURRENT_DATE - INTERVAL '1 day' AND created_by = $1`,
      [userId]
    );
    let crecimiento = '0%';
    if (jornadaAyer.length > 0) {
      const { rows: ventasAyer } = await pool.query(
        `SELECT COALESCE(SUM(v.total), 0) + COALESCE(
           (SELECT SUM(vl.total_vendido) FROM vehiculo_liquidaciones vl
            JOIN vehiculo_envios ve ON vl.envio_id = ve.id
            WHERE ve.jornada_id = $1), 0
         ) as total
         FROM ventas v
         WHERE v.jornada_id = $1 AND v.estado = 'completada'`,
        [jornadaAyer[0].id]
      );
      const totalAyer = Number(ventasAyer[0].total) || 0;
      const totalHoy = Number(ventasDirectas[0].total) + Number(ventasVehiculos[0].total);
      if (totalAyer > 0) {
        const pct = ((totalHoy - totalAyer) / totalAyer * 100).toFixed(0);
        crecimiento = `${pct >= 0 ? '+' : ''}${pct}%`;
      } else if (totalHoy > 0) {
        crecimiento = '+100%';
      }
    }

    const totalDirectas = Number(ventasDirectas[0].total) || 0;
    const totalVehiculos = Number(ventasVehiculos[0].total) || 0;

    return {
      ventas: totalDirectas + totalVehiculos,
      ventas_directas: totalDirectas,
      ventas_vehiculos: totalVehiculos,
      produccion: Number(produccion[0].total) || 0,
      clientes: Number(clientes[0].total) || 0,
      crecimiento
    };
  }

  // Historial de jornadas (últimos 3 meses) para un usuario
  static async getHistorial(userId, limit = 90) {
    const { rows } = await pool.query(
      `SELECT j.id, j.fecha, j.estado,
              COALESCE(SUM(v.total) FILTER (WHERE v.estado = 'completada'), 0) as ventas_directas,
              COALESCE((
                SELECT SUM(vl.total_vendido) 
                FROM vehiculo_liquidaciones vl
                JOIN vehiculo_envios ve ON vl.envio_id = ve.id
                WHERE ve.jornada_id = j.id
              ), 0) as ventas_vehiculos,
              COALESCE(cc.total_esperado, 0) as total_esperado,
              cc.total_fisico,
              cc.diferencia
       FROM jornadas j
       LEFT JOIN ventas v ON v.jornada_id = j.id
       LEFT JOIN cuadre_caja cc ON cc.jornada_id = j.id
       WHERE j.created_by = $1 
         AND j.fecha >= CURRENT_DATE - INTERVAL '3 months'
       GROUP BY j.id, j.fecha, j.estado, cc.total_esperado, cc.total_fisico, cc.diferencia
       ORDER BY j.fecha DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows;
  }
}

module.exports = JornadaService;
