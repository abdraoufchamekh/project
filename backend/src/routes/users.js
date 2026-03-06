const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// All routes require admin authentication
router.use(authMiddleware);
router.use(adminOnly);

router.get('/', userController.getAllUsers);
router.get('/designers', userController.getDesigners);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;