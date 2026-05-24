const pool = require('../../config/db');

class VentaService {
  static async registrar(data, userId) {
    const { jornada_id, cliente_id, subtotal, descuento, total, items } = data;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insertar venta
      const { rows: ventaRows } = await client.query(
        'INSERT INTO ventas (jornada_id, cliente_id, subtotal, descuento, total, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [jornada_id, cliente_id || null, subtotal, descuento, total, userId]
      );
      const ventaId = ventaRows[0].id;

      // 2. Insertar detalles y descontar stock
      for (const item of items) {
        await client.query(
          'INSERT INTO ventas_detalle (venta_id, producto_id, cantidad, precio_unit, subtotal) VALUES ($1, $2, $3, $4, $5)',
          [ventaId, item.producto_id, item.cantidad, item.precio_unit, item.subtotal]
        );

        // Descontar stock diario
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

  static async getByJornada(jornadaId) {
    const { rows } = await pool.query(
      `SELECT v.*, c.nombre as cliente_nombre 
       FROM ventas v 
       LEFT JOIN clientes c ON v.cliente_id = c.id 
       WHERE v.jornada_id = $1 ORDER BY v.created_at DESC`,
      [jornadaId]
    );
    return rows;
  }
}

module.exports = VentaService;
