const AIProvider = require('./provider');
const env = require('../../config/environment');

class GeminiProvider extends AIProvider {
    async chat(messages, options = {}) {
        const apiKey = env.GEMINI_API_KEY;
        const model = options.model || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content || '' }]
        }));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: options.maxTokens ?? 2048
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }

    async streamChat(messages, options = {}, onChunk) {
        const apiKey = env.GEMINI_API_KEY;
        const model = options.model || 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content || '' }]
        }));

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: options.maxTokens ?? 2048
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
        }

        for await (const chunk of response.body) {
            const rawChunk = chunk.toString();
            // Parse Gemini stream JSON structures
            try {
                const parsed = JSON.parse(rawChunk);
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                if (text) onChunk(text);
            } catch (e) {
                // Fallback manual regex extractor if buffer splits JSON chunks
                const match = rawChunk.match(/"text":\s*"((?:[^"\\]|\\.)*)"/);
                if (match && match[1]) {
                    try {
                        const text = JSON.parse(`"${match[1]}"`);
                        if (text) onChunk(text);
                    } catch (err) {
                        // Skip corrupt fragments
                    }
                }
            }
        }
    }
}

module.exports = new GeminiProvider();
