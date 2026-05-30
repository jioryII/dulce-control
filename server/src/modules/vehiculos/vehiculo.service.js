const pool = require('../../config/db');

class VehiculoService {
  static async getAll(userId) {
    const { rows } = await pool.query('SELECT * FROM vehiculos WHERE activo = TRUE AND creado_por = $1 ORDER BY nombre ASC', [userId]);
    return rows;
  }

  static async create(data, userId) {
    const { nombre, placa, responsable } = data;
    const { rows } = await pool.query(
      'INSERT INTO vehiculos (nombre, placa, responsable, creado_por) VALUES ($1, $2, $3, $4) RETURNING id',
      [nombre, placa, responsable, userId]
    );
    return rows[0].id;
  }

  static async update(id, data, userId) {
    const { nombre, placa, responsable } = data;
    await pool.query(
      'UPDATE vehiculos SET nombre = $1, placa = $2, responsable = $3 WHERE id = $4 AND creado_por = $5',
      [nombre, placa, responsable, id, userId]
    );
  }

  static async delete(id, userId) {
    await pool.query('UPDATE vehiculos SET activo = FALSE WHERE id = $1 AND creado_por = $2', [id, userId]);
  }

  static async getHistorial(vehiculoId, userId) {
    const { rows } = await pool.query(
      `SELECT e.*, l.hora_llegada, l.total_vendido, j.fecha 
       FROM vehiculo_envios e 
       LEFT JOIN vehiculo_liquidaciones l ON e.id = l.envio_id 
       JOIN jornadas j ON e.jornada_id = j.id 
       JOIN vehiculos v ON e.vehiculo_id = v.id
       WHERE e.vehiculo_id = $1 AND v.creado_por = $2
       ORDER BY j.fecha DESC, e.hora_salida DESC`,
      [vehiculoId, userId]
    );
    return rows;
  }

  static async registrarEnvio(data, userId) {
    const { jornada_id, vehiculo_id, hora_salida, observacion, productos } = data;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validar jornada
      const { rows: jornadaRows } = await client.query(
        "SELECT id FROM jornadas WHERE id = $1 AND estado = 'abierta' AND created_by = $2",
        [jornada_id, userId]
      );
      if (jornadaRows.length === 0) throw new Error('Jornada no válida o no está abierta');

      const { rows } = await client.query(
        "INSERT INTO vehiculo_envios (jornada_id, vehiculo_id, hora_salida, observacion, estado) VALUES ($1, $2, $3, $4, 'enviado') RETURNING id",
        [jornada_id, vehiculo_id, hora_salida, observacion]
      );
      
      const envioId = rows[0].id;
      
      if (productos && productos.length > 0) {
        for (const prod of productos) {
          await client.query(
            'INSERT INTO vehiculo_envios_detalle (envio_id, producto_id, cantidad_enviada) VALUES ($1, $2, $3)',
            [envioId, prod.producto_id, prod.cantidad]
          );

          // Descontar stock y validar
          const { rows: stockRows } = await client.query(
            'SELECT stock_actual FROM stock_diario WHERE jornada_id = $1 AND producto_id = $2',
            [jornada_id, prod.producto_id]
          );

          if (stockRows.length === 0 || stockRows[0].stock_actual < prod.cantidad) {
            throw new Error(`Stock insuficiente para el producto ID ${prod.producto_id}`);
          }

          await client.query(
            'UPDATE stock_diario SET stock_actual = stock_actual - $1 WHERE jornada_id = $2 AND producto_id = $3',
            [prod.cantidad, jornada_id, prod.producto_id]
          );
        }
      }
      
      await client.query('COMMIT');
      return envioId;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async liquidarEnvio(data, userId) {
    const { envio_id, hora_llegada, total_vendido, observacion, productos } = data;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Validar envio
      const { rows: envioRows } = await client.query(
        `SELECT e.jornada_id 
         FROM vehiculo_envios e 
         JOIN jornadas j ON e.jornada_id = j.id
         WHERE e.id = $1 AND e.estado = 'enviado' AND j.created_by = $2`,
        [envio_id, userId]
      );
      if (envioRows.length === 0) throw new Error('Envío no válido o ya liquidado');
      const jornada_id = envioRows[0].jornada_id;

      const { rows: liqRows } = await client.query(
        'INSERT INTO vehiculo_liquidaciones (envio_id, hora_llegada, total_vendido, observacion) VALUES ($1, $2, $3, $4) RETURNING id',
        [envio_id, hora_llegada, total_vendido, observacion]
      );
      const liquidacionId = liqRows[0].id;
      
      await client.query(
        "UPDATE vehiculo_envios SET estado = 'liquidado' WHERE id = $1",
        [envio_id]
      );

      // Guardar detalle y devolver stock
      if (productos && productos.length > 0) {
        for (const prod of productos) {
          await client.query(
            'INSERT INTO vehiculo_liquidaciones_detalle (liquidacion_id, producto_id, cantidad_enviada, cantidad_restante, precio_unit) VALUES ($1, $2, $3, $4, $5)',
            [liquidacionId, prod.producto_id, prod.cantidad_enviada, prod.cantidad_restante, prod.precio_unit || 0]
          );

          // Devolver sobrante al stock
          if (prod.cantidad_restante > 0) {
            await client.query(
              'UPDATE stock_diario SET stock_actual = stock_actual + $1 WHERE jornada_id = $2 AND producto_id = $3',
              [prod.cantidad_restante, jornada_id, prod.producto_id]
            );
          }
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getEnviosActivos(jornadaId, userId) {
    const { rows } = await pool.query(
      `SELECT e.*, v.nombre as vehiculo_nombre, v.placa 
       FROM vehiculo_envios e 
       JOIN vehiculos v ON e.vehiculo_id = v.id 
       JOIN jornadas j ON e.jornada_id = j.id
       WHERE e.jornada_id = $1 AND e.estado = 'enviado' AND j.created_by = $2`,
      [jornadaId, userId]
    );
    // Necesitamos incluir los detalles del envío (productos) para la liquidación
    for (let envio of rows) {
      const { rows: detalles } = await pool.query(
        `SELECT d.*, p.nombre as producto_nombre, p.precio as precio_unit
         FROM vehiculo_envios_detalle d
         JOIN productos p ON d.producto_id = p.id
         WHERE d.envio_id = $1`,
        [envio.id]
      );
      envio.productos = detalles;
    }
    return rows;
  }
}

module.exports = VehiculoService;
