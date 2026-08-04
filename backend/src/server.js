//   Server Entry Point
const dotenv = require('dotenv');
const path = require('path');
const result = dotenv.config({ 
    path: path.join(__dirname, '..', '.env') 
});

if (result.error) {
    console.error(' Error loading .env file:', result.error.message);
} else {
    console.log('Environment variables loaded');
}

const app = require('./app');
const { testConnection } = require('./config/db');
const runMigration = require('./config/migrate');

// Get port from environment variables or use default
const PORT = process.env.PORT || 5000;

//  Start the server

const startServer = async () => {
    try {
        // Run database migration
        await runMigration();
        
        // Test the database connection
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.warn('Server starting without database connection');
        }
        
        // Start listening
        app.listen(PORT, () => {
            console.log(`JODA Electronics Server Running! under Port: ${PORT} `);
        });
        
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
    console.error('UNHANDLED REJECTION!');
    console.error(error);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION!');
    console.error(error);
    process.exit(1);
});

// Start the server
startServer();