const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware, adminOrAtelier } = require('../middleware/auth');

router.get('/', authMiddleware, adminOrAtelier, notificationController.getActiveNotifications);

module.exports = router;
