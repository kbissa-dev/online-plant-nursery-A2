const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { requireCustomer, requireStaff, requireStaffOrCustomer } = require('../middleware/roleMiddleware');

// customers can view their own orders and staff can view all orders
router.get('/', protect, requireStaffOrCustomer, c.getOrders);
// only customers can create orders, staff use need to create separate personal accounts to become member
router.post('/', protect, requireCustomer, c.addOrder);
// staff can update order status and customers can **cancel** within 5 minutes
router.put('/:id', protect, requireStaffOrCustomer, c.updateOrder);
router.put('/:id/cancel', protect, requireCustomer, c.cancelOrder);
// only staff can delete orders
router.delete('/:id', protect, requireStaff, c.deleteOrder);

module.exports = router;
