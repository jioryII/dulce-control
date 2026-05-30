-- MIGRACIÓN: Aislamiento multi-usuario + nuevas funcionalidades
-- Ejecutar en la BD existente con: psql -U <user> -d <dbname> -f migration.sql

-- 1. Agregar creado_por a clientes (aislamiento por usuario)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS creado_por INT REFERENCES usuarios(id);

-- 2. Agregar creado_por a vehiculos (aislamiento por usuario)
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS creado_por INT REFERENCES usuarios(id);
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. Agregar creado_por a productos (aislamiento por usuario)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS creado_por INT REFERENCES usuarios(id);

-- 4. Agregar closed_at a jornadas
ALTER TABLE jornadas ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- 5. Actualizar jornada.cerrar para guardar timestamp
-- (esto lo maneja el service, no SQL)

-- 6. Índices críticos para rendimiento
CREATE INDEX IF NOT EXISTS idx_jornadas_fecha ON jornadas(fecha);
CREATE INDEX IF NOT EXISTS idx_jornadas_created_by ON jornadas(created_by);
CREATE INDEX IF NOT EXISTS idx_produccion_jornada ON produccion(jornada_id);
CREATE INDEX IF NOT EXISTS idx_stock_diario_jornada ON stock_diario(jornada_id);
CREATE INDEX IF NOT EXISTS idx_ventas_jornada ON ventas(jornada_id);
CREATE INDEX IF NOT EXISTS idx_ventas_created_at ON ventas(created_at);
CREATE INDEX IF NOT EXISTS idx_vehiculo_envios_jornada ON vehiculo_envios(jornada_id);
CREATE INDEX IF NOT EXISTS idx_clientes_creado_por ON clientes(creado_por);
CREATE INDEX IF NOT EXISTS idx_vehiculos_creado_por ON vehiculos(creado_por);
CREATE INDEX IF NOT EXISTS idx_productos_creado_por ON productos(creado_por);

-- 7. Para usuarios existentes sin creado_por: asignar al primer admin
-- (Esto se hace manualmente o via script)
