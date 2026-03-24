const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { authMiddleware, adminOrAtelier } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Protect all routes
router.use(authMiddleware);

// GET /api/stock (Accessible by all logged-in users)
router.get('/', stockController.getAllStock);

// The following routes are Admin or Atelier
router.use(adminOrAtelier);

// POST /api/stock
router.post('/', upload.single('image'), stockController.addProduct);

// PUT /api/stock/:id
router.put('/:id', upload.single('image'), stockController.updateProduct);

// DELETE /api/stock/:id
router.delete('/:id', stockController.deleteProduct);

module.exports = router;
