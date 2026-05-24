const { Client } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function initDB() {
  const dbName = process.env.DB_NAME || 'pasteleria_db';
  
  // 1. Conectar a la base de datos 'postgres' para crear la base de datos del proyecto
  const adminClient = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: 'postgres'
  });

  try {
    await adminClient.connect();
    
    // Verificar si la base de datos existe
    const res = await adminClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    
    if (res.rowCount === 0) {
      // En PostgreSQL no se puede usar CREATE DATABASE en una transacción o con parámetros normales fácilmente en algunas versiones
      // pero aquí estamos fuera de transacción.
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de datos '${dbName}' creada.`);
    } else {
      console.log(`✅ Base de datos '${dbName}' ya existe.`);
    }
  } catch (error) {
    console.error('❌ Error verificando/creando base de datos:', error.message);
    process.exit(1);
  } finally {
    await adminClient.end();
  }

  // 2. Conectar a la nueva base de datos para crear el esquema
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: dbName
  });

  try {
    await client.connect();
    
    const sqlFile = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    
    // PostgreSQL permite ejecutar múltiples sentencias en un solo query si se pasa el string completo
    // a diferencia de mysql2 que a veces requiere configuración.
    await client.query(sqlFile);
    
    console.log('✅ Esquema de base de datos importado exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importando esquema:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

initDB();
