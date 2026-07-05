const express = require('express');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');

// Config and services
const env = require('./config/environment');
const { logger, auditLogger } = require('./config/logger');
const passport = require('./config/passport');
const apiRouter = require('./routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Set EJS views configurations
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Core security configurations
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            mediaSrc: ["'self'", "blob:", "data:"]
        }
    }
}));

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(compression());
app.use(cookieParser(env.SESSION_SECRET));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Morgan request logging piped to Winston access log transporter
app.use(morgan('combined', {
    stream: { write: (message) => auditLogger.info(message.trim()) }
}));

// Configure Express Sessions
app.use(session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Serves client static assets
app.use(express.static(path.join(__dirname, '../public')));

// Versioned APIs Router
app.use('/api/v1', apiRouter);

// Fallback Route for non-API html views
app.get('*', (req, res, next) => {
    // If requesting an API, return 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found.' });
    }
    
    // For non-API routes, attempt to render the page, otherwise render 404
    const pagePath = req.path === '/' ? 'pages/home/index' : `pages${req.path}/index`;
    res.render(pagePath, {}, (err, html) => {
        if (err) {
            return res.status(404).render('pages/404', { error: 'Page not found' });
        }
        res.send(html);
    });
});

// Centralized error catcher
app.use(errorHandler);

// Start Server
app.listen(env.PORT, () => {
    logger.info(`🚀 3M Studio Enterprise SaaS server started on port http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});
