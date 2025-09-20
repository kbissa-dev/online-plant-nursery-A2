
const User = require('../models/User');
const { USER_ROLES } = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// for customers only
const registerUser = async (req, res) => {
    const { name, email, address, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const user = await User.create({ 
            name, 
            email, 
            address, 
            password,
            role: USER_ROLES.CUSTOMER,
            loyaltyTier: 'green',
            totalSpent: 0,
            loyaltyPoints: 0
        });

        res.status(201).json({ 
            id: user.id, 
            name: user.name,
            address: user.address, 
            email: user.email,
            role: user.role,
            loyaltyTier: user.loyaltyTier,
            token: generateToken(user.id)            
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {          
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isCustomer() && !user.isActive) {
            return res.status(401).json({ message: 'Account deactivated.'});
        }

        const response = {
            id: user.id,
            name: user.name,
            email: user.email,
            address: user.address,
            role: user.role,
            isActive: user.isActive,
            token: generateToken(user.id)
        };

        if (user.isCustomer()) {
            response.address = user.address;
            response.loyaltyTier = user.loyaltyTier;
            response.loyaltyInfo = user.getLoyaltyInfo();
        }

        if (user.canManagePlants()) {
            response.employeeId = user.employeeId;
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createStaff = async (req, res) => {
    try {
        if (!req.user.isAdmin()) {
            return res.status(403).json({ message: 'Admin access level required.' });
        }

        const { name, email, password, role, employeeId } = req.body;

        if (![USER_ROLES.STAFF, USER_ROLES.ADMIN].includes(role)) {
            return res.status(400).json({ message: 'Invalid role.' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists.' });

        const staff = await User.create({
            name,
            email,
            password,
            role,
            employeeId,
            isActive: true,
            createdBy: req.user._id
        });

        res.status(201).json({
            id: staff.id,
            name: staff.name,
            email: staff.email,
            role: staff.role,
            employeeId: staff.employeeId,
            isActive: staff.isActive,
            message: `${role} account created successfully`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getStaff = async (req, res) => {
    try {
        if (!req.user.isAdmin()) {
            return res.status(403).json({ message: 'Admin level access required.' });
        }

        const staff = await User.find({
            role: { $in: [USER_ROLES.STAFF, USER_ROLES.ADMIN] }
        }).select('-password');

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const toggleStaffStatus = async (req, res) => {
    try {
        if (!req.user.isAdmin()) {
            return res.status(403).json({ message: 'Admin access level required.' });
        }

        const { staffId } = req.params;
        const staff = await User.findById(staffId);

        if (!staff || staff.isCustomer()) {
            return res.status(404).json({ message: 'Staff member not found.' });
        }

        staff.isActive = !staff.isActive;
        await staff.save();

        res.json({
            id: staff.id,
            name: staff.name,
            isActive: staff.isActive,
            message: `Staff ${staff.isActive ? 'activated' : 'deactivated'}`
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const profile = {
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      };

      if (user.isCustomer()) {
        profile.address = user.address;
        profile.loyaltyTier = user.loyaltyTier;
        profile.loyaltyInfo = user.getLoyaltyInfo;
      }

      if (user.canManagePlants()) {
        profile.employeeId = user.employeeId;
      }
  
      res.status(200).json(profile);
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  };

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email } = req.body;
        user.name = name || user.name;
        user.email = email || user.email;

        if (user.isCustomer()) {
            const { address } = req.body;
            user.address = address || user.address;
        }

        const updatedUser = await user.save();

        const response = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser.id)
        };

        if (updatedUser.isCustomer()) {
            response.address = updatedUser.address;
            response.loyaltyTier = updatedUser.loyaltyTier;
            response.loyaltyInfo = updatedUser.getLoyaltyInfo();
        }

        res.json(response);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, createStaff, getStaff, toggleStaffStatus, getProfile, updateUserProfile };
