require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('./src/config/database');

async function run() {
  const adminDoc = await pool.query("SELECT id FROM users WHERE email = 'admin@aurea.dz'");
  if (!adminDoc.rows.length) throw new Error("Admin not found");
  const token = jwt.sign({ userId: adminDoc.rows[0].id, role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

  try {
    const r = await axios.get('http://localhost:5000/api/yalidine/communes/18', {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('✅ Communes working. Count:', r.data.length, '| Sample:', r.data[0]?.name);
  } catch (e) {
    console.error('❌ FAILED:', e.response?.status, e.response?.data || e.message);
  }
  process.exit(0);
}
run();
