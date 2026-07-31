// backend/src/controllers/categoryController.js

/**
 * Category Controller
 * 
 * This module handles all HTTP request/response logic for categories.
 * It acts as the "middleman" between routes and models.
 * 
 * Responsibilities:
 * - Extract data from request (params, query, body)
 * - Call the appropriate model function
 * - Format the response with proper HTTP status codes
 * - Handle errors and pass them to the error handler
 */

const categoryModel = require('../models/categoryModel');

const categoryController = {
    
    /**
     * GET ALL CATEGORIES
     * 
     * Endpoint: GET /api/categories
     * Purpose: Returns all active categories for navigation and display
     * Access: Public
     * 
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {Function} next - Express next middleware function
     */
    getAllCategories: async (req, res, next) => {
        try {
            // Call the model to get all categories
            const categories = await categoryModel.findAll();
            
            // Send successful response
            res.status(200).json({
                success: true,
                count: categories.length,
                data: categories
            });
            
        } catch (error) {
            // Pass error to centralized error handler
            next(error);
        }
    },
    
    /**
     * GET CATEGORY BY ID
     * 
     * Endpoint: GET /api/categories/:id
     * Purpose: Returns a single category by its database ID
     * Access: Public
     * 
     * @param {Object} req - Contains req.params.id
     */
    getCategoryById: async (req, res, next) => {
        try {
            // Extract the ID from the URL parameter
            // parseInt converts string to number
            const id = parseInt(req.params.id);
            
            // Validate that ID is a valid number
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID. ID must be a number.'
                });
            }
            
            // Find the category
            const category = await categoryModel.findById(id);
            
            // If category doesn't exist, return 404
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: `Category with ID ${id} not found.`
                });
            }
            
            // Return the found category
            res.status(200).json({
                success: true,
                data: category
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * GET CATEGORY BY SLUG
     * 
     * Endpoint: GET /api/categories/slug/:slug
     * Purpose: Returns a category by its URL-friendly slug
     * Access: Public
     * 
     * Why have both ID and slug lookup?
     * - ID: For internal/API use (faster, numeric lookup)
     * - Slug: For public URLs (SEO-friendly, readable)
     */
    getCategoryBySlug: async (req, res, next) => {
        try {
            const { slug } = req.params;
            
            // Validate slug is not empty
            if (!slug || slug.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Slug parameter is required.'
                });
            }
            
            const category = await categoryModel.findBySlug(slug);
            
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: `Category with slug '${slug}' not found.`
                });
            }
            
            res.status(200).json({
                success: true,
                data: category
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * CREATE CATEGORY
     * 
     * Endpoint: POST /api/categories
     * Purpose: Creates a new category
     * Access: Admin only (authentication will be added later)
     * 
     * Request Body:
     * {
     *   "name": "Laptops",
     *   "description": "All kinds of laptops"
     * }
     */
    createCategory: async (req, res, next) => {
        try {
            const { name, description, image } = req.body;
            
            // INPUT VALIDATION
            // Always validate before touching the database!
            
            // Check if name is provided
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Category name is required.'
                });
            }
            
            // Generate slug from name
            // Converts "Bluetooth Speakers" → "bluetooth-speakers"
            const slug = name
                .toLowerCase()           // Convert to lowercase
                .trim()                  // Remove leading/trailing spaces
                .replace(/\s+/g, '-')    // Replace spaces with hyphens
                .replace(/[^a-z0-9-]/g, ''); // Remove special characters
            
            // Check if slug already exists
            const existingCategory = await categoryModel.findBySlug(slug);
            if (existingCategory) {
                return res.status(409).json({
                    success: false,
                    message: `Category '${name}' already exists.`
                });
            }
            
            // Create the category
            const newId = await categoryModel.create({
                name: name.trim(),
                slug: slug,
                description: description || null,
                image: image || null
            });
            
            // Fetch the newly created category to return it
            const newCategory = await categoryModel.findById(newId);
            
            // 201 = Created (specifically for successful creation)
            res.status(201).json({
                success: true,
                message: 'Category created successfully.',
                data: newCategory
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * UPDATE CATEGORY
     * 
     * Endpoint: PUT /api/categories/:id
     * Purpose: Updates an existing category
     * Access: Admin only
     */
    updateCategory: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID.'
                });
            }
            
            // Check if category exists
            const existingCategory = await categoryModel.findById(id);
            if (!existingCategory) {
                return res.status(404).json({
                    success: false,
                    message: `Category with ID ${id} not found.`
                });
            }
            
            const { name, description, image, is_active } = req.body;
            
            // Validate name if provided
            if (name !== undefined && name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Category name cannot be empty.'
                });
            }
            
            // Generate new slug if name changed
            let slug = existingCategory.slug;
            if (name && name.trim() !== existingCategory.name) {
                slug = name
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
            }
            
            // Prepare update data (use existing values if not provided)
            const updateData = {
                name: name ? name.trim() : existingCategory.name,
                slug: slug,
                description: description !== undefined ? description : existingCategory.description,
                image: image !== undefined ? image : existingCategory.image,
                is_active: is_active !== undefined ? is_active : existingCategory.is_active
            };
            
            // Perform the update
            const updated = await categoryModel.update(id, updateData);
            
            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update category.'
                });
            }
            
            // Fetch and return the updated category
            const updatedCategory = await categoryModel.findById(id);
            
            res.status(200).json({
                success: true,
                message: 'Category updated successfully.',
                data: updatedCategory
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * DELETE CATEGORY
     * 
     * Endpoint: DELETE /api/categories/:id
     * Purpose: Deletes a category
     * Access: Admin only
     * 
     * NOTE: Will fail if products exist in this category
     * due to ON DELETE RESTRICT constraint.
     */
    deleteCategory: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            // Validate ID
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID.'
                });
            }
            
            // Check if category exists
            const category = await categoryModel.findById(id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: `Category with ID ${id} not found.`
                });
            }
            
            // Check if category has products
            const productCount = await categoryModel.getProductCount(id);
            if (productCount > 0) {
                return res.status(409).json({
                    success: false,
                    message: `Cannot delete category. It contains ${productCount} product(s). Remove or reassign the products first.`
                });
            }
            
            // Delete the category
            const deleted = await categoryModel.delete(id);
            
            if (!deleted) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete category.'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Category deleted successfully.'
            });
            
        } catch (error) {
            next(error);
        }
    }
};

module.exports = categoryController;