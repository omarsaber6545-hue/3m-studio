const hasRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized.' });
        }
        
        if (allowedRoles.includes(req.user.role)) {
            return next();
        }
        
        return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    };
};

module.exports = {
    hasRole
};
