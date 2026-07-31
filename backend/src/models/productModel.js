// backend/src/models/productModel.js

/**
 * Product Model
 * 
 * Handles all database operations for products including
 * related images and specifications.
 * 
 * Key concepts:
 * - JOIN queries to get related data
 * - Multiple queries combined for complete product data
 * - Parameterized queries for security
 */

const { pool } = require('../config/db');

const productModel = {
    
    // ============================================
    // READ OPERATIONS
    // ============================================
    
    /**
     * GET ALL PRODUCTS (with optional filters)
     * 
     * Supports filtering by:
     * - category: /api/products?category=1
     * - status: /api/products?status=FEATURED
     * - search: /api/products?search=samsung
     * 
     * @param {Object} filters - Optional filter parameters
     * @returns {Array} - Array of product objects
     */
    findAll: async (filters = {}) => {
        let query = `
            SELECT 
                p.id,
                p.category_id,
                p.name,
                p.slug,
                p.model,
                p.price,
                p.description,
                p.warranty,
                p.status,
                p.created_at,
                p.updated_at,
                c.name AS category_name,
                c.slug AS category_slug,
                (SELECT image_url FROM product_images 
                 WHERE product_id = p.id AND is_primary = 1 
                 LIMIT 1) AS primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE 1=1
        `;
        
        const params = [];
        
        // Filter by category
        if (filters.category) {
            query += ` AND p.category_id = ?`;
            params.push(filters.category);
        }
        
        // Filter by status
        if (filters.status) {
            query += ` AND p.status = ?`;
            params.push(filters.status);
        } else {
            // Default: show only ACTIVE and FEATURED products
            query += ` AND p.status IN ('ACTIVE', 'FEATURED')`;
        }
        
        // Search by name
        if (filters.search) {
            query += ` AND p.name LIKE ?`;
            params.push(`%${filters.search}%`);
        }
        
        // Sort: featured first, then newest
        query += ` ORDER BY 
            CASE WHEN p.status = 'FEATURED' THEN 0 ELSE 1 END,
            p.created_at DESC`;
        
        // Limit results
        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(filters.limit));
        }
        
        const [rows] = await pool.execute(query, params);
        return rows;
    },
    
    /**
     * FIND PRODUCT BY ID (with all related data)
     * 
     * This method returns the COMPLETE product with:
     * - Category information
     * - All images
     * - All specifications
     * 
     * @param {number} id - Product ID
     * @returns {Object|null} - Complete product object or null
     */
    findById: async (id) => {
        // Query 1: Get the main product with category
        const [productRows] = await pool.execute(
            `SELECT 
                p.*,
                c.name AS category_name,
                c.slug AS category_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.id = ?`,
            [id]
        );
        
        if (productRows.length === 0) {
            return null;
        }
        
        const product = productRows[0];
        
        // Query 2: Get all images for this product
        const [imageRows] = await pool.execute(
            `SELECT id, image_url, is_primary, sort_order
             FROM product_images
             WHERE product_id = ?
             ORDER BY sort_order ASC`,
            [id]
        );
        product.images = imageRows;
        
        // Query 3: Get all specifications for this product
        const [specRows] = await pool.execute(
            `SELECT id, specification, value, sort_order
             FROM product_specifications
             WHERE product_id = ?
             ORDER BY sort_order ASC`,
            [id]
        );
        product.specifications = specRows;
        
        return product;
    },
    
    /**
     * FIND PRODUCT BY SLUG
     * 
     * @param {string} slug - URL-friendly product name
     * @returns {Object|null} - Complete product object
     */
    findBySlug: async (slug) => {
        const [productRows] = await pool.execute(
            `SELECT id FROM products WHERE slug = ?`,
            [slug]
        );
        
        if (productRows.length === 0) {
            return null;
        }
        
        // Reuse findById to get complete product data
        return await productModel.findById(productRows[0].id);
    },
    
    /**
     * GET FEATURED PRODUCTS
     * 
     * @param {number} limit - Maximum number of featured products
     * @returns {Array} - Featured products
     */
    findFeatured: async (limit = 8) => {
        const [rows] = await pool.execute(
            `SELECT 
                p.id, p.name, p.slug, p.model, p.price, p.status,
                c.name AS category_name, c.slug AS category_slug,
                (SELECT image_url FROM product_images 
                 WHERE product_id = p.id AND is_primary = 1 
                 LIMIT 1) AS primary_image
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.status = 'FEATURED'
             ORDER BY p.created_at DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    },
    
    /**
     * GET PRODUCTS BY CATEGORY
     * 
     * @param {number} categoryId - Category ID
     * @returns {Array} - Products in this category
     */
    findByCategory: async (categoryId) => {
        const [rows] = await pool.execute(
            `SELECT 
                p.id, p.name, p.slug, p.model, p.price, p.status,
                c.name AS category_name, c.slug AS category_slug,
                (SELECT image_url FROM product_images 
                 WHERE product_id = p.id AND is_primary = 1 
                 LIMIT 1) AS primary_image
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.category_id = ? 
               AND p.status IN ('ACTIVE', 'FEATURED')
             ORDER BY p.created_at DESC`,
            [categoryId]
        );
        return rows;
    },
    
    // ============================================
    // CREATE OPERATION
    // ============================================
    
    /**
     * CREATE PRODUCT (with images and specifications)
     * 
     * This method demonstrates a multi-step database operation.
     * In a production system, we'd use database TRANSACTIONS
     * to ensure all steps succeed or all fail together.
     * 
     * @param {Object} productData - Product information
     * @param {Array} images - Array of image objects
     * @param {Array} specifications - Array of spec objects
     * @returns {number} - New product ID
     */
    create: async (productData, images = [], specifications = []) => {
        const { 
            category_id, name, slug, model, 
            price, description, warranty, status 
        } = productData;
        
        // Step 1: Insert the main product
        const [productResult] = await pool.execute(
            `INSERT INTO products 
             (category_id, name, slug, model, price, description, warranty, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [category_id, name, slug, model, price, description, warranty, status || 'ACTIVE']
        );
        
        const productId = productResult.insertId;
        
        // Step 2: Insert images (if any)
        if (images.length > 0) {
            for (const image of images) {
                await pool.execute(
                    `INSERT INTO product_images 
                     (product_id, image_url, is_primary, sort_order)
                     VALUES (?, ?, ?, ?)`,
                    [productId, image.image_url, image.is_primary || 0, image.sort_order || 0]
                );
            }
        }
        
        // Step 3: Insert specifications (if any)
        if (specifications.length > 0) {
            for (const spec of specifications) {
                await pool.execute(
                    `INSERT INTO product_specifications 
                     (product_id, specification, value, sort_order)
                     VALUES (?, ?, ?, ?)`,
                    [productId, spec.specification, spec.value, spec.sort_order || 0]
                );
            }
        }
        
        return productId;
    },
    
    // ============================================
    // UPDATE OPERATION
    // ============================================
    
    /**
     * UPDATE PRODUCT
     * 
     * @param {number} id - Product ID
     * @param {Object} productData - Updated product data
     * @returns {boolean} - Success status
     */
    update: async (id, productData) => {
        const { category_id, name, slug, model, price, description, warranty, status } = productData;
        
        const [result] = await pool.execute(
            `UPDATE products 
             SET category_id = ?, name = ?, slug = ?, model = ?, 
                 price = ?, description = ?, warranty = ?, status = ?
             WHERE id = ?`,
            [category_id, name, slug, model, price, description, warranty, status, id]
        );
        
        return result.affectedRows > 0;
    },
    
    // ============================================
    // DELETE OPERATION
    // ============================================
    
    /**
     * DELETE PRODUCT
     * 
     * Images and specifications are automatically deleted
     * due to ON DELETE CASCADE in the database.
     * 
     * @param {number} id - Product ID
     * @returns {boolean} - Success status
     */
    delete: async (id) => {
        const [result] = await pool.execute(
            `DELETE FROM products WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    },
    
    // ============================================
    // IMAGE OPERATIONS
    // ============================================
    
    /**
     * ADD IMAGE TO PRODUCT
     */
    addImage: async (productId, imageData) => {
        const { image_url, is_primary, sort_order } = imageData;
        const [result] = await pool.execute(
            `INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
             VALUES (?, ?, ?, ?)`,
            [productId, image_url, is_primary || 0, sort_order || 0]
        );
        return result.insertId;
    },
    
    /**
     * REMOVE IMAGE
     */
    removeImage: async (imageId) => {
        const [result] = await pool.execute(
            `DELETE FROM product_images WHERE id = ?`,
            [imageId]
        );
        return result.affectedRows > 0;
    },
    
    /**
     * SET PRIMARY IMAGE
     */
    setPrimaryImage: async (productId, imageId) => {
        // First, unset all primary images for this product
        await pool.execute(
            `UPDATE product_images SET is_primary = 0 WHERE product_id = ?`,
            [productId]
        );
        
        // Then set the specified image as primary
        const [result] = await pool.execute(
            `UPDATE product_images SET is_primary = 1 WHERE id = ? AND product_id = ?`,
            [imageId, productId]
        );
        
        return result.affectedRows > 0;
    },
    
    // ============================================
    // SPECIFICATION OPERATIONS
    // ============================================
    
    /**
     * ADD SPECIFICATION TO PRODUCT
     */
    addSpecification: async (productId, specData) => {
        const { specification, value, sort_order } = specData;
        const [result] = await pool.execute(
            `INSERT INTO product_specifications (product_id, specification, value, sort_order)
             VALUES (?, ?, ?, ?)`,
            [productId, specification, value, sort_order || 0]
        );
        return result.insertId;
    },
    
    /**
     * REMOVE SPECIFICATION
     */
    removeSpecification: async (specId) => {
        const [result] = await pool.execute(
            `DELETE FROM product_specifications WHERE id = ?`,
            [specId]
        );
        return result.affectedRows > 0;
    },
    
    /**
     * GET PRODUCT COUNT (for validation)
     */
    getCount: async () => {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count FROM products`
        );
        return rows[0].count;
    },
    
    /**
     * CHECK IF SLUG EXISTS (excluding a specific product)
     */
    slugExists: async (slug, excludeId = null) => {
        let query = `SELECT COUNT(*) AS count FROM products WHERE slug = ?`;
        const params = [slug];
        
        if (excludeId) {
            query += ` AND id != ?`;
            params.push(excludeId);
        }
        
        const [rows] = await pool.execute(query, params);
        return rows[0].count > 0;
    }
};

module.exports = productModel;