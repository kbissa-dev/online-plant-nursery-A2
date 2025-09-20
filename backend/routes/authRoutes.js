
const express = require('express');
const { 
    registerUser, 
    loginUser,
    createStaff,
    getStaff,
    toggleStaffStatus,
    updateUserProfile, 
    getProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

router.post('/staff', protect, requireAdmin, createStaff);
router.get('/staff', protect, requireAdmin, getStaff);
router.put('/staff/:staffId/toggle', protect, requireAdmin, toggleStaffStatus);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateUserProfile);

// router.get('/loyalty', protect, getLoyaltyStatus);
// router.put('/admin/users/:userId/loyalty', protect, updateUserLoyaltyTier);

module.exports = router;