const MessagingUI = {
    switchTab: function(tabName) {
        // Redirection to the new tab switching logic
        switchSidebarTab(tabName);
    }
};
// State management
let connectionFilter = 'all'; // 'all', 'following', 'followers', 'mutual'

// Helper for robust ID retrieval
function getUserId(user) {
    if (!user) return null;
    return user.id || user.userId || user.ID || user.userID || (typeof user !== 'object' ? user : null);
}

function switchSidebarTab(tabName) {
    const chatTab = document.getElementById('conversationsList');
    const followTab = document.getElementById('followingList');
    const btns = document.querySelectorAll('.list-tabs button');

    if (tabName === 'conversations') {
        if (chatTab) chatTab.style.display = 'block';
        if (followTab) followTab.style.display = 'none';
        if(btns[0]) btns[0].classList.add('active');
        if(btns[1]) btns[1].classList.remove('active');
    } else {
        if (chatTab) chatTab.style.display = 'none';
        if (followTab) followTab.style.display = 'block';
        if(btns[0]) btns[0].classList.remove('active');
        if(btns[1]) btns[1].classList.add('active');
    }
}

let currentUserId = null;
let selectedConversationUserId = null;
let conversations = [];
let stompClient = null;

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
        showMessage("No user session found. Please login again.", "error");
        // Show error in lists
        ['conversationsList', 'followingList', 'followersList'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '<div style="padding: 20px; color: #f44336; font-size: 13px;">Session error. Please logout and login again.</div>';
        });
        return;
    }

    // Check if opening conversation with specific user
    const targetUserId = getQueryParam('userId');
    if (targetUserId) {
        console.log("Redirected with target user ID:", targetUserId);
        // Using setTimeout to ensure initMessaging runs first
        setTimeout(() => startNewChat(targetUserId), 500);
    }

    initMessaging();
    connectWebSocket();
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
        await Promise.all([
            loadConversations(),
            loadFollowing()
        ]);
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

// Load following and followers
async function loadFollowing() {
    try {
        console.log("Loading all connection types for:", currentUserId);
        
        // 1. Fetch Following
        const respFollowing = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}/following?t=${Date.now()}`);
        let following = [];
        if (respFollowing.ok) {
            following = await respFollowing.json();
            if (!Array.isArray(following)) following = [];
            window.allFollowingUsers = following;
        }

        // 2. Fetch Followers
        const respFollowers = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}/followers?t=${Date.now()}`);
        let followers = [];
        if (respFollowers.ok) {
            followers = await respFollowers.json();
            if (!Array.isArray(followers)) followers = [];
            window.allFollowerUsers = followers;
        }

        // 3. Calculate Mutuals
        const followingIds = new Set(following.map(u => String(getUserId(u))));
        const mutuals = followers.filter(u => followingIds.has(String(getUserId(u))));
        window.allMutualUsers = mutuals;

        // 4. Merge into a unique Connections list (Everyone you can message)
        const combined = [...following];
        const combinedIds = new Set(following.map(u => String(getUserId(u))));
        
        followers.forEach(u => {
            const id = String(getUserId(u));
            if (!combinedIds.has(id)) {
                combined.push(u);
                combinedIds.add(id);
            }
        });
        window.allConnections = combined;

        // Update counts in UI
        if (document.getElementById('followingCount')) document.getElementById('followingCount').innerText = `${following.length} Following`;
        if (document.getElementById('followerCount')) document.getElementById('followerCount').innerText = `${followers.length} Followers`;
        if (document.getElementById('mutualCount')) document.getElementById('mutualCount').innerText = `${mutuals.length} Mutual`;

        // Display List
        filterConnections('all');

        // Global Platform Search initialization
        try {
            const respAll = await fetch(`${API_BASE_URL}/api/profile/search?query=`);
            if (respAll.ok) window.allPlatformUsers = await respAll.json();
        } catch (e) { console.warn("Platform search unavailable", e); }

    } catch (error) {
        console.error('Error loading social connections:', error);
        const container = document.getElementById('followingList');
        if (container) container.innerHTML = '<div style="padding: 20px; color: #f44336; font-size: 13px;">Wait! Logic error or server down.</div>';
    }
}

function filterConnections(type) {
    connectionFilter = type;
    let list = window.allConnections || [];
    let emptyMsg = "No connections found";

    if (type === 'following') {
        list = window.allFollowingUsers || [];
        emptyMsg = "You are not following anyone yet";
    } else if (type === 'followers') {
        list = window.allFollowerUsers || [];
        emptyMsg = "No one is following you yet";
    } else if (type === 'mutual') {
        list = window.allMutualUsers || [];
        emptyMsg = "No mutual connections found";
    }

    displayUsersList('followingList', list, emptyMsg);
    
    // UI highlight for pills if wanted, but switching tobacco tab is enough
    switchSidebarTab('following');
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
                <button class="message-row-btn" onclick="startNewChat(${userId})">
                    <i class="fa-solid fa-paper-plane"></i> Message
                </button>
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
            console.error("Failed to start conversation");
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

    container.innerHTML = items.map(conv => {
        try {
            const otherUser = String(conv.user1Id) === String(currentUserId) ? conv.user2 : conv.user1;
            const otherUserId = getUserId(otherUser);
            
            if (!otherUserId) return ''; // Skip invalid conversations

            const isActive = String(selectedConversationUserId) === String(otherUserId);
            const name = otherUser?.name || 'User';
            const initials = name.charAt(0).toUpperCase();
            const color = getRandomColor(name);

            return `
                <div class="user-row ${isActive ? 'active' : ''}" onclick="openConversation(${otherUserId})">
                    <div class="initials-avatar" style="background: ${color}">${initials}</div>
                    <div class="user-main">
                        <div class="user-name-row">
                            <h4>${name}</h4>
                            <span class="user-time">${formatDateShort(conv.updatedAt)}</span>
                        </div>
                        <div class="user-status-row">
                            <span class="user-status">${truncateText(conv.lastMessage || 'Start a conversation...', 40)}</span>
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
    const date = new Date(dateString);
    const now = new Date();
    if (isNaN(date.getTime())) return '';
    
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}


let selectedPartnerProfile = null;

// Open conversation
let refreshInterval = null;
async function openConversation(userId) {
    if (!userId) return;
    if (refreshInterval) clearInterval(refreshInterval);
    selectedConversationUserId = userId;
    console.log("Opening conversation with:", userId);

    // UI Updates for mobile and desktop
    const chatOverlay = document.getElementById('chatOverlay');
    if (chatOverlay) chatOverlay.style.display = 'flex';
    
    const chatArea = document.getElementById('chatArea');
    if (chatArea) chatArea.style.display = 'flex';

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
}

function closeChat() {
    const chatOverlay = document.getElementById('chatOverlay');
    if (chatOverlay) chatOverlay.style.display = 'none';
    selectedConversationUserId = null;
    selectedPartnerProfile = null;
    if (refreshInterval) clearInterval(refreshInterval);
}

function closeChatArea() {
    closeChat();
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

        // Mark messages as read ONLY if they were unread and from the partner
        const unreadFromPartner = messages.filter(m => m.receiverId == currentUserId && !m.isRead);
        if (unreadFromPartner.length > 0) {
            for (let msg of unreadFromPartner) {
                await markAsRead(msg.id);
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
            attachmentContent = `<img src="${msg.imageUrl}" alt="Image" style="max-width: 100%; border-radius: 8px; margin-top:5px; cursor:pointer;" onclick="downloadFile('${msg.imageUrl}', 'image_${msg.id}.png')">`;
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
    if (!input) return;
    const content = input.value.trim();

    if (!content && !selectedImageFile && !selectedGenericFile) {
        return;
    }

    if (!selectedConversationUserId || !currentUserId) {
        showMessage('Please select a conversation', 'error');
        return;
    }

    if (stompClient && stompClient.connected) {
         const messagePayload = {
            conversationId: 0, // Placeholder, backend should handle it if needed or extract from participants
            senderId: currentUserId,
            receiverId: selectedConversationUserId,
            content: content,
            imageUrl: selectedImageFile || '',
            fileUrl: selectedGenericFile || '',
            fileType: selectedFileType || '',
            timestamp: new Date().toISOString()
        };
        
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(messagePayload));
        
        input.value = '';
        clearPreview();
        
        // Optionally load messages immediately for optimistic UI
        // loadMessages();
    } else {
        // Fallback to REST if WS failing
        try {
            const response = await fetch(`${API_BASE_URL}/api/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderId: currentUserId,
                    receiverId: selectedConversationUserId,
                    content: content,
                    imageUrl: selectedImageFile || '',
                    fileUrl: selectedGenericFile || '',
                    fileType: selectedFileType || ''
                })
            });

            if (response.ok) {
                input.value = '';
                clearPreview();
                loadMessages();
                loadConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
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

// Search conversations
function searchConversations() {
    const query = document.getElementById('searchConversations').value.toLowerCase();
    
    // Filter conversations
    const filtered = conversations.filter(msg => {
        const otherUser = msg.senderId == currentUserId ? msg.receiver : msg.sender;
        const nameMatch = (otherUser?.name || 'User').toLowerCase().includes(query);
        const contentMatch = (msg.content || '').toLowerCase().includes(query);
        return nameMatch || contentMatch;
    });
    displayConversations(filtered);
    
    // Instagram-like: Search all users on the platform automatically
    if (window.allPlatformUsers) {
        if (query.trim().length > 0) {
            switchSidebarTab('following'); // auto switch to connections tab while searching
            const filteredAll = window.allPlatformUsers.filter(u => (u.name || '').toLowerCase().includes(query) && u.id != currentUserId);
            displayUsersList('followingList', filteredAll, 'No users found matching search');
        } else {
            switchSidebarTab('conversations'); // switch back
            displayUsersList('followingList', window.allFollowingUsers, 'Not following anyone yet');
        }
    }
}

// Image upload for messages
let selectedImageFile = null;
document.getElementById('messageImage')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 50 * 1024 * 1024) {
            showMessage('File size must be less than 50MB', 'error');
            return;
        }
        try {
            selectedImageFile = await uploadImage(file);
            showFilePreview(file.name, selectedImageFile, 'image');
        } catch (error) {
            showMessage(error.message, 'error');
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
            showMessage('File size must be less than 50MB', 'error');
            return;
        }
        try {
            selectedGenericFile = await uploadImage(file); 
            selectedFileType = file.type;
            showFilePreview(file.name, null, 'file');
        } catch (error) {
            showMessage(error.message, 'error');
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
