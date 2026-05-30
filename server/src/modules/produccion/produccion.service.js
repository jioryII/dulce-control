const pool = require('../../config/db');

class ProduccionService {
  static async getByJornada(jornadaId, userId) {
    const { rows } = await pool.query(
      `SELECT p.*, prod.nombre as producto_nombre 
       FROM produccion p 
       JOIN productos prod ON p.producto_id = prod.id 
       JOIN jornadas j ON p.jornada_id = j.id
       WHERE p.jornada_id = $1 AND j.created_by = $2`,
      [jornadaId, userId]
    );
    return rows;
  }

  static async registrar(data, userId) {
    const { jornada_id, producto_id, cantidad, observacion } = data;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Validar jornada abierta
      const { rows: jornadaRows } = await client.query(
        "SELECT id FROM jornadas WHERE id = $1 AND estado = 'abierta' AND created_by = $2",
        [jornada_id, userId]
      );
      if (jornadaRows.length === 0) throw new Error('Jornada no válida o no está abierta');

      // 1. Insertar registro de producción
      const { rows: prodRows } = await client.query(
        'INSERT INTO produccion (jornada_id, producto_id, cantidad, observacion) VALUES ($1, $2, $3, $4) RETURNING id',
        [jornada_id, producto_id, cantidad, observacion]
      );

      // 2. Actualizar stock diario
      const { rows: stockExists } = await client.query(
        'SELECT id, stock_actual FROM stock_diario WHERE jornada_id = $1 AND producto_id = $2',
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

  static async eliminar(id, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Obtener datos y validar
      const { rows } = await client.query(
        `SELECT p.* FROM produccion p 
         JOIN jornadas j ON p.jornada_id = j.id 
         WHERE p.id = $1 AND j.estado = 'abierta' AND j.created_by = $2`, 
        [id, userId]
      );

      if (rows.length > 0) {
        const { jornada_id, producto_id, cantidad } = rows[0];
        
        const { rows: stockRows } = await client.query(
          'SELECT stock_actual FROM stock_diario WHERE jornada_id = $1 AND producto_id = $2',
          [jornada_id, producto_id]
        );

        if (stockRows.length > 0 && stockRows[0].stock_actual >= cantidad) {
          await client.query(
            'UPDATE stock_diario SET stock_actual = stock_actual - $1 WHERE jornada_id = $2 AND producto_id = $3',
            [cantidad, jornada_id, producto_id]
          );
        } else {
          throw new Error('No se puede eliminar la producción: el stock actual es menor a la cantidad producida (ya se vendió)');
        }

        await client.query('DELETE FROM produccion WHERE id = $1', [id]);
      } else {
         throw new Error('Producción no encontrada o jornada cerrada');
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
