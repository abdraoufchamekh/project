const axios = require('axios');
const pool = require('../config/database');

const YALIDINE_BASE_URL = 'https://api.yalidine.app/v1';
const FALLBACK_YALIDINE_ID = '42835487942502895620';
const FALLBACK_YALIDINE_TOKEN = 'WRhmBgaljw2Myc3SqX7U5Cxsu8G6PfJAidztDnKprTELoYvH10I4NeQb9FOkVZ';
const FALLBACK_GUEPEX_ID = '37092681310163806238';
const FALLBACK_GUEPEX_TOKEN = 'SOALibowc9WhT5JHnyX2CN16vgxZrQ8sjfukzEteU7GpIKYdRq3FmlB0DMV4aP';
const FALLBACK_GUEPEX_BASE = 'https://api.guepex.app/v1';

const ACTUAL_YALIDINE_ID = (process.env.YALIDINE_API_ID || FALLBACK_YALIDINE_ID).replace(/[\r\n\s]/g, '');
const ACTUAL_YALIDINE_TOKEN = (process.env.YALIDINE_API_TOKEN || FALLBACK_YALIDINE_TOKEN).replace(/[\r\n\s]/g, '');

// In-memory cache for wilayas and communes
const cache = {};

/**
 * Helper to get or set cached data
 * @param {string} key Cache key
 * @param {function} fetchFn Function that returns a Promise yielding the data
 * @param {number} ttlMs Time to live in milliseconds (default 24 hours)
 */
async function getCached(key, fetchFn, ttlMs = 86400000) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].timestamp < ttlMs)) {
    return cache[key].data;
  }
  const data = await fetchFn();
  cache[key] = { data, timestamp: now };
  return data;
}

/**
 * Delays execution for a given number of milliseconds
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Basic wrapper to execute an axios request with automatic retry on 429 Too Many Requests
 */
async function executeWithRetry(reqConfig, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios({
        ...reqConfig,
        headers: {
          'X-API-ID': ACTUAL_YALIDINE_ID,
          'X-API-TOKEN': ACTUAL_YALIDINE_TOKEN,
          ...reqConfig.headers,
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429 && attempt < maxRetries) {
        // Log the rate limit
        console.warn(`[Yalidine API] Rate limit hit. Attempt ${attempt}/${maxRetries}. Retrying...`);
        // Check Retry-After header
        const retryAfter = error.response.headers['retry-after'];
        let waitTime = 1000; // Default 1 second
        if (retryAfter) {
          waitTime = parseInt(retryAfter, 10) * 1000;
        } else {
          // Exponential backoff if no Retry-After is supplied
          waitTime = attempt * 2000;
        }
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Fetch Wilayas from Yalidine API (Cached 24h)
 * Returns all wilayas
 */
async function fetchWilayas() {
  return getCached('yalidine_wilayas', async () => {
    try {
      const data = await executeWithRetry({
        method: 'GET',
        url: 'https://api.yalidine.app/v1/wilayas/'
      });
      return data.data || data;
    } catch (error) {
      console.error('[Yalidine API Error] fetchWilayas failed:', error.message, error.response?.status, error.response?.data);
      throw error;
    }
  });
}

/**
 * Fetch Communes from Yalidine API per Wilaya (Cached 24h)
 * Returns all communes
 */
async function fetchCommunes(wilayaId) {
  return getCached(`yalidine_communes_${wilayaId}`, async () => {
    try {
      const data = await executeWithRetry({
        method: 'GET',
        url: `https://api.yalidine.app/v1/communes/?wilaya_id=${wilayaId}`
      });
      return data.data || data;
    } catch (error) {
      console.error('[Yalidine API Error] fetchCommunes failed:', error.message, error.response?.status, error.response?.data);
      throw error;
    }
  });
}

/**
 * Fetch Stop Desk Agencies from Yalidine API per Commune
 */
const fetchAgencies = async (communeId) => {
  try {
    const data = await executeWithRetry({
      method: 'GET',
      url: `https://api.yalidine.app/v1/centers/?commune_id=${communeId}`
    });
    return data.data || data || [];
  } catch (error) {
    console.error('Error fetching agencies from Yalidine:', error.message);
    return [];
  }
};

/**
 * Format and validate phone numbers for Yalidine
 * Must start with 0 and contain 9 or 8 digits after
 */
function formatPhone(phone) {
  if (!phone) return null;
  // Remove spaces, dashes, etc
  let p = phone.replace(/[\s\-\.\(\)]/g, '');
  // If it starts with +213, replace with 0
  if (p.startsWith('+213')) p = '0' + p.substring(4);
  if (p.startsWith('00213')) p = '0' + p.substring(5);
  
  // Strict matching checking for valid format
  if (/^0\d{8,9}$/.test(p)) {
    return p;
  }
  return null;
}

/**
 * Fetches the seller/sender's wilaya from the company settings.
 * Defaults to "Alger" if not found.
 */
async function getSenderWilaya() {
  try {
    const query = `
      SELECT value 
      FROM company_settings 
      WHERE key IN ('wilaya', 'company_wilaya', 'address')
      LIMIT 1;
    `;
    const res = await pool.query(query);
    if (res.rows.length > 0) {
      // Assuming it's the exact name of a wilaya or part of an address
      return res.rows[0].value.trim();
    }
    return 'Alger'; // Fallback
  } catch (error) {
    console.error('[YalidineService] Error fetching company settings:', error);
    return 'Alger';
  }
}

/**
 * Creates a Yalidine parcel and syncs it with the database
 */
const syncOrder = async (orderId) => {
  // 1. Get order from database using real column names
  const dbResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = dbResult.rows[0];

  if (!order) throw new Error(`Order ${orderId} not found in database`);

  console.log('=== SYNCING ORDER TO YALIDINE ===');
  console.log('Order ID:', orderId);
  console.log('wilaya:', order.wilaya, '| wilaya_id:', order.wilaya_id);
  console.log('commune:', order.commune, '| commune_id:', order.commune_id);
  console.log('delivery_type:', order.delivery_type);
  console.log('delivery_fee:', order.delivery_fee);

  // 2. Calculate price from products table + delivery_fee
  let productTotal = 0;
  let productListStr = 'Articles Auréa Déco';
  try {
    const productsResult = await pool.query(
      'SELECT type, quantity, unit_price FROM products WHERE order_id = $1',
      [orderId]
    );
    if (productsResult.rows.length > 0) {
      productTotal = productsResult.rows.reduce((sum, p) => sum + (Number(p.unit_price || 0) * Number(p.quantity || 1)), 0);
      productListStr = productsResult.rows.map(p => `${p.quantity || 1} ${p.type || 'Article'}`).join(' - ');
    }
  } catch (e) {
    console.log('No products table or no products found, using delivery_fee only');
  }

  const deliveryFee = Number(order.delivery_fee || 0);
  const discount = Number(order.discount || 0);
  const finalPrice = productTotal + deliveryFee - discount;

  console.log('productTotal:', productTotal, '| deliveryFee:', deliveryFee, '| finalPrice:', finalPrice);

  // Format phone to guarantee 10 digits for Yalidine validations
  let fixedPhone = String(order.phone || '0000000000').replace(/\s/g, '').trim();
  if (fixedPhone.length < 10) {
    fixedPhone = fixedPhone.padEnd(10, '0');
  }

  // 3. Build payload with ALL required Yalidine fields
  const uniqueOrderId = `D${orderId}`;
  const payload = [{
    order_id: uniqueOrderId,
    firstname: order.first_name || 'Client',
    familyname: order.last_name || 'Anonyme',
    contact_phone: fixedPhone,
    address: order.address || order.commune || 'Adresse non spécifiée',
    from_wilaya_name: 'Bouira',
    to_wilaya_id: Number(order.wilaya_id) || 0,
    to_wilaya_name: order.wilaya || '',
    to_commune_id: Number(order.commune_id) || 0,
    to_commune_name: order.commune || '',
    product_list: productListStr,
    price: finalPrice || deliveryFee || 1000,
    do_insurance: order.has_insurance === true,
    declared_value: Number(order.declared_value || 0),
    delivery_type: order.delivery_type === 'stop_desk' ? 'Stopdesk' : 'Domicile',
    is_stopdesk: order.delivery_type === 'stop_desk',
    has_exchange: order.has_exchange === true,
    freeshipping: order.is_free_delivery === true
  }];

  if (order.delivery_type === 'stop_desk' && order.agency_id) {
    payload[0].stopdesk_id = Number(order.agency_id);
  }

  console.log('PAYLOAD SENDING TO YALIDINE:', JSON.stringify(payload, null, 2));

  // 4. Send to Yalidine using direct axios call
  const response = await axios.post('https://api.yalidine.app/v1/parcels/', payload, {
    headers: {
      'X-API-ID': ACTUAL_YALIDINE_ID,
      'X-API-TOKEN': ACTUAL_YALIDINE_TOKEN,
      'Content-Type': 'application/json'
    }
  });

  console.log('YALIDINE FULL RESPONSE:', JSON.stringify(response.data, null, 2));

  // 5. Parse response — ALWAYS use first key dynamically
  const responseKey = Object.keys(response.data)[0];
  const result = response.data[responseKey];

  console.log('RESPONSE KEY:', responseKey);
  console.log('RESULT:', JSON.stringify(result, null, 2));

  if (!result) {
    throw new Error('Empty response from Yalidine');
  }

  if (result.success === false) {
    const errMsg = result.message || result.error || 'Yalidine returned failure';
    await pool.query(
      `UPDATE orders SET yalidine_status = 'failed', yalidine_error = $1 WHERE id = $2`,
      [errMsg, orderId]
    );
    throw new Error(errMsg);
  }

  // 6. Save tracking to database
  await pool.query(
    `UPDATE orders SET
      yalidine_tracking = $1,
      yalidine_label_url = $2,
      yalidine_status = 'success',
      yalidine_error = NULL,
      yalidine_synced_at = NOW(),
      delivery_carrier = 'yalidine'
     WHERE id = $3`,
    [result.tracking, result.label || result.bordereau_url || null, orderId]
  );

  console.log('✅ Yalidine sync SUCCESS! Tracking:', result.tracking);
  return { tracking: result.tracking, label_url: result.label || result.bordereau_url, carrier: 'yalidine' };
};

const syncOrderGuepex = async (orderId) => {
  const dbResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = dbResult.rows[0];
  if (!order) throw new Error(`Order ${orderId} not found`);

  console.log('=== SYNCING ORDER TO GUEPEX ===');
  console.log('Order ID:', orderId);
  console.log('wilaya:', order.wilaya, '| wilaya_id:', order.wilaya_id);
  console.log('commune:', order.commune, '| commune_id:', order.commune_id);

  // Calculate price same way as Yalidine
  let productTotal = 0;
  let productListStr = 'Articles Auréa Déco';
  try {
    const productsResult = await pool.query(
      'SELECT type, quantity, unit_price FROM products WHERE order_id = $1',
      [orderId]
    );
    if (productsResult.rows.length > 0) {
      productTotal = productsResult.rows.reduce((sum, p) => sum + (Number(p.unit_price || 0) * Number(p.quantity || 1)), 0);
      productListStr = productsResult.rows.map(p => `${p.quantity || 1} ${p.type || 'Article'}`).join(' - ');
    }
  } catch (e) {
    console.log('No products found, using delivery_fee only');
  }

  const deliveryFee = Number(order.delivery_fee || 0);
  const discount = Number(order.discount || 0);
  const finalPrice = productTotal + deliveryFee - discount;

  let fixedPhone = String(order.phone || '0000000000').replace(/\s/g, '').trim();
  if (fixedPhone.length < 10) fixedPhone = fixedPhone.padEnd(10, '0');

  const uniqueOrderId = `D${orderId}`;
  const payload = [{
    order_id: uniqueOrderId,
    firstname: order.first_name || 'Client',
    familyname: order.last_name || 'Anonyme',
    contact_phone: fixedPhone,
    address: order.address || order.commune || 'Adresse non spécifiée',
    from_wilaya_name: 'Bouira',
    to_wilaya_id: Number(order.wilaya_id) || 0,
    to_wilaya_name: order.wilaya || '',
    to_commune_id: Number(order.commune_id) || 0,
    to_commune_name: order.commune || '',
    product_list: productListStr,
    price: finalPrice || deliveryFee || 1000,
    do_insurance: order.has_insurance === true,
    declared_value: Number(order.declared_value || 0),
    delivery_type: 'Domicile',
    is_stopdesk: false,
    has_exchange: order.has_exchange === true,
    freeshipping: order.is_free_delivery === true
  }];

  console.log('PAYLOAD SENDING TO GUEPEX:', JSON.stringify(payload, null, 2));

  const response = await axios.post(`${process.env.GUEPEX_BASE_URL || FALLBACK_GUEPEX_BASE}/parcels/`, payload, {
    headers: {
      'X-API-ID': (process.env.GUEPEX_API_ID || FALLBACK_GUEPEX_ID).replace(/[\r\n\s]/g, ''),
      'X-API-TOKEN': (process.env.GUEPEX_API_TOKEN || FALLBACK_GUEPEX_TOKEN).replace(/[\r\n\s]/g, ''),
      'Content-Type': 'application/json'
    }
  });

  console.log('GUEPEX FULL RESPONSE:', JSON.stringify(response.data, null, 2));

  const responseKey = Object.keys(response.data)[0];
  const result = response.data[responseKey];

  if (!result || result.success === false) {
    const errMsg = result?.message || result?.error || 'Guepex returned failure';
    await pool.query(
      `UPDATE orders SET yalidine_status = 'failed', yalidine_error = $1 WHERE id = $2`,
      [errMsg, orderId]
    );
    throw new Error(errMsg);
  }

  await pool.query(
    `UPDATE orders SET
      yalidine_tracking = $1,
      yalidine_label_url = $2,
      yalidine_status = 'success',
      yalidine_error = NULL,
      yalidine_synced_at = NOW(),
      delivery_carrier = 'guepex'
     WHERE id = $3`,
    [result.tracking, result.label || null, orderId]
  );

  console.log('✅ Guepex sync SUCCESS! Tracking:', result.tracking);
  return { tracking: result.tracking, label_url: result.label, carrier: 'guepex' };
};

const syncOrderAuto = async (orderId) => {
  // Get order from DB
  const dbResult = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = dbResult.rows[0];
  if (!order) throw new Error(`Order ${orderId} not found`);

  console.log('=== AUTO ROUTING ORDER ===');
  console.log('delivery_type:', order.delivery_type);

  if (order.delivery_type === 'stop_desk') {
    console.log('→ Routing to YALIDINE (stop_desk)');
    return await syncOrder(orderId);
  } else if (order.delivery_type === 'domicile') {
    console.log('→ Routing to GUEPEX (domicile)');
    return await syncOrderGuepex(orderId);
  } else {
    throw new Error(`Unknown delivery_type: ${order.delivery_type}`);
  }
};

module.exports = {
  fetchWilayas,
  fetchCommunes,
  fetchAgencies,
  syncOrder,          // Yalidine only
  syncOrderGuepex,    // Guepex only
  syncOrderAuto,      // Smart router — USE THIS everywhere
};
