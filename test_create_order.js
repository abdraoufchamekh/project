const axios = require('axios');
const API_URL = 'http://localhost:5000/api';

async function testOrder() {
  const newOrder = {
    firstName: "Test",
    lastName: "User",
    phone: "0123456789",
    wilaya: "Alger",
    commune: "Alger Centre",
    address: "123 Rue de Test",
    deliveryType: "domicile",
    isFreeDelivery: false,
    deliveryFee: 600,
    delivery_fee: 600,
    discount: 100,
    products: [{
      type: "Mug Personnalisé",
      quantity: 2,
      unitPrice: 500
    }]
  };

  try {
    const res = await axios.post(`${API_URL}/orders`, newOrder);
    console.log("Created order:", res.data.order);
    
    // fetch detail
    const detail = await axios.get(`${API_URL}/orders/${res.data.order.id}`);
    console.log("Fetched order details:", detail.data.order.delivery_fee, detail.data.order.discount);
  } catch (e) {
    if (e.response) console.error(e.response.data);
    else console.error(e.message);
  }
}
testOrder();
