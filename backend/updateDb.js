require('dotenv').config();
const pool = require('./src/config/database');
async function run() {
  try {
    const delRes = await pool.query("DELETE FROM orders WHERE delivery_type = 'sur_place' OR wilaya = 'Atelier' OR status = '_HIDDEN_ATELIER_'");
    console.log('Deleted orders:', delRes.rowCount);
    await pool.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'admin'");
    console.log('Added source column.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
