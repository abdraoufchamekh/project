const axios = require('axios');
const fs = require('fs');
const API_URL = 'http://localhost:5000/api';

async function checkInvoice() {
  try {
    const res = await axios.get(`${API_URL}/orders/19/invoice`, { responseType: 'arraybuffer' });
    fs.writeFileSync('test_invoice.pdf', res.data);
    console.log("PDF saved successfully to test_invoice.pdf", res.data.length, "bytes");
  } catch(e) { 
    if(e.response) console.error("Error from API:", e.response.status, e.response.statusText, e.response.data.toString());
    else console.error(e.message);
  }
}
checkInvoice();
