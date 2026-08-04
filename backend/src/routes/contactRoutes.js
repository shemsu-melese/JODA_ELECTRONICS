const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, authorize } = require('../middleware/auth');

// Public route (anyone can submit)
router.post('/', (req, res, next) => {
    // If token is provided, verify it to get user ID
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return protect(req, res, next);
    }
    next();
}, contactController.submitMessage);

// Admin routes
router.get('/', protect, authorize('ADMIN'), contactController.getMessages);
router.get('/:id', protect, authorize('ADMIN'), contactController.getMessage);
router.put('/:id/status', protect, authorize('ADMIN'), contactController.updateStatus);
router.delete('/:id', protect, authorize('ADMIN'), contactController.deleteMessage);

module.exports = router;