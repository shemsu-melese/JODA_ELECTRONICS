// backend/src/app.js

const express = require('express');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// ============================================
// IMPORT ROUTES
// ============================================
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');    

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'JODA Electronics API is running! 🚀',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'not set',
        database: process.env.DB_NAME || 'not set'
    });
});

// Routes
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes); 
// ============================================
// ERROR HANDLING
// ============================================
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;