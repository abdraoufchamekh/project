const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware, adminOnly, designerOrAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authMiddleware);

// Order routes
router.post('/', designerOrAdmin, orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/stats', orderController.getOrderStats);
router.get('/:id', orderController.getOrderById);
router.put('/:id', designerOrAdmin, orderController.updateOrder);
router.delete('/:id', designerOrAdmin, orderController.deleteOrder);
router.get('/:id/invoice', require('../controllers/invoiceController').generateInvoice);

// Product routes
router.patch('/products/:productId/status', orderController.updateProductStatus);
router.put('/products/:productId/image', upload.single('image'), orderController.updateProductImage);
router.delete('/products/:productId/image', orderController.deleteProductImage);

// Photo routes
router.post('/:orderId/photos', upload.array('photos', 10), orderController.uploadPhotos);
router.delete('/photos/:photoId', orderController.deletePhoto);
router.put('/photos/:photoId', upload.single('photo'), orderController.replacePhoto);

module.exports = router;