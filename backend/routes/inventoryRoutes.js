const router = require('express').Router();
const c = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { requireStaff, requireCustomer } = require('../middleware/roleMiddleware');

// staff only operations for inventory control
router.post('/plants/:id/adjust', protect, requireStaff, c.adjustStock);
router.get('/plants/:id/stock', protect, requireStaff, c.checkStock);
router.get('/low-stock', protect, requireStaff, c.listLowStock);

// customer only when submitting orders then stock (inventory) reduction
router.post('/apply-order', protect, requireCustomer, c.applyOrder);

module.exports = router;
