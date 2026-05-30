const pool = require('../../config/db');

class ContingenciaService {
  static async getByJornada(jornadaId, userId) {
    const { rows } = await pool.query(
      `SELECT c.*, p.nombre as producto_nombre 
       FROM contingencias c
       JOIN productos p ON c.producto_id = p.id
       JOIN jornadas j ON c.jornada_id = j.id
       WHERE c.jornada_id = $1 AND j.created_by = $2
       ORDER BY c.created_at DESC`,
      [jornadaId, userId]
    );
    return rows;
  }

  static async registrar(data, userId) {
    const { jornada_id, producto_id, cantidad, motivo, observacion } = data;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Validar jornada
      const { rows: jornadaRows } = await client.query(
        "SELECT id FROM jornadas WHERE id = $1 AND estado = 'abierta' AND created_by = $2",
        [jornada_id, userId]
      );
      if (jornadaRows.length === 0) throw new Error('Jornada no válida o no está abierta');

      // Descontar stock
      const { rows: stockRows } = await client.query(
        'SELECT stock_actual FROM stock_diario WHERE jornada_id = $1 AND producto_id = $2',
        [jornada_id, producto_id]
      );

      if (stockRows.length === 0 || stockRows[0].stock_actual < cantidad) {
        throw new Error(`Stock insuficiente para contingencia del producto ID ${producto_id}`);
      }

      await client.query(
        'UPDATE stock_diario SET stock_actual = stock_actual - $1 WHERE jornada_id = $2 AND producto_id = $3',
        [cantidad, jornada_id, producto_id]
      );

      // Registrar contingencia
      const { rows } = await client.query(
        'INSERT INTO contingencias (jornada_id, producto_id, cantidad, motivo, observacion) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [jornada_id, producto_id, cantidad, motivo, observacion]
      );

      await client.query('COMMIT');
      return rows[0].id;
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

      const { rows } = await client.query(
        `SELECT c.* FROM contingencias c
         JOIN jornadas j ON c.jornada_id = j.id
         WHERE c.id = $1 AND j.estado = 'abierta' AND j.created_by = $2`,
        [id, userId]
      );

      if (rows.length > 0) {
        const contingencia = rows[0];

        // Devolver stock
        await client.query(
          'UPDATE stock_diario SET stock_actual = stock_actual + $1 WHERE jornada_id = $2 AND producto_id = $3',
          [contingencia.cantidad, contingencia.jornada_id, contingencia.producto_id]
        );

        await client.query('DELETE FROM contingencias WHERE id = $1', [id]);
      } else {
         throw new Error('Contingencia no encontrada o jornada cerrada');
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

module.exports = ContingenciaService;
