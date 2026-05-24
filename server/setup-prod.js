const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Script para inicializar la base de datos en producción (Render)
async function setupProd() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  };

  if (config.host && config.host.includes('.com')) {
    config.ssl = { rejectUnauthorized: false };
  }

  const client = new Client(config);

  try {
    console.log(`📡 Conectando a ${config.host}...`);
    await client.connect();
    console.log('✅ Conexión exitosa.');

    const sqlPath = path.join(__dirname, 'database.sql');
    console.log(`📄 Leyendo esquema desde ${sqlPath}...`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('⚡ Ejecutando scripts SQL de creación de tablas...');
    await client.query(sql);
    console.log('✅ Tablas creadas exitosamente.');

    await client.end();

    // Ahora ejecutar el seed para crear el admin
    console.log('🌱 Ejecutando seed de datos iniciales...');
    // Usamos spawn para ejecutar seed.js de forma independiente o simplemente requerirlo si es modular
    // Como seed.js tiene process.exit(0), mejor lo ejecutamos como comando.
    const { execSync } = require('child_process');
    execSync('node seed.js', { stdio: 'inherit' });
    
    console.log('\n✨ Configuración de producción completada.');
  } catch (err) {
    console.error('❌ Error configurando la base de datos:', err.message);
    process.exit(1);
  }
}

setupProd();
