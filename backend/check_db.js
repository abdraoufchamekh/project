require('dotenv').config();
const pool = require('./src/config/database');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' ORDER BY ordinal_position")
  .then(r => { r.rows.forEach(row => console.log('-', row.column_name)); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
