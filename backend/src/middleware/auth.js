// backend/src/middleware/auth.js

/**
 * Authentication & Authorization Middleware
 * 
 * This middleware protects routes by verifying JWT tokens.
 * 
 * How it works:
 * 1. Extract token from Authorization header
 * 2. Verify token signature with secret key
 * 3. If valid, attach user info to request object
 * 4. If invalid, return 401 Unauthorized
 */

const jwt = require('jsonwebtoken');

// Secret key for signing tokens
// In production, this should be a long, random string in .env
const JWT_SECRET = process.env.JWT_SECRET || 'joda_electronics_secret_key_change_in_production';

/**
 * PROTECT MIDDLEWARE
 * 
 * Verifies that the user is authenticated (has a valid token).
 * Does NOT check user role — use authorize() for role checks.
 */
const protect = async (req, res, next) => {
    try {
        let token;
        
        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            // Extract token from "Bearer <token>"
            token = req.headers.authorization.split(' ')[1];
        }
        
        // If no token found
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized. Please login to access this resource.'
            });
        }
        
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Attach user info to request object
        // All subsequent middleware/controllers can access req.user
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };
        
        // Continue to the next middleware/controller
        next();
        
    } catch (error) {
        // Token verification failed
        return res.status(401).json({
            success: false,
            message: 'Not authorized. Token is invalid or expired.'
        });
    }
};

/**
 * AUTHORIZE MIDDLEWARE
 * 
 * Restricts access based on user roles.
 * Must be used AFTER protect middleware.
 * 
 * Usage: router.delete('/:id', protect, authorize('ADMIN'), controller.delete)
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        // Check if user's role is in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource.`
            });
        }
        next();
    };
};

/**
 * GENERATE JWT TOKEN
 * 
 * Creates a signed JWT token with user information.
 * Token expires in 30 days.
 * 
 * @param {Object} user - User object { id, email, role }
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: '30d' // Token expires in 30 days
        }
    );
};

module.exports = {
    protect,
    authorize,
    generateToken
};