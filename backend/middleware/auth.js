const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found. Token invalid.' });
    }

    if (!req.user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Authorize roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

// Log activity middleware (can be used per route)
exports.logActivity = (action, entity, getEntityInfo) => {
  return async (req, res, next) => {
    // Call next first, then log after response
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      originalJson(data);
      if (data.success && req.user) {
        try {
          const entityInfo = getEntityInfo ? getEntityInfo(req, data) : {};
          await Activity.create({
            user: req.user._id,
            action,
            entity,
            entityId: entityInfo.id || null,
            entityTitle: entityInfo.title || '',
            details: entityInfo.details || {},
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
        } catch (err) {
          console.error('Activity log error:', err.message);
        }
      }
    };
    next();
  };
};
