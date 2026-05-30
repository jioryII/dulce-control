const pool = require('../../config/db');

class VentaService {
  static async registrar(data, userId) {
    const { jornada_id, cliente_id, subtotal, descuento, total, items, descuento_motivo, observacion } = data;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 0. Validar jornada abierta y pertenece al usuario
      const { rows: jornadaRows } = await client.query(
        "SELECT id FROM jornadas WHERE id = $1 AND estado = 'abierta' AND created_by = $2",
        [jornada_id, userId]
      );
      if (jornadaRows.length === 0) {
        throw new Error('Jornada no válida o no está abierta');
      }

      // 1. Insertar venta
      const { rows: ventaRows } = await client.query(
        'INSERT INTO ventas (jornada_id, cliente_id, subtotal, descuento, descuento_motivo, total, observacion, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [jornada_id, cliente_id || null, subtotal, descuento || 0, descuento_motivo || null, total, observacion || null, userId]
      );
      const ventaId = ventaRows[0].id;

      // 2. Insertar detalles y descontar stock
      for (const item of items) {
        await client.query(
          'INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unit, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [ventaId, item.producto_id, item.cantidad, item.precio_unit, item.subtotal]
        );

        // Validar y descontar stock diario
        const { rows: stockRows } = await client.query(
          'SELECT stock_actual FROM stock_diario WHERE jornada_id = $1 AND producto_id = $2',
          [jornada_id, item.producto_id]
        );

        if (stockRows.length === 0 || stockRows[0].stock_actual < item.cantidad) {
          throw new Error(`Stock insuficiente para el producto ID ${item.producto_id}`);
        }

        await client.query(
          'UPDATE stock_diario SET stock_actual = stock_actual - $1 WHERE jornada_id = $2 AND producto_id = $3',
          [item.cantidad, jornada_id, item.producto_id]
        );
      }

      await client.query('COMMIT');
      return ventaId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getByJornada(jornadaId, userId) {
    const { rows } = await pool.query(
      `SELECT v.*, c.nombre as cliente_nombre 
       FROM ventas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       JOIN jornadas j ON v.jornada_id = j.id
       WHERE v.jornada_id = $1 AND j.created_by = $2 
       ORDER BY v.created_at DESC`,
      [jornadaId, userId]
    );
    return rows;
  }
}

module.exports = VentaService;
