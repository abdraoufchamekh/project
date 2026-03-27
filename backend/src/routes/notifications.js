const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware, designerOrAdmin } = require('../middleware/auth');

router.get('/', authMiddleware, designerOrAdmin, notificationController.getActiveNotifications);

module.exports = router;
