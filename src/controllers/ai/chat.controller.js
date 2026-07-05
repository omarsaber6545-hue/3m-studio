const aiService = require('../../services/ai.service');
const { logger } = require('../../config/logger');

class ChatController {
    async handleChat(req, res, next) {
        const { messages, model, temperature, maxTokens, stream } = req.body;
        const userId = req.user.id;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid messages payload.' });
        }

        const modelStr = model || 'google/gemini-2.0-flash';
        const options = {
            model: modelStr,
            temperature: temperature ?? 0.7,
            maxTokens: maxTokens ?? 2048,
            toolType: 'chat'
        };

        try {
            if (stream ?? true) {
                // Configure SSE headers
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                await aiService.streamChat(
                    userId,
                    messages,
                    options,
                    (chunkText) => {
                        res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
                    },
                    () => {
                        res.write('data: [DONE]\n\n');
                        res.end();
                    }
                );
            } else {
                const responseText = await aiService.chat(userId, messages, options);
                return res.json({ text: responseText });
            }
        } catch (err) {
            logger.error('Chat execution failed:', { error: err });
            // If headers were already sent in stream, end the request
            if (res.headersSent) {
                res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
                return res.end();
            }
            return res.status(500).json({ error: 'AI generation error: ' + err.message });
        }
    }

    async getHistory(req, res, next) {
        try {
            const history = await aiService.getHistory(req.user.id, 'chat');
            return res.json({ history });
        } catch (err) {
            next(err);
        }
    }
}

module.exports = new ChatController();
