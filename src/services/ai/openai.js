const AIProvider = require('./provider');
const env = require('../../config/environment');

class OpenAIProvider extends AIProvider {
    async chat(messages, options = {}) {
        const apiKey = env.OPENAI_API_KEY;
        const model = options.model || 'gpt-4o-mini';
        const url = 'https://api.openai.com/v1/chat/completions';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 2048
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
    }

    async streamChat(messages, options = {}, onChunk) {
        const apiKey = env.OPENAI_API_KEY;
        const model = options.model || 'gpt-4o-mini';
        const url = 'https://api.openai.com/v1/chat/completions';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: options.temperature ?? 0.7,
                max_tokens: options.maxTokens ?? 2048,
                stream: true
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`OpenAI API Error: ${response.status} - ${errText}`);
        }

        for await (const chunk of response.body) {
            const chunkText = chunk.toString();
            const lines = chunkText.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const dataStr = line.slice(6).trim();
                    if (dataStr === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(dataStr);
                        const text = parsed.choices?.[0]?.delta?.content || '';
                        if (text) onChunk(text);
                    } catch (e) {
                        // Skip empty buffer segments
                    }
                }
            }
        }
    }
}

module.exports = new OpenAIProvider();
