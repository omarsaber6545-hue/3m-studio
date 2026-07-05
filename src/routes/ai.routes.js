const express = require('express');
const chatController = require('../controllers/ai/chat.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/ratelimit.middleware');

const router = express.Router();

// Mount protected AI Chat endpoints
router.post('/chat', isAuthenticated, apiLimiter, chatController.handleChat);
router.get('/chat/history', isAuthenticated, chatController.getHistory);

module.exports = router;
