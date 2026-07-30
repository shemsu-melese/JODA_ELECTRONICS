const categoryModel = require('../models/categoryModel');

/**
 * Category Controller
 * Handles HTTP requests/responses for categories
 */
const categoryController = {
    /**
     * GET /api/categories
     * Returns all active categories
     */
    getAllCategories: async (req, res, next) => {
        try {
            const categories = await categoryModel.findAll();
            
            res.status(200).json({
                success: true,
                count: categories.length,
                data: categories
            });
        } catch (error) {
            next(error); // Pass to error handler
        }
    },

    /**
     * GET /api/categories/:slug
     * Returns a single category by slug
     */
    getCategoryBySlug: async (req, res, next) => {
        try {
            const category = await categoryModel.findBySlug(req.params.slug);
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: 'Category not found'
                });
            }
            
            res.status(200).json({
                success: true,
                data: category
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = categoryController;