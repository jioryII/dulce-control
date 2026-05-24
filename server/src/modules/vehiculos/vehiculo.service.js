const pool = require('../../config/db');

class VehiculoService {
  static async getAll() {
    const { rows } = await pool.query('SELECT * FROM vehiculos WHERE activo = TRUE ORDER BY nombre ASC');
    return rows;
  }

  static async create(data) {
    const { nombre, placa, responsable } = data;
    const { rows } = await pool.query(
      'INSERT INTO vehiculos (nombre, placa, responsable) VALUES ($1, $2, $3) RETURNING id',
      [nombre, placa, responsable]
    );
    return rows[0].id;
  }

  static async update(id, data) {
    const { nombre, placa, responsable } = data;
    await pool.query(
      'UPDATE vehiculos SET nombre = $1, placa = $2, responsable = $3 WHERE id = $4',
      [nombre, placa, responsable, id]
    );
  }

  static async delete(id) {
    await pool.query('UPDATE vehiculos SET activo = FALSE WHERE id = $1', [id]);
  }

  static async getHistorial(vehiculoId) {
    const { rows } = await pool.query(
      `SELECT e.*, l.hora_llegada, l.total_vendido, j.fecha 
       FROM vehiculo_envios e 
       LEFT JOIN vehiculo_liquidaciones l ON e.id = l.envio_id 
       JOIN jornadas j ON e.jornada_id = j.id 
       WHERE e.vehiculo_id = $1 
       ORDER BY j.fecha DESC, e.hora_salida DESC`,
      [vehiculoId]
    );
    return rows;
  }

  static async registrarEnvio(data) {
    const { jornada_id, vehiculo_id, hora_salida, observacion } = data;
    const { rows } = await pool.query(
      "INSERT INTO vehiculo_envios (jornada_id, vehiculo_id, hora_salida, observacion, estado) VALUES ($1, $2, $3, $4, 'enviado') RETURNING id",
      [jornada_id, vehiculo_id, hora_salida, observacion]
    );
    return rows[0].id;
  }

  static async liquidarEnvio(data) {
    const { envio_id, hora_llegada, total_vendido } = data;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query(
        'INSERT INTO vehiculo_liquidaciones (envio_id, hora_llegada, total_vendido) VALUES ($1, $2, $3)',
        [envio_id, hora_llegada, total_vendido]
      );
      
      await client.query(
        "UPDATE vehiculo_envios SET estado = 'liquidado' WHERE id = $1",
        [envio_id]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getEnviosActivos(jornadaId) {
    const { rows } = await pool.query(
      `SELECT e.*, v.nombre as vehiculo_nombre, v.placa 
       FROM vehiculo_envios e 
       JOIN vehiculos v ON e.vehiculo_id = v.id 
       WHERE e.jornada_id = $1 AND e.estado = 'enviado'`,
      [jornadaId]
    );
    return rows;
  }
}

module.exports = VehiculoService;
