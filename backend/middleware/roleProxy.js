// middleware/roleProxy.js

function roleProxy(requiredRole) {
  return function (req, res, next) {
    // assume JWT decoded user role is attached to req.user
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized. No user found." });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ 
        message: `Forbidden. Requires role: ${requiredRole}` 
      });
    }

    // ✅ pass through to the real controller (real object)
    next();
  };
}

module.exports = roleProxy;
