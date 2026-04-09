require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('./src/config/database');

async function run() {
  const adminDoc = await pool.query("SELECT id FROM users WHERE email = 'admin@aurea.dz'");
  if (!adminDoc.rows.length) throw new Error("Admin not found");
  const token = jwt.sign({ userId: adminDoc.rows[0].id, role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '1h' });

  try {
    const r = await axios.post('http://localhost:5000/api/orders', {
      firstName: 'Test',
      lastName: 'Domicile',
      phone: '0555000001',
      wilaya: 'Jijel',
      wilaya_id: 18,
      commune: 'Sidi Maarouf',
      commune_id: 1810,
      deliveryType: 'domicile',
      address: 'Test address',
      products: [{ type: 'Produit test', quantity: 1, unitPrice: 5000, article_type: 'manuel' }],
      deliveryFee: 500
    }, {
      headers: { Authorization: 'Bearer ' + token }
    });
    console.log('✅ Order created:', JSON.stringify(r.data, null, 2));
  } catch (e) {
    console.error('❌ Order failed:', e.response?.status, JSON.stringify(e.response?.data, null, 2));
  }
  process.exit(0);
}
run();
