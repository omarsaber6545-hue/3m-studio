class AIProvider {
    /**
     * Send chat completion request
     * @param {Array} messages List of message objects
     * @param {Object} options Parameters (temperature, maxTokens, model)
     * @returns {Promise<string>} Responded text
     */
    async chat(messages, options) {
        throw new Error('Method chat() must be implemented');
    }

    /**
     * Send streaming completion request
     * @param {Array} messages List of message objects
     * @param {Object} options Parameters
     * @param {Function} onChunk Callback executed on chunk chunks
     */
    async streamChat(messages, options, onChunk) {
        throw new Error('Method streamChat() must be implemented');
    }

    /**
     * Resolve model provider instances dynamically
     * @param {string} model Model string (e.g. 'google/gemini-2.0-flash')
     * @returns {AIProvider} Resolved provider instance
     */
    static getProvider(model) {
        const providerName = model.split('/')[0];
        
        switch (providerName) {
            case 'google':
                return require('./gemini');
            case 'openai':
                return require('./openai');
            case 'anthropic':
                return require('./claude');
            case 'deepseek':
                return require('./deepseek');
            case 'openrouter':
                return require('./openrouter');
            default:
                throw new Error(`Unsupported AI model provider: ${providerName}`);
        }
    }
}

module.exports = AIProvider;
