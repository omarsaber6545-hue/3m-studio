const { logger } = require('../config/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err.message || 'Internal Server Error', { error: err });

    const statusCode = err.statusCode || err.status || 500;
    const message = err.message || 'Internal Server Error';

    if (req.accepts('html')) {
        const errorTemplates = {
            401: 'pages/401',
            403: 'pages/403',
            404: 'pages/404',
            429: 'pages/429',
            500: 'pages/500',
            503: 'pages/503'
        };

        const template = errorTemplates[statusCode] || 'pages/500';

        return res.status(statusCode).render(template, { error: message }, (renderErr, html) => {
            if (renderErr) {
                // Fallback to simple styled HTML if the EJS template fails to render
                return res.status(statusCode).send(`
                    <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0b0f19; color: #f3f4f6; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                        <h1 style="font-size: 3rem; color: #8b5cf6; margin-bottom: 10px;">Error ${statusCode}</h1>
                        <p style="font-size: 1.2rem; color: #9ca3af; max-width: 500px;">${message}</p>
                        <a href="/" style="margin-top: 20px; color: #8b5cf6; text-decoration: none; font-weight: bold; border: 1px solid #8b5cf6; padding: 10px 20px; border-radius: 8px;">Back to Home</a>
                    </div>
                `);
            }
            res.send(html);
        });
    }

    return res.status(statusCode).json({ error: message });
};

module.exports = {
    errorHandler
};
