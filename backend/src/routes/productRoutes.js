// backend/src/routes/productRoutes.js

/**
 * Product Routes
 * 
 * IMPORTANT: Route order matters!
 * More specific routes must come BEFORE generic ones.
 * 
 * Example:
 * /featured must come before /:id
 * /category/:categoryId must come before /:id
 * Otherwise Express would treat "featured" as an ID
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// ============================================
// SPECIFIC ROUTES (must come before /:id)
// ============================================

/**
 * GET /api/products/featured
 * Get featured products
 */
router.get('/featured', productController.getFeaturedProducts);

/**
 * GET /api/products/category/:categoryId
 * Get products by category
 */
router.get('/category/:categoryId', productController.getProductsByCategory);

/**
 * GET /api/products/slug/:slug
 * Get product by slug
 */
router.get('/slug/:slug', productController.getProductBySlug);

// ============================================
// CRUD ROUTES
// ============================================

/**
 * GET /api/products
 * Get all products (with optional filters)
 */
router.get('/', productController.getAllProducts);

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', productController.getProductById);

/**
 * POST /api/products
 * Create new product
 */
router.post('/', productController.createProduct);

/**
 * PUT /api/products/:id
 * Update product
 */
router.put('/:id', productController.updateProduct);

/**
 * DELETE /api/products/:id
 * Delete product
 */
router.delete('/:id', productController.deleteProduct);

module.exports = router;