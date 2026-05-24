const { Pool } = require('pg');
const config = require('./env');

const poolConfig = {
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.pass,
  database: config.db.name,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// SSL requerido por Render, Neon, Supabase, etc.
if (process.env.NODE_ENV === 'production' || (config.db.host && config.db.host.includes('.com'))) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(poolConfig);

module.exports = pool;
