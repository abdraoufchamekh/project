require('dotenv').config();
const pool = require('./src/config/database');
pool.query('SELECT id, wilaya, wilaya_id, commune, commune_id, stop_desk_agency, agency_id, delivery_type, delivery_carrier, yalidine_tracking, yalidine_status FROM orders ORDER BY created_at DESC LIMIT 3')
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); process.exit(0); })
  .catch(e => { console.error(e.message); process.exit(1); });
