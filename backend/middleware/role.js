const jwt = require('jsonwebtoken');

// Verify Admin JWT Token
const verifyAdminToken = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Not an admin token.' });
    }
    
    // Set req.admin so we don't conflict with participant's req.user
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Role-Based Authorization
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin || !req.admin.role) {
      return res.status(403).json({ message: 'Forbidden: No role found.' });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Your role '${req.admin.role}' does not have permission to access this resource.` 
      });
    }

    next();
  };
};

module.exports = {
  verifyAdminToken,
  authorizeRoles
};
