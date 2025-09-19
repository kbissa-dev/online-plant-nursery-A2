const { USER_ROLES } = require('../models/User');

const requireCustomer = (req, res, next) => {
    if (!req.user || !req.user.isCustomer()) {
        return res.status(403).json ({ message: 'Customer access required.' });
    }
    next();
};

const requireStaff = (req, res, next) => {
    if (!req.user || (!req.user.isStaff() && req.user.isAdmin())) {
        return res.status(403).json({ message: 'Staff level access required.' });
    }

    if (!req.user.isActive) {
        return res.status(403).json({ message: 'Account deactivated.' });
    }

    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin()) {
        return res.status(403).json({ message: 'Admin level access required.' });
    }

    next();
};

const requireStaffOrCustomer = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }

    if (req.user.isCustomer()) {
        return next();
    }

    if ((req.user.isStaff() || req.user.isAdmin()) && req.user.isActive) {
        return next();
    }

    return res.status(403).json({ message: 'Access denied.' });
};

module.exports = { requireCustomer, requireStaff, requireAdmin, requireStaffOrCustomer };
