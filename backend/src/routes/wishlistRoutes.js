// backend/src/routes/wishlistRoutes.js

const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/clear', wishlistController.clearWishlist);
router.get('/check/:productId', wishlistController.checkWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;