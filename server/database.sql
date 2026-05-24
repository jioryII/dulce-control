-- BASE DE DATOS PARA DULCE CONTROL (POSTGRESQL)

-- Tablas Maestras
-- Productos base (catálogo)
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    categoria VARCHAR(50), -- Tortas, Panes, Donas, etc.
    precio DECIMAL(10,2) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios del sistema
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hash
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin','produccion','caja','reparto')),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clientes (fijos y frecuentes)
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    tipo VARCHAR(20) DEFAULT 'variable' CHECK (tipo IN ('fijo','variable')),
    observacion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehículos/Carros de reparto
CREATE TABLE vehiculos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL, -- "Carro 1", "Camioneta"
    placa VARCHAR(20),
    responsable VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE
);

-- Tablas de Operación Diaria
-- Jornada diaria (agrupa todas las operaciones del día)
CREATE TABLE jornadas (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta','cerrada')),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Producción del día
CREATE TABLE produccion (
    id SERIAL PRIMARY KEY,
    jornada_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    observacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Stock del día
CREATE TABLE stock_diario (
    id SERIAL PRIMARY KEY,
    jornada_id INT NOT NULL,
    producto_id INT NOT NULL,
    stock_inicial INT NOT NULL DEFAULT 0, -- Al inicio del día
    stock_actual INT NOT NULL DEFAULT 0, -- Se descuenta con ventas
    UNIQUE (jornada_id, producto_id),
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Contingencias / Mermas
CREATE TABLE contingencias (
    id SERIAL PRIMARY KEY,
    jornada_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('danado','malogrado','caida','devolucion','otro')),
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tablas de Ventas
-- Ventas normales (directo al cliente)
CREATE TABLE ventas (
    id SERIAL PRIMARY KEY,
    jornada_id INT NOT NULL,
    cliente_id INT, -- NULL = cliente general
    subtotal DECIMAL(10,2) NOT NULL,
    descuento DECIMAL(10,2) DEFAULT 0,
    descuento_motivo VARCHAR(200),
    total DECIMAL(10,2) NOT NULL,
    observacion TEXT,
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('completada','anulada')),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Detalle de cada venta
CREATE TABLE ventas_detalle (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unit DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Devoluciones de ventas
CREATE TABLE devoluciones (
    id SERIAL PRIMARY KEY,
    venta_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    devuelve_stock BOOLEAN DEFAULT FALSE,
    motivo TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id)
);

-- Tablas de Vehículos
-- Envío de productos al vehículo (mañana)
CREATE TABLE vehiculo_envios (
    id SERIAL PRIMARY KEY,
    jornada_id INT NOT NULL,
    vehiculo_id INT NOT NULL,
    hora_salida TIME,
    observacion TEXT,
    estado VARCHAR(20) DEFAULT 'enviado' CHECK (estado IN ('enviado','liquidado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
    FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);

-- Detalle de productos enviados al vehículo
CREATE TABLE vehiculo_envios_detalle (
    id SERIAL PRIMARY KEY,
    envio_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad_enviada INT NOT NULL,
    FOREIGN KEY (envio_id) REFERENCES vehiculo_envios(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Liquidación del vehículo al final del día
CREATE TABLE vehiculo_liquidaciones (
    id SERIAL PRIMARY KEY,
    envio_id INT NOT NULL UNIQUE,
    hora_llegada TIME,
    total_vendido DECIMAL(10,2) NOT NULL,
    observacion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (envio_id) REFERENCES vehiculo_envios(id)
);

-- Detalle de lo que sobró / se vendió por producto
CREATE TABLE vehiculo_liquidaciones_detalle (
    id SERIAL PRIMARY KEY,
    liquidacion_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad_enviada INT NOT NULL,
    cantidad_restante INT NOT NULL,
    cantidad_vendida INT GENERATED ALWAYS AS (cantidad_enviada - cantidad_restante) STORED,
    precio_unit DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS ((cantidad_enviada - cantidad_restante) * precio_unit) STORED,
    FOREIGN KEY (liquidacion_id) REFERENCES vehiculo_liquidaciones(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Cuadre de Caja
CREATE TABLE cuadre_caja (
    id SERIAL PRIMARY KEY,
    jornada_id INT NOT NULL UNIQUE,
    total_ventas_normales DECIMAL(10,2) DEFAULT 0,
    total_ventas_vehiculos DECIMAL(10,2) DEFAULT 0,
    total_descuentos DECIMAL(10,2) DEFAULT 0,
    total_devoluciones DECIMAL(10,2) DEFAULT 0,
    total_esperado DECIMAL(10,2) DEFAULT 0, -- calculado
    total_fisico DECIMAL(10,2), -- ingresado manualmente
    diferencia DECIMAL(10,2), -- fisico - esperado
    observacion TEXT,
    cerrado_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (jornada_id) REFERENCES jornadas(id),
    FOREIGN KEY (cerrado_por) REFERENCES usuarios(id)
);
