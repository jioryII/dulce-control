const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth.middleware');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

router.post('/backup', auth, async (req, res) => {
  try {
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    // We will save to a public or temp directory. Let's use a backups folder.
    const backupDir = path.join(__dirname, '../../../backups');
    
    if (!fs.existsSync(backupDir)){
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const filepath = path.join(backupDir, filename);

    // Usa las variables de entorno para pg_dump
    const { DB_USER, DB_PASS, DB_HOST, DB_NAME, DB_PORT } = process.env;
    // Configurar contraseña de postgres en la variable de entorno PGPASSWORD para pg_dump
    const env = { ...process.env, PGPASSWORD: DB_PASS };

    // pg_dump command (assuming pg_dump is in system PATH)
    const command = `pg_dump -U ${DB_USER} -h ${DB_HOST} -p ${DB_PORT || 5432} -d ${DB_NAME} -F p -f "${filepath}"`;

    exec(command, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error during backup:', error);
        return res.status(500).json({ message: 'Error generando el respaldo. ¿Está pg_dump en el PATH?' });
      }

      const stats = fs.statSync(filepath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      res.json({ 
        message: 'Respaldo generado correctamente',
        filename,
        size: `${sizeInMB} MB`,
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ruta para descargar el archivo de backup
router.get('/backup/download/:filename', auth, (req, res) => {
   if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
   }
   const filename = req.params.filename;
   const filepath = path.join(__dirname, '../../../backups', filename);
   
   if (fs.existsSync(filepath)) {
       res.download(filepath);
   } else {
       res.status(404).json({ message: 'Archivo no encontrado' });
   }
});

module.exports = router;
