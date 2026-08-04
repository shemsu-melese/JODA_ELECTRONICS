// backend/src/controllers/wishlistController.js

const wishlistModel = require('../models/wishlistModel');
const productModel = require('../models/productModel');

const wishlistController = {
    
    /**
     * GET USER'S WISHLIST
     * GET /api/wishlist
     */
    getWishlist: async (req, res, next) => {
        try {
            const wishlist = await wishlistModel.findByUser(req.user.id);
            const count = await wishlistModel.getCount(req.user.id);
            
            res.status(200).json({
                success: true,
                count: count,
                data: wishlist
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * ADD TO WISHLIST
     * POST /api/wishlist
     * Body: { product_id }
     */
    addToWishlist: async (req, res, next) => {
        try {
            const productId = parseInt(req.body.product_id);
            
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid product ID is required.'
                });
            }
            
            // Check if product exists
            const product = await productModel.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found.'
                });
            }
            
            const result = await wishlistModel.add(req.user.id, productId);
            
            if (result.duplicate) {
                return res.status(409).json({
                    success: false,
                    message: 'Product is already in your wishlist.'
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'Product added to wishlist.'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * REMOVE FROM WISHLIST
     * DELETE /api/wishlist/:productId
     */
    removeFromWishlist: async (req, res, next) => {
        try {
            const productId = parseInt(req.params.productId);
            
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid product ID is required.'
                });
            }
            
            const removed = await wishlistModel.remove(req.user.id, productId);
            
            if (!removed) {
                return res.status(404).json({
                    success: false,
                    message: 'Product not found in wishlist.'
                });
            }
            
            res.status(200).json({
                success: true,
                message: 'Product removed from wishlist.'
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * CHECK IF PRODUCT IS WISHLISTED
     * GET /api/wishlist/check/:productId
     */
    checkWishlist: async (req, res, next) => {
        try {
            const productId = parseInt(req.params.productId);
            
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Valid product ID is required.'
                });
            }
            
            const isWishlisted = await wishlistModel.isWishlisted(req.user.id, productId);
            
            res.status(200).json({
                success: true,
                is_wishlisted: isWishlisted
            });
            
        } catch (error) {
            next(error);
        }
    },
    
    /**
     * CLEAR WISHLIST
     * DELETE /api/wishlist
     */
    clearWishlist: async (req, res, next) => {
        try {
            const count = await wishlistModel.clearAll(req.user.id);
            
            res.status(200).json({
                success: true,
                message: `${count} item(s) removed from wishlist.`
            });
            
        } catch (error) {
            next(error);
        }
    }
};

module.exports = wishlistController;