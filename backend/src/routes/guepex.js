const express = require('express');
const router = express.Router();
const guepexService = require('../services/guepexService');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// GET /api/guepex/wilayas
router.get('/wilayas', async (req, res) => {
  try {
    const wilayas = await guepexService.fetchWilayas();
    res.json(wilayas);
  } catch (error) {
    console.error('Error fetching wilayas from Guepex:', error.message);
    res.status(500).json({ error: 'Failed to fetch wilayas from Guepex' });
  }
});

// GET /api/guepex/communes/:wilayaId
router.get('/communes/:wilayaId', async (req, res) => {
  try {
    res.json(await guepexService.fetchCommunes(req.params.wilayaId));
  } catch (error) {
    console.error(`Error fetching communes for wilaya ${req.params.wilayaId} from Guepex:`, error.message);
    res.status(500).json({ error: 'Failed to fetch communes from Guepex' });
  }
});

// GET /api/guepex/agencies/:communeId
router.get('/agencies/:communeId', async (req, res) => {
  try {
    res.json(await guepexService.fetchAgencies(req.params.communeId));
  } catch (error) {
    console.error(`Error fetching agencies for commune ${req.params.communeId} from Guepex:`, error.message);
    res.status(500).json({ error: 'Failed to fetch agencies from Guepex' });
  }
});

module.exports = router;
