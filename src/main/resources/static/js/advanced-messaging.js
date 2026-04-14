/**
 * Advanced Messaging System for CrewCanvas
 * Extends basic messaging with:
 * 1. Emoji Support
 * 2. File Attachments
 * 3. Mock End-to-End Encryption
 * 4. Rich Media Handling
 */

const AdvancedMessaging = {

    /**
     * EMOJI HANDLER
     */
    initEmojiPicker(inputId, buttonId) {
        const btn = document.getElementById(buttonId);
        const input = document.getElementById(inputId);

        if (!btn || !input) return;

        // Simple mock emoji list for film industry
        const emojis = ['🎬', '🎥', '🎭', '⭐', '🔥', '🎞️', '🍿', '💡', '✅', '❤️', '👏', '🎨'];

        const picker = document.createElement('div');
        picker.className = 'emoji-picker-popup';
        picker.style = `
            display: none; position: absolute; bottom: 60px; right: 0;
            background: white; border-radius: 12px; padding: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1); grid-template-columns: repeat(4, 1fr);
            gap: 5px; z-index: 1000;
        `;

        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.innerText = emoji;
            span.style.cursor = 'pointer';
            span.style.fontSize = '20px';
            span.style.padding = '5px';
            span.onclick = () => {
                input.value += emoji;
                picker.style.display = 'none';
                input.focus();
            };
            picker.appendChild(span);
        });

        document.body.appendChild(picker);

        btn.onclick = (e) => {
            e.stopPropagation();
            const rect = btn.getBoundingClientRect();
            picker.style.top = (rect.top - 150) + 'px';
            picker.style.left = rect.left + 'px';
            picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
        };

        window.onclick = () => picker.style.display = 'none';
    },

    /**
     * MOCK ENCRYPTION
     * Encodes message content to simulate safe transmission
     */
    encrypt(text) {
        if (!text) return text;
        // Simple Base64 for visual simulation of "encrypted" state in network tab
        return btoa(unescape(encodeURIComponent(text)));
    },

    decrypt(encodedText) {
        if (!encodedText) return encodedText;
        try {
            return decodeURIComponent(escape(atob(encodedText)));
        } catch (e) {
            return encodedText; // Return original if not base64
        }
    },

    /**
     * FILE ATTACHMENT HANDLER
     */
    async handleAttachment(file) {
        if (!file) return null;

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            showMessage('File too large (Max 5MB)', 'error');
            return null;
        }

        try {
            // Reusing existing uploadImage logic or base64 fallback
            return await uploadImage(file);
        } catch (error) {
            console.error('Attachment upload failed:', error);
            return null;
        }
    }
};

// Enhancement for existing loadMessages in messages.js
function enhanceMessageDisplay(msg) {
    // Decrypt if it looks encrypted
    const content = AdvancedMessaging.decrypt(msg.content);

    // Process hashtags or @mentions if needed
    return content.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
}

// Export for use in messages.js
window.AdvancedMessaging = AdvancedMessaging;
