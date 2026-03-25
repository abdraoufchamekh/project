const pool = require('./src/config/database');
const fs = require('fs');

async function checkIndexes() {
  const query = `
    SELECT
        tablename,
        indexname,
        indexdef
    FROM
        pg_indexes
    WHERE
        schemaname = 'public' AND
        tablename IN ('orders', 'products', 'photos')
    ORDER BY
        tablename,
        indexname;
  `;
  try {
    const res = await pool.query(query);
    fs.writeFileSync('temp_indexes.json', JSON.stringify(res.rows, null, 2), 'utf8');
    console.log('Saved to temp_indexes.json');
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

checkIndexes();
