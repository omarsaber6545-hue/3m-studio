const jwt = require('jsonwebtoken');
const env = require('../config/environment');
const prisma = require('../config/database');

const isAuthenticated = async (req, res, next) => {
    const token = req.signedCookies?.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
        return handleUnauthenticated(req, res);
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        
        // Fetch user matching token details
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { role: true, profile: true }
        });

        if (!user) {
            return handleUnauthenticated(req, res);
        }

        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role.name,
            profile: user.profile
        };

        return next();
    } catch (err) {
        return handleUnauthenticated(req, res);
    }
};

const handleUnauthenticated = (req, res) => {
    // Check if the client requested HTML or JSON API
    if (req.accepts('html')) {
        return res.redirect('/pages/login');
    }
    return res.status(401).json({ error: 'Unauthorized. Authentication session expired or missing.' });
};

module.exports = {
    isAuthenticated
};
