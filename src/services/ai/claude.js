const AIProvider = require('./provider');
const env = require('../../config/environment');

class ClaudeProvider extends AIProvider {
    async chat(messages, options = {}) {
        const apiKey = env.CLAUDE_API_KEY;
        const model = options.model || 'claude-3-haiku-20240307';
        const url = 'https://api.anthropic.com/v1/messages';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                max_tokens: options.maxTokens ?? 2048,
                temperature: options.temperature ?? 0.7
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Claude API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text || '';
    }

    async streamChat(messages, options = {}, onChunk) {
        const apiKey = env.CLAUDE_API_KEY;
        const model = options.model || 'claude-3-haiku-20240307';
        const url = 'https://api.anthropic.com/v1/messages';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                max_tokens: options.maxTokens ?? 2048,
                temperature: options.temperature ?? 0.7,
                stream: true
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Claude API Error: ${response.status} - ${errText}`);
        }

        for await (const chunk of response.body) {
            const chunkText = chunk.toString();
            const lines = chunkText.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (parsed.type === 'content_block_delta') {
                            const text = parsed.delta?.text || '';
                            if (text) onChunk(text);
                        }
                    } catch (e) {
                        // Skip empty buffer lines
                    }
                }
            }
        }
    }
}

module.exports = new ClaudeProvider();
