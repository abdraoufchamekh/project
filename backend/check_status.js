require('dotenv').config();
const pool = require('./src/config/database');

async function checkStatus() {
  try {
    const res = await pool.query('SELECT DISTINCT status, source FROM orders');
    console.log('--- DB STATUSES ---');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    process.exit(0);
  }
}
checkStatus();
