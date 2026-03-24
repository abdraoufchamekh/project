const pool = require('./backend/src/config/database');

async function testFetch() {
  try {
    const orders = await pool.query('SELECT * FROM orders ORDER BY id DESC LIMIT 1');
    if (orders.rows.length === 0) return console.log('No orders');
    
    const order = orders.rows[0];
    console.log("Order:", order);

    const prods = await pool.query('SELECT * FROM products WHERE order_id = $1', [order.id]);
    console.log("Products:", prods.rows);
  } catch(e) { console.error(e) }
  finally { pool.end(); }
}
testFetch();
