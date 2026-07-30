// backend/src/config/db.js

/**
 * Database Configuration & Connection Pool
 * 
 * This module creates TWO connection pools:
 * 1. initPool - Used to create the database (connects without DB selected)
 * 2. pool     - Main connection pool for all queries
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Initial Pool (Without Database)
 * Used ONLY for creating the database on first run
 */
const initPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    // NOTE: No database specified - we connect to MySQL itself
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

/**
 * Main Connection Pool (With Database)
 * Used for all application queries after database exists
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'joda_electronics_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * Test the database connection
 * Uses the main pool (with database selected)
 */
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully!');
        console.log(`📊 Connected to MySQL database: ${process.env.DB_NAME || 'joda_electronics_db'}`);
        connection.release();
        return true;
    } catch (error) {
        console.error(' Database connection failed:', error.message);
        return false;
    }
};

// Export both pools and the test function
module.exports = {
    initPool,
    pool,
    testConnection
};