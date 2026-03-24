const fs = require('fs');
const API_URL = 'http://localhost:5000/api';

async function checkInvoice() {
  try {
    const res = await fetch(`${API_URL}/orders/19/invoice`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync('test_invoice.pdf', Buffer.from(buffer));
    console.log("PDF saved successfully to test_invoice.pdf", buffer.byteLength, "bytes");
  } catch(e) { 
    console.error(e.message);
  }
}
checkInvoice();
