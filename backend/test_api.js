const axios = require('axios');

async function test() {
  try {
    const { data } = await axios.get('http://localhost:5000/api/orders');
    console.log('API RESPONSE KEYS:', Object.keys(data));
    console.log('TOTAL ORDERS:', data.totalOrders);
    console.log('ORDERS LENGTH:', data.orders.length);
    if (data.orders.length > 0) {
      console.log('FIRST ORDER:', JSON.stringify(data.orders[0], null, 2));
    }
  } catch (error) {
    console.error('API ERROR:', error.response ? error.response.data : error.message);
  }
}

test();
