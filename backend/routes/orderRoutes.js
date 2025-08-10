const router = require('express').Router();
const c = require('../controllers/orderController');
// const auth = require('../middleware/auth');
// router.use(auth);
router.get('/', c.getOrders);
router.post('/', c.addOrder);
router.put('/:id', c.updateOrder);
router.delete('/:id', c.deleteOrder);
module.exports = router;
