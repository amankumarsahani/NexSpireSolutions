const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Add user info to request
        req.user = decoded;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired. Please login again.'
            });
        }

        res.status(401).json({
            error: 'Invalid token.'
        });
    }
};

// Optional auth - attaches user if token exists, but doesn't require it
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
    } catch (error) {
        // Token invalid or expired - just continue without user
    }
    next();
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Middleware to check if user is manager or admin
const isManager = (req, res, next) => {
    if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied. Manager or Admin privileges required.'
        });
    }
    next();
};

// Middleware to check if user is sales operator, manager, or admin
const isSalesOperator = (req, res, next) => {
    if (!['admin', 'manager', 'sales_operator'].includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied. Sales Operator privileges required.'
        });
    }
    next();
};

// Middleware factory to check for specific roles
const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
                userRole: req.user.role
            });
        }
        next();
    };
};

// Roles hierarchy and permissions reference:
// admin - Full access to everything, create users, assign leads, view all stats
// manager - Can manage team, leads, clients, projects. Cannot manage other admins
// sales_operator - Can view/manage assigned leads and inquiries, convert inquiries
// user - Can view and edit assigned items only

module.exports = { auth, optionalAuth, isAdmin, isManager, isSalesOperator, hasRole };

