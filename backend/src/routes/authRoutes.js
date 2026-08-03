// backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// ============================================
// PUBLIC ROUTES
// ============================================

// Register
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// ============================================
// PROTECTED ROUTES (Need valid token)
// ============================================

// Get current user profile
router.get('/profile', protect, authController.getProfile);

// Update profile
router.put('/profile', protect, authController.updateProfile);

// Change password
router.put('/change-password', protect, authController.changePassword);

// ============================================
// ADMIN ROUTES
// ============================================

// Get all users
router.get('/users', protect, authorize('ADMIN'), authController.getAllUsers);

// Toggle user status
router.put('/users/:id/status', protect, authorize('ADMIN'), authController.toggleUserStatus);

module.exports = router;