const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware);

// Order routes
router.post('/', adminOnly, orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', adminOnly, orderController.updateOrder);
router.delete('/:id', adminOnly, orderController.deleteOrder);

// Product routes
router.patch('/products/:productId/status', orderController.updateProductStatus);

// Image routes
router.post('/products/:productId/images', upload.array('images', 10), orderController.uploadImages);
router.delete('/images/:imageId', orderController.deleteImage);

module.exports = router;