// backend/src/models/wishlistModel.js

const { pool } = require('../config/db');

const wishlistModel = {
    
    /**
     * GET USER'S WISHLIST
     * Returns all products in a user's wishlist with product details
     */
    findByUser: async (userId) => {
        const [rows] = await pool.execute(
            `SELECT 
                w.id AS wishlist_id,
                w.created_at AS added_at,
                p.id AS product_id,
                p.name,
                p.slug,
                p.model,
                p.price,
                p.status,
                c.name AS category_name,
                (SELECT image_url FROM product_images 
                 WHERE product_id = p.id AND is_primary = 1 
                 LIMIT 1) AS primary_image
             FROM wishlists w
             JOIN products p ON w.product_id = p.id
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE w.user_id = ?
             ORDER BY w.created_at DESC`,
            [userId]
        );
        return rows;
    },
    
    /**
     * ADD TO WISHLIST
     * The UNIQUE constraint on (user_id, product_id) prevents duplicates
     */
    add: async (userId, productId) => {
        try {
            const [result] = await pool.execute(
                `INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)`,
                [userId, productId]
            );
            return { success: true, id: result.insertId };
        } catch (error) {
            // Duplicate entry error code
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, duplicate: true };
            }
            throw error;
        }
    },
    
    /**
     * REMOVE FROM WISHLIST
     */
    remove: async (userId, productId) => {
        const [result] = await pool.execute(
            `DELETE FROM wishlists WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );
        return result.affectedRows > 0;
    },
    
    /**
     * CHECK IF PRODUCT IS IN WISHLIST
     */
    isWishlisted: async (userId, productId) => {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count FROM wishlists 
             WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );
        return rows[0].count > 0;
    },
    
    /**
     * GET WISHLIST COUNT
     */
    getCount: async (userId) => {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count FROM wishlists WHERE user_id = ?`,
            [userId]
        );
        return rows[0].count;
    },
    
    /**
     * CLEAR WISHLIST (remove all items)
     */
    clearAll: async (userId) => {
        const [result] = await pool.execute(
            `DELETE FROM wishlists WHERE user_id = ?`,
            [userId]
        );
        return result.affectedRows;
    }
};

module.exports = wishlistModel;