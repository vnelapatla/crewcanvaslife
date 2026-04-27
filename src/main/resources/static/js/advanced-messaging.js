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

        // Stickers for film industry (Mock URLs/Base64 or large emojis)
        const stickers = [
            { name: 'Director', icon: '🎬', color: '#000' },
            { name: 'Camera', icon: '🎥', color: '#333' },
            { name: 'Star', icon: '⭐', color: '#ffc107' },
            { name: 'Oscar', icon: '🏆', color: '#ffd700' },
            { name: 'Popcorn', icon: '🍿', color: '#e91e63' },
            { name: 'Action', icon: '🔥', color: '#ff5722' },
            { name: 'Cool', icon: '😎', color: '#2196f3' },
            { name: 'Love', icon: '❤️', color: '#f44336' }
        ];

        const emojis = ['🎬', '🎥', '🎭', '⭐', '🔥', '🎞️', '🍿', '💡', '✅', '❤️', '👏', '🎨', '😎', '👍', '🙏', '💯'];

        const picker = document.createElement('div');
        picker.className = 'emoji-picker-popup';
        picker.style = `
            display: none; position: absolute; bottom: 60px; right: 0;
            background: white; border-radius: 12px; padding: 0;
            box-shadow: 0 4px 25px rgba(0,0,0,0.15); width: 280px;
            z-index: 1000; overflow: hidden; border: 1px solid #eee;
        `;

        picker.innerHTML = `
            <div style="display: flex; background: #f8f9fa; border-bottom: 1px solid #eee;">
                <div id="emojiTab" style="flex: 1; padding: 10px; text-align: center; cursor: pointer; border-bottom: 2px solid var(--primary-orange); font-size: 13px; font-weight: 600;">Emojis</div>
                <div id="stickerTab" style="flex: 1; padding: 10px; text-align: center; cursor: pointer; border-bottom: 2px solid transparent; font-size: 13px; font-weight: 600;">Stickers</div>
            </div>
            <div id="emojiGrid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; padding: 15px; max-height: 200px; overflow-y: auto;">
            </div>
            <div id="stickerGrid" style="display: none; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 15px; max-height: 200px; overflow-y: auto;">
            </div>
        `;

        const emojiGrid = picker.querySelector('#emojiGrid');
        const stickerGrid = picker.querySelector('#stickerGrid');
        const emojiTab = picker.querySelector('#emojiTab');
        const stickerTab = picker.querySelector('#stickerTab');

        // Render Emojis
        emojis.forEach(emoji => {
            const span = document.createElement('span');
            span.innerText = emoji;
            span.style = `cursor: pointer; font-size: 24px; padding: 5px; text-align: center; transition: transform 0.2s;`;
            span.onmouseover = () => span.style.transform = 'scale(1.2)';
            span.onmouseout = () => span.style.transform = 'scale(1)';
            span.onclick = () => {
                input.value += emoji;
                input.focus();
            };
            emojiGrid.appendChild(span);
        });

        // Render Stickers
        stickers.forEach(sticker => {
            const div = document.createElement('div');
            div.style = `
                cursor: pointer; background: #f0f0f0; border-radius: 8px; 
                display: flex; flex-direction: column; align-items: center; 
                padding: 10px; gap: 5px; transition: all 0.2s;
            `;
            div.innerHTML = `
                <span style="font-size: 32px;">${sticker.icon}</span>
                <span style="font-size: 10px; font-weight: 600; color: #666;">${sticker.name}</span>
            `;
            div.onmouseover = () => div.style.background = '#e0e0e0';
            div.onmouseout = () => div.style.background = '#f0f0f0';
            div.onclick = () => {
                this.sendSticker(sticker);
                picker.style.display = 'none';
            };
            stickerGrid.appendChild(div);
        });

        // Tab Switching
        emojiTab.onclick = () => {
            emojiGrid.style.display = 'grid';
            stickerGrid.style.display = 'none';
            emojiTab.style.borderBottomColor = 'var(--primary-orange)';
            stickerTab.style.borderBottomColor = 'transparent';
        };
        stickerTab.onclick = () => {
            emojiGrid.style.display = 'none';
            stickerGrid.style.display = 'grid';
            emojiTab.style.borderBottomColor = 'transparent';
            stickerTab.style.borderBottomColor = 'var(--primary-orange)';
        };

        document.body.appendChild(picker);

        btn.onclick = (e) => {
            e.stopPropagation();
            const rect = btn.getBoundingClientRect();
            picker.style.top = (rect.top - 300) + 'px';
            picker.style.left = Math.min(rect.left, window.innerWidth - 300) + 'px';
            picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
        };

        window.addEventListener('click', () => picker.style.display = 'none');
        picker.onclick = (e) => e.stopPropagation();
    },

    /**
     * Send a sticker as a message
     */
    async sendSticker(sticker) {
        if (!selectedConversationUserId || !currentUserId) return;

        try {
            // Stickers are sent as messages with a specific format or just a large emoji in content
            await fetch(`${API_BASE_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUserId,
                    receiverId: selectedConversationUserId,
                    content: `[STICKER:${sticker.icon}]`,
                    imageUrl: '', // We could use a real image URL here if we had one
                    fileUrl: '',
                    fileType: 'sticker'
                })
            });
            
            // Refresh messages locally
            if (typeof loadMessages === 'function') loadMessages();
        } catch (e) {
            console.error("Failed to send sticker", e);
        }
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
        if (!encodedText || encodedText.length < 4) return encodedText;
        try {
            // Only attempt decryption if it looks like a Base64 string (no spaces, valid chars)
            if (/\s/.test(encodedText)) return encodedText;
            
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
    let content = AdvancedMessaging.decrypt(msg.content);

    // Handle Stickers
    if (content && content.startsWith('[STICKER:') && content.endsWith(']')) {
        const icon = content.replace('[STICKER:', '').replace(']', '');
        return `<div class="sticker-msg" style="font-size: 80px; text-align: center; padding: 10px; animation: bounceIn 0.5s ease;">${icon}</div>`;
    }

    // Process hashtags or @mentions if needed
    return (content || '').replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');
}

// Export for use in messages.js
window.AdvancedMessaging = AdvancedMessaging;
