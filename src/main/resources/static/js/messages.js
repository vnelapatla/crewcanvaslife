const MessagingUI = {
    version: '1.1',
    switchTab: function(tabName) {
        // Redirection to the new tab switching logic
        switchSidebarTab(tabName);
    }
};
// State management


// Helper for robust ID retrieval
// Helper for robust ID retrieval (Handled in utils.js, but keeping a local alias for safety)
if (typeof getUserId === 'undefined') {
    window.getUserId = function(user) {
        if (!user) return null;
        if (typeof user !== 'object') return user;
        return user.id || user.userId || user.ID || user.userID;
    };
}

function switchSidebarTab(tabName) {
    const chatTab = document.getElementById('conversationsList');
    const followingTab = document.getElementById('followingList');
    const btns = document.querySelectorAll('.list-tabs button');

    if (tabName === 'conversations') {
        if (chatTab) chatTab.style.display = 'block';
        if (followingTab) followingTab.style.display = 'none';
        if (btns[0]) btns[0].classList.add('active');
        if (btns[1]) btns[1].classList.remove('active');
        loadConversations();
    } else {
        if (chatTab) chatTab.style.display = 'none';
        if (followingTab) followingTab.style.display = 'block';
        if (btns[0]) btns[0].classList.remove('active');
        if (btns[1]) btns[1].classList.add('active');
        loadFollowersAndMutuals();
    }
}

let followers = [];
let following = [];
let mutuals = [];

async function loadFollowersAndMutuals() {
    if (!currentUserId) return;
    
    try {
        const [followersRes, followingRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/profile/${currentUserId}/followers`),
            fetch(`${API_BASE_URL}/api/profile/${currentUserId}/following`)
        ]);

        if (followersRes.ok && followingRes.ok) {
            followers = await followersRes.json();
            following = await followingRes.json();
            
            // Calculate mutuals
            const followingIds = new Set(following.map(u => String(getUserId(u))));
            mutuals = followers.filter(u => followingIds.has(String(getUserId(u))));
            
            // Update counts in UI
            const followerCountEl = document.getElementById('followerCount');
            const mutualCountEl = document.getElementById('mutualCount');
            if (followerCountEl) followerCountEl.textContent = `${followers.length} Followers`;
            if (mutualCountEl) mutualCountEl.textContent = `${mutuals.length} Mutual`;

            // Display in followingList (Contacts)
            displayUsersList('followingList', followers, "No contacts found. Follow people to start chatting!");
        }
    } catch (e) {
        console.error("Error loading connections:", e);
    }
}

function filterConnections(type) {
    // Switch to contacts tab first
    switchSidebarTab('followers');
    
    if (type === 'followers') {
        displayUsersList('followingList', followers, "No followers yet.");
    } else if (type === 'mutual') {
        displayUsersList('followingList', mutuals, "No mutual connections yet.");
    }
}

let currentUserId = null;
let selectedConversationUserId = null;
let conversations = [];
let stompClient = null;
let isSending = false;

const WS_ENDPOINT = '/ws-chat';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Messages JS Loaded");
    
    if (typeof checkAuth === 'function') {
        if (!checkAuth()) {
            console.log("Auth failed, redirecting...");
            return;
        }
    } else {
        console.error("checkAuth function missing!");
    }
    
    currentUserId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : localStorage.getItem('userId');
    console.log("=== MESSAGING SYSTEM DEBUG ===");
    console.log("Current User ID:", currentUserId);

    if (!currentUserId || currentUserId === 'undefined' || currentUserId === 'null') {
        console.error("CRITICAL: userId is null or undefined!");
        showMessage("Your session has expired. Please log in again to continue.", "error");
        // Show error in lists
        ['conversationsList', 'followingList', 'followersList'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div style="padding: 20px; color: #f44336; font-size: 13px;">Session error. Please logout and login again.</div>';
        });
        return;
    }

    // Check if opening conversation with specific user
    const targetUserId = getQueryParam('chatWith') || getQueryParam('userId');
    if (targetUserId) {
        console.log("Redirected with target user ID:", targetUserId);
        // Using setTimeout to ensure initMessaging runs first
        setTimeout(() => startNewChat(targetUserId), 800);
    }

    initMessaging();
    connectWebSocket();
    
    // Initialize Emoji Picker from advanced-messaging.js
    if (typeof AdvancedMessaging !== 'undefined' && typeof AdvancedMessaging.initEmojiPicker === 'function') {
        AdvancedMessaging.initEmojiPicker('messageInput', 'emojiBtn');
    }
});

function connectWebSocket() {
    if (!currentUserId) return;
    const socket = new SockJS(WS_ENDPOINT);
    stompClient = Stomp.over(socket);
    stompClient.debug = null;

    stompClient.connect({}, (frame) => {
        console.log('Connected to WebSocket');
        stompClient.subscribe(`/topic/messages/${currentUserId}`, (message) => {
            const msg = JSON.parse(message.body);
            onMessageReceived(msg);
        });
    }, (error) => {
        console.error('WebSocket error:', error);
        setTimeout(connectWebSocket, 5000);
    });
}

function onMessageReceived(msg) {
    if (String(selectedConversationUserId) === String(msg.senderId) || String(selectedConversationUserId) === String(msg.receiverId)) {
        loadMessages(); 
    }
    loadConversations();
}

async function initMessaging() {
    // Show loading state
    const lists = ['conversationsList', 'followingList', 'followersList'];
    lists.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 13px;">Connecting to server...</div>';
    });

    try {
        await loadConversations(); 
        await loadFollowersAndMutuals();
        console.log("Messaging initialized successfully");
    } catch (e) {
        console.error("Failed to initialize messaging:", e);
    }
}

// Load conversations
async function loadConversations() {
    try {
        const url = `${API_BASE_URL}/api/conversations/${currentUserId}`;
        console.log("Fetching conversations from:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errText}`);
        }
        
        conversations = await response.json();
        console.log("Conversations loaded:", conversations);
        displayConversations();
    } catch (error) {
        console.error('Error loading conversations:', error);
        const container = document.getElementById('conversationsList');
        if (container) container.innerHTML = `<div style="padding: 20px; text-align: center; color: #f44336; font-size: 13px;">
            Connection Error<br>
            <span style="font-size: 10px; opacity: 0.7;">${error.message.substring(0, 50)}</span>
        </div>`;
    }
}



// Generic user list display
function displayUsersList(elementId, users, emptyMessage) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    if (!Array.isArray(users) || users.length === 0) {
        container.innerHTML = `<div style="padding: 10px; font-size: 11px; color: #999;">${emptyMessage}</div>`;
        return;
    }

    container.innerHTML = users.map(user => {
        const userId = getUserId(user);
        const initials = (user.name || 'U').charAt(0).toUpperCase();
        const color = getRandomColor(user.name);
        
        return `
            <div class="user-row">
                <div class="initials-avatar" style="background: ${color}">${initials}</div>
                <div class="user-main" onclick="openConversation(${userId})">
                    <div class="user-name-row">
                        <h4>${user.name || 'User'}</h4>
                        <span class="user-time">active now</span>
                    </div>
                    <div class="user-status-row">
                        <span class="user-status">${user.role || 'Film Professional'}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function startNewChat(receiverId) {
    if (!currentUserId || !receiverId) return;
    
    console.log(`Starting conversation with ${receiverId}`);
    try {
        const response = await fetch(`${API_BASE_URL}/api/conversations/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: currentUserId, receiverId: receiverId })
        });
        
        if (response.ok) {
            const conversation = await response.json();
            console.log("Conversation started:", conversation);
            switchSidebarTab('conversations');
            openConversation(receiverId);
            loadConversations();
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("Failed to start conversation:", errorData.message || "Unknown error");
            showMessage(errorData.message || "Could not start chat. Please check your connection permissions.", "error");
        }
    } catch (e) {
        console.error("Error starting chat:", e);
    }
}


// Display conversations
async function displayConversations(listToDisplay = null) {
    const container = document.getElementById('conversationsList');
    if (!container) return;
    
    const items = listToDisplay || conversations;

    if (items.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size:13px;">No conversations yet</div>';
        return;
    }

    // Get unread counts
    let unreadMap = new Map();
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/unread?userId=${currentUserId}`);
        if (response.ok) {
            const unreadMessages = await response.json();
            if (Array.isArray(unreadMessages)) {
                unreadMessages.forEach(m => {
                    unreadMap.set(m.senderId, (unreadMap.get(m.senderId) || 0) + 1);
                });
            }
        }
    } catch (e) {
        console.warn("Could not fetch unread counts:", e);
    }

    // Display all conversations that exist in the database
    container.innerHTML = items.map(conv => {
        try {
            const otherUser = String(conv.user1Id) === String(currentUserId) ? conv.user2 : conv.user1;
            const otherUserId = getUserId(otherUser);
            
            if (!otherUserId) return ''; // Skip invalid conversations

            const isActive = String(selectedConversationUserId) === String(otherUserId);
            const name = otherUser?.name || 'User';
            const initials = name.charAt(0).toUpperCase();
            const color = getRandomColor(name);
            
            // Format preview text
            let previewText = conv.lastMessage || 'Start a conversation...';
            if (previewText.startsWith('[STICKER:')) {
                previewText = 'Sticker';
            }

            return `
                <div class="user-row ${isActive ? 'active' : ''}" onclick="openConversation(${otherUserId})">
                    <div class="initials-avatar" style="background: ${color}">${initials}</div>
                    <div class="user-main">
                        <div class="user-name-row">
                            <h4>${name}</h4>
                            <span class="user-time">${formatDateShort(conv.updatedAt)}</span>
                        </div>
                        <div class="user-status-row">
                            <span class="user-status">${truncateText(previewText, 40)}</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("Error rendering conversation row:", e, conv);
            return '';
        }
    }).join('');
}

function formatDateShort(dateString) {
    if (!dateString) return '';
    const date = typeof parseSafeDate === 'function' ? parseSafeDate(dateString) : new Date(dateString);
    if (!date || isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    // Today
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    }
    
    // Within last week
    if (diffDays < 7) {
        return date.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'Asia/Kolkata' });
    }
    
    // Older
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
}


let selectedPartnerProfile = null;

// Open conversation
let refreshInterval = null;
async function openConversation(userId) {
    if (!userId) return;
    if (refreshInterval) clearInterval(refreshInterval);
    selectedConversationUserId = userId;
    console.log("Opening conversation with:", userId);

    // UI Updates for mobile and desktop (Modal Overlay)
    const chatOverlay = document.getElementById('chatOverlay');
    if (chatOverlay) {
        chatOverlay.style.display = 'flex';
        document.body.classList.add('scroll-lock');
    }
    
    // Handle Visual Viewport for mobile keyboard stability
    if (window.visualViewport && window.innerWidth <= 1024) {
        const handleViewportChange = () => {
            const viewport = window.visualViewport;
            const chatWindow = document.querySelector('.chat-window');
            if (chatWindow) {
                chatWindow.style.height = `${viewport.height}px`;
                chatWindow.style.top = `${viewport.offsetTop}px`;
            }
        };
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
        // Initial call
        handleViewportChange();
    }
    
    // Highlight sidebar row
    document.querySelectorAll('.user-row').forEach(row => row.classList.remove('active'));
    const activeRow = document.querySelector(`.user-row[onclick="openConversation(${userId})"]`);
    if (activeRow) activeRow.classList.add('active');

    // Update partner details in overlay
    try {
        selectedPartnerProfile = await getUserProfile(userId);
        if (selectedPartnerProfile) {
            const avatar = document.getElementById('chatUserAvatar');
            if (avatar) {
                const initials = (selectedPartnerProfile.name || 'U').charAt(0).toUpperCase();
                avatar.textContent = initials;
                avatar.style.background = getRandomColor(selectedPartnerProfile.name);
            }
            const nameEl = document.getElementById('chatUserName');
            if (nameEl) nameEl.textContent = selectedPartnerProfile.name || 'User';
            const statusEl = document.getElementById('chatUserStatus');
            if (statusEl) statusEl.textContent = 'active now';
        }
    } catch (error) {
        console.error('Error loading partner info:', error);
    }

    // Load messages
    loadMessages();
    
    // Check messaging permission
    checkMessagingPermission(currentUserId, userId);
}

async function checkMessagingPermission(senderId, receiverId) {
    const inputArea = document.querySelector('.chat-input-area');
    if (!inputArea) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/check-permission?senderId=${senderId}&receiverId=${receiverId}`);
        if (response.ok) {
            const data = await response.json();
            if (data.allowed) {
                inputArea.style.display = 'flex';
                const oldMsg = document.getElementById('restriction-msg');
                if (oldMsg) oldMsg.remove();
            } else {
                inputArea.style.display = 'none';
                let restrictionMsg = document.getElementById('restriction-msg');
                if (!restrictionMsg) {
                    restrictionMsg = document.createElement('div');
                    restrictionMsg.id = 'restriction-msg';
                    restrictionMsg.style = 'padding: 20px; text-align: center; color: #666; font-size: 13px; background: #f9f9f9; border-top: 1px solid #eee;';
                    inputArea.parentNode.insertBefore(restrictionMsg, inputArea);
                }
                restrictionMsg.innerHTML = `<i class="fa-solid fa-lock" style="margin-right: 8px;"></i> You can only message followers, mutual followers, admins, or event applicants.`;
            }
        }
    } catch (e) {
        console.error("Error checking permission:", e);
    }
}

function closeChatArea() {
    const chatOverlay = document.getElementById('chatOverlay');
    if (chatOverlay) {
        chatOverlay.style.display = 'none';
        document.body.classList.remove('scroll-lock');
    }
    selectedConversationUserId = null;
    selectedPartnerProfile = null;
    if (refreshInterval) clearInterval(refreshInterval);
    document.querySelectorAll('.user-row').forEach(row => row.classList.remove('active'));
    
    // Clean up viewport listeners
    if (window.visualViewport) {
        // We can't easily remove anonymous listeners, but resetting height is enough
        const chatWindow = document.querySelector('.chat-window');
        if (chatWindow) {
            chatWindow.style.height = '';
            chatWindow.style.top = '';
        }
    }
}

function getRandomColor(name) {
    if (!name) return '#ff8800';
    const colors = ['#ff8800', '#ff2d55', '#4fc3f7', '#4caf50', '#9c27b0', '#795548'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}


// Load messages
async function loadMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${currentUserId}?otherUserId=${selectedConversationUserId}`);
        if (!response.ok) {
            const errText = await response.text();
            const container = document.getElementById('messagesArea');
            if (container) container.innerHTML = `<div style="text-align: center; color: #f44336; padding: 40px; font-size:14px;">Error loading messages: ${errText.substring(0, 100)}</div>`;
            return;
        }
        
        const messages = await response.json();
        if (!Array.isArray(messages)) return;

        // Mark messages as read using the optimized bulk endpoint
        const hasUnread = messages.some(m => m.receiverId == currentUserId && !m.isRead);
        if (hasUnread) {
            try {
                await fetch(`${API_BASE_URL}/api/messages/read-all?senderId=${selectedConversationUserId}&receiverId=${currentUserId}`, {
                    method: 'PUT'
                });
            } catch (e) {
                console.warn("Failed to mark messages as read:", e);
            }
        }

        // Process with AdvancedMessaging enhancement if available
        if (typeof enhanceMessageDisplay === 'function') {
            messages.forEach(msg => {
                if (msg.content) msg.displayContent = enhanceMessageDisplay(msg);
            });
        }

        displayMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

let lastMessageCountMap = new Map();
let lastLoadedConversationId = null;


// Display messages
function displayMessages(messages) {
    const container = document.getElementById('messagesArea');
    if (!container) return;
    
    // Check if we actually need to re-render everything
    // This prevents the "not moving" or "jumping" feeling when polling
    const conversationId = selectedConversationUserId;
    const lastCount = lastMessageCountMap.get(conversationId) || 0;
    const isNewMessage = messages.length > lastCount || conversationId !== lastLoadedConversationId;
    
    // Detect if user is currently scrolled up
    const isAtBottomBefore = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;

    // Optimization: If no new messages and not a new conversation, don't re-render
    if (messages.length === lastCount && conversationId === lastLoadedConversationId && messages.length > 0) {
        // Just update read statuses if they changed
        return;
    }

    lastMessageCountMap.set(conversationId, messages.length);
    lastLoadedConversationId = conversationId;

    if (messages.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: #999; padding: 60px 40px; font-size:14px; display:flex; flex-direction:column; align-items:center; gap:15px;">
                <div style="font-size:40px; opacity:0.3;">✨</div>
                <div>No messages yet.<br><span style="font-size:12px; opacity:0.7;">Start the conversation with ${selectedPartnerProfile?.name || 'them'}!</span></div>
            </div>`;
        return;
    }

    container.innerHTML = messages.map((msg, index) => {
        const isSent = msg.senderId == currentUserId;
        const name = isSent ? 'You' : (selectedPartnerProfile?.name || 'User');
        
        let attachmentContent = '';
        if (msg.imageUrl) {
            attachmentContent = `<img src="${msg.imageUrl}" alt="Image" style="max-width: 100%; border-radius: 8px; margin-top:5px;">`;
        } else if (msg.fileUrl) {
            const fileName = `attachment_${msg.id}`;
            attachmentContent = `
                <div class="file-attachment" onclick="downloadFile('${msg.fileUrl}', '${fileName}')" style="display: flex; align-items: center; gap: 10px; background: rgba(255,136,0,0.1); padding: 12px; border-radius: 8px; margin-top: 8px; cursor: pointer; border: 1px solid rgba(255,136,0,0.2);">
                    <div style="width: 35px; height: 35px; background: var(--primary-orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fa-solid fa-file-arrow-down"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-size: 13px; font-weight: 700; color: #333;">Download File</div>
                        <div style="font-size: 10px; color: #888;">${msg.fileType || 'Document'}</div>
                    </div>
                </div>
            `;
        }

        let avatarHtml = '';
        if (!isSent && selectedPartnerProfile) {
            avatarHtml = `<div style="margin-right:10px; align-self: flex-end; margin-bottom: 5px;">${renderAvatar(selectedPartnerProfile, 'nav-avatar')}</div>`;
        }

        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                ${avatarHtml}
                <div class="message-text">
                    ${(msg.displayContent || msg.content) ? `<p style="margin:0;">${msg.displayContent || msg.content}</p>` : ''}
                    ${attachmentContent}
                    <div class="message-status">
                        ${formatTime(msg.createdAt)}
                        ${isSent ? (msg.isRead ? ' <span style="color:#4fc3f7">✓✓</span>' : ' ✓') : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Force scroll to bottom if new message OR first load OR was already at bottom
    if (isNewMessage || isAtBottomBefore) {
        // Using requestAnimationFrame to ensure the scroll happens after DOM update
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
            // Also try smooth scroll as a secondary to make it feel better
            setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        });
    }
}


// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || isSending) return;
    
    const content = input.value.trim();
    const hasAttachments = selectedImageFile || selectedGenericFile;

    if (!content && !hasAttachments) {
        return;
    }

    if (!selectedConversationUserId || !currentUserId) {
        showMessage('Please select a conversation first.', 'error');
        return;
    }

    // Capture files and clear state immediately to allow typing next message
    // Encrypt content for "safe" transmission if AdvancedMessaging is available
    const finalContent = (typeof AdvancedMessaging !== 'undefined' && content) 
        ? AdvancedMessaging.encrypt(content) 
        : content;

    const payload = {
        senderId: currentUserId,
        receiverId: selectedConversationUserId,
        content: finalContent,
        imageUrl: selectedImageFile || '',
        fileUrl: selectedGenericFile || '',
        fileType: selectedFileType || ''
    };

    // Clear input and previews immediately for snappy UI
    input.value = '';
    clearPreview();
    isSending = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Load messages and conversations in background
            loadMessages();
            loadConversations();
            // Re-focus input
            input.focus();
        } else {
            const err = await response.text();
            console.error('Error sending message:', err);
            // Show the actual error from the backend if possible
            const errorMsg = err.includes('Error sending message:') ? err.split('Error sending message:')[1] : err;
            showMessage(errorMsg || 'We couldn’t send your message. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showMessage('Network error. Please check your internet connection.', 'error');
    } finally {
        isSending = false;
    }
}

// Handle Enter key
function handleEnter(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Mark as read
async function markAsRead(messageId) {
    if (!messageId) return;
    try {
        await fetch(`${API_BASE_URL}/api/messages/${messageId}/read`, {
            method: 'PUT'
        });
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

// Search conversations (Debounced for better performance)
const searchConversations = debounce(() => {
    const input = document.getElementById('searchConversations');
    if (!input) return;
    
    const query = input.value.toLowerCase().trim();
    
    // Filter existing conversations
    const filtered = conversations.filter(conv => {
        const otherUser = String(conv.user1Id) === String(currentUserId) ? conv.user2 : conv.user1;
        const nameMatch = (otherUser?.name || 'User').toLowerCase().includes(query);
        const contentMatch = (conv.lastMessage || '').toLowerCase().includes(query);
        return nameMatch || contentMatch;
    });
    displayConversations(filtered);
}, 300);

// Also expose to window for the oninput attribute
window.searchConversations = searchConversations;

// Image upload for messages
let selectedImageFile = null;
document.getElementById('messageImage')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 50 * 1024 * 1024) {
            showMessage('That file is too big! Please keep it under 50MB.', 'error');
            return;
        }
        try {
            selectedImageFile = await uploadImage(file);
            showFilePreview(file.name, selectedImageFile, 'image');
        } catch (error) {
            showMessage('Something went wrong with the upload. Please try again.', 'error');
        }
    }
});

// Generic file upload for messages
let selectedGenericFile = null;
let selectedFileType = null;
document.getElementById('messageFile')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 50 * 1024 * 1024) {
            showMessage('That file is too big! Please keep it under 50MB.', 'error');
            return;
        }
        try {
            selectedGenericFile = await uploadImage(file); 
            selectedFileType = file.type;
            showFilePreview(file.name, null, 'file');
        } catch (error) {
            showMessage('Something went wrong with the upload. Please try again.', 'error');
        }
    }
});

function showFilePreview(name, data, type) {
    const previewArea = document.getElementById('previewArea');
    if (!previewArea) return;
    
    previewArea.style.display = 'flex';
    if (type === 'image') {
        previewArea.innerHTML = `
            <div style="position: relative; width: 50px; height: 50px;">
                <img src="${data}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">
                <div onclick="clearPreview()" style="position: absolute; top: -5px; right: -5px; background: #ff4444; color: white; border-radius: 50%; width: 15px; height: 15px; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer;">×</div>
            </div>
            <span style="font-size: 12px; color: #666;">${truncateText(name, 20)}</span>
        `;
    } else {
        previewArea.innerHTML = `
            <div style="position: relative; display: flex; align-items: center; gap: 10px; background: #f0f0f0; padding: 5px 10px; border-radius: 4px;">
                <i class="fa-solid fa-file" style="color: #666;"></i>
                <span style="font-size: 12px; color: #666;">${truncateText(name, 20)}</span>
                <div onclick="clearPreview()" style="margin-left: 10px; color: #ff4444; cursor: pointer; font-weight: bold;">×</div>
            </div>
        `;
    }
}

function clearPreview() {
    selectedImageFile = null;
    selectedGenericFile = null;
    selectedFileType = null;
    const previewArea = document.getElementById('previewArea');
    if (previewArea) {
        previewArea.style.display = 'none';
        previewArea.innerHTML = '';
    }
    // Reset file inputs
    const imgInput = document.getElementById('messageImage');
    if(imgInput) imgInput.value = '';
    const fileInput = document.getElementById('messageFile');
    if(fileInput) fileInput.value = '';
}
function downloadFile(base64, filename) {
    if (!base64) return;
    try {
        const link = document.createElement('a');
        link.href = base64;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        console.error("Download failed:", e);
        window.open(base64); // Fallback
    }
}
