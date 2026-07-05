const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security settings
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            mediaSrc: ["'self'", "blob:", "data:"]
        }
    }
}));

app.use(cors());

// Limit upload sizes to support base64 images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static frontend serving
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', apiLimiter);

// HELPER: Convert base64 DataURL to simple base64 & MIME type
function parseBase64Image(dataUrl) {
    if (!dataUrl) return null;
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;
    return {
        mimeType: matches[1],
        base64Data: matches[2]
    };
}

// ROUTE: AI Chat completion gateway
app.post('/api/ai/chat', async (req, res) => {
    const { messages, model, temperature, maxTokens, topP, stream, systemPrompt } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Invalid messages list.' });
    }

    const provider = model.split('/')[0]; // "google", "openai", "anthropic", "deepseek", "openrouter"
    const modelName = model.split('/')[1];

    try {
        if (provider === 'google') {
            // Google Gemini Completion Integration
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey || apiKey === 'mock_key') {
                return res.status(500).json({ error: 'Gemini API Key is not configured on the server.' });
            }

            // Map standard chat roles to Gemini role formats
            const contents = messages.map(msg => {
                const parts = [{ text: msg.content || '' }];
                if (msg.images && msg.images.length > 0) {
                    msg.images.forEach(imgBase64 => {
                        const parsed = parseBase64Image(imgBase64);
                        if (parsed) {
                            parts.unshift({
                                inlineData: {
                                    mimeType: parsed.mimeType,
                                    data: parsed.base64Data
                                }
                            });
                        }
                    });
                }
                return {
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts
                };
            });

            // Handle system instruction
            const systemInstruction = systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined;

            const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName || 'gemini-2.0-flash'}:${endpoint}?key=${apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    systemInstruction,
                    generationConfig: {
                        temperature: temperature ?? 0.7,
                        maxOutputTokens: maxTokens ?? 2048,
                        topP: topP ?? 0.9
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
            }

            if (stream) {
                // Stream handler
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                const reader = response.body;
                if (!reader) throw new Error('No stream response body returned.');

                // Read chunks manually
                for await (const chunk of reader) {
                    const text = chunk.toString();
                    // Gemini stream returns JSON array items or raw JSON blocks
                    // Let's forward chunks in SSE formatting
                    res.write(`data: ${JSON.stringify({ text: extractGeminiText(text) })}\n\n`);
                }
                res.write('data: [DONE]\n\n');
                return res.end();
            } else {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                return res.json({ text });
            }

        } else if (provider === 'openai' || provider === 'deepseek' || provider === 'openrouter') {
            // OpenAI style completion endpoint integration
            let apiKey = '';
            let apiUrl = '';
            
            if (provider === 'openai') {
                apiKey = process.env.OPENAI_API_KEY;
                apiUrl = 'https://api.openai.com/v1/chat/completions';
            } else if (provider === 'deepseek') {
                apiKey = process.env.DEEPSEEK_API_KEY;
                apiUrl = 'https://api.deepseek.com/v1/chat/completions';
            } else {
                apiKey = process.env.OPENROUTER_API_KEY;
                apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
            }

            if (!apiKey || apiKey === 'mock_key') {
                return res.status(500).json({ error: `${provider.toUpperCase()} API Key is not configured on the server.` });
            }

            // Map standard chat roles to OpenAI messages formats
            const mappedMessages = [];
            if (systemPrompt) {
                mappedMessages.push({ role: 'system', content: systemPrompt });
            }

            messages.forEach(msg => {
                let content = msg.content || '';
                
                // Handle image uploads (multimodal OpenAI/OpenRouter inputs)
                if (msg.images && msg.images.length > 0) {
                    content = [
                        { type: 'text', text: msg.content || '' },
                        ...msg.images.map(imgBase64 => ({
                            type: 'image_url',
                            image_url: { url: imgBase64 }
                        }))
                    ];
                }

                mappedMessages.push({
                    role: msg.role,
                    content
                });
            });

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://3mstudio.design', // Required for OpenRouter
                    'X-Title': '3M Studio'
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: mappedMessages,
                    temperature: temperature ?? 0.7,
                    max_tokens: maxTokens ?? 2048,
                    top_p: topP ?? 0.9,
                    stream: stream ?? true
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`${provider.toUpperCase()} API Error: ${response.status} - ${errText}`);
            }

            if (stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                const reader = response.body;
                if (!reader) throw new Error('No stream response body returned.');

                for await (const chunk of reader) {
                    const chunkText = chunk.toString();
                    const lines = chunkText.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6).trim();
                            if (dataStr === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(dataStr);
                                const text = parsed.choices?.[0]?.delta?.content || '';
                                if (text) {
                                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                                }
                            } catch (e) {
                                // Skip parsing errors for empty chunks
                            }
                        }
                    }
                }
                res.write('data: [DONE]\n\n');
                return res.end();
            } else {
                const data = await response.json();
                const text = data.choices?.[0]?.message?.content || '';
                return res.json({ text });
            }

        } else if (provider === 'anthropic') {
            // Anthropic Claude Messages Integration
            const apiKey = process.env.CLAUDE_API_KEY;
            if (!apiKey || apiKey === 'mock_key') {
                return res.status(500).json({ error: 'Claude API Key is not configured on the server.' });
            }

            const mappedMessages = messages.map(msg => {
                let content = msg.content || '';
                if (msg.images && msg.images.length > 0) {
                    content = [
                        { type: 'text', text: msg.content || '' },
                        ...msg.images.map(imgBase64 => {
                            const parsed = parseBase64Image(imgBase64);
                            return {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: parsed.mimeType,
                                    data: parsed.base64Data
                                }
                            };
                        })
                    ];
                }
                return {
                    role: msg.role,
                    content
                };
            });

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: modelName,
                    messages: mappedMessages,
                    system: systemPrompt,
                    max_tokens: maxTokens ?? 2048,
                    temperature: temperature ?? 0.7,
                    stream: stream ?? true
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Claude API Error: ${response.status} - ${errText}`);
            }

            if (stream) {
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                const reader = response.body;
                for await (const chunk of reader) {
                    const chunkText = chunk.toString();
                    const lines = chunkText.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.slice(6).trim();
                            try {
                                const parsed = JSON.parse(dataStr);
                                if (parsed.type === 'content_block_delta') {
                                    const text = parsed.delta?.text || '';
                                    res.write(`data: ${JSON.stringify({ text })}\n\n`);
                                }
                            } catch (e) {
                                // Skip
                            }
                        }
                    }
                }
                res.write('data: [DONE]\n\n');
                return res.end();
            } else {
                const data = await response.json();
                const text = data.content?.[0]?.text || '';
                return res.json({ text });
            }
        } else {
            return res.status(400).json({ error: 'Unsupported AI provider.' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'AI completion error: ' + err.message });
    }
});

// Helper: Extract Text content from Gemini stream response chunks
function extractGeminiText(rawChunk) {
    try {
        const parsed = JSON.parse(rawChunk);
        return parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
        // Handle chunk pieces
        const match = rawChunk.match(/"text":\s*"((?:[^"\\]|\\.)*)"/);
        if (match && match[1]) {
            return JSON.parse(`"${match[1]}"`); // unescape string
        }
    }
    return '';
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 3M Studio server running on port http://localhost:${PORT}`);
});
