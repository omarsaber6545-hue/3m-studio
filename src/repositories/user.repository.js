const prisma = require('../config/database');

class UserRepository {
    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
            include: { role: true, profile: true }
        });
    }

    async findByUsername(username) {
        return prisma.user.findUnique({
            where: { username },
            include: { role: true, profile: true }
        });
    }

    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
            include: { role: true, profile: true }
        });
    }

    async findRoleByName(name) {
        return prisma.role.findUnique({
            where: { name }
        });
    }

    async create({ username, email, passwordHash, roleId, displayName }) {
        return prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                roleId,
                profile: {
                    create: {
                        displayName: displayName || username,
                        language: 'en',
                        theme: 'dark'
                    }
                }
            },
            include: { role: true, profile: true }
        });
    }

    async updateProfile(userId, profileData) {
        return prisma.profile.update({
            where: { userId },
            data: profileData
        });
    }

    // Sessions Management
    async createSession(userId, token, expiresAt) {
        return prisma.session.create({
            data: {
                userId,
                token,
                expiresAt
            }
        });
    }

    async findSession(token) {
        return prisma.session.findUnique({
            where: { token },
            include: { user: { include: { role: true, profile: true } } }
        });
    }

    async deleteSession(token) {
        return prisma.session.delete({
            where: { token }
        }).catch(() => null); // ignore if already deleted
    }

    async deleteUserSessions(userId) {
        return prisma.session.deleteMany({
            where: { userId }
        });
    }

    // Discord account links
    async findByDiscordId(discordId) {
        return prisma.user.findFirst({
            where: {
                profile: {
                    bio: {
                        contains: `discord_id:${discordId}` // store discord metadata
                    }
                }
            },
            include: { role: true, profile: true }
        });
    }

    async linkDiscord(userId, discordId, discordUsername) {
        const user = await this.findById(userId);
        if (!user) throw new Error('User not found');

        return prisma.profile.update({
            where: { userId },
            data: {
                bio: `${user.profile.bio || ''}\ndiscord_id:${discordId}\ndiscord_username:${discordUsername}`.trim()
            }
        });
    }
}

module.exports = new UserRepository();
