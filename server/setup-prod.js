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
      console.log('✅ Base de datos ya cuenta con las tablas.');
      
      // Ejecutar migraciones en caso de que falten columnas
      console.log('⚡ Verificando y aplicando migraciones...');
      try {
        const { execSync } = require('child_process');
        execSync('node run-migration.js', { cwd: __dirname, stdio: 'inherit' });
        execSync('node fix_schema.js', { cwd: __dirname, stdio: 'inherit' });
      } catch(e) {
        console.log('⚠️ Error menor al aplicar migraciones (pueden ya estar aplicadas):', e.message);
      }

      // Verificar si existe el usuario Demo
      const checkDemoQuery = `SELECT EXISTS (SELECT FROM usuarios WHERE email = $1);`;
      const demoRes = await client.query(checkDemoQuery, [process.env.DEMO_EMAIL || 'demo@dulcecontrol']);
      
      if (!demoRes.rows[0].exists) {
        console.log('🌱 Usuario demo no encontrado, inyectando datos iniciales...');
        const { execSync } = require('child_process');
        execSync('node seed.js', { cwd: __dirname, stdio: 'inherit' });
      } else {
        console.log('✅ Datos iniciales ya inyectados previamente. Continuando...');
      }

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

    // 3. Ejecutar migraciones adicionales y el seed
    console.log('⚡ Aplicando migraciones adicionales...');
    const { execSync } = require('child_process');
    try {
      execSync('node run-migration.js', { cwd: __dirname, stdio: 'inherit' });
      execSync('node fix_schema.js', { cwd: __dirname, stdio: 'inherit' });
    } catch(e) {
      console.log('⚠️ Error en migraciones:', e.message);
    }

    console.log('🌱 Creando usuario administrador inicial e inyectando datos...');
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
