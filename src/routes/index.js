const express = require('express');
const authRoutes = require('./auth.routes');
const env = require('../config/environment');

const router = express.Router();

// Mount Auth Sub-Router
router.use('/auth', authRoutes);

// Health check endpoints mounted directly inside router index
router.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

router.get('/status', (req, res) => {
    res.json({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version,
        env: env.NODE_ENV
    });
});

router.get('/version', (req, res) => {
    res.json({ version: '1.0.0' });
});

module.exports = router;
