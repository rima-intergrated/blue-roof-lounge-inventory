const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is no longer valid'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
    }

    // Attach user to request
    req.user = decoded;
    req.userDetails = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check user permissions
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userDetails) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.userDetails.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check specific permissions for modules
const checkPermission = (module, action) => {
  return async (req, res, next) => {
    try {
      if (!req.userDetails) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Administrator has all permissions
      if (req.userDetails.role === 'Administrator') {
        return next();
      }

      // Get user permissions from populated staff/position data
      const userWithPermissions = await User.findById(req.userDetails._id)
        .populate({
          path: 'staffId',
          populate: {
            path: 'position',
            select: 'permissions'
          }
        });

  // Prefer staffId->position->permissions (detailed role permissions)
  // Note: we populate using the 'staffId' path, so use that property name here.
  const positionPermissions = userWithPermissions.staffId?.position?.permissions;

      if (positionPermissions) {
        const modulePerm = positionPermissions[module];

        // If module entry is missing entirely, deny
        if (!modulePerm) {
          return res.status(403).json({
            success: false,
            message: `Insufficient permissions for ${module}.${action}`
          });
        }

        // If the module entry exists but has no specific flags (empty object),
        // treat that as full access to the module (create/update/delete/get)
        const isObject = modulePerm && typeof modulePerm === 'object';
        const hasFlags = isObject && Object.keys(modulePerm).length > 0;
        if (!hasFlags) {
          return next();
        }

        // If the specific action flag is present and truthy, allow
        if (modulePerm[action]) {
          return next();
        }

        // If any truthy flag exists on the module (for example `view: true`),
        // treat that as granting module-level access (fallback to full access)
        if (isObject && Object.values(modulePerm).some(v => !!v)) {
          return next();
        }

        // Deny if none of the above checks passed
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions for ${module}.${action}`
        });
      }

      // Fallback: support legacy or simplified user-level permissions array
      // e.g., req.userDetails.permissions = ['sales', 'hrm']
      const userLevelPerms = req.userDetails.permissions;
      if (Array.isArray(userLevelPerms) && userLevelPerms.includes(module)) {
        // Grant module-level access when module present in user's permissions array
        return next();
      }

      // Diagnostic logging to help identify why permission lookup failed
      try {
        // Keep logs concise and avoid sensitive data
        const debugInfo = {
          userId: req.userDetails?._id,
          userLevelPermissions: req.userDetails?.permissions || [],
          hasStaffLink: !!userWithPermissions?.staffId,
          positionPermissionsPresent: !!positionPermissions
        };
        // eslint-disable-next-line no-console
        console.warn('[PERM CHECK] No permissions assigned:', JSON.stringify(debugInfo));
      } catch (e) {
        // ignore logging errors
      }

      return res.status(403).json({
        success: false,
        message: 'No permissions assigned'
      });

    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  };
};

// Optional authentication (for public endpoints with optional user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -refreshToken');
      
      if (user && user.isActive) {
        req.user = decoded;
        req.userDetails = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

module.exports = {
  auth: authenticateToken,
  authorize,
  checkPermission,
  optionalAuth
};
