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

/**
 * CALLING SYSTEM
 * Integrated with Jitsi Meet for real-time Voice/Video calls
 */
const CallSystem = {
    isCalling: false,
    currentCallRoom: null,

    init() {
        console.log("Call System Initialized");
        this.injectStyles();
        
        // Initialize mutual users array if not present
        if (!window.allMutualUsers) window.allMutualUsers = [];
    },

    injectStyles() {
        if (document.getElementById('call-styles')) return;
        const style = document.createElement('style');
        style.id = 'call-styles';
        style.textContent = `
            .call-overlay {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: radial-gradient(circle at center, rgba(30, 30, 30, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%);
                backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
                z-index: 1000000; display: flex; flex-direction: column;
                align-items: center; justify-content: center; color: white;
                font-family: 'Inter', sans-serif;
                animation: fadeIn 0.5s ease;
            }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .call-avatar {
                width: 140px; height: 140px; border-radius: 50%;
                background: linear-gradient(135deg, var(--primary-orange, #ff8800), #ff5e00);
                display: flex; align-items: center; justify-content: center; 
                font-size: 50px; font-weight: 800; color: white;
                margin-bottom: 30px; box-shadow: 0 0 60px rgba(255,136,0,0.4);
                animation: pulse 2s infinite;
                border: 4px solid rgba(255,255,255,0.1);
            }
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,136,0,0.5); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 30px rgba(255,136,0,0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255,136,0,0); }
            }
            .call-overlay h2 { font-size: 32px; font-weight: 800; margin-bottom: 10px; letter-spacing: -1px; }
            .call-status { font-size: 14px; opacity: 0.6; margin-bottom: 60px; text-transform: uppercase; letter-spacing: 3px; font-weight: 600; }
            .call-actions-row { display: flex; gap: 40px; }
            .call-btn {
                width: 75px; height: 75px; border-radius: 50%; display: flex;
                align-items: center; justify-content: center; font-size: 28px;
                cursor: pointer; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
                border: none; outline: none;
            }
            .call-btn.decline { background: #ff3b30; color: white; box-shadow: 0 10px 25px rgba(255,59,48,0.3); }
            .call-btn.accept { background: #34c759; color: white; box-shadow: 0 10px 25px rgba(52,199,89,0.3); }
            .call-btn:hover { transform: scale(1.15) rotate(5deg); }
            
            #jitsi-container {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: #000; z-index: 1000001; display: none;
                animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); opacity: 1; }
                70% { transform: scale(0.9); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    },

    async startCall(type = 'video') {
        if (!selectedConversationUserId) {
            showMessage("Select a user to call", "error");
            return;
        }

        // Restriction: Only mutual followers can call
        // Robust check for mutual status
        const isMutual = (window.allMutualUsers && window.allMutualUsers.some(u => String(getUserId(u)) === String(selectedConversationUserId))) ||
                         (window.allConnections && window.allConnections.some(u => String(getUserId(u)) === String(selectedConversationUserId)) && 
                          window.allFollowingUsers && window.allFollowingUsers.some(u => String(getUserId(u)) === String(selectedConversationUserId)));
        
        if (!isMutual) {
            const partnerName = selectedPartnerProfile?.name || 'this user';
            showMessage(`Only mutual followers can start calls. Make sure you both follow each other.`, "error");
            return;
        }

        const roomName = `CrewCanvas_${Math.random().toString(36).substring(7)}_${Date.now()}`;
        this.currentCallRoom = roomName;

        // Create UI
        this.showOutgoingCallUI(selectedPartnerProfile?.name || 'User', type);

        // Send signaling message via WebSocket
        // We use a special content prefix for call signaling
        const signal = {
            type: 'CALL_REQUEST',
            callType: type,
            roomName: roomName,
            senderName: localStorage.getItem('userName') || 'Someone'
        };

        try {
            // Send as a hidden message
            await fetch(`${API_BASE_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUserId,
                    receiverId: selectedConversationUserId,
                    content: `__CALL_SIGNAL__:${JSON.stringify(signal)}`
                })
            });
        } catch (e) {
            console.error("Signal failed", e);
        }
    },

    showOutgoingCallUI(name, type) {
        const overlay = document.createElement('div');
        overlay.id = 'callOverlay';
        overlay.className = 'call-overlay';
        overlay.innerHTML = `
            <div class="call-avatar">${name.charAt(0)}</div>
            <h2>${name}</h2>
            <div class="call-status">Ringing...</div>
            <div class="call-actions-row">
                <button class="call-btn decline" onclick="CallSystem.endCall()"><i class="fa-solid fa-phone-slash"></i></button>
            </div>
        `;
        document.body.appendChild(overlay);
        this.isCalling = true;
    },

    handleIncomingSignal(senderId, signalData) {
        try {
            const signal = JSON.parse(signalData);
            if (signal.type === 'CALL_REQUEST') {
                // Don't show if already in a call
                if (this.isCalling || document.getElementById('callOverlay') || document.getElementById('jitsi-container')?.style.display === 'block') {
                    console.log("Busy: Ignoring incoming call signal");
                    return;
                }
                this.showIncomingCallUI(signal.senderName, signal.callType, signal.roomName, senderId);
            } else if (signal.type === 'CALL_CANCEL' || signal.type === 'CALL_REJECT') {
                this.endCall();
                showMessage(`${signal.senderName} ended the call`, "info");
            }
        } catch (e) { console.error("Invalid signal", e); }
    },

    showIncomingCallUI(name, type, roomName, senderId) {
        // Play ringtone if possible
        this.playRingtone();

        const overlay = document.createElement('div');
        overlay.id = 'callOverlay';
        overlay.className = 'call-overlay';
        overlay.innerHTML = `
            <div class="call-avatar">${name.charAt(0)}</div>
            <h2>${name}</h2>
            <div class="call-status">Incoming ${type} call...</div>
            <div class="call-actions-row">
                <button class="call-btn accept" onclick="CallSystem.acceptCall('${roomName}', '${type}')"><i class="fa-solid fa-phone"></i></button>
                <button class="call-btn decline" onclick="CallSystem.rejectCall('${senderId}')"><i class="fa-solid fa-phone-slash"></i></button>
            </div>
        `;
        document.body.appendChild(overlay);
    },

    async rejectCall(senderId) {
        this.endCall();
        // Send rejection signal
        const signal = {
            type: 'CALL_REJECT',
            senderName: localStorage.getItem('userName') || 'User'
        };
        try {
            await fetch(`${API_BASE_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: currentUserId || localStorage.getItem('userId'),
                    receiverId: senderId,
                    content: `__CALL_SIGNAL__:${JSON.stringify(signal)}`
                })
            });
        } catch (e) {}
    },

    playRingtone() {
        try {
            // Simple simulated ringtone using Web Audio
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            oscillator.start();
            
            // Loop a pattern
            let count = 0;
            const interval = setInterval(() => {
                if (!document.getElementById('callOverlay') || count > 20) {
                    clearInterval(interval);
                    oscillator.stop();
                    return;
                }
                gainNode.gain.setValueAtTime(count % 2 === 0 ? 0.1 : 0, audioCtx.currentTime);
                count++;
            }, 500);
        } catch (e) { console.warn("Audio play failed", e); }
    },

    acceptCall(roomName, type) {
        this.endCall(); // Clear overlay
        this.launchJitsi(roomName, type);
    },

    endCall() {
        const overlay = document.getElementById('callOverlay');
        if (overlay) overlay.remove();
        this.isCalling = false;
    },

    launchJitsi(roomName, type) {
        let container = document.getElementById('jitsi-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'jitsi-container';
            document.body.appendChild(container);
        }
        container.style.display = 'block';

        // Load Jitsi script if not present
        if (!window.JitsiMeetExternalAPI) {
            const script = document.createElement('script');
            script.src = 'https://meet.jit.si/external_api.js';
            script.onload = () => this.startJitsiInternal(roomName, type);
            document.head.appendChild(script);
        } else {
            this.startJitsiInternal(roomName, type);
        }
    },

    startJitsiInternal(roomName, type) {
        const domain = 'meet.jit.si';
        const isVideo = type === 'video';
        const options = {
            roomName: roomName,
            width: '100%',
            height: '100%',
            parentNode: document.getElementById('jitsi-container'),
            userInfo: {
                displayName: localStorage.getItem('userName') || 'User'
            },
            configOverwrite: {
                startWithVideoMuted: !isVideo,
                startWithAudioMuted: false,
                disableDeepLinking: true
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                    'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                    'security'
                ],
            }
        };
        const api = new JitsiMeetExternalAPI(domain, options);
        api.addEventListener('videoConferenceLeft', () => {
            document.getElementById('jitsi-container').style.display = 'none';
            document.getElementById('jitsi-container').innerHTML = '';
        });
    }
};

// Initialize system
CallSystem.init();
window.CallSystem = CallSystem;

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
