require('dotenv').config();
const Order = require('./src/models/Order');

async function test() {
  try {
    const limit = 50;
    const offset = 0;
    const filters = { excludeStatus: 'Livré,Retourné' };
    
    const count = await Order.countAll({});
    const countFiltered = await Order.countAll(filters);
    
    console.log('Total orders in DB:', count);
    console.log('Total active orders:', countFiltered);

    const orders = await Order.getAll(filters, limit, offset);
    console.log('Orders returned by getAll:', orders.length);
    
    const stats = await Order.getStats();
    console.log('Stats:', JSON.stringify(stats, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}
test();
