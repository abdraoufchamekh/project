const express = require('express');
const router = express.Router();
const yalidineService = require('../services/yalidineService');
const { authMiddleware } = require('../middleware/auth');

// GET /api/yalidine/debug (Unprotected for immediate testing on production)
router.get('/debug', async (req, res) => {
  const axios = require('axios');
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.yalidine.app/v1/wilayas/',
      headers: {
        'X-API-ID': process.env.YALIDINE_API_ID || '42835487942502895620',
        'X-API-TOKEN': process.env.YALIDINE_API_TOKEN || 'WRhmBgaljw2Myc3SqX7U5Cxsu8G6PfJAidztDnKprTELoYvH10I4NeQb9FOkVZ'
      }
    });
    res.json({
      success: true,
      headersSent: {
        'X-API-ID': process.env.YALIDINE_API_ID ? 'Configured ✅' : 'Using Fallback ⚠️',
        'X-API-TOKEN': process.env.YALIDINE_API_TOKEN ? 'Configured ✅' : 'Using Fallback ⚠️'
      },
      data: response.data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
});

// All routes require authentication
router.use(authMiddleware);

// GET /api/yalidine/wilayas
router.get('/wilayas', async (req, res) => {
  try {
    const wilayas = await yalidineService.fetchWilayas();
    res.json(wilayas);
  } catch (error) {
    console.error('Error fetching wilayas from Yalidine:', error.message);
    res.status(500).json({ error: 'Failed to fetch wilayas from Yalidine', details: error.message });
  }
});

// GET /api/yalidine/communes/:wilayaId
router.get('/communes/:wilayaId', async (req, res) => {
  try { res.json(await yalidineService.fetchCommunes(req.params.wilayaId)); }
  catch (e) { res.status(500).json({ error: 'Failed to fetch communes', details: e.message }); }
});

// GET /api/yalidine/parcels/:tracking
router.get('/parcels/:tracking', async (req, res) => {
  try {
    const { tracking } = req.params;
    const axios = require('axios');
    const response = await axios({
       method: 'GET',
       url: `https://api.yalidine.app/v1/parcels/?tracking=${tracking}`,
       headers: {
          'X-API-ID': process.env.YALIDINE_API_ID,
          'X-API-TOKEN': process.env.YALIDINE_API_TOKEN,
       }
    });
    // Yalidine returns { data: [ { tracking: "...", last_status: "..." } ] }
    const parcels = response.data.data || response.data;
    if (parcels && parcels.length > 0) {
      res.json(parcels[0]);
    } else {
      res.status(404).json({ error: 'Parcel not found' });
    }
  } catch (error) {
    console.error('Error fetching parcel live status from Yalidine:', error.message);
    res.status(500).json({ error: 'Failed to fetch parcel from Yalidine' });
  }
});

// GET /api/yalidine/agencies/:communeId
router.get('/agencies/:communeId', async (req, res) => {
  try { res.json(await yalidineService.fetchAgencies(req.params.communeId)); }
  catch (e) { res.status(500).json({ error: 'Failed to fetch agencies' }); }
});

module.exports = router;
