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
let selectedGroupId = null; // Track group chat
let conversations = [];
let userGroups = []; // Track groups user belongs to
let groupMemberRoles = new Map();
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
        
        // Subscribe to private messages
        stompClient.subscribe(`/topic/messages/${currentUserId}`, (message) => {
            const msg = JSON.parse(message.body);
            onMessageReceived(msg);
        });

        // Subscribe to all group messages
        userGroups.forEach(group => {
            stompClient.subscribe(`/topic/group/${group.id}`, (message) => {
                const msg = JSON.parse(message.body);
                onMessageReceived(msg);
            });
        });

    }, (error) => {
        console.error('WebSocket error:', error);
        setTimeout(connectWebSocket, 5000);
    });
}

function onMessageReceived(msg) {
    console.log("WebSocket Message Received:", msg);
    
    // Play sound if message is from someone else
    if (String(msg.senderId) !== String(currentUserId)) {
        if (typeof playSound === 'function') playSound('message');
    }

    // Robust ID comparison using String conversion
    const isCurrentChat = (selectedConversationUserId && (String(selectedConversationUserId) === String(msg.senderId) || 
                          String(selectedConversationUserId) === String(msg.receiverId))) ||
                          (selectedGroupId && String(selectedGroupId) === String(msg.groupId));
    
    if (isCurrentChat) {
        loadMessages(); 
    }
    loadConversations();
}

// Fallback polling every 5 seconds to ensure sync
setInterval(() => {
    if (selectedConversationUserId) {
        loadMessages();
    }
    loadConversations();
}, 5000);

async function initMessaging() {
    // Show loading state
    const lists = ['conversationsList', 'followingList', 'followersList'];
    lists.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size: 13px;">Connecting to server...</div>';
    });

    try {
        // Fetch user profile to check terms
        const userRes = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}?viewerId=${currentUserId}`);
        if (userRes.ok) {
            const user = await userRes.json();
            if (user.termsAccepted === false) {
                showTermsModal();
            }
        }

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
        // --- OPTIMIZATION: Try to load from Pre-fetch Cache first ---
        const cached = localStorage.getItem('cache_conversations');
        if (cached && conversations.length === 0) {
            try {
                const cachedConvs = JSON.parse(cached);
                if (cachedConvs && cachedConvs.length > 0) {
                    console.log("✨ Instant Messages: Using pre-fetch cache");
                    conversations = cachedConvs;
                    displayConversations();
                }
            } catch (e) { localStorage.removeItem('cache_conversations'); }
        }

        // Optimized: Use the summary endpoint which performs 1 query instead of N+1
        const url = `${API_BASE_URL}/api/conversations/summary/${currentUserId}`;
        console.log("Fetching optimized conversations from:", url);
        
        const response = await fetch(url);
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server returned ${response.status}: ${errText}`);
        }
        
        conversations = await response.json();
        console.log("Conversations loaded (optimized):", conversations);
        displayConversations();
    } catch (error) {
        console.error('Error loading conversations:', error);
        
        // Fallback to old endpoint if summary fails (e.g. while server is updating)
        try {
            const fallbackUrl = `${API_BASE_URL}/api/conversations/${currentUserId}`;
            const fbResponse = await fetch(fallbackUrl);
            if (fbResponse.ok) {
                conversations = await fbResponse.json();
                displayConversations();
                return;
            }
        } catch(e) {}

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
        const name = user.name || 'User';
        
        return `
            <div class="user-row" onclick="openConversation(${userId})">
                ${renderAvatar(user, 'initials-avatar', '45px')}
                <div class="user-main">
                    <div class="user-name-row">
                        <h4>${name}</h4>
                        <span class="user-time">active now</span>
                    </div>
                    <div class="user-status-row">
                        <span class="user-status">${typeof getUserDisplayStatus === 'function' ? getUserDisplayStatus(user) : (user.role || 'Film Professional')}</span>
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
    
    let items = [];
    if (listToDisplay) {
        items = listToDisplay;
    } else {
        // Merge conversations and groups
        const mappedConvs = conversations.map(c => ({...c, chatType: 'private'}));
        const mappedGroups = userGroups.map(g => ({...g, chatType: 'group'}));
        items = [...mappedConvs, ...mappedGroups];
        
        // Sort by last message time
        items.sort((a, b) => {
            const timeA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
            return timeB - timeA;
        });
    }

    if (items.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: #999; font-size:13px;">No conversations yet</div>';
        return;
    }

    container.innerHTML = items.map(item => {
        try {
            if (item.chatType === 'group') {
                const isActive = String(selectedGroupId) === String(item.id);
                return `
                    <div class="user-row ${isActive ? 'active' : ''}" onclick="selectGroup(${item.id})">
                        <div class="initials-avatar group-avatar" style="width: 45px; height: 45px; background: #e2e8f0; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 18px; border-radius: 50%;">
                            <i class="fa-solid fa-users"></i>
                        </div>
                        <div class="user-main">
                            <div class="user-name-row">
                                <h4>${item.name}</h4>
                                <span class="user-time">${formatDateShort(item.createdAt)}</span>
                            </div>
                            <div class="user-status-row">
                                <span class="user-status">Group Chat</span>
                            </div>
                        </div>
                    </div>
                `;
            }

            const otherUserId = item.otherUserId || item.user2Id || (item.otherUser ? item.otherUser.id : null); 
            const name = item.otherUserName || item.otherUser?.name || 'User';
            const profilePicture = item.otherUserProfilePicture || item.otherUser?.profilePicture;
            const role = item.otherUserRole || item.otherUser?.role;
            const updatedAt = item.lastMessageAt || item.updatedAt;
            
            if (!otherUserId) return ''; 

            const isActive = String(selectedConversationUserId) === String(otherUserId);
            let previewText = item.lastMessage || 'Start a conversation...';
            previewText = typeof decryptMessage === 'function' ? decryptMessage(previewText) : previewText;
            
            if (previewText.startsWith('[STICKER:')) previewText = 'Sticker';

            const tempUser = { id: otherUserId, name: name, profilePicture: profilePicture, role: role };

            return `
                <div class="user-row ${isActive ? 'active' : ''}" onclick="openConversation(${otherUserId})">
                    ${renderAvatar(tempUser, 'initials-avatar', '45px')}
                    <div class="user-main">
                        <div class="user-name-row">
                            <h4>${name}</h4>
                            <span class="user-time">${formatDateShort(updatedAt)}</span>
                        </div>
                        <div class="user-status-row">
                            <span class="user-status">${truncateText(previewText, 40)}</span>
                        </div>
                    </div>
                </div>
            `;
        } catch (e) {
            console.error("Error rendering row:", e, item);
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
        chatOverlay.classList.add('active'); // Added for mobile visibility
        document.body.classList.add('scroll-lock');
    }

    // Hide group-specific buttons for private chat
    const leaveBtn = document.getElementById('leaveGroupBtn');
    if (leaveBtn) leaveBtn.style.display = 'none';
    
    // Handle Visual Viewport for mobile keyboard stability
    if (window.visualViewport) {
        const handleViewportChange = () => {
            const viewport = window.visualViewport;
            const chatOverlay = document.getElementById('chatOverlay');
            const chatWindow = document.querySelector('.chat-window');
            
            if (window.innerWidth <= 1024 && chatOverlay && chatOverlay.classList.contains('active')) {
                // On mobile, the overlay should match the visible viewport exactly
                const newHeight = viewport.height;
                chatOverlay.style.height = `${newHeight}px`;
                chatOverlay.style.top = `${viewport.offsetTop}px`;
                
                if (chatWindow) {
                    chatWindow.style.height = '100%';
                }
                
                // Ensure the last message is still visible
                const container = document.getElementById('messagesArea');
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            } else if (chatWindow) {
                // Reset for desktop or when closed
                if (chatOverlay) {
                    chatOverlay.style.height = '';
                    chatOverlay.style.top = '';
                }
                chatWindow.style.height = '';
            }
        };
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
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
                avatar.innerHTML = renderAvatar(selectedPartnerProfile, 'main-avatar', '45px');
                avatar.style.background = 'none';
            }
            const nameEl = document.getElementById('chatUserName');
            if (nameEl) nameEl.textContent = selectedPartnerProfile.name || 'User';
            const statusEl = document.getElementById('chatUserStatus');
            if (statusEl) statusEl.textContent = typeof getUserDisplayStatus === 'function' ? getUserDisplayStatus(selectedPartnerProfile) : 'active now';
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
        // Restrictions removed for live environment - anyone can message anyone
        inputArea.style.display = 'flex';
        const oldMsg = document.getElementById('restriction-msg');
        if (oldMsg) oldMsg.remove();
    } catch (e) {
        console.error("Error checking permission:", e);
    }
}

function closeChatArea() {
    const chatOverlay = document.getElementById('chatOverlay');
    if (chatOverlay) {
        chatOverlay.style.display = 'none';
        chatOverlay.classList.remove('active');
        document.body.classList.remove('scroll-lock');
    }
    
    // Hide group specific buttons
    const leaveBtn = document.getElementById('leaveGroupBtn');
    if (leaveBtn) leaveBtn.style.display = 'none';
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
        let url = "";
        if (selectedGroupId) {
            url = `${API_BASE_URL}/api/groups/${selectedGroupId}/history?userId=${currentUserId}`;
        } else {
            url = `${API_BASE_URL}/api/messages/history/${currentUserId}?otherUserId=${selectedConversationUserId}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
            const errText = await response.text();
            const container = document.getElementById('messagesArea');
            if (container) container.innerHTML = `<div style="text-align: center; color: #f44336; padding: 40px; font-size:14px;">Error loading messages: ${errText.substring(0, 100)}</div>`;
            return;
        }
        
        let messages = await response.json();
        
        // Backend now returns messages in DESC order (newest first) for paged fetching.
        // We reverse them for correct chronological display in the chat interface.
        if (Array.isArray(messages)) {
            messages.reverse();
        }
        if (!Array.isArray(messages)) return;
        
        // Filter out technical signaling messages
        messages = messages.filter(m => !m.content || !m.content.startsWith('__CALL_SIGNAL__'));

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
        const isSent = String(msg.senderId) === String(currentUserId);
        const senderName = isSent ? 'You' : (selectedPartnerProfile?.name || 'User');
        
        let attachmentContent = '';
        const allFiles = [...(msg.fileUrls || [])];
        if (msg.imageUrl && !allFiles.includes(msg.imageUrl)) allFiles.unshift(msg.imageUrl);
        if (msg.fileUrl && !allFiles.includes(msg.fileUrl)) allFiles.push(msg.fileUrl);

        if (allFiles.length > 0) {
            attachmentContent = '<div class="message-attachments-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 5px; margin-top: 8px;">';
            allFiles.forEach((url, idx) => {
                if (!url) return;
                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.startsWith('data:image/');
                const isVideo = isVideoFile(url);
                
                if (isImage) {
                    attachmentContent += `<img src="${url}" alt="Image" style="width: 100%; max-width: 300px; height: auto; border-radius: 8px; cursor: pointer; display: block;" onclick="viewImageFull('${url}')">`;
                } else if (isVideo) {
                    const safeUrl = typeof getSafeMediaUrl === 'function' ? getSafeMediaUrl(url) : url;
                    attachmentContent += `
                        <div style="width: 100%; height: 100px; position: relative; border-radius: 8px; overflow: hidden; background: #000;">
                            <video src="${safeUrl}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="viewFile('${url}')"></video>
                            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; pointer-events: none;"><i class="fa-solid fa-play"></i></div>
                        </div>
                    `;
                } else {
                    attachmentContent += `
                        <div class="file-attachment mini" onclick="downloadFile('${url}', 'file_${idx + 1}')" style="display: flex; align-items: center; gap: 5px; background: rgba(255,136,0,0.1); padding: 8px; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,136,0,0.2);">
                            <div style="width: 25px; height: 25px; background: var(--primary-orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
                                <i class="fa-solid fa-file-arrow-down"></i>
                            </div>
                            <div style="font-size: 11px; font-weight: 700; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">File ${idx + 1}</div>
                        </div>
                    `;
                }
            });
            attachmentContent += '</div>';
        }

        let avatarHtml = '';
        if (!isSent && selectedPartnerProfile) {
            avatarHtml = `<div style="margin-right:10px; align-self: flex-start; margin-bottom: 5px;">${renderAvatar(selectedPartnerProfile, 'nav-avatar')}</div>`;
        }

        return `
            <div class="message ${isSent ? 'sent' : 'received'}" id="msg-${msg.id}">
                ${avatarHtml}
                <div class="message-content-wrapper">
                    <div class="message-text">
                        <div class="message-sender-name" style="color: ${isSent ? 'var(--primary-orange)' : '#64748b'};">${senderName}</div>
                        <div class="message-body">
                            ${(msg.displayContent || msg.content) ? `<div class="text-content">${msg.displayContent || msg.content}</div>` : ''}
                        </div>
                        ${attachmentContent}
                        <div class="message-status">
                            <span class="time">${formatTime(msg.createdAt)}</span>
                            ${isSent ? `<span class="checkmarks" style="${msg.isRead ? 'color:var(--primary-orange)' : 'color:#cbd5e1'}">${msg.isRead ? '✓✓' : '✓'}</span>` : ''}
                            ${msg.isEdited ? '<span class="edited-tag">(edited)</span>' : ''}
                        </div>
                        <button class="message-options-btn" onclick="handleOptionsClick(event, ${msg.id})">
                            <i class="fa-solid fa-ellipsis-vertical"></i>
                        </button>
                        <div id="options-${msg.id}" class="message-dropdown">
                            ${isSent ? `<div class="message-dropdown-item" onclick="editMessageUI(${msg.id})"><i class="fa-solid fa-pen"></i> Edit</div>` : ''}
                            <div class="message-dropdown-item" onclick="copyToClipboardText(${msg.id})"><i class="fa-solid fa-copy"></i> Copy</div>
                            ${(isSent && (msg.imageUrl || msg.fileUrl || (msg.fileUrls && msg.fileUrls.length > 0))) ? `<div class="message-dropdown-item" onclick="removeImageUI(${msg.id})"><i class="fa-solid fa-image-slash"></i> Remove Attachment</div>` : ''}
                            ${isSent ? `<div class="message-dropdown-item delete" onclick="confirmDeleteMessage(${msg.id})"><i class="fa-solid fa-trash"></i> Delete</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Force scroll to bottom if new message OR first load OR was already at bottom
    if (isNewMessage || isAtBottomBefore) {
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }
}

/**
 * Optimistically appends a single message to the UI without full re-render
 */
function appendSingleMessage(msg) {
    const container = document.getElementById('messagesArea');
    if (!container) return;

    // Skip technical signaling messages
    if (msg.content && msg.content.startsWith('__CALL_SIGNAL__')) {
        return;
    }

    // Remove empty state if present
    const emptyState = container.querySelector('div[style*="text-align: center; color: #999"]');
    if (emptyState) emptyState.remove();

    const isSent = msg.senderId == currentUserId;
    const senderName = isSent ? (localStorage.getItem('userName') || 'You') : (selectedPartnerProfile?.name || 'User');
    
    // Check for attachments
    let attachmentContent = '';
    const allFiles = [...(msg.fileUrls || [])];
    if (msg.imageUrl && !allFiles.includes(msg.imageUrl)) allFiles.unshift(msg.imageUrl);
    
    if (allFiles.length > 0) {
        attachmentContent = '<div class="message-attachments-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 5px; margin-top: 8px;">';
        allFiles.forEach((url, idx) => {
            if (!url) return;
            const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.startsWith('data:image/');
            const isVideo = url.match(/\.(mp4|webm|ogg|mov|avi|flv|wmv)/i) || url.startsWith('data:video/');
            
            if (isImage) {
                attachmentContent += `<img src="${url}" alt="Image" style="width: 100%; max-width: 300px; height: auto; border-radius: 8px; cursor: pointer; display: block;" onclick="viewImageFull('${url}')">`;
            } else if (isVideo) {
                const safeUrl = typeof getSafeMediaUrl === 'function' ? getSafeMediaUrl(url) : url;
                attachmentContent += `
                    <div style="width: 100%; height: 100px; position: relative; border-radius: 8px; overflow: hidden; background: #000;">
                        <video src="${safeUrl}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer;" onclick="viewFile('${url}')"></video>
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; pointer-events: none;"><i class="fa-solid fa-play"></i></div>
                    </div>
                `;
            } else {
                attachmentContent += `
                    <div class="file-attachment mini" onclick="downloadFile('${url}', 'file_${idx + 1}')" style="display: flex; align-items: center; gap: 5px; background: rgba(255,136,0,0.1); padding: 8px; border-radius: 8px; cursor: pointer; border: 1px solid rgba(255,136,0,0.2);">
                        <div style="width: 25px; height: 25px; background: var(--primary-orange); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
                            <i class="fa-solid fa-file-arrow-down"></i>
                        </div>
                        <div style="font-size: 11px; font-weight: 700; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">File ${idx + 1}</div>
                    </div>
                `;
            }
        });
        attachmentContent += '</div>';
    }

    let avatarHtml = '';
    if (!isSent && selectedPartnerProfile) {
        avatarHtml = `<div style="margin-right:10px; align-self: flex-start; margin-bottom: 5px;">${renderAvatar(selectedPartnerProfile, 'nav-avatar')}</div>`;
    }

    const html = `
        <div class="message ${isSent ? 'sent' : 'received'} optimistic" id="msg-${msg.id}" style="opacity: 0.7;">
            ${avatarHtml}
            <div class="message-content-wrapper">
                <div class="message-text">
                    <div class="message-sender-name" style="color: ${isSent ? 'var(--primary-orange)' : '#64748b'}; display: flex; align-items: center; gap: 5px;">
                        ${senderName}
                        ${selectedGroupId && groupMemberRoles.get(String(msg.senderId))?.toUpperCase() === 'ADMIN' ? '<span class="admin-badge-mini">Admin</span>' : ''}
                    </div>
                    <div class="message-body">
                        <div class="text-content">${msg.displayContent || msg.content}</div>
                    </div>
                    ${attachmentContent}
                    <div class="message-status">
                        <span class="time">${formatTime(msg.createdAt)}</span>
                        ${isSent ? `<span class="checkmarks" style="color:#cbd5e1">✓</span>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', html);
    
    // Auto scroll to bottom
    requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
    });

    // Update internal count tracker to avoid jumpy re-render on next poll
    const conversationId = selectedConversationUserId;
    const currentCount = lastMessageCountMap.get(conversationId) || 0;
    lastMessageCountMap.set(conversationId, currentCount + 1);
}

// Minimal Edit/Delete Logic
let editingMessageId = null;
let originalContent = '';
let activeSheetMessageId = null;

function handleOptionsClick(event, messageId) {
    event.stopPropagation();
    if (window.innerWidth <= 768) {
        openBottomSheet(messageId);
    } else {
        toggleMessageOptions(event, messageId);
    }
}



function toggleMessageOptions(event, messageId) {
    const dropdown = document.getElementById(`options-${messageId}`);
    const wasActive = dropdown.classList.contains('active');
    document.querySelectorAll('.message-dropdown').forEach(d => d.classList.remove('active'));
    if (!wasActive) dropdown.classList.add('active');
}

document.addEventListener('click', () => {
    document.querySelectorAll('.message-dropdown').forEach(d => d.classList.remove('active'));
});

async function confirmDeleteMessage(messageId) {
    if (!confirm('Delete this message?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/delete/${messageId}`, { method: 'DELETE' });
        if (res.ok) {
            document.getElementById(`msg-${messageId}`).remove();
            if (typeof showMessage === 'function') showMessage('Deleted', 'success');
        }
    } catch (e) { console.error(e); }
}

function editMessageUI(messageId) {
    const msgEl = document.getElementById(`msg-${messageId}`);
    const body = msgEl.querySelector('.message-body');
    originalContent = body.innerText;
    editingMessageId = messageId;
    body.innerHTML = `
        <div class="edit-message-container">
            <textarea class="edit-message-input">${originalContent}</textarea>
            <div class="edit-actions">
                <button class="edit-btn cancel" onclick="cancelEdit(${messageId})">Cancel</button>
                <button class="edit-btn save" onclick="saveEdit(${messageId})">Save</button>
            </div>
        </div>
    `;
}

function cancelEdit(messageId) {
    const msgEl = document.getElementById(`msg-${messageId}`);
    msgEl.querySelector('.message-body').innerHTML = `<p style="margin:0;">${originalContent}</p>`;
    editingMessageId = null;
}

async function saveEdit(messageId) {
    const msgEl = document.getElementById(`msg-${messageId}`);
    const newContent = msgEl.querySelector('.edit-message-input').value.trim();
    if (!newContent || newContent === originalContent) return cancelEdit(messageId);

    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/edit/${messageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newContent })
        });
        if (res.ok) {
            msgEl.querySelector('.message-body').innerHTML = `<p style="margin:0;">${newContent}</p>`;
            if (!msgEl.querySelector('.edited-tag')) {
                msgEl.querySelector('.message-status').insertAdjacentHTML('beforeend', ' <span class="edited-tag">(edited)</span>');
            }
            editingMessageId = null;
        }
    } catch (e) { console.error(e); }
}

function openBottomSheet(messageId) {
    activeSheetMessageId = messageId;
    const msgEl = document.getElementById(`msg-${messageId}`);
    const isSent = msgEl.classList.contains('sent');
    const hasAttachments = msgEl.querySelector('img') !== null || msgEl.querySelector('.file-attachment') !== null || msgEl.querySelector('video') !== null;

    document.getElementById('sheetEditBtn').style.display = isSent ? 'flex' : 'none';
    document.getElementById('sheetDeleteBtn').style.display = isSent ? 'flex' : 'none';
    
    // Toggle Remove Attachment in bottom sheet
    const removeImgBtn = document.getElementById('sheetRemoveImgBtn');
    if (removeImgBtn) {
        removeImgBtn.style.display = (isSent && hasAttachments) ? 'flex' : 'none';
        const removeLabel = removeImgBtn.querySelector('span');
        if (removeLabel) removeLabel.textContent = 'Remove Attachment';
    }

    // Update labels if needed
    const deleteText = document.querySelector('#sheetDeleteBtn span');
    if (deleteText) deleteText.textContent = hasImage ? 'Delete Message' : 'Delete Message';

    document.getElementById('bottomSheetOverlay').classList.add('active');
    document.getElementById('messageOptionsBottomSheet').classList.add('active');
}

function closeBottomSheet() {
    document.getElementById('bottomSheetOverlay').classList.remove('active');
    document.getElementById('messageOptionsBottomSheet').classList.remove('active');
}

function handleSheetAction(action) {
    const id = activeSheetMessageId;
    closeBottomSheet();
    if (action === 'edit') editMessageUI(id);
    else if (action === 'delete') confirmDeleteMessage(id);
    else if (action === 'copy') copyToClipboardText(id);
    else if (action === 'removeImage') removeImageUI(id);
    else if (action === 'block') blockUserUI(id);
    else if (action === 'report') reportMessageUI(id);
}

function copyToClipboardText(id) {
    const text = document.getElementById(`msg-${id}`).querySelector('.message-body').innerText;
    navigator.clipboard.writeText(text);
    if (typeof showMessage === 'function') showMessage('Copied', 'success');
}

async function removeImageUI(messageId) {
    if (!confirm('Remove image/file from this message?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/remove-image/${messageId}`, { method: 'PUT' });
        if (res.ok) {
            const msgEl = document.getElementById(`msg-${messageId}`);
            const attachments = msgEl.querySelector('.message-attachments-grid');
            if (attachments) attachments.remove();
            if (typeof showMessage === 'function') showMessage('Image Removed', 'success');
        }
    } catch (e) { console.error(e); }
}


// Send message
async function sendMessage() {
    console.log("sendMessage called");
    const input = document.getElementById('messageInput');
    if (!input || isSending) return;
    
    const content = input.value.trim();
    
    // CC-MODERATION: Check content safety
    const contentCheck = isContentSafe(content);
    if (!contentCheck.safe) {
        showMessage(`Message Blocked: Contains a restricted phrase ("${contentCheck.keyword}"). Scam and fraudulent messages are strictly prohibited.`, 'error');
        return;
    }

    const hasAttachments = selectedFiles && selectedFiles.length > 0;

    if (!content && !hasAttachments) {
        return;
    }

    if (!selectedConversationUserId && !selectedGroupId && !currentUserId) {
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
        groupId: selectedGroupId,
        content: finalContent,
        imageUrl: selectedFiles.length > 0 && selectedFiles[0].type === 'image' ? selectedFiles[0].url : '',
        fileUrl: selectedFiles.length > 0 && selectedFiles[0].type === 'file' ? selectedFiles[0].url : '',
        fileType: selectedFiles.length > 0 ? selectedFiles[0].rawType : '',
        fileUrls: selectedFiles.map(f => f.url)
    };

    // OPTIMISTIC UI: Append message immediately
    const tempMsg = {
        id: Date.now(),
        senderId: currentUserId,
        receiverId: selectedConversationUserId,
        content: content,
        imageUrl: payload.imageUrl,
        fileUrl: payload.fileUrl,
        fileUrls: payload.fileUrls,
        createdAt: new Date().toISOString(),
        isRead: false,
        displayContent: typeof enhanceMessageDisplay === 'function' ? enhanceMessageDisplay({content: content}) : content
    };
    
    appendSingleMessage(tempMsg);

    // Clear input and previews immediately for snappy UI
    input.value = '';
    clearPreview();
    isSending = true;
    const sendBtn = document.querySelector('.send-btn');
    if (sendBtn) {
        sendBtn.classList.add('sending');
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const savedMsg = await response.json();
            
            // Resolve optimistic UI
            const tempEl = document.getElementById(`msg-${tempMsg.id}`);
            if (tempEl) {
                tempEl.style.opacity = '1';
                tempEl.classList.remove('optimistic');
                const checkmarks = tempEl.querySelector('.checkmarks');
                if (checkmarks) checkmarks.textContent = '✓'; // Single check for sent
            }

            // Load conversations in background to update sidebar
            loadConversations();
            // Re-focus input
            input.focus();
        } else {
            const err = await response.text();
            console.error('Error sending message:', err);
            
            // Remove optimistic message on failure
            const tempEl = document.getElementById(`msg-${tempMsg.id}`);
            if (tempEl) tempEl.remove();

            const errorMsg = err.includes('Error sending message:') ? err.split('Error sending message:')[1] : err;
            showMessage(errorMsg || 'We couldn’t send your message. Please try again.', 'error');
            loadMessages();
        }
    } catch (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on failure
        const tempEl = document.getElementById(`msg-${tempMsg.id}`);
        if (tempEl) tempEl.remove();
        
        showMessage('Network error. Please check your internet connection.', 'error');
        loadMessages();
    } finally {
        isSending = false;
        const sendBtn = document.querySelector('.send-btn');
        if (sendBtn) {
            sendBtn.classList.remove('sending');
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
async function loadConversations() {
    if (!currentUserId) return;
    try {
        const [convRes, groupsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/messages/conversations?userId=${currentUserId}`),
            fetch(`${API_BASE_URL}/api/groups/user/${currentUserId}`)
        ]);
        
        if (convRes.ok) conversations = await convRes.json();
        if (groupsRes.ok) userGroups = await groupsRes.json();
        
        displayConversations();
    } catch (e) {
        console.error("Error loading conversations:", e);
    }
}

// Search conversations (Debounced for better performance)
const searchConversations = debounce(() => {
    const input = document.getElementById('searchConversations');
    if (!input) return;
    
    const query = input.value.toLowerCase().trim();
    
    // Filter existing conversations
    const filtered = conversations.filter(conv => {
        const otherUser = conv.otherUser;
        const nameMatch = (otherUser?.name || 'User').toLowerCase().includes(query);
        const contentMatch = (conv.lastMessage || '').toLowerCase().includes(query);
        return nameMatch || contentMatch;
    });
    displayConversations(filtered);
}, 300);

// Also expose to window for the oninput attribute
window.searchConversations = searchConversations;

// Support for multiple files (up to 7)
let selectedFiles = [];

async function handleFileSelect(e, type) {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (selectedFiles.length + files.length > 7) {
        showMessage('You can only select up to 7 files total.', 'error');
        return;
    }

    for (const file of files) {
        const isVideo = file.type.startsWith('video/') || 
                        file.name.match(/\.(mp4|webm|ogg|mov|avi|flv|wmv)$/i);
        
        // Video upload restriction removed for live environment


        if (file.size > 100 * 1024 * 1024) {
            showMessage(`${file.name} is too big! (Max 100MB)`, 'error');
            continue;
        }

        try {
            const dataUrl = await uploadImage(file); // existing helper
            selectedFiles.push({
                name: file.name,
                url: dataUrl,
                type: type,
                rawType: file.type
            });
        } catch (error) {
            showMessage(`Failed to upload ${file.name}`, 'error');
        }
    }
    renderFilePreviews();
}

document.getElementById('messageImage')?.addEventListener('change', (e) => handleFileSelect(e, 'image'));
document.getElementById('messageFile')?.addEventListener('change', (e) => handleFileSelect(e, 'file'));

function renderFilePreviews() {
    const previewArea = document.getElementById('previewArea');
    if (!previewArea) return;
    
    if (selectedFiles.length === 0) {
        previewArea.style.display = 'none';
        previewArea.innerHTML = '';
        return;
    }

    previewArea.style.display = 'flex';
    previewArea.style.flexWrap = 'wrap';
    previewArea.style.gap = '8px';
    previewArea.style.padding = '10px';

    previewArea.innerHTML = selectedFiles.map((file, index) => {
        if (file.type === 'image') {
            return `
                <div style="position: relative; width: 60px; height: 60px; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
                    <img src="${file.url}" style="width: 100%; height: 100%; object-fit: cover;">
                    <div onclick="removeSelectedFile(${index})" style="position: absolute; top: 2px; right: 2px; background: rgba(255,0,0,0.8); color: white; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 12px; cursor: pointer; font-weight: bold;">×</div>
                </div>
            `;
        } else {
            return `
                <div style="position: relative; display: flex; align-items: center; gap: 8px; background: #f8f9fa; padding: 8px 12px; border-radius: 8px; border: 1px solid #eee; max-width: 150px;">
                    <i class="fa-solid fa-file" style="color: var(--primary-orange);"></i>
                    <span style="font-size: 11px; color: #444; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${file.name}</span>
                    <div onclick="removeSelectedFile(${index})" style="color: #ff4444; cursor: pointer; font-weight: bold; font-size: 14px; margin-left: 5px;">×</div>
                </div>
            `;
        }
    }).join('');
}

function removeSelectedFile(index) {
    selectedFiles.splice(index, 1);
    renderFilePreviews();
}

function clearPreview() {
    selectedFiles = [];
    const previewArea = document.getElementById('previewArea');
    if (previewArea) {
        previewArea.style.display = 'none';
        previewArea.innerHTML = '';
    }
    const imgInput = document.getElementById('messageImage');
    if(imgInput) imgInput.value = '';
    const fileInput = document.getElementById('messageFile');
    if(fileInput) fileInput.value = '';
}
function downloadFile(url, filename) {
    if (!url) return;
    try {
        let targetUrl = url;
        let isDataUrl = url.startsWith('data:');
        
        if (isDataUrl) {
            const parts = url.split(';base64,');
            if (parts.length === 2) {
                const contentType = parts[0].split(':')[1];
                const raw = window.atob(parts[1]);
                const rawLength = raw.length;
                const uInt8Array = new Uint8Array(rawLength);
                for (let i = 0; i < rawLength; ++i) {
                    uInt8Array[i] = raw.charCodeAt(i);
                }
                const blob = new Blob([uInt8Array], { type: contentType });
                targetUrl = URL.createObjectURL(blob);
            }
        }

        const link = document.createElement('a');
        link.href = targetUrl;
        link.download = filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (targetUrl !== url) {
            setTimeout(() => URL.revokeObjectURL(targetUrl), 1000);
        }
    } catch (e) {
        console.error("Download failed:", e);
        window.open(url, '_blank');
    }
}

function viewFile(url) {
    if (!url) return;
    const isImage = url.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || url.startsWith('data:image/');
    
    if (isImage && typeof viewImageFull === 'function') {
        viewImageFull(url);
    } else if (url.startsWith('data:')) {
        viewFileFromBase64(url);
    } else {
        window.open(url, '_blank');
    }
}

// Group Creation Functions
function openCreateGroupModal() {
    document.getElementById('createGroupModal').style.display = 'flex';
    const listEl = document.getElementById('groupMembersList');
    listEl.innerHTML = '<div style="padding: 10px; text-align: center;">Loading connections...</div>';
    
    // Fetch followers to add to group
    fetch(`${API_BASE_URL}/api/profile/${currentUserId}/followers`)
        .then(res => res.json())
        .then(users => {
            if (users.length === 0) {
                listEl.innerHTML = '<div style="padding: 10px; text-align: center; color: #999;">No connections to add.</div>';
                return;
            }
            listEl.innerHTML = users.map(u => `
                <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #f9f9f9;">
                    <input type="checkbox" class="group-member-checkbox" value="${u.id}">
                    <div class="initials-avatar" style="width: 30px; height: 30px; font-size: 12px;">${getInitials(u.name)}</div>
                    <span style="font-size: 14px;">${u.name}</span>
                </div>
            `).join('');
        });
}

function closeCreateGroupModal() {
    document.getElementById('createGroupModal').style.display = 'none';
}

async function submitCreateGroup() {
    const name = document.getElementById('groupNameInput').value.trim();
    const description = document.getElementById('groupDescInput').value.trim();
    const selectedCheckboxes = document.querySelectorAll('.group-member-checkbox:checked');
    const memberIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));

    if (!name) {
        if (typeof showMessage === 'function') showMessage('Please enter a group name', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/groups/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                description,
                creatorId: currentUserId,
                memberIds
            })
        });

        if (res.ok) {
            if (typeof showMessage === 'function') showMessage('Group created successfully!', 'success');
            closeCreateGroupModal();
            loadConversations();
            // Re-connect WS to subscribe to new group
            connectWebSocket();
        } else {
            const err = await res.text();
            if (typeof showMessage === 'function') showMessage('Error: ' + err, 'error');
        }
    } catch (e) {
        console.error(e);
    }
}

async function selectGroup(groupId) {
    selectedConversationUserId = null;
    selectedGroupId = groupId;
    
    const group = userGroups.find(g => String(g.id) === String(groupId));
    if (!group) return;

    document.getElementById('chatUserName').textContent = group.name;
    document.getElementById('chatUserStatus').textContent = 'Group Chat';
    
    const avatarEl = document.getElementById('chatUserAvatar');
    avatarEl.innerHTML = `<i class="fa-solid fa-users"></i>`;
    avatarEl.className = 'initials-avatar group-avatar';

    // Show leave group button
    const leaveBtn = document.getElementById('leaveGroupBtn');
    if (leaveBtn) leaveBtn.style.display = 'inline-block';
    
    document.getElementById('chatOverlay').style.display = 'flex';
    
    // Fetch member roles for this group to show badges in messages
    await fetchGroupMemberRoles(groupId);
    
    loadMessages();
}

async function fetchGroupMemberRoles(groupId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`);
        if (res.ok) {
            const members = await res.json();
            groupMemberRoles.clear();
            members.forEach(m => groupMemberRoles.set(String(m.userId), m.role));
        }
    } catch (e) { console.error(e); }
}

async function blockUserUI(messageId) {
    const targetId = selectedConversationUserId;
    if (!targetId) return;
    
    if (!confirm('Are you sure you want to block this user? You will no longer receive messages from them.')) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/block/${targetId}?userId=${currentUserId}`, { method: 'POST' });
        if (res.ok) {
            showMessage('User blocked', 'success');
            closeChatArea();
            loadConversations();
        }
    } catch (e) { console.error(e); }
}

async function leaveGroupUI() {
    if (!selectedGroupId) return;
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/member/${currentUserId}?adminId=${currentUserId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            showMessage('You have left the group', 'success');
            closeChatArea();
            loadConversations();
        }
    } catch (e) { console.error(e); }
}

async function reportMessageUI(messageId) {
    const reason = prompt('Why are you reporting this message? (e.g. HARASSMENT, SPAM, INAPPROPRIATE)');
    if (!reason) return;
    
    const details = prompt('Any additional details?');
    
    const payload = {
        reporterId: currentUserId,
        targetUserId: selectedConversationUserId,
        messageId: messageId,
        reason: reason.toUpperCase(),
        details: details
    };
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/messages/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showMessage('Report submitted to admins', 'success');
        }
    } catch (e) { console.error(e); }
}

// Terms Consent Functions
function showTermsModal() {
    const modal = document.getElementById('termsConsentModal');
    const checkbox = document.getElementById('termsCheckbox');
    const btn = document.getElementById('consentSubmitBtn');
    
    if (modal) modal.style.display = 'flex';
    
    if (checkbox && btn) {
        checkbox.addEventListener('change', () => {
            btn.disabled = !checkbox.checked;
            btn.style.background = checkbox.checked ? '#f97316' : '#cbd5e1';
            btn.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
        });
    }
}

async function submitTermsConsent() {
    try {
        // Fetch current user first to avoid data loss
        const userRes = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}?viewerId=${currentUserId}`);
        if (!userRes.ok) return;
        const user = await userRes.json();
        
        user.termsAccepted = true;
        
        const res = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });
        
        if (res.ok) {
            document.getElementById('termsConsentModal').style.display = 'none';
            if (typeof showMessage === 'function') showMessage('Terms accepted. Welcome!', 'success');
        }
    } catch (e) { console.error(e); }
}

// Helper for Initials
function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

async function getUserProfile(userId) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userId}?viewerId=${currentUserId}`);
        if (res.ok) return await res.json();
    } catch (e) { console.error(e); }
    return null;
}

function getRandomColor(seed) {
    const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50', '#ff9800', '#795548'];
    if (!seed) return colors[0];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

function toggleGroupInfo() {
    const panel = document.getElementById('groupInfoPanel');
    if (!panel) return;
    
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'flex';
        if (selectedGroupId) loadGroupMembers(selectedGroupId);
    } else {
        panel.style.display = 'none';
    }
}

async function loadGroupMembers(groupId) {
    const listEl = document.getElementById('infoMembersList');
    const group = userGroups.find(g => String(g.id) === String(groupId));
    
    if (group) {
        document.getElementById('infoGroupName').textContent = group.name;
        document.getElementById('infoGroupDesc').textContent = group.description || 'No description provided';
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`);
        if (res.ok) {
            const members = await res.json();
            
            // Check if current user is admin
            const currentMember = members.find(m => String(m.userId) === String(currentUserId));
            const isAdmin = currentMember && currentMember.role === 'ADMIN';
            
            const addBtn = document.getElementById('addMemberBtn');
            if (addBtn) addBtn.style.display = isAdmin ? 'block' : 'none';

            // Fetch user details for each member
            const membersWithDetails = await Promise.all(members.map(async m => {
                const profile = await getUserProfile(m.userId);
                return { ...m, profile };
            }));

            listEl.innerHTML = membersWithDetails.map(m => `
                <div class="info-member-row">
                    <div class="initials-avatar" style="width: 32px; height: 32px; font-size: 12px; background: ${getRandomColor(m.profile?.name)}">
                        ${getInitials(m.profile?.name)}
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px;">
                            ${m.profile?.name || 'Unknown'}
                            ${String(m.role).toUpperCase() === 'ADMIN' ? '<span class="admin-badge">Admin</span>' : ''}
                        </div>
                        <div style="font-size: 11px; color: #94a3b8;">${m.profile?.role || 'Member'}</div>
                    </div>
                    ${isAdmin && String(m.userId) !== String(currentUserId) ? `
                        <div class="member-actions" style="position: relative;">
                            <button onclick="toggleMemberActions(event, ${m.userId})" style="background: none; border: none; color: #94a3b8; cursor: pointer; padding: 5px;">
                                <i class="fa-solid fa-ellipsis-vertical"></i>
                            </button>
                            <div id="member-actions-${m.userId}" class="message-dropdown" style="right: 0; top: 100%;">
                                ${m.role !== 'ADMIN' ? `<div class="message-dropdown-item" onclick="promoteToAdmin(${m.userId})"><i class="fa-solid fa-shield"></i> Make Admin</div>` : ''}
                                <div class="message-dropdown-item delete" onclick="removeMember(${m.userId})"><i class="fa-solid fa-user-minus"></i> Remove</div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

function toggleMemberActions(event, userId) {
    event.stopPropagation();
    document.querySelectorAll('.message-dropdown').forEach(d => {
        if (d.id !== `member-actions-${userId}`) d.classList.remove('active');
    });
    document.getElementById(`member-actions-${userId}`).classList.toggle('active');
}

function openAddMemberModal() {
    document.getElementById('addMemberModal').style.display = 'flex';
    const listEl = document.getElementById('addMembersSearchList');
    listEl.innerHTML = '<div style="padding: 20px; text-align: center;">Loading connections...</div>';
    
    // Fetch followers who aren't in the group
    fetch(`${API_BASE_URL}/api/profile/${currentUserId}/followers`)
        .then(res => res.json())
        .then(async followers => {
            const currentMembersRes = await fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/members`);
            const currentMembers = await currentMembersRes.json();
            const memberIds = new Set(currentMembers.map(m => String(m.userId)));
            
            const nonMembers = followers.filter(u => !memberIds.has(String(u.id)));
            
            if (nonMembers.length === 0) {
                listEl.innerHTML = '<div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 13px;">No connections to add. Follow more people to expand your group!</div>';
                return;
            }

            listEl.innerHTML = nonMembers.map(u => `
                <div style="display: flex; align-items: center; gap: 12px; padding: 10px; border-bottom: 1px solid #f8fafc;">
                    <input type="checkbox" class="add-member-checkbox" value="${u.id}" style="width: 18px; height: 18px;">
                    <div class="initials-avatar" style="width: 36px; height: 36px; font-size: 13px;">${getInitials(u.name)}</div>
                    <div>
                        <div style="font-size: 14px; font-weight: 600;">${u.name}</div>
                        <div style="font-size: 11px; color: #94a3b8;">${u.role || 'Professional'}</div>
                    </div>
                </div>
            `).join('');
        });
}

function closeAddMemberModal() {
    document.getElementById('addMemberModal').style.display = 'none';
}

async function submitAddMembers() {
    const selected = document.querySelectorAll('.add-member-checkbox:checked');
    const ids = Array.from(selected).map(cb => parseInt(cb.value));
    
    if (ids.length === 0) {
        closeAddMemberModal();
        return;
    }

    try {
        for (const userId of ids) {
            await fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/add?userId=${userId}&adderId=${currentUserId}`, {
                method: 'POST'
            });
        }
        showMessage('Members added successfully', 'success');
        closeAddMemberModal();
        loadGroupMembers(selectedGroupId);
    } catch (e) {
        console.error(e);
        showMessage('Error adding members', 'error');
    }
}

async function promoteToAdmin(userId) {
    if (!confirm('Promote this member to Group Admin?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/promote?userId=${userId}`, {
            method: 'POST'
        });
        if (res.ok) {
            showMessage('Member promoted to Admin', 'success');
            // Refresh member list AND roles cache for badges
            await fetchGroupMemberRoles(selectedGroupId);
            loadGroupMembers(selectedGroupId);
        }
    } catch (e) { console.error(e); }
}

async function removeMember(userId) {
    if (!confirm('Remove this member from the group?')) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${selectedGroupId}/member/${userId}?adminId=${currentUserId}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            showMessage('Member removed', 'success');
            loadGroupMembers(selectedGroupId);
        }
    } catch (e) { console.error(e); }
}

// Ensure toggleGroupInfo is called correctly when switching groups
const originalSelectGroup = selectGroup;
window.selectGroup = async function(groupId) {
    await originalSelectGroup(groupId);
    // Hide info panel if it was open for a different group
    const panel = document.getElementById('groupInfoPanel');
    if (panel) panel.style.display = 'none';
    
    // Show info btn
    const infoBtn = document.getElementById('groupInfoBtn');
    if (infoBtn) infoBtn.style.display = 'block';
};

const originalOpenConversation = openConversation;
window.openConversation = async function(userId) {
    await originalOpenConversation(userId);
    // Hide info panel and btn for private chats
    const panel = document.getElementById('groupInfoPanel');
    if (panel) panel.style.display = 'none';
    const infoBtn = document.getElementById('groupInfoBtn');
    if (infoBtn) infoBtn.style.display = 'none';
    selectedGroupId = null;
};
