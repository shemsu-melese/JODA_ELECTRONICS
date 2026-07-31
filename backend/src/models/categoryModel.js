// backend/src/models/categoryModel.js

/**
 * Category Model
 * 
 * This module handles all database operations for the categories table.
 * It is the ONLY file that writes SQL queries for categories.
 * 
 * Why separate models?
 * - If we change the database (MySQL → PostgreSQL), we only change THIS file
 * - Controllers don't need to know SQL
 * - Queries are reusable across multiple controllers
 */

// Import the connection pool from our database configuration
const { pool } = require('../config/db');

/**
 * Category Model Object
 * Contains all database operations for categories
 */
const categoryModel = {
    
    /**
     * GET ALL CATEGORIES
     * 
     * Retrieves all active categories from the database.
     * Used for displaying categories on the website.
     * 
     * @returns {Array} - Array of category objects
     */
    findAll: async () => {
        // pool.execute() runs a prepared statement (safe from SQL injection)
        // The query selects specific columns (not SELECT *) for performance
        const [rows] = await pool.execute(
            `SELECT 
                id, 
                name, 
                slug, 
                description, 
                image, 
                is_active,
                created_at,
                updated_at
             FROM categories 
             WHERE is_active = 1 
             ORDER BY name ASC`
        );
        
        // pool.execute returns [rows, fields]
        // We destructure to get only rows
        return rows;
    },
    
    /**
     * FIND CATEGORY BY ID
     * 
     * Retrieves a single category by its primary key (id).
     * Used for category detail pages and admin editing.
     * 
     * @param {number} id - The category ID to find
     * @returns {Object|null} - Category object or null if not found
     * 
     * SECURITY NOTE: The '?' is a parameterized query placeholder.
     * This PREVENTS SQL injection attacks by escaping the value.
     */
    findById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT 
                id, 
                name, 
                slug, 
                description, 
                image, 
                is_active,
                created_at,
                updated_at
             FROM categories 
             WHERE id = ?`,
            [id]  // The ? is replaced with this value safely
        );
        
        // Return the first row, or null if not found
        return rows[0] || null;
    },
    
    /**
     * FIND CATEGORY BY SLUG
     * 
     * Retrieves a single category by its URL-friendly slug.
     * Used for SEO-friendly URLs like /categories/smartphones
     * 
     * @param {string} slug - The URL slug to search for
     * @returns {Object|null} - Category object or null if not found
     */
    findBySlug: async (slug) => {
        const [rows] = await pool.execute(
            `SELECT 
                id, 
                name, 
                slug, 
                description, 
                image, 
                is_active,
                created_at,
                updated_at
             FROM categories 
             WHERE slug = ?`,
            [slug]
        );
        
        return rows[0] || null;
    },
    
    /**
     * CREATE NEW CATEGORY
     * 
     * Inserts a new category into the database.
     * The slug is generated from the name (lowercase, hyphens).
     * 
     * @param {Object} categoryData - { name, slug, description, image }
     * @returns {number} - The ID of the newly created category
     */
    create: async (categoryData) => {
        const { name, slug, description, image } = categoryData;
        
        const [result] = await pool.execute(
            `INSERT INTO categories (name, slug, description, image) 
             VALUES (?, ?, ?, ?)`,
            [name, slug, description, image || null]
        );
        
        // result.insertId contains the AUTO_INCREMENT id of the new row
        return result.insertId;
    },
    
    /**
     * UPDATE CATEGORY
     * 
     * Updates an existing category's information.
     * Only updates fields that are provided.
     * 
     * @param {number} id - The category ID to update
     * @param {Object} categoryData - Fields to update
     * @returns {boolean} - True if update was successful
     */
    update: async (id, categoryData) => {
        const { name, slug, description, image, is_active } = categoryData;
        
        const [result] = await pool.execute(
            `UPDATE categories 
             SET name = ?, 
                 slug = ?, 
                 description = ?, 
                 image = ?,
                 is_active = ?
             WHERE id = ?`,
            [name, slug, description, image || null, is_active, id]
        );
        
        // result.affectedRows tells us how many rows were updated
        return result.affectedRows > 0;
    },
    
    /**
     * DELETE CATEGORY
     * 
     * Deletes a category by its ID.
     * Will FAIL if products exist in this category (RESTRICT constraint).
     * 
     * @param {number} id - The category ID to delete
     * @returns {boolean} - True if deletion was successful
     */
    delete: async (id) => {
        const [result] = await pool.execute(
            `DELETE FROM categories WHERE id = ?`,
            [id]
        );
        
        return result.affectedRows > 0;
    },
    
    /**
     * CHECK IF CATEGORY HAS PRODUCTS
     * 
     * Counts how many products belong to this category.
     * Used before deletion to provide helpful error messages.
     * 
     * @param {number} id - The category ID to check
     * @returns {number} - Number of products in this category
     */
    getProductCount: async (id) => {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count FROM products WHERE category_id = ?`,
            [id]
        );
        
        return rows[0].count;
    }
};

// Export the model so controllers can use it
module.exports = categoryModel;