const fs = require('fs');
const pool = require('./src/config/database');
async function run() {
  try {
    const result = await pool.query('SELECT id, client_name, versement, delivery_fee, discount FROM orders ORDER BY id DESC LIMIT 5');
    fs.writeFileSync('output.json', JSON.stringify(result.rows, null, 2));
    process.exit();
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
