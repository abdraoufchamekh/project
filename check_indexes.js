const pool = require('./backend/src/config/database');

async function checkIndexes() {
  try {
    const res = await pool.query(`
      SELECT tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename IN ('orders', 'products', 'photos', 'users');
    `);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
checkIndexes();
