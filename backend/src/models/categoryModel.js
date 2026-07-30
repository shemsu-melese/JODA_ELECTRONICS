const { pool } = require('../config/db');

/**
 * Category Model
 * Handles all database operations for categories
 */
const categoryModel = {
    /**
     * Get all active categories
     */
    findAll: async () => {
        const [rows] = await pool.execute(
            'SELECT id, name, slug, description, image FROM categories WHERE is_active = 1 ORDER BY name'
        );
        return rows;
    },

    /**
     * Find category by ID
     */
    findById: async (id) => {
        const [rows] = await pool.execute(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        return rows[0]; // Return first (and only) row
    },

    /**
     * Find category by slug (for URLs)
     */
    findBySlug: async (slug) => {
        const [rows] = await pool.execute(
            'SELECT * FROM categories WHERE slug = ?',
            [slug]
        );
        return rows[0];
    },

    /**
     * Create new category
     */
    create: async (categoryData) => {
        const { name, slug, description, image } = categoryData;
        const [result] = await pool.execute(
            'INSERT INTO categories (name, slug, description, image) VALUES (?, ?, ?, ?)',
            [name, slug, description, image]
        );
        return result.insertId; // Return the new category's ID
    }
};

module.exports = categoryModel;