// Configuration
const API_BASE_URL = 'http://localhost:8084/api/chat';
const WS_ENDPOINT = 'http://localhost:8084/ws-chat';

// State
let stompClient = null;
let currentUserId = 1; // Default test user
let activeConversationId = null;
let activeOtherUserId = null;
let conversations = [];

// DOM Elements
const sidebar = document.getElementById('sidebar');
const conversationList = document.getElementById('conversation-list');
const chatPlaceholder = document.getElementById('chat-placeholder');
const chatActive = document.getElementById('chat-active');
const messageContainer = document.getElementById('message-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const backBtn = document.getElementById('back-btn');
const activeUserImg = document.getElementById('active-user-img');
const activeUserName = document.getElementById('active-user-name');
const activeUserStatus = document.getElementById('active-user-status');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Prompt for user ID if needed for testing
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('userId')) {
        currentUserId = parseInt(urlParams.get('userId'));
    }

    loadConversations();
    connectWebSocket();

    // Event Listeners
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    backBtn.addEventListener('click', () => {
        sidebar.classList.remove('hidden');
    });
});

// WebSocket logic
function connectWebSocket() {
    const socket = new SockJS(WS_ENDPOINT);
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Disable logging

    stompClient.connect({}, (frame) => {
        console.log('Connected: ' + frame);
        
        // Subscribe to private messages
        stompClient.subscribe(`/user/${currentUserId}/queue/messages`, (message) => {
            const msg = JSON.parse(message.body);
            onMessageReceived(msg);
        });
    }, (error) => {
        console.error('WebSocket Error: ', error);
        setTimeout(connectWebSocket, 5000); // Attempt reconnection
    });
}

async function loadConversations() {
    try {
        const response = await fetch(`${API_BASE_URL}/conversations/${currentUserId}`);
        conversations = await response.json();
        renderConversations();
    } catch (error) {
        console.error('Failed to load conversations:', error);
        conversationList.innerHTML = '<div class="error">Error loading chats</div>';
    }
}

function renderConversations() {
    if (conversations.length === 0) {
        conversationList.innerHTML = '<div class="empty-state">No conversations yet</div>';
        return;
    }

    conversationList.innerHTML = '';
    conversations.forEach(conv => {
        const item = document.createElement('div');
        item.className = `conversation-item ${conv.conversation_id === activeConversationId ? 'active' : ''}`;
        
        const timestamp = conv.last_message_time ? formatTime(conv.last_message_time) : '';
        
        item.innerHTML = `
            <img src="${conv.profile_image || 'https://ui-avatars.com/api/?name=' + conv.other_user_name}" alt="${conv.other_user_name}">
            <div class="conversation-info">
                <div class="conv-header">
                    <span class="conv-name">${conv.other_user_name}</span>
                    <span class="conv-time">${timestamp}</span>
                </div>
                <div class="conv-last-msg">${conv.last_message || 'No messages yet'}</div>
            </div>
        `;
        
        item.addEventListener('click', () => openChat(conv));
        conversationList.appendChild(item);
    });
}

async function openChat(conv) {
    activeConversationId = conv.conversation_id;
    activeOtherUserId = conv.user_id;

    // UI Updates
    chatPlaceholder.style.display = 'none';
    chatActive.style.display = 'flex';
    if (window.innerWidth <= 768) {
        sidebar.classList.add('hidden');
    }

    activeUserImg.src = conv.profile_image || `https://ui-avatars.com/api/?name=${conv.other_user_name}`;
    activeUserName.innerText = conv.other_user_name;
    
    // Highlight active in list
    document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
    renderConversations();

    loadMessages();
}

async function loadMessages() {
    messageContainer.innerHTML = '<div class="loading">Loading messages...</div>';
    try {
        const response = await fetch(`${API_BASE_URL}/messages/${activeConversationId}`);
        const data = await response.json();
        const messages = data.content.reverse(); // Page is descending, we want ascending for display
        
        messageContainer.innerHTML = '';
        if (messages.length === 0) {
            messageContainer.innerHTML = '<div class="empty-messages">Say hello!</div>';
        } else {
            messages.forEach(appendMessageUI);
        }
        scrollToBottom();
    } catch (error) {
        console.error('Failed to load messages:', error);
    }
}

function appendMessageUI(msg) {
    const isSent = msg.senderId === currentUserId;
    const msgEl = document.createElement('div');
    msgEl.className = `message ${isSent ? 'sent' : 'received'}`;
    
    const time = formatTime(msg.timestamp);
    
    msgEl.innerHTML = `
        <div class="message-text">${msg.messageText}</div>
        <span class="message-time">${time}</span>
    `;
    
    messageContainer.appendChild(msgEl);
    scrollToBottom();
}

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !stompClient || !activeConversationId) return;

    const messagePayload = {
        conversationId: activeConversationId,
        senderId: currentUserId,
        receiverId: activeOtherUserId,
        content: text,
        timestamp: new Date().toISOString()
    };

    // Optimistic UI update
    appendMessageUI({
        senderId: currentUserId,
        messageText: text,
        timestamp: new Date()
    });

    stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(messagePayload));
    
    messageInput.value = '';
    messageInput.focus();
}

function onMessageReceived(msg) {
    // If receiving a message for the currently active chat
    if (msg.conversationId === activeConversationId) {
        appendMessageUI(msg);
    }
    
    // Refresh conversation list to show last message
    loadConversations();
}

// Helpers
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    messageContainer.scrollTop = messageContainer.scrollHeight;
}
