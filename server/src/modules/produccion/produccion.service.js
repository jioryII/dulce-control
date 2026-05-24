const pool = require('../../config/db');

class ProduccionService {
  static async getByJornada(jornadaId) {
    const { rows } = await pool.query(
      `SELECT p.*, prod.nombre as producto_nombre 
       FROM produccion p 
       JOIN productos prod ON p.producto_id = prod.id 
       WHERE p.jornada_id = $1`,
      [jornadaId]
    );
    return rows;
  }

  static async registrar(data) {
    const { jornada_id, producto_id, cantidad, observacion } = data;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // 1. Insertar registro de producción
      const { rows: prodRows } = await client.query(
        'INSERT INTO produccion (jornada_id, producto_id, cantidad, observacion) VALUES ($1, $2, $3, $4) RETURNING id',
        [jornada_id, producto_id, cantidad, observacion]
      );

      // 2. Actualizar stock diario
      // Primero verificamos si ya existe entrada para este producto en esta jornada
      const { rows: stockExists } = await client.query(
        'SELECT id FROM stock_diario WHERE jornada_id = $1 AND producto_id = $2',
        [jornada_id, producto_id]
      );

      if (stockExists.length > 0) {
        await client.query(
          'UPDATE stock_diario SET stock_actual = stock_actual + $1 WHERE jornada_id = $2 AND producto_id = $3',
          [cantidad, jornada_id, producto_id]
        );
      } else {
        await client.query(
          'INSERT INTO stock_diario (jornada_id, producto_id, stock_inicial, stock_actual) VALUES ($1, $2, 0, $3)',
          [jornada_id, producto_id, cantidad]
        );
      }

      await client.query('COMMIT');
      return prodRows[0].id;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async eliminar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener datos antes de borrar para revertir stock
      const { rows } = await client.query('SELECT * FROM produccion WHERE id = $1', [id]);
      if (rows.length > 0) {
        const { jornada_id, producto_id, cantidad } = rows[0];
        await client.query(
          'UPDATE stock_diario SET stock_actual = stock_actual - $1 WHERE jornada_id = $2 AND producto_id = $3',
          [cantidad, jornada_id, producto_id]
        );
        await client.query('DELETE FROM produccion WHERE id = $1', [id]);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ProduccionService;
