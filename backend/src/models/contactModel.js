const { pool } = require('../config/db');
const contactModel = {
    
    //  CREATE CONTACT MESSAGE
    //  user_id is NULL for guest messages
     
    create: async (messageData, userId = null) => {
        const { name, email, phone, subject, message } = messageData;
        
        const [result] = await pool.execute(
            `INSERT INTO contact_messages 
             (user_id, name, email, phone, subject, message, status)
             VALUES (?, ?, ?, ?, ?, ?, 'NEW')`,
            [userId, name, email, phone || null, subject, message]
        );
        
        return result.insertId;
    },
    
    // GET ALL MESSAGES (Admin)
    // Supports filtering by status
     
    findAll: async (filters = {}) => {
        let query = `
            SELECT 
                cm.*,
                u.full_name AS user_name,
                u.email AS user_email
             FROM contact_messages cm
             LEFT JOIN users u ON cm.user_id = u.id
             WHERE 1=1
        `;
        const params = [];
        
        if (filters.status) {
            query += ` AND cm.status = ?`;
            params.push(filters.status);
        }
        
        query += ` ORDER BY 
            CASE WHEN cm.status = 'NEW' THEN 0 ELSE 1 END,
            cm.created_at DESC`;
        
        const [rows] = await pool.execute(query, params);
        return rows;
    },
    
    // FIND MESSAGE BY ID
     
    findById: async (id) => {
        const [rows] = await pool.execute(
            `SELECT 
                cm.*,
                u.full_name AS user_name,
                u.email AS user_email
             FROM contact_messages cm
             LEFT JOIN users u ON cm.user_id = u.id
             WHERE cm.id = ?`,
            [id]
        );
        return rows[0] || null;
    },

// UPDATE MESSAGE STATUS
     
    updateStatus: async (id, status) => {
        const [result] = await pool.execute(
            `UPDATE contact_messages 
             SET status = ?, updated_at = NOW()
             WHERE id = ?`,
            [status, id]
        );
        return result.affectedRows > 0;
    },
    
    // DELETE MESSAGE
    
    delete: async (id) => {
        const [result] = await pool.execute(
            `DELETE FROM contact_messages WHERE id = ?`,
            [id]
        );
        return result.affectedRows > 0;
    },
    
    // GET MESSAGE COUNTS BY STATUS
    
    getCountsByStatus: async () => {
        const [rows] = await pool.execute(
            `SELECT 
                status,
                COUNT(*) AS count
             FROM contact_messages
             GROUP BY status`
        );
        return rows;
    }
};

module.exports = contactModel;