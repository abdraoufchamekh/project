require('dotenv').config();
const yalidineService = require('./src/services/yalidineService');
(async () => {
  try {
    const w = await yalidineService.fetchWilayas();
    console.log(JSON.stringify(w, null, 2));
  } catch (error) {
    console.error('Crash:', error);
  }
})();
