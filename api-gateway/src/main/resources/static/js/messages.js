const MessagingUI = {
    switchTab: function(tabName) {
        // Redirection to the new tab switching logic
        switchSidebarTab(tabName);
    }
};

function switchSidebarTab(tabName) {
    const chatTab = document.getElementById('conversationsList');
    const followTab = document.getElementById('followingList');
    const btns = document.querySelectorAll('.list-tabs button');

    if (tabName === 'conversations') {
        if (chatTab) chatTab.style.display = 'flex';
        if (followTab) followTab.style.display = 'none';
        btns[0]?.classList.add('active');
        btns[1]?.classList.remove('active');
    } else {
        if (chatTab) chatTab.style.display = 'none';
        if (followTab) followTab.style.display = 'flex';
        btns[0]?.classList.remove('active');
        btns[1]?.classList.add('active');
    }
}

let currentUserId = null;
let selectedConversationUserId = null;
let conversations = [];
let stompClient = null;

const WS_ENDPOINT = 'http://localhost:8084/ws-chat';

document.addEventListener('DOMContentLoaded', () => {
    console.log("Messages JS Loaded");
    
    currentUserId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : localStorage.getItem('userId');
    console.log("Current User ID:", currentUserId);

    if (!currentUserId) {
        console.error("No user id found");
        return;
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
        stompClient.subscribe(`/user/${currentUserId}/queue/messages`, (message) => {
            const msg = JSON.parse(message.body);
            onMessageReceived(msg);
        });
    }, (error) => {
        console.error('WebSocket error:', error);
        setTimeout(connectWebSocket, 5000);
    });
}

function onMessageReceived(msg) {
    if (selectedConversationUserId == msg.senderId) {
        loadMessages();
    }
    loadConversations();
}

async function initMessaging() {
    try {
        await Promise.all([
            loadConversations(),
            loadFollowing()
        ]);
    } catch (e) {
        console.error("Failed to initialize messaging:", e);
    }
}

// Load conversations
async function loadConversations() {
    try {
        const url = `${API_BASE_URL}/api/messages/conversations?userId=${currentUserId}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fetch failed");
        
        let messages = await response.json();
        
        // Group by conversation
        const conversationMap = new Map();
        messages.forEach(msg => {
            const otherUserId = msg.senderId == currentUserId ? msg.receiverId : msg.senderId;
            if (!conversationMap.has(otherUserId) || new Date(msg.createdAt) > new Date(conversationMap.get(otherUserId).createdAt)) {
                conversationMap.set(otherUserId, msg);
            }
        });

        conversations = Array.from(conversationMap.values());

        // Enrich profiles
        for (let msg of conversations) {
            const otherUserId = msg.senderId == currentUserId ? msg.receiverId : msg.senderId;
            const profile = await getUserProfile(otherUserId);
            if (msg.senderId == currentUserId) msg.receiver = profile;
            else msg.sender = profile;
        }

        displayConversations();
    } catch (error) {
        console.error('Error loading conversations:', error);
    }
}

// Load following
async function loadFollowing() {
    try {
        const respFollowing = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}/following`);
        let following = await respFollowing.json();
        displayUsersList('followingList', following, 'Not following anyone yet');
        
        const respFollowers = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}/followers`);
        let followers = await respFollowers.json();

        // Update counts
        const followingCountEl = document.getElementById('followingCount');
        if (followingCountEl) followingCountEl.innerText = `${following.length} Following`;

        const followerCountEl = document.getElementById('followerCount');
        if (followerCountEl) followerCountEl.innerText = `${followers.length} Followers`;

        const followingIds = following.map(u => u.id);
        const mutuals = followers.filter(u => followingIds.includes(u.id));
        const mutualCountEl = document.getElementById('mutualCount');
        if (mutualCountEl) mutualCountEl.innerText = `${mutuals.length} Mutual`;
    } catch (error) {
        console.error('Error loading following:', error);
    }
}

// User list rendering matching screenshot
function displayUsersList(elementId, users, emptyMessage) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    if (!Array.isArray(users) || users.length === 0) {
        container.innerHTML = `<div style="padding: 20px; color: #999;">${emptyMessage}</div>`;
        return;
    }

    container.innerHTML = users.map(user => {
        const initials = (user.name || 'U').charAt(0).toUpperCase();
        const color = getRandomColor(user.name);
        
        return `
            <div class="user-row" onclick="openConversation(${user.id})">
                <div class="initials-avatar" style="background: ${color}">${initials}</div>
                <div class="user-main">
                    <div class="user-name-row">
                        <h4>${user.name || 'User'}</h4>
                        <span class="user-time">active now</span>
                    </div>
                    <div class="user-status-row">
                        <span class="user-status">${user.role || 'Film Professional'}</span>
                        <span class="badge-pill">FOLLOWING</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}


// Conversations rendering matching screenshot
async function displayConversations() {
    const container = document.getElementById('conversationsList');
    if (!container) return;
    
    if (conversations.length === 0) {
        container.innerHTML = '<div style="padding: 20px; color: #999;">No conversations yet</div>';
        return;
    }

    container.innerHTML = conversations.map(msg => {
        const otherUserId = msg.senderId == currentUserId ? msg.receiverId : msg.senderId;
        const otherUser = msg.senderId == currentUserId ? msg.receiver : msg.sender;
        const isActive = selectedConversationUserId == otherUserId;
        const name = otherUser?.name || 'User';
        const initials = name.charAt(0).toUpperCase();
        const color = getRandomColor(name);

        return `
            <div class="user-row ${isActive ? 'active' : ''}" onclick="openConversation(${otherUserId})">
                <div class="initials-avatar" style="background: ${color}">${initials}</div>
                <div class="user-main">
                    <div class="user-name-row">
                        <h4>${name}</h4>
                        <span class="user-time">${formatDateShort(msg.createdAt)}</span>
                    </div>
                    <div class="user-status-row">
                        <span class="user-status">${truncateText(msg.content || 'Attached file', 40)}</span>
                        <span class="badge-pill">FOLLOWING</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function formatDateShort(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

let selectedPartnerProfile = null;
let refreshInterval = null;

// Open conversation in overlay
async function openConversation(userId) {
    if (!userId) return;
    selectedConversationUserId = userId;

    const chatOverlay = document.getElementById('chatOverlay');
    if (chatOverlay) chatOverlay.style.display = 'flex';
    
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
        }
    } catch (error) {
        console.error('Error loading partner info:', error);
    }

    loadMessages();
}

function closeChatArea() {
    const chatOverlay = document.getElementById('chatOverlay');
    if (chatOverlay) chatOverlay.style.display = 'none';
    selectedConversationUserId = null;
    selectedPartnerProfile = null;
}

// Load messages
async function loadMessages() {
    if (!selectedConversationUserId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/messages/${currentUserId}?otherUserId=${selectedConversationUserId}`);
        const messages = await response.json();
        displayMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// Display messages
function displayMessages(messages) {
    const container = document.getElementById('messagesArea');
    if (!container) return;
    
    container.innerHTML = messages.map((msg) => {
        const isSent = msg.senderId == currentUserId;
        return `
            <div class="message ${isSent ? 'sent' : 'received'}" style="margin-bottom: 10px; display: flex; flex-direction: column; align-items: ${isSent ? 'flex-end' : 'flex-start'}">
                <div style="background: ${isSent ? '#dcf8c6' : '#eee'}; padding: 10px; border-radius: 10px; max-width: 80%">
                    ${msg.content}
                    <div style="font-size: 10px; color: #888; text-align: right; margin-top: 5px">${formatTime(msg.createdAt)}</div>
                </div>
            </div>
        `;
    }).join('');
    container.scrollTop = container.scrollHeight;
}

// Send message
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content || !selectedConversationUserId) return;

    if (stompClient && stompClient.connected) {
         const messagePayload = {
            senderId: currentUserId,
            receiverId: selectedConversationUserId,
            content: content,
            timestamp: new Date().toISOString()
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(messagePayload));
        input.value = '';
    } else {
        // Fallback REST
        await fetch(`${API_BASE_URL}/api/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: currentUserId,
                receiverId: selectedConversationUserId,
                content: content
            })
        });
        input.value = '';
        loadMessages();
    }
}

function handleEnter(event) {
    if (event.key === 'Enter') sendMessage();
}

function getRandomColor(name) {
    if (!name) return '#ff8800';
    const colors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#009688', '#4caf50', '#ffc107', '#ff5722'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}
