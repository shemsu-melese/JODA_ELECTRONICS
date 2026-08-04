// backend/src/routes/reviewRoutes.js

const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);

// Authenticated routes
router.post('/', protect, reviewController.createReview);
router.put('/:id', protect, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);

// Admin routes
router.get('/pending', protect, authorize('ADMIN'), reviewController.getPendingReviews);
router.put('/:id/approve', protect, authorize('ADMIN'), reviewController.approveReview);
router.put('/:id/reject', protect, authorize('ADMIN'), reviewController.rejectReview);

module.exports = router;