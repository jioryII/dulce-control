const { execSync } = require('child_process');

// Archivo de entrada por defecto para Render
// Antes de iniciar el servidor, aseguramos que la base de datos esté configurada
try {
  console.log('⚡ Verificando estado de la base de datos antes de iniciar...');
  execSync('node server/setup-prod.js', { stdio: 'inherit' });
} catch (err) {
  console.error('❌ Error en el setup de BD previo al inicio:', err.message);
}

// Redirige la ejecución al servidor Express real
require('./server/src/app.js');
