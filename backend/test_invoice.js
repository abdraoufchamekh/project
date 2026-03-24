const invoiceController = require('./src/controllers/invoiceController');

const req = { params: { id: 6 } };
const res = {
  setHeader: (key, val) => console.log('SetHeader:', key, val),
  send: (buffer) => {
    require('fs').writeFileSync('test_invoice.pdf', buffer);
    console.log('Saved test_invoice.pdf');
  },
  status: (code) => {
    console.log('Status:', code);
    return {
      json: (data) => console.log('JSON:', data),
      send: (data) => console.log('Send:', data)
    };
  }
};

invoiceController.generateInvoice(req, res).then(() => {
    console.log('Done');
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
