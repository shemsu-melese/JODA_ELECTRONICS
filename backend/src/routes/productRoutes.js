const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');  

// Public routes
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/slug/:slug', productController.getProductBySlug);
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes (protected)
router.post('/', protect, authorize('ADMIN'), productController.createProduct);
router.put('/:id', protect, authorize('ADMIN'), productController.updateProduct);
router.delete('/:id', protect, authorize('ADMIN'), productController.deleteProduct);

module.exports = router;