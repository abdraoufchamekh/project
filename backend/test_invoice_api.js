const http = require('http');

const jwt = require('jsonwebtoken');
const token = jwt.sign({ userId: 1, role: 'admin' }, 'your_super_secret_jwt_key_minimum_32_characters_long', { expiresIn: '1h' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/orders/6/invoice',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  const chunks = [];
  res.on('data', chunk => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    console.log('BODY LENGTH:', buffer.length);
    console.log('BODY HEAD (HEX):', buffer.slice(0, 10).toString('hex'));
    console.log('BODY HEAD (ASCII):', buffer.slice(0, 10).toString('ascii'));
    if (res.statusCode >= 400) {
        console.log('ERROR BODY:', buffer.toString());
    }
  });
});

req.on('error', e => console.error(e));
req.end();
