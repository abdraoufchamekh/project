const pool = require('./src/config/database');
async function run() {
  try {
    const result = await pool.query('SELECT id, client_name, versement FROM orders ORDER BY id DESC LIMIT 5');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit();
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
