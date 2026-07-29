//Express Application Setup
 
const express = require('express');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true,               
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json());        // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form data

/**
 * Request Logger 
 * Logs every request so we can see what's happening
 */
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================
app.get('/', (req, res)=>{
    res.status(200).json({
        success: true,
        message: 'JODA Electronics HOME PAGE',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

app.get('/contact', (req, res)=>{
    res.status(200).json({
        success: true,
        message: 'JODA Electronics CONTACT PAGE',
        timestamp: new Date().toISOString(),
        
    });
});
/**
 * Health Check Route
 * A simple endpoint to verify our server is running
 */
app.get('/product', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'JODA Electronics API PRODUCT PAGE',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// API Routes will be added here as we build features
// Example: app.use('/api/products', productRoutes);


// Handle 404 - Route not found
app.use(notFoundHandler);

// Handle all other errors
app.use(errorHandler);

module.exports = app;