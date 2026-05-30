const pool = require('./src/config/db');

async function fixContingenciasSchema() {
  try {
    console.log('Fixing contingencias table schema...');
    
    // 1. Rename columns if they haven't been renamed
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='contingencias' and column_name='tipo') THEN
          ALTER TABLE contingencias RENAME COLUMN tipo TO motivo;
        END IF;
        
        IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='contingencias' and column_name='descripcion') THEN
          ALTER TABLE contingencias RENAME COLUMN descripcion TO observacion;
        END IF;
      END $$;
    `);

    // 2. Drop the CHECK constraint if it exists
    await pool.query(`
      DO $$ 
      DECLARE
        constraint_name text;
      BEGIN
        SELECT conname INTO constraint_name
        FROM pg_constraint
        WHERE conrelid = 'contingencias'::regclass
        AND contype = 'c';
        
        IF constraint_name IS NOT NULL THEN
          EXECUTE 'ALTER TABLE contingencias DROP CONSTRAINT ' || constraint_name;
        END IF;
      END $$;
    `);

    // Also increase the size of motivo just in case
    await pool.query('ALTER TABLE contingencias ALTER COLUMN motivo TYPE VARCHAR(50);');

    console.log('Schema fixed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing schema:', error);
    process.exit(1);
  }
}

fixContingenciasSchema();
