const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect, authorize } = require('../middleware/auth');  // 🆕 ADD

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/slug/:slug', categoryController.getCategoryBySlug);
router.get('/:id', categoryController.getCategoryById);

// Admin routes (protected)
router.post('/', protect, authorize('ADMIN'), categoryController.createCategory);
router.put('/:id', protect, authorize('ADMIN'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('ADMIN'), categoryController.deleteCategory);

module.exports = router;