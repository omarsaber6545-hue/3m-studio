const express = require('express');
const passport = require('passport');
const authController = require('../controllers/auth.controller');
const { isAuthenticated } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/ratelimit.middleware');

const router = express.Router();

// Local Email Register & Login
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);

// Session User verification
router.get('/me', isAuthenticated, authController.getCurrentUser);

// Discord OAuth Redirections
router.get('/discord', passport.authenticate('discord'));
router.get('/discord/callback', passport.authenticate('discord', {
    session: false,
    failureRedirect: '/pages/login?error=Discord authentication rejected'
}), authController.discordCallback);

module.exports = router;
