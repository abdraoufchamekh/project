const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// @route   GET /api/settings
// @desc    Get all company settings
// @access  Private
router.get('/', authMiddleware, settingsController.getSettings);

// @route   PUT /api/settings
// @desc    Update company settings
// @access  Private (Admin only)
router.put('/', authMiddleware, adminOnly, settingsController.updateSettings);

module.exports = router;
