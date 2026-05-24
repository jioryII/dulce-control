const pool = require('../../config/db');

class CajaService {
  static async getResumenCierre(jornadaId) {
    // 1. Total ventas normales
    const { rows: ventasNormales } = await pool.query(
      "SELECT SUM(total) as total FROM ventas WHERE jornada_id = $1 AND estado = 'completada'",
      [jornadaId]
    );

    // 2. Total ventas vehículos (Liquidaciones)
    const { rows: ventasVehiculos } = await pool.query(
      'SELECT SUM(total_vendido) as total FROM vehiculo_liquidaciones vl JOIN vehiculo_envios ve ON vl.envio_id = ve.id WHERE ve.jornada_id = $1',
      [jornadaId]
    );

    const esperado = (Number(ventasNormales[0].total) || 0) + (Number(ventasVehiculos[0].total) || 0);

    return {
      ventas_normales: Number(ventasNormales[0].total) || 0,
      ventas_vehiculos: Number(ventasVehiculos[0].total) || 0,
      total_esperado: esperado
    };
  }

  static async procesarCuadre(data, userId) {
    const { jornada_id, total_fisico, observacion } = data;
    const resumen = await this.getResumenCierre(jornada_id);
    
    const diferencia = total_fisico - resumen.total_esperado;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insertar cuadre
      await client.query(
        `INSERT INTO cuadre_caja (
          jornada_id, total_ventas_normales, total_ventas_vehiculos, 
          total_esperado, total_fisico, diferencia, observacion, cerrado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          jornada_id, resumen.ventas_normales, resumen.ventas_vehiculos,
          resumen.total_esperado, total_fisico, diferencia, observacion, userId
        ]
      );

      // 2. Marcar jornada como cerrada
      await client.query("UPDATE jornadas SET estado = 'cerrada' WHERE id = $1", [jornada_id]);

      await client.query('COMMIT');
      return { diferencia };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = CajaService;
