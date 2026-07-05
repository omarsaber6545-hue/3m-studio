document.addEventListener('DOMContentLoaded', () => {
    let currentConversation = [];
    let isGenerating = false;
    let uploadedImageBase64 = null;

    const messagesContainer = document.getElementById('chat-messages-container');
    const welcomePane = document.getElementById('chat-welcome-pane');
    const promptTextarea = document.getElementById('chat-prompt-textarea');
    const sendBtn = document.getElementById('btn-chat-send');
    const modelSelect = document.getElementById('chat-model-select');
    
    // Sliders
    const tempSlider = document.getElementById('param-temperature');
    const tempVal = document.getElementById('val-temperature');
    const maxTokensInput = document.getElementById('param-max-tokens');
    const settingsSidebar = document.getElementById('chat-settings-sidebar');
    const settingsToggle = document.getElementById('btn-chat-settings-toggle');

    // Attachments
    const attachBtn = document.getElementById('btn-chat-attach');
    const fileInput = document.getElementById('chat-file-input');
    const imgPreviewBox = document.getElementById('chat-image-preview-box');
    const imgPreviewImg = document.getElementById('chat-image-preview-img');
    const imgPreviewName = document.getElementById('chat-image-preview-name');
    const imgPreviewRemove = document.getElementById('btn-chat-image-remove');
    
    // Counter
    const charCountEl = document.getElementById('chat-char-count');

    // Toggle settings sidebar
    if (settingsToggle && settingsSidebar) {
        settingsToggle.addEventListener('click', () => {
            settingsSidebar.style.display = settingsSidebar.style.display === 'none' ? 'flex' : 'none';
        });
    }

    if (tempSlider && tempVal) {
        tempSlider.addEventListener('input', (e) => {
            tempVal.textContent = e.target.value;
        });
    }

    // Input handlers
    if (promptTextarea) {
        promptTextarea.addEventListener('input', (e) => {
            const len = e.target.value.length;
            charCountEl.textContent = len;
            sendBtn.disabled = len === 0 && !uploadedImageBase64;
            
            // Auto resize height
            promptTextarea.style.height = 'auto';
            promptTextarea.style.height = (promptTextarea.scrollHeight) + 'px';
        });

        // Ctrl+Enter hotkey to send message
        promptTextarea.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                triggerSend();
            }
        });
    }

    // Attachments actions
    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedImageBase64 = event.target.result;
                    imgPreviewImg.src = uploadedImageBase64;
                    imgPreviewName.textContent = file.name;
                    imgPreviewBox.style.display = 'flex';
                    sendBtn.disabled = false;
                };
                reader.readAsDataURL(file);
            }
        });
        
        imgPreviewRemove.addEventListener('click', () => {
            uploadedImageBase64 = null;
            imgPreviewBox.style.display = 'none';
            sendBtn.disabled = promptTextarea.value.trim().length === 0;
            fileInput.value = '';
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', triggerSend);
    }

    // Markdown simple formatter
    function formatMarkdown(text) {
        if (!text) return '';
        let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        
        // Code blocks
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        html = html.replace(codeBlockRegex, (match, lang, code) => `
            <div class="code-block-container" style="border: 1px solid var(--border-color); border-radius: 8px; margin: 1rem 0; overflow: hidden; background: var(--bg-primary); font-family: var(--font-mono); font-size: 0.85rem; text-align: left;">
                <div style="background: var(--bg-secondary); padding: 0.5rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
                    <span style="font-weight: 700; text-transform: uppercase;">${lang || 'code'}</span>
                    <button onclick="navigator.clipboard.writeText(this.nextElementSibling.value).then(() => toasts.show('Code copied', 'success'))" style="background: none; border: none; color: inherit; cursor: pointer; font-weight: 600;">Copy</button>
                    <input type="hidden" value="${code.replace(/"/g, '&quot;')}">
                </div>
                <pre style="margin: 0; padding: 1rem; overflow-x: auto; white-space: pre; line-height: 1.5; color: var(--text-primary);"><code>${code}</code></pre>
            </div>
        `);
        
        // Bold / Italic
        html = html.replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([\s\S]*?)\*/g, '<em>$1</em>');
        html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(255,255,255,0.06); padding: 0.15rem 0.35rem; border-radius: 4px; font-family: var(--font-mono); font-size: 0.85em;">$1</code>');
        html = html.replace(/\n/g, '<br>');
        return html;
    }

    function appendMessage(role, content, image = null, isStreaming = false) {
        if (welcomePane) welcomePane.style.display = 'none';

        const bubbleId = isStreaming ? 'chat-streaming-bubble' : `msg-${Date.now()}`;
        let bubble = document.getElementById(bubbleId);

        if (bubble) {
            bubble.querySelector('.msg-text').innerHTML = formatMarkdown(content);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.id = bubbleId;
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = role === 'user' ? 'flex-end' : 'flex-start';
        wrapper.style.width = '100%';

        const imageMarkup = image ? `<img src="${image}" style="max-width: 260px; border-radius: 8px; margin-bottom: 0.5rem; border: 1px solid var(--border-color);">` : '';

        wrapper.innerHTML = `
            <div style="max-width: 75%; padding: 1rem 1.25rem; border-radius: 12px; background: ${role === 'user' ? 'var(--surface-primary)' : 'var(--bg-secondary)'}; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.25rem; text-align: left;">
                <span style="font-size: 0.65rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">${role === 'user' ? 'You' : 'Assistant'}</span>
                ${imageMarkup}
                <div class="msg-text" style="font-size: 0.9rem; line-height: 1.6; color: var(--text-primary);">${formatMarkdown(content)}</div>
            </div>
        `;

        messagesContainer.appendChild(wrapper);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async function triggerSend() {
        const text = promptTextarea.value.trim();
        if (!text && !uploadedImageBase64) return;
        if (isGenerating) return;

        isGenerating = true;
        sendBtn.disabled = true;

        const userMessage = { role: 'user', content: text };
        if (uploadedImageBase64) {
            userMessage.images = [uploadedImageBase64];
        }

        currentConversation.push(userMessage);
        appendMessage('user', text, uploadedImageBase64);
        
        // Reset inputs
        promptTextarea.value = '';
        promptTextarea.style.height = 'auto';
        uploadedImageBase64 = null;
        imgPreviewBox.style.display = 'none';

        // Add thinking loading state
        appendMessage('assistant', 'Thinking...', null, true);

        try {
            const response = await fetch('/api/v1/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: currentConversation,
                    model: modelSelect.value,
                    temperature: parseFloat(tempSlider.value),
                    maxTokens: parseInt(maxTokensInput.value),
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error('Completions query failed');
            }

            // Remove thinking preloader bubble
            const streamBubble = document.getElementById('chat-streaming-bubble');
            if (streamBubble) streamBubble.remove();

            appendMessage('assistant', '', null, true);
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let assistantText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.text) {
                                assistantText += parsed.text;
                                appendMessage('assistant', assistantText, null, true);
                            }
                        } catch (e) {
                            // Skip formatting errors
                        }
                    }
                }
            }

            // Lock in final bubble
            const finalBubble = document.getElementById('chat-streaming-bubble');
            if (finalBubble) finalBubble.remove();
            
            appendMessage('assistant', assistantText);
            currentConversation.push({ role: 'assistant', content: assistantText });

        } catch (err) {
            toasts.show('AI Generation failed: ' + err.message, 'error');
            const streamBubble = document.getElementById('chat-streaming-bubble');
            if (streamBubble) streamBubble.remove();
        } finally {
            isGenerating = false;
            sendBtn.disabled = promptTextarea.value.trim().length === 0;
        }
    }
});
