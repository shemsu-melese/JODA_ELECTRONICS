
const reviewModel = require('../models/reviewModel');
const productModel = require('../models/productModel');

const reviewController = {
    
    
    //   GET REVIEWS FOR A PRODUCT (Public)
    //   GET /api/reviews/product/:productId
     
    getProductReviews: async (req, res, next) => {
        try {
            const productId = parseInt(req.params.productId);
            
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid product ID is required.'
                });
            }
            
            const reviews = await reviewModel.findByProduct(productId);
            const summary = await reviewModel.getProductRatingSummary(productId);
            
            res.status(200).json({
                success: true,
                count: reviews.length,
                summary: summary,
                data: reviews
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    
    //   CREATE REVIEW (Authenticated)
    //  POST /api/reviews
    //  Body: { product_id, rating, comment }
     
    createReview: async (req, res, next) => {
        try {
            const { product_id, rating, comment } = req.body;
            
            // Validation
            if (!product_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Product ID is required.'
                });
            }
            
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5.'
                });
            }
            
            // Check if product exists
            const product = await productModel.findById(product_id);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found.'
                });
            }
            
            // Create review
            const result = await reviewModel.create(
                req.user.id,
                product_id,
                rating,
                comment || null
            );
            
            if (result.duplicate) {
                return res.status(409).json({
                    success: false,
                    message: 'You have already reviewed this product. You can update your existing review.'
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'Review submitted successfully. It will be visible after approval.'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    //  UPDATE REVIEW (Owner only)
    //   PUT /api/reviews/:id
     
    updateReview: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            const { rating, comment } = req.body;
            
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Rating must be between 1 and 5.'
                });
            }
            
            // Check if review exists and belongs to user
            const review = await reviewModel.findById(id);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found.'
                });
            }
            
            if (review.user_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update your own reviews.'
                });
            }
            
            await reviewModel.update(id, req.user.id, { rating, comment });
            
            res.status(200).json({
                success: true,
                message: 'Review updated. It will be visible after re-approval.'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    
    //  DELETE REVIEW (Owner or Admin)
    //  DELETE /api/reviews/:id
     
    deleteReview: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            const review = await reviewModel.findById(id);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found.'
                });
            }
            
            // Allow owner or admin to delete
            if (review.user_id !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this review.'
                });
            }
            
            const deleted = req.user.role === 'ADMIN'
                ? await reviewModel.delete(id)
                : await reviewModel.delete(id, req.user.id);
            
            res.status(200).json({
                success: true,
                message: 'Review deleted successfully.'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    
    //   APPROVE REVIEW (Admin)
    //   PUT /api/reviews/:id/approve
    
    approveReview: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            const review = await reviewModel.findById(id);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found.'
                });
            }
            
            await reviewModel.approve(id);
            
            res.status(200).json({
                success: true,
                message: 'Review approved successfully.'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * REJECT REVIEW (Admin)
     * PUT /api/reviews/:id/reject
     */
    rejectReview: async (req, res, next) => {
        try {
            const id = parseInt(req.params.id);
            
            const review = await reviewModel.findById(id);
            if (!review) {
                return res.status(404).json({
                    success: false,
                    message: 'Review not found.'
                });
            }
            
            await reviewModel.reject(id);
            
            res.status(200).json({
                success: true,
                message: 'Review rejected.'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    //  GET PENDING REVIEWS (Admin)
    //   GET /api/reviews/pending
    
    getPendingReviews: async (req, res, next) => {
        try {
            const reviews = await reviewModel.findPending();
            
            res.status(200).json({
                success: true,
                count: reviews.length,
                data: reviews
            });
            
        } catch (error) {
            next(error);
        }
    }
};

module.exports = reviewController;