const express = require('express');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

// Load environment config
const env = require('./config/environment');
const { logger, auditLogger } = require('./config/logger');

const app = express();

// Set EJS views configurations
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Core middleware
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

// Morgan request logging piped to Winston access transporter
app.use(morgan('combined', {
    stream: { write: (message) => auditLogger.info(message.trim()) }
}));

// Serves client static assets
app.use(express.static(path.join(__dirname, '../public')));

// MONITORING ENDPOINTS: Health checks
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/status', (req, res) => {
    res.json({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        env: env.NODE_ENV
    });
});

app.get('/api/version', (req, res) => {
    res.json({ version: '1.0.0' });
});

// Fallback Route for API Version v1
app.use('/api/v1', (req, res) => {
    res.status(404).json({ error: 'v1 API route not found.' });
});

// Global Centralized Error Handler Middleware
app.use((err, req, res, next) => {
    logger.error(err.message, { error: err });
    
    // Check if client expects JSON or EJS Page
    if (req.accepts('html')) {
        res.status(500).render('pages/404', { error: 'Internal Server Error' }, (renderErr, html) => {
            if (renderErr) {
                return res.status(500).send('Internal Server Error');
            }
            res.send(html);
        });
    } else {
        res.status(500).json({ error: 'Internal Server Error.' });
    }
});

// Start Server
app.listen(env.PORT, () => {
    logger.info(`🚀 3M Studio Enterprise SaaS server started on port http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});
