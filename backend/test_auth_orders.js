require('dotenv').config();
const jwt = require('jsonwebtoken');

async function testAuthOrders() {
  try {
    const token = jwt.sign(
      { id: 1, email: 'admin@aurea.com', role: 'admin' }, 
      'your_super_secret_jwt_key_minimum_32_characters_long', 
      { expiresIn: '1h' }
    );
    
    const response = await fetch('http://localhost:5000/api/orders?excludeStatus=Livr%C3%A9,Retourn%C3%A9', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await response.json();
    console.log('HTTP STATUS:', response.status);
    if (data.orders) {
      console.log('ORDERS RETURNED:', data.orders.length);
      if (data.orders.length > 0) {
        console.log('FIRST ORDER:', JSON.stringify(data.orders[0], null, 2));
      }
    } else {
      console.log('UNEXPECTED DATA:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('SCRIPT ERROR:', error.message);
  }
}
testAuthOrders();
