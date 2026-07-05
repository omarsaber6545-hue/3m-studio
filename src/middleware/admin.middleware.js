const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        return next();
    }
    
    // Check if client expects HTML or JSON
    if (req.accepts('html')) {
        return res.status(403).render('pages/403', { error: 'Forbidden. Administrator privileges required.' }, (renderErr, html) => {
            if (renderErr) {
                return res.status(403).send('Forbidden. Access Denied.');
            }
            res.send(html);
        });
    }
    
    return res.status(403).json({ error: 'Forbidden. Access restricted to administrator credentials.' });
};

module.exports = {
    isAdmin
};
