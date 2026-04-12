const Order = require('./src/models/Order');
Order.getSummaryPage().then(res => {
  console.log('Success:', res.length > 0 ? res[0] : 'No orders, but query succeeded');
  process.exit(0);
}).catch(err => {
  console.error('Failure:', err);
  process.exit(1);
});
