// backend/src/routes/categoryRoutes.js

/**
 * Category Routes
 * 
 * This file defines all URL endpoints for the categories feature.
 * Each route maps an HTTP method + URL pattern to a controller function.
 * 
 * Router is like a mini-Express app for a specific feature.
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * GET /api/categories
 * Get all active categories
 * Example: http://localhost:5000/api/categories
 */
router.get('/', categoryController.getAllCategories);

/**
 * GET /api/categories/slug/:slug
 * Get category by slug
 * Example: http://localhost:5000/api/categories/slug/smartphones
 * 
 * IMPORTANT: This route MUST come before /:id
 * Otherwise Express would treat "slug" as an ID parameter
 */
router.get('/slug/:slug', categoryController.getCategoryBySlug);

/**
 * GET /api/categories/:id
 * Get category by ID
 * Example: http://localhost:5000/api/categories/1
 */
router.get('/:id', categoryController.getCategoryById);

// ============================================
// ADMIN ROUTES (Authentication will be added)
// ============================================

/**
 * POST /api/categories
 * Create a new category
 * Body: { "name": "...", "description": "..." }
 */
router.post('/', categoryController.createCategory);

/**
 * PUT /api/categories/:id
 * Update an existing category
 * Body: { "name": "...", "description": "..." }
 */
router.put('/:id', categoryController.updateCategory);

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;