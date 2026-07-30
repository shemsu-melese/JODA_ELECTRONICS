const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

/**
 * Category Routes
 * Public routes for browsing categories
 */

// GET /api/categories - Get all categories
router.get('/', categoryController.getAllCategories);

// GET /api/categories/:slug - Get category by slug
router.get('/:slug', categoryController.getCategoryBySlug);

module.exports = router;