const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const env = require('../config/environment');

class AuthService {
    async register({ username, email, password }) {
        const existingEmail = await userRepository.findByEmail(email);
        if (existingEmail) {
            throw new Error('Email is already registered');
        }

        const existingUser = await userRepository.findByUsername(username);
        if (existingUser) {
            throw new Error('Username is already taken');
        }

        // Get default USER role
        let role = await userRepository.findRoleByName('USER');
        if (!role) {
            // Fallback default role (seed should prevent this)
            role = { id: 'default_role_id' };
        }

        const passwordHash = await bcrypt.hash(password, 12);
        
        return userRepository.create({
            username,
            email,
            passwordHash,
            roleId: role.id,
            displayName: username
        });
    }

    async login({ email, password }) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid email or password');
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            throw new Error('Invalid email or password');
        }

        const tokens = this.generateTokens(user);
        
        // Save session
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        await userRepository.createSession(user.id, tokens.refreshToken, expiresAt);

        return { user, tokens };
    }

    async handleDiscordLogin(discordProfile) {
        const { discordId, username, email, avatar, globalName } = discordProfile;
        
        // 1. Check if email exists
        let user = await userRepository.findByEmail(email);

        if (!user) {
            // 2. If not exists, check by Discord ID metadata in profiles bio
            user = await userRepository.findByDiscordId(discordId);
        }

        if (!user) {
            // 3. Register new user
            const role = await userRepository.findRoleByName('USER');
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const passwordHash = await bcrypt.hash(randomPassword, 12);

            user = await userRepository.create({
                username: `${username}_discord_${crypto.randomBytes(3).toString('hex')}`,
                email,
                passwordHash,
                roleId: role.id,
                displayName: globalName || username
            });

            // Update Discord profile photo
            await userRepository.updateProfile(user.id, {
                avatar: avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png` : null,
                bio: `discord_id:${discordId}\ndiscord_username:${username}`
            });
        } else {
            // Account linking: verify if Discord link is in bio, if not append it
            if (!user.profile.bio || !user.profile.bio.includes(`discord_id:${discordId}`)) {
                await userRepository.linkDiscord(user.id, discordId, username);
            }
        }

        const tokens = this.generateTokens(user);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await userRepository.createSession(user.id, tokens.refreshToken, expiresAt);

        return { user, tokens };
    }

    async logout(refreshToken) {
        if (refreshToken) {
            await userRepository.deleteSession(refreshToken);
        }
    }

    generateTokens(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role.name
        };

        const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

        return { accessToken, refreshToken };
    }
}

module.exports = new AuthService();
