const pool = require('./src/config/database');

async function migrate() {
  try {
    console.log('Running VERSEMENT migration...');
    await pool.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS versement DECIMAL(10,2) DEFAULT 0;');
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}
migrate();
