// backend/src/controllers/authController.js

/**
 * Authentication Controller
 * 
 * Handles user registration, login, profile management,
 * and password operations.
 */

const userModel = require('../models/userModel');
const { generateToken } = require('../middleware/auth');

const authController = {
    
    /**
     * REGISTER NEW USER
     * 
     * POST /api/auth/register
     * Body: { full_name, email, password, phone? }
     */
    register: async (req, res, next) => {
        try {
            const { full_name, email, password, phone } = req.body;
            
            // ==========================================
            // INPUT VALIDATION
            // ==========================================
            
            if (!full_name || full_name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Full name is required.'
                });
            }
            
            if (!email || email.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Email is required.'
                });
            }
            
            // Basic email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid email address.'
                });
            }
            
            if (!password || password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be at least 6 characters long.'
                });
            }
            
            // Check if email already exists
            const emailExists = await userModel.emailExists(email);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'An account with this email already exists.'
                });
            }
            
            // Create the user
            const userId = await userModel.create({
                full_name: full_name.trim(),
                email: email.toLowerCase().trim(),
                password: password, // Will be hashed in the model
                phone: phone || null
            });
            
            // Get the created user (without password)
            const user = await userModel.findById(userId);
            
            // Generate JWT token
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role_name
            });
            
            res.status(201).json({
                success: true,
                message: 'Account created successfully.',
                token: token,
                user: user
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * LOGIN USER
     * 
     * POST /api/auth/login
     * Body: { email, password }
     */
    login: async (req, res, next) => {
        try {
            const { email, password } = req.body;
            
            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide email and password.'
                });
            }
            
            // Find user by email (includes password hash)
            const user = await userModel.findByEmail(email.toLowerCase());
            
            // Check if user exists
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password.'
                });
            }
            
            // Check if account is active
            if (!user.is_active) {
                return res.status(403).json({
                    success: false,
                    message: 'Your account has been deactivated. Please contact support.'
                });
            }
            
            // Verify password
            const isPasswordValid = await userModel.verifyPassword(password, user.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid email or password.'
                });
            }
            
            // Generate token
            const token = generateToken({
                id: user.id,
                email: user.email,
                role: user.role_name
            });
            
            // Return user without password
            const { password: _, ...userWithoutPassword } = user;
            
            res.status(200).json({
                success: true,
                message: 'Login successful.',
                token: token,
                user: userWithoutPassword
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * GET CURRENT USER PROFILE
     * 
     * GET /api/auth/profile
     * Header: Authorization: Bearer <token>
     */
    getProfile: async (req, res, next) => {
        try {
            // req.user is set by the protect middleware
            const user = await userModel.findById(req.user.id);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found.'
                });
            }
            
            res.status(200).json({
                success: true,
                data: user
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * UPDATE PROFILE
     * 
     * PUT /api/auth/profile
     * Body: { full_name, phone }
     */
    updateProfile: async (req, res, next) => {
        try {
            const { full_name, phone } = req.body;
            
            if (!full_name || full_name.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Full name is required.'
                });
            }
            
            const updated = await userModel.updateProfile(req.user.id, {
                full_name: full_name.trim(),
                phone: phone || null,
                avatar: req.body.avatar || null
            });
            
            if (!updated) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update profile.'
                });
            }
            
            const user = await userModel.findById(req.user.id);
            
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully.',
                data: user
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * CHANGE PASSWORD
     * 
     * PUT /api/auth/change-password
     * Body: { current_password, new_password }
     */
    changePassword: async (req, res, next) => {
        try {
            const { current_password, new_password } = req.body;
            
            // Validate
            if (!current_password || !new_password) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password and new password are required.'
                });
            }
            
            if (new_password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'New password must be at least 6 characters long.'
                });
            }
            
            // Get user with password
            const user = await userModel.findByEmail(req.user.email);
            
            // Verify current password
            const isPasswordValid = await userModel.verifyPassword(
                current_password,
                user.password
            );
            
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Current password is incorrect.'
                });
            }
            
            // Update password
            await userModel.changePassword(req.user.id, new_password);
            
            res.status(200).json({
                success: true,
                message: 'Password changed successfully.'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * GET ALL USERS (Admin only)
     */
    getAllUsers: async (req, res, next) => {
        try {
            const users = await userModel.findAll();
            
            res.status(200).json({
                success: true,
                count: users.length,
                data: users
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * TOGGLE USER STATUS (Admin only)
     */
    toggleUserStatus: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            if (isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID.'
                });
            }
            
            const user = await userModel.findById(id);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found.'
                });
            }
            
            await userModel.toggleStatus(id);
            
            const updatedUser = await userModel.findById(id);
            
            res.status(200).json({
                success: true,
                message: `User ${updatedUser.is_active ? 'activated' : 'deactivated'} successfully.`,
                data: updatedUser
            });
            
        } catch (error) {
            next(error);
        }
    }
};

module.exports = authController;