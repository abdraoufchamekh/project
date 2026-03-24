require('dotenv').config();
const pool = require('./src/config/database');

async function checkDatabase() {
  try {
    const ordersRes = await pool.query('SELECT * FROM orders');
    console.log('--- DATABASE ROWS ---');
    console.log('TOTAL ORDERS ROWS:', ordersRes.rows.length);
    if (ordersRes.rows.length > 0) {
      console.log('RAW ROW 0:', JSON.stringify(ordersRes.rows[0], null, 2));
    }
  } catch (error) {
    console.error('DB ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
