// backend/routes/inventoryRoutes.js
const router = require('express').Router();
const c = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');

// Stock ops
router.post('/plants/:id/adjust', protect, c.adjustStock);
router.get('/plants/:id/stock', protect, c.checkStock);
router.get('/low-stock', protect, c.listLowStock);

// Orders with stock reduction
router.post('/apply-order', protect,  c.applyOrder);

module.exports = router;
