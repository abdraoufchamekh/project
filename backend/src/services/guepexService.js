const axios = require('axios');
const pool = require('../config/database');

const GUEPEX_BASE_URL = 'https://api.guepex.app/v1';
const FALLBACK_GUEPEX_ID = '37092681310163806238';
const FALLBACK_GUEPEX_TOKEN = 'SOALibowc9WhT5JHnyX2CN16vgxZrQ8sjfukzEteU7GpIKYdRq3FmlB0DMV4aP';

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

const guepexService = {
  async fetchWilayas() {
    return getCached('guepex_wilayas', async () => {
      try {
        const response = await axios.get(`${GUEPEX_BASE_URL}/wilayas/`, {
          headers: {
            'X-API-ID': process.env.GUEPEX_API_ID || FALLBACK_GUEPEX_ID,
            'X-API-TOKEN': process.env.GUEPEX_API_TOKEN || FALLBACK_GUEPEX_TOKEN
          }
        });
        const wilayas = response.data.data || response.data;
        return wilayas.filter(w => w.is_deliverable === 1 || w.is_deliverable === true);
      } catch (error) {
        console.error('Guepex failed fetching wilayas:', error.message);
        return [];
      }
    });
  },

  async fetchCommunes(wilayaId) {
    return getCached(`guepex_communes_${wilayaId}`, async () => {
      try {
        const response = await axios.get(`${GUEPEX_BASE_URL}/communes/?wilaya_id=${wilayaId}`, {
          headers: {
            'X-API-ID': process.env.GUEPEX_API_ID || FALLBACK_GUEPEX_ID,
            'X-API-TOKEN': process.env.GUEPEX_API_TOKEN || FALLBACK_GUEPEX_TOKEN
          }
        });
        const communes = response.data.data || response.data;
        return communes.filter(c => c.is_deliverable === 1 || c.is_deliverable === true);
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
        const response = await axios.get(
          `${GUEPEX_BASE_URL}/centers/?commune_id=${communeId}`,
          {
            headers: {
              'X-API-ID': process.env.GUEPEX_API_ID || FALLBACK_GUEPEX_ID,
              'X-API-TOKEN': process.env.GUEPEX_API_TOKEN || FALLBACK_GUEPEX_TOKEN
            }
          }
        );
        return response.data.data || response.data;
      } catch (error) {
        console.error('Guepex failed fetching agencies:', error.message);
        return [];
      }
    });
  }
};

module.exports = guepexService;
