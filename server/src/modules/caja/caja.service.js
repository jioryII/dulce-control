const pool = require('../../config/db');

class CajaService {
  static async getResumenCierre(jornadaId, userId) {
    // Validar que la jornada pertenece al usuario
    const { rows: jornadaRows } = await pool.query(
      'SELECT id FROM jornadas WHERE id = $1 AND created_by = $2',
      [jornadaId, userId]
    );
    if (jornadaRows.length === 0) throw new Error('Jornada no encontrada');

    // 1. Total ventas normales
    const { rows: ventasNormales } = await pool.query(
      "SELECT SUM(total) as total, SUM(descuento) as descuentos FROM ventas WHERE jornada_id = $1 AND estado = 'completada'",
      [jornadaId]
    );

    // 2. Total ventas vehículos (Liquidaciones)
    const { rows: ventasVehiculos } = await pool.query(
      'SELECT SUM(total_vendido) as total FROM vehiculo_liquidaciones vl JOIN vehiculo_envios ve ON vl.envio_id = ve.id WHERE ve.jornada_id = $1',
      [jornadaId]
    );

    const ventas_normales = Number(ventasNormales[0].total) || 0;
    const ventas_vehiculos = Number(ventasVehiculos[0].total) || 0;
    const descuentos = Number(ventasNormales[0].descuentos) || 0;
    
    // Total esperado: incluye las ventas normales (que ya tienen el descuento aplicado) + ventas vehiculos
    // Si la columna total en ventas es subtotal - descuento, entonces el total esperado es la suma de los totales.
    const esperado = ventas_normales + ventas_vehiculos;

    return {
      ventas_normales,
      ventas_vehiculos,
      total_descuentos: descuentos,
      total_devoluciones: 0, // Por implementar
      total_esperado: esperado
    };
  }

  static async procesarCuadre(data, userId) {
    const { jornada_id, total_fisico, observacion } = data;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validar que la jornada esté abierta y sea del usuario
      const { rows: jornadaRows } = await client.query(
        "SELECT id FROM jornadas WHERE id = $1 AND estado = 'abierta' AND created_by = $2 FOR UPDATE",
        [jornada_id, userId]
      );
      if (jornadaRows.length === 0) throw new Error('Jornada no válida o ya está cerrada');

      // Validar si hay envíos pendientes
      const { rows: enviosPendientes } = await client.query(
        "SELECT id FROM vehiculo_envios WHERE jornada_id = $1 AND estado = 'enviado'",
        [jornada_id]
      );
      if (enviosPendientes.length > 0) throw new Error('No se puede cerrar caja: Hay vehículos sin liquidar');

      const resumen = await this.getResumenCierre(jornada_id, userId);
      const diferencia = total_fisico - resumen.total_esperado;

      // 1. Insertar cuadre
      await client.query(
        `INSERT INTO cuadre_caja (
          jornada_id, total_ventas_normales, total_ventas_vehiculos, total_descuentos, total_devoluciones,
          total_esperado, total_fisico, diferencia, observacion, cerrado_por
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          jornada_id, resumen.ventas_normales, resumen.ventas_vehiculos, resumen.total_descuentos, resumen.total_devoluciones,
          resumen.total_esperado, total_fisico, diferencia, observacion, userId
        ]
      );

      // 2. Marcar jornada como cerrada y guardar fecha
      await client.query("UPDATE jornadas SET estado = 'cerrada', closed_at = CURRENT_TIMESTAMP WHERE id = $1", [jornada_id]);

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
