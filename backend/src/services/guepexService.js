const axios = require('axios');

const FALLBACK_GUEPEX_ID = '37092681310163806238';
const FALLBACK_GUEPEX_TOKEN = 'SOALibowc9WhT5JHnyX2CN16vgxZrQ8sjfukzEteU7GpIKYdRq3FmlB0DMV4aP';

const ACTUAL_GUEPEX_ID = (process.env.GUEPEX_API_ID || FALLBACK_GUEPEX_ID).replace(/[\r\n\s]/g, '');
const ACTUAL_GUEPEX_TOKEN = (process.env.GUEPEX_API_TOKEN || FALLBACK_GUEPEX_TOKEN).replace(/[\r\n\s]/g, '');

// In-memory cache for wilayas and communes
const cache = {};

async function getCached(key, fetchFn, ttlMs = 86400000) {
  const now = Date.now();
  if (cache[key] && (now - cache[key].timestamp < ttlMs)) {
    return cache[key].data;
  }
  const data = await fetchFn();
  cache[key] = { data, timestamp: now };
  return data;
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry(reqConfig, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios({
        ...reqConfig,
        headers: {
          'X-API-ID': ACTUAL_GUEPEX_ID,
          'X-API-TOKEN': ACTUAL_GUEPEX_TOKEN,
          ...reqConfig.headers,
        }
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 429 && attempt < maxRetries) {
        console.warn(`[Guepex API] Rate limit hit. Attempt ${attempt}/${maxRetries}. Retrying...`);
        const retryAfter = error.response.headers['retry-after'];
        let waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : attempt * 2000;
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
}

const guepexService = {
  async fetchWilayas() {
    return getCached('guepex_wilayas', async () => {
      try {
        const baseUrl = process.env.GUEPEX_BASE_URL || 'https://api.guepex.app/v1';
        const data = await executeWithRetry({
          method: 'GET',
          url: `${baseUrl}/wilayas/`
        });
        return data.data || data;
      } catch (error) {
        console.error('Guepex failed fetching wilayas:', error.message);
        return [];
      }
    });
  },

  async fetchCommunes(wilayaId) {
    return getCached(`guepex_communes_${wilayaId}`, async () => {
      try {
        const baseUrl = process.env.GUEPEX_BASE_URL || 'https://api.guepex.app/v1';
        const data = await executeWithRetry({
          method: 'GET',
          url: `${baseUrl}/communes/?wilaya_id=${wilayaId}`
        });
        return data.data || data;
      } catch (error) {
        console.error('Guepex failed fetching communes:', error.message);
        return [];
      }
    });
  },

  async fetchAgencies(communeId) {
    if (!communeId) return [];
    return getCached(`guepex_agencies_${communeId}`, async () => {
      try {
        const baseUrl = process.env.GUEPEX_BASE_URL || 'https://api.guepex.app/v1';
        const data = await executeWithRetry({
          method: 'GET',
          url: `${baseUrl}/centers/?commune_id=${communeId}`
        });
        return data.data || data;
      } catch (error) {
        console.error('Guepex failed fetching agencies:', error.message);
        return [];
      }
    });
  }
};

module.exports = guepexService;
