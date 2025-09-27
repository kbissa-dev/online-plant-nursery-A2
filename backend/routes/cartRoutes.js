const router = require('express').Router();
const { calculateCartTotals } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');
const { requireCustomer } = require('../middleware/roleMiddleware');

router.post('/calculate-totals', protect, requireCustomer, calculateCartTotals);

module.exports = router;