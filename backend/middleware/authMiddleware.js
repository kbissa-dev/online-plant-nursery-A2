const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  // SOFT AUTH (dev): if a Bearer token is present, try to decode it.
  // If not present or invalid, don't block; just continue.
  const h = req.headers.authorization || '';

  if (h.startsWith('Bearer ')) {
    try {
      const token = h.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // You can log, but don't block
      console.warn('[auth] token invalid, proceeding without user');
    }
  }

  return next(); // <-- critical: never 401 in dev
};

module.exports = { protect };

