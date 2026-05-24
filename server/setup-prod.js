const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Script para inicializar la base de datos automáticamente al iniciar el servidor
async function setupProd() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  };

  // Solo actuar si hay credenciales configuradas
  if (!config.host) {
    console.log('⚠️ No hay DB_HOST configurado. Saltando setup de base de datos.');
    return;
  }

  if (config.host.includes('.com')) {
    config.ssl = { rejectUnauthorized: false };
  }

  const client = new Client(config);

  try {
    await client.connect();
    
    // 1. Verificar si las tablas ya existen (comprobando la tabla 'usuarios')
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      );
    `;
    const res = await client.query(checkTableQuery);
    const tablesExist = res.rows[0].exists;

    if (tablesExist) {
      console.log('✅ Base de datos ya cuenta con las tablas. Continuando...');
      await client.end();
      return;
    }

    // 2. Si no existen, ejecutar el esquema
    console.log('⚡ Base de datos vacía. Iniciando creación de tablas...');
    const sqlPath = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Tablas creadas con éxito.');

    await client.end();

    // 3. Ejecutar el seed para crear el admin (sólo la primera vez)
    console.log('🌱 Creando usuario administrador inicial...');
    const { execSync } = require('child_process');
    // Forzamos el directorio de trabajo para que el seed encuentre sus módulos
    execSync('node seed.js', { 
      cwd: __dirname,
      stdio: 'inherit' 
    });
    
    console.log('✨ Configuración de base de datos finalizada.');
  } catch (err) {
    console.error('❌ Error en el setup automático de base de datos:', err.message);
    // No salimos con error para permitir que el servidor intente iniciar de todos modos
    // si la base de datos falla por otros motivos temporales.
  }
}

setupProd();
