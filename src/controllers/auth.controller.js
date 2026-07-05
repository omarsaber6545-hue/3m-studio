const authService = require('../services/auth.service');
const { logger } = require('../config/logger');

class AuthController {
    async register(req, res, next) {
        try {
            const { username, email, password } = req.body;
            await authService.register({ username, email, password });
            return res.status(201).json({ success: true, message: 'Registration completed successfully.' });
        } catch (err) {
            logger.warn('Registration failed:', { error: err.message });
            return res.status(400).json({ error: err.message });
        }
    }

    async login(req, res, next) {
        try {
            const { email, password, rememberMe } = req.body;
            const { user, tokens } = await authService.login({ email, password });

            // Set cookie options
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                signed: true,
                sameSite: 'lax'
            };

            // Set longer age if rememberMe toggle is checked
            const maxAgeAccess = 15 * 60 * 1000; // 15 mins
            const maxAgeRefresh = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days vs 7 days

            res.cookie('token', tokens.accessToken, { ...cookieOptions, maxAge: maxAgeAccess });
            res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: maxAgeRefresh });

            return res.json({
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role.name
                }
            });
        } catch (err) {
            logger.warn('Login attempt failed:', { error: err.message });
            return res.status(400).json({ error: err.message });
        }
    }

    async logout(req, res, next) {
        try {
            const refreshToken = req.signedCookies?.refreshToken;
            await authService.logout(refreshToken);

            res.clearCookie('token');
            res.clearCookie('refreshToken');

            if (req.accepts('html')) {
                return res.redirect('/pages/login');
            }
            return res.json({ success: true, message: 'Logged out successfully.' });
        } catch (err) {
            next(err);
        }
    }

    async discordCallback(req, res, next) {
        try {
            if (!req.user) {
                return res.redirect('/pages/login?error=Discord auth failed');
            }

            const { tokens } = await authService.handleDiscordLogin(req.user);

            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                signed: true,
                sameSite: 'lax'
            };

            res.cookie('token', tokens.accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', tokens.refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

            return res.redirect('/pages/dashboard');
        } catch (err) {
            logger.error('Discord auth callback error:', { error: err });
            return res.redirect('/pages/login?error=Discord authentication error');
        }
    }

    async getCurrentUser(req, res, next) {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        return res.json({ user: req.user });
    }
}

module.exports = new AuthController();
