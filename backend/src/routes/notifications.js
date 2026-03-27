const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken, isAdminOrDesigner } = require('../middleware/auth');

router.get('/', verifyToken, isAdminOrDesigner, notificationController.getActiveNotifications);

module.exports = router;
