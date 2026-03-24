const pool = require('./backend/src/config/database');

async function checkColumns() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders';
    `);
    console.log("Columns:", res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
checkColumns();
