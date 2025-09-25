const router = require('express').Router();
const c = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { requireCustomer } = require('../middleware/roleMiddleware');

router.post('/', protect, requireCustomer, c.addToCart);
router.get('/', protect, requireCustomer, c.getCart);
router.put('/item', protect, requireCustomer, c.updateCartItem);
router.delete('/item/:plantId', protect, requireCustomer, c.removeFromCart);
router.delete('/clear', protect, requireCustomer, c.clearCart);
router.get('/pricing', protect, requireCustomer, c.getCartPricing);

module.exports = router;