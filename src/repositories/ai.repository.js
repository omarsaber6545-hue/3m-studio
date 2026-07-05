const prisma = require('../config/database');

class AIRepository {
    async saveHistory({ userId, toolType, prompt, response, tokensUsed }) {
        return prisma.aIHistory.create({
            data: {
                userId,
                toolType,
                prompt,
                response,
                tokensUsed: tokensUsed || 0
            }
        });
    }

    async getHistory(userId, toolType) {
        return prisma.aIHistory.findMany({
            where: {
                userId,
                toolType
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });
    }
}

module.exports = new AIRepository();
