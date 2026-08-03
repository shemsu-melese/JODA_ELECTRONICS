// backend/src/models/userModel.js

/**
 * User Model
 * 
 * Handles all database operations for users.
 * Password hashing is done with bcryptjs BEFORE storing.
 * NEVER store plain-text passwords!
 */

const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const userModel = {
    
    /**
     * FIND USER BY EMAIL
     * Used during login to find the user account
     */
    findByEmail: async (email) => {
        const [rows] = await pool.execute(
            `SELECT 
                u.id, u.role_id, u.full_name, u.email, u.password,
                u.phone, u.avatar, u.is_active, u.created_at, u.updated_at,
                r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.email = ?`,
            [email.toLowerCase()]
        );
        return rows[0] || null;
    },
    
    /**
     * FIND USER BY ID
     * Used for profile lookups
     */
    findById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT 
                u.id, u.role_id, u.full_name, u.email,
                u.phone, u.avatar, u.is_active, u.created_at, u.updated_at,
                r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             WHERE u.id = ?`,
            [id]
        );
        return rows[0] || null;
    },
    
    /**
     * CREATE NEW USER
     * 
     * SECURITY: Password is hashed with bcrypt before storage.
     * 12 salt rounds = 2^12 iterations (industry standard)
     */
    create: async (userData) => {
        const { full_name, email, password, phone } = userData;
        
        // Hash the password with bcrypt
        // NEVER store the raw password!
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        const [result] = await pool.execute(
            `INSERT INTO users (role_id, full_name, email, password, phone, is_active)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [
                2, // Default role: CUSTOMER
                full_name,
                email.toLowerCase(),
                hashedPassword, // Store the HASH, not the plain password!
                phone || null
            ]
        );
        
        return result.insertId;
    },
    
    /**
     * VERIFY PASSWORD
     * 
     * Compares a plain-text password with the stored hash.
     * bcrypt.compare() extracts the salt from the hash automatically.
     */
    verifyPassword: async (plainPassword, hashedPassword) => {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },
    
    /**
     * UPDATE USER PROFILE
     */
    updateProfile: async (id, userData) => {
        const { full_name, phone, avatar } = userData;
        
        const [result] = await pool.execute(
            `UPDATE users 
             SET full_name = ?, phone = ?, avatar = ?
             WHERE id = ?`,
            [full_name, phone || null, avatar || null, id]
        );
        
        return result.affectedRows > 0;
    },
    
    /**
     * CHANGE PASSWORD
     */
    changePassword: async (id, newPassword) => {
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        const [result] = await pool.execute(
            `UPDATE users SET password = ? WHERE id = ?`,
            [hashedPassword, id]
        );
        
        return result.affectedRows > 0;
    },
    
    /**
     * GET ALL USERS (Admin only)
     */
    findAll: async () => {
        const [rows] = await pool.execute(
            `SELECT 
                u.id, u.role_id, u.full_name, u.email,
                u.phone, u.avatar, u.is_active, u.created_at,
                r.name AS role_name
             FROM users u
             LEFT JOIN roles r ON u.role_id = r.id
             ORDER BY u.created_at DESC`
        );
        return rows;
    },
    
    /**
     * TOGGLE USER ACTIVE STATUS
     */
    toggleStatus: async (id) => {
        const [result] = await pool.execute(
            `UPDATE users 
             SET is_active = NOT is_active 
             WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    },
    
    /**
     * CHECK IF EMAIL EXISTS
     */
    emailExists: async (email, excludeId = null) => {
        let query = `SELECT COUNT(*) AS count FROM users WHERE email = ?`;
        const params = [email.toLowerCase()];
        
        if (excludeId) {
            query += ` AND id != ?`;
            params.push(excludeId);
        }
        
        const [rows] = await pool.execute(query, params);
        return rows[0].count > 0;
    },
    
    /**
     * DELETE USER
     */
    delete: async (id) => {
        const [result] = await pool.execute(
            `DELETE FROM users WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = userModel;