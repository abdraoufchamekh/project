require('dotenv').config();
const pool = require('./src/config/database');
pool.query(`
  ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS wilaya_id INT,
  ADD COLUMN IF NOT EXISTS commune_id INT,
  ADD COLUMN IF NOT EXISTS agency_id INT,
  ADD COLUMN IF NOT EXISTS stop_desk_agency VARCHAR(255),
  ADD COLUMN IF NOT EXISTS delivery_carrier VARCHAR(20)
`)
.then(() => { console.log('✅ All columns added'); process.exit(0); })
.catch(e => { console.error(e.message); process.exit(1); });
