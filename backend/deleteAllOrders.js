require('dotenv').config();
const pool = require('./src/config/database');

async function run() {
  try {
    const res = await pool.query('DELETE FROM orders');
    console.log(`Deleted ${res.rowCount} orders completely.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
