// backend/src/controllers/productController.js

/**
 * Product Controller
 * 
 * Handles HTTP requests/responses for products.
 * Includes filtering, searching, and related data management.
 */

const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');

const productController = {
    
    /**
     * GET ALL PRODUCTS (with optional filters)
     * 
     * Query Parameters:
     * - category: Filter by category ID
     * - status: Filter by status (ACTIVE, INACTIVE, FEATURED)
     * - search: Search products by name
     * - limit: Limit number of results
     */
    getAllProducts: async (req, res, next) => {
        try {
            // Extract query parameters
            const filters = {
                category: req.query.category || null,
                status: req.query.status || null,
                search: req.query.search || null,
                limit: req.query.limit || null
            };
            
            const products = await productModel.findAll(filters);
            
            res.status(200).json({
                success: true,
                count: products.length,
                filters: filters,
                data: products
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * GET SINGLE PRODUCT BY ID
     * Returns complete product with images and specifications
     */
    getProductById: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID.'
                });
            }
            
            const product = await productModel.findById(id);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${id} not found.`
                });
            }
            
            res.status(200).json({
                success: true,
                data: product
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * GET PRODUCT BY SLUG
     */
    getProductBySlug: async (req, res, next) => {
        try {
            const { slug } = req.params;
            
            if (!slug || slug.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Slug parameter is required.'
                });
            }
            
            const product = await productModel.findBySlug(slug);
            
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with slug '${slug}' not found.`
                });
            }
            
            res.status(200).json({
                success: true,
                data: product
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * GET FEATURED PRODUCTS
     */
    getFeaturedProducts: async (req, res, next) => {
        try {
            const limit = parseInt(req.query.limit) || 8;
            const products = await productModel.findFeatured(limit);
            
            res.status(200).json({
                success: true,
                count: products.length,
                data: products
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * GET PRODUCTS BY CATEGORY
     */
    getProductsByCategory: async (req, res, next) => {
        try {
            const categoryId = parseInt(req.params.categoryId);
            
            if (isNaN(categoryId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category ID.'
                });
            }
            
            // Check if category exists
            const category = await categoryModel.findById(categoryId);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: `Category with ID ${categoryId} not found.`
                });
            }
            
            const products = await productModel.findByCategory(categoryId);
            
            res.status(200).json({
                success: true,
                count: products.length,
                category: {
                    id: category.id,
                    name: category.name,
                    slug: category.slug
                },
                data: products
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * CREATE PRODUCT (with images and specifications)
     */
    createProduct: async (req, res, next) => {
        try {
            const { 
                category_id, name, model, price, description, 
                warranty, status, images, specifications 
            } = req.body;
            
            // ==========================================
            // INPUT VALIDATION
            // ==========================================
            
            if (!name || name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Product name is required.'
                });
            }
            
            if (!category_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Category ID is required.'
                });
            }
            
            // Validate category exists
            const category = await categoryModel.findById(category_id);
            if (!category) {
                return res.status(404).json({
                    success: false,
                    message: `Category with ID ${category_id} not found.`
                });
            }
            
            if (price === undefined || price === null || price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid price is required.'
                });
            }
            
            // Generate slug from name
            const slug = name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            
            // Check if slug already exists
            const slugExists = await productModel.slugExists(slug);
            if (slugExists) {
                return res.status(409).json({
                    success: false,
                    message: `A product with name '${name}' already exists.`
                });
            }
            
            // Prepare product data
            const productData = {
                category_id,
                name: name.trim(),
                slug,
                model: model || null,
                price,
                description: description || null,
                warranty: warranty || null,
                status: status || 'ACTIVE'
            };
            
            // Create the product with images and specs
            const newId = await productModel.create(
                productData,
                images || [],
                specifications || []
            );
            
            // Fetch the complete new product
            const newProduct = await productModel.findById(newId);
            
            res.status(201).json({
                success: true,
                message: 'Product created successfully.',
                data: newProduct
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * UPDATE PRODUCT
     */
    updateProduct: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID.'
                });
            }
            
            // Check if product exists
            const existingProduct = await productModel.findById(id);
            if (!existingProduct) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${id} not found.`
                });
            }
            
            const { 
                category_id, name, model, price, 
                description, warranty, status 
            } = req.body;
            
            // Validate name if provided
            if (name !== undefined && name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Product name cannot be empty.'
                });
            }
            
            // Generate new slug if name changed
            let slug = existingProduct.slug;
            if (name && name.trim() !== existingProduct.name) {
                slug = name
                    .toLowerCase()
                    .trim()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                
                // Check slug uniqueness
                const slugExists = await productModel.slugExists(slug, id);
                if (slugExists) {
                    return res.status(409).json({
                        success: false,
                        message: `A product with name '${name}' already exists.`
                    });
                }
            }
            
            // Prepare update data
            const updateData = {
                category_id: category_id || existingProduct.category_id,
                name: name ? name.trim() : existingProduct.name,
                slug: slug,
                model: model !== undefined ? model : existingProduct.model,
                price: price !== undefined ? price : existingProduct.price,
                description: description !== undefined ? description : existingProduct.description,
                warranty: warranty !== undefined ? warranty : existingProduct.warranty,
                status: status || existingProduct.status
            };
            
            const updated = await productModel.update(id, updateData);
            
            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update product.'
                });
            }
            
            const updatedProduct = await productModel.findById(id);
            
            res.status(200).json({
                success: true,
                message: 'Product updated successfully.',
                data: updatedProduct
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * DELETE PRODUCT
     */
    deleteProduct: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid product ID.'
                });
            }
            
            const product = await productModel.findById(id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${id} not found.`
                });
            }
            
            await productModel.delete(id);
            
            res.status(200).json({
                success: true,
                message: 'Product deleted successfully.'
            });
            
        } catch (error) {
            next(error);
        }
    }
};

module.exports = productController;