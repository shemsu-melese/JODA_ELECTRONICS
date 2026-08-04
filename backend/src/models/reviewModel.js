// backend/src/models/reviewModel.js

const { pool } = require('../config/db');

const reviewModel = {
    
    //  GET REVIEWS FOR A PRODUCT
    //  Only returns APPROVED reviews for public display
     
    findByProduct: async (productId, status = 'APPROVED') => {
        const [rows] = await pool.execute(
            `SELECT 
                r.id, r.rating, r.comment, r.status, r.created_at, r.updated_at,
                u.id AS user_id, u.full_name, u.avatar
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             WHERE r.product_id = ? AND r.status = ?
             ORDER BY r.created_at DESC`,
            [productId, status]
        );
        return rows;
    },
    
    //  GET ALL REVIEWS (Admin - includes all statuses)

    findAll: async (filters = {}) => {
        let query = `
            SELECT 
                r.id, r.rating, r.comment, r.status, r.created_at, r.updated_at,
                u.id AS user_id, u.full_name, u.avatar,
                p.id AS product_id, p.name AS product_name, p.slug AS product_slug
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             JOIN products p ON r.product_id = p.id
             WHERE 1=1
        `;
        const params = [];
        
        if (filters.status) {
            query += ` AND r.status = ?`;
            params.push(filters.status);
        }
        
        if (filters.product_id) {
            query += ` AND r.product_id = ?`;
            params.push(filters.product_id);
        }
        
        query += ` ORDER BY r.created_at DESC`;
        
        const [rows] = await pool.execute(query, params);
        return rows;
    },
    
    
    //  GET PENDING REVIEWS (Admin)
     
    findPending: async () => {
        return await reviewModel.findAll({ status: 'PENDING' });
    },
    
    //  CREATE REVIEW
    //  One review per user per product (enforced by UNIQUE constraint)

    create: async (userId, productId, rating, comment) => {
        try {
            const [result] = await pool.execute(
                `INSERT INTO reviews (user_id, product_id, rating, comment, status)
                 VALUES (?, ?, ?, ?, 'PENDING')`,
                [userId, productId, rating, comment]
            );
            return { success: true, id: result.insertId };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return { success: false, duplicate: true };
            }
            throw error;
        }
    },
    
    // GET REVIEW BY ID

    findById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT 
                r.*, u.full_name, u.avatar,
                p.name AS product_name, p.slug AS product_slug
             FROM reviews r
             JOIN users u ON r.user_id = u.id
             JOIN products p ON r.product_id = p.id
             WHERE r.id = ?`,
            [id]
        );
        return rows[0] || null;
    },
    
    // UPDATE REVIEW
     
    update: async (id, userId, data) => {
        const { rating, comment } = data;
        const [result] = await pool.execute(
            `UPDATE reviews 
             SET rating = ?, comment = ?, status = 'PENDING', updated_at = NOW()
             WHERE id = ? AND user_id = ?`,
            [rating, comment, id, userId]
        );
        return result.affectedRows > 0;
    },
    
    
    //   DELETE REVIEW
     
    delete: async (id, userId = null) => {
        let query = `DELETE FROM reviews WHERE id = ?`;
        const params = [id];
        
        if (userId) {
            query += ` AND user_id = ?`;
            params.push(userId);
        }
        
        const [result] = await pool.execute(query, params);
        return result.affectedRows > 0;
    },
    
    // APPROVE REVIEW (Admin)

    approve: async (id) => {
        const [result] = await pool.execute(
            `UPDATE reviews SET status = 'APPROVED', updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    },
    
    
    // REJECT REVIEW (Admin)
     
    reject: async (id) => {
        const [result] = await pool.execute(
            `UPDATE reviews SET status = 'REJECTED', updated_at = NOW() WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    },
    
    // GET PRODUCT RATING SUMMARY
    // Returns average rating and total review count
    getProductRatingSummary: async (productId) => {
        const [rows] = await pool.execute(
            `SELECT 
                COUNT(*) AS total_reviews,
                ROUND(AVG(rating), 1) AS average_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS two_star,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS one_star
             FROM reviews
             WHERE product_id = ? AND status = 'APPROVED'`,
            [productId]
        );
        return rows[0];
    },
    
    // CHECK IF USER ALREADY REVIEWED PRODUCT
    hasUserReviewed: async (userId, productId) => {
        const [rows] = await pool.execute(
            `SELECT COUNT(*) AS count FROM reviews 
             WHERE user_id = ? AND product_id = ?`,
            [userId, productId]
        );
        return rows[0].count > 0;
    }
};

module.exports = reviewModel;