const router = require('express').Router();
const c = require('../controllers/plantController');
const { protect } = require('../middleware/authMiddleware');
const { requireStaff, requireStaffOrCustomer } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// public read access for customers and staff management for plant CRUD
router.get('/', protect, requireStaffOrCustomer, c.getPlants);
router.post('/', protect, requireStaff, upload.single('image'), c.addPlant);
router.put('/:id', protect, requireStaff, upload.single('image'), c.updatePlant);
router.delete('/:id', protect, requireStaff, c.deletePlant);

module.exports = router;
