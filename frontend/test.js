const axios = require('axios');
async function test() {
  try {
    // 1. Get auth token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'atelier@aurea.dz',
      password: 'password' // We will try this
    });
    const token = loginRes.data.token;
    console.log('Got token');

    // 2. Post order
    const newOrder = {
      id: Date.now(),
      firstName: 'Test',
      lastName: 'Atelier',
      clientName: 'Test Atelier',
      phone: '12345678', 
      phone2: null,
      wilaya: 'Atelier',
      commune: 'Atelier',
      address: 'Sur place',
      deliveryType: 'sur_place',
      isFreeDelivery: true,
      hasExchange: false,
      hasInsurance: false,
      declaredValue: null,
      status: 'Nouvelle commande',
      deliveryFee: 0,
      discount: 0,
      products: [{
        type: 'Test Product',
        quantity: 1,
        unitPrice: 0,
        status: 'En attente',
        inventoryItemId: ''
      }]
    };

    const res = await axios.post('http://localhost:5000/api/orders', newOrder, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Order created:', res.data);
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Request failed:', err.message);
    }
  }
}
test();
