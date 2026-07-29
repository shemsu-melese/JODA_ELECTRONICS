
// Database Configuration & Connection 
 
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a connection 
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'joda_electronics'
});

// Test the database connection

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`Database connected successfully! to MySQL database: ${process.env.DB_NAME}`);
        connection.release(); // Always release connections back to the pool
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        
        return false;
    }
};

// Export the pool so other files can use it
module.exports = {
    pool,
    testConnection
};