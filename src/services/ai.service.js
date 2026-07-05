const aiRepository = require('../repositories/ai.repository');
const AIProvider = require('./ai/provider');

class AIService {
    async chat(userId, messages, options = {}) {
        const provider = AIProvider.getProvider(options.model);
        const responseText = await provider.chat(messages, options);
        
        const lastPrompt = messages[messages.length - 1]?.content || '';
        
        // Save prompt completion logs
        await aiRepository.saveHistory({
            userId,
            toolType: options.toolType || 'chat',
            prompt: lastPrompt,
            response: responseText,
            tokensUsed: Math.ceil((lastPrompt.length + responseText.length) / 4)
        });

        return responseText;
    }

    async streamChat(userId, messages, options = {}, onChunk, onDone) {
        const provider = AIProvider.getProvider(options.model);
        const lastPrompt = messages[messages.length - 1]?.content || '';
        let fullResponse = '';

        await provider.streamChat(messages, options, (chunkText) => {
            fullResponse += chunkText;
            onChunk(chunkText);
        });

        // Save streaming audit logs when stream finishes
        await aiRepository.saveHistory({
            userId,
            toolType: options.toolType || 'chat',
            prompt: lastPrompt,
            response: fullResponse,
            tokensUsed: Math.ceil((lastPrompt.length + fullResponse.length) / 4)
        });

        onDone();
    }

    async getHistory(userId, toolType) {
        return aiRepository.getHistory(userId, toolType);
    }
}

module.exports = new AIService();
