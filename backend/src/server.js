
//   Server Entry Point
//   This file starts our Express server and connects to the database.
 

// Load environment variables FIRST (before anything else)
require('dotenv').config();

const app = require('./app');
const { testConnection } = require('./config/db');

// Get port from environment variables or use default
const PORT = process.env.PORT || 5000;

/**
 * Start the server
 * We use an async function so we can await the database connection
 */
const startServer = async () => {
    try {
        // Test database connection first
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.warn('⚠️  Server starting without database connection');
        }
        
        // Start listening for requests
        app.listen(PORT, () => {
            
            console.log(`JODA Electronics Server Running! under Port: ${PORT} `);
            console.log(`Environment: ${process.env.NODE_ENV}`);
            
         
        });
        
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1); // Exit with error code
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(error);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(error);
    process.exit(1);
});

// Start the server
startServer();