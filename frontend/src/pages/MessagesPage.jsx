import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, ArrowLeft, Paperclip, Smile, Send, UserMinus, UserPlus, Users, Heart, MessageSquare } from 'lucide-react';
import './MessagesPage.css';

const MessagesPage = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSelectedUserId = queryParams.get('userId');

    const [activeTab, setActiveTab] = useState('conversations'); 
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [following, setFollowing] = useState([]);
    const [followers, setFollowers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const currentUserId = localStorage.getItem('userId');
    const scrollRef = useRef();

    useEffect(() => {
        fetchConnections();
        fetchConversations();
        
        if (initialSelectedUserId) {
            fetchAndSelectUser(initialSelectedUserId);
        }
    }, [initialSelectedUserId]);

    const fetchAndSelectUser = async (id) => {
        try {
            const res = await fetch(`http://localhost:8081/api/profile/${id}`);
            if (res.ok) {
                const userData = await res.json();
                setSelectedUser(userData);
            }
        } catch (error) {
            console.error('Error fetching user for auto-selection:', error);
        }
    };

    useEffect(() => {
        if (selectedUser) {
            fetchConversation(selectedUser.id);
        }
    }, [selectedUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchConnections = async () => {
        try {
            // Using absolute URLs for development consistency
            const [followingRes, followersRes] = await Promise.all([
                fetch(`http://localhost:8081/api/profile/${currentUserId}/following`),
                fetch(`http://localhost:8081/api/profile/${currentUserId}/followers`)
            ]);
            
            const followingData = await followingRes.json();
            const followersData = await followersRes.json();
            
            setFollowing(Array.isArray(followingData) ? followingData : []);
            setFollowers(Array.isArray(followersData) ? followersData : []);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching connections:', error);
            setLoading(false);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await fetch(`http://localhost:8084/api/messages/conversations?userId=${currentUserId}`);
            const data = await res.json();
            
            const conversationMap = {};
            data.forEach(msg => {
                const otherId = msg.senderId == currentUserId ? msg.receiverId : msg.senderId;
                if (!conversationMap[otherId] || new Date(msg.createdAt) > new Date(conversationMap[otherId].createdAt)) {
                    conversationMap[otherId] = msg;
                }
            });

            const conversationList = await Promise.all(Object.keys(conversationMap).map(async (id) => {
                const userRes = await fetch(`http://localhost:8081/api/profile/${id}`);
                const userData = await userRes.json();
                return {
                    user: userData,
                    lastMessage: conversationMap[id]
                };
            }));

            setConversations(conversationList.sort((a, b) => 
                new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
            ));
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchConversation = async (otherUserId) => {
        try {
            const res = await fetch(`http://localhost:8084/api/messages/${currentUserId}?otherUserId=${otherUserId}`);
            const data = await res.json();
            setMessages(data);
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        const messageData = {
            senderId: currentUserId,
            receiverId: selectedUser.id,
            content: newMessage,
            imageUrl: null
        };

        try {
            const res = await fetch('http://localhost:8084/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(messageData)
            });

            if (res.ok) {
                const sentMsg = await res.json();
                setMessages([...messages, sentMsg]);
                setNewMessage('');
                fetchConversations();
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const filteredUsers = () => {
        let users = [];
        if (activeTab === 'conversations') {
            return conversations
                .filter(c => c.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(c => ({
                    ...c.user,
                    lastMessage: c.lastMessage.content,
                    time: formatCompactTime(c.lastMessage.createdAt),
                    isFollowing: following.some(f => f.id === c.user.id),
                    isFollower: followers.some(f => f.id === c.user.id)
                }));
        } else if (activeTab === 'following') {
            users = following;
        } else if (activeTab === 'followers') {
            users = followers;
        } else if (activeTab === 'mutual') {
            users = following.filter(f => followers.some(fo => fo.id === f.id));
        }

        return users
            .filter(u => u.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(u => ({
                ...u,
                isFollowing: following.some(f => f.id === u.id),
                isFollower: followers.some(f => f.id === u.id)
            }));
    };

    const formatCompactTime = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        return `${diffDays}d`;
    };

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="messages-page-container">
            <div className="messages-sidebar">
                <div className="sidebar-search">
                    <div className="search-input-wrapper">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search conversations..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="connection-stats">
                    <div className={`stat-item ${activeTab === 'following' ? 'active' : ''}`} onClick={() => setActiveTab('following')}>
                        <UserPlus size={16} />
                        <span>{following.length} Following</span>
                    </div>
                    <div className={`stat-item ${activeTab === 'followers' ? 'active' : ''}`} onClick={() => setActiveTab('followers')}>
                        <Heart size={16} />
                        <span>{followers.length} Followers</span>
                    </div>
                    <div className={`stat-item ${activeTab === 'mutual' ? 'active' : ''}`} onClick={() => setActiveTab('mutual')}>
                        <Users size={16} />
                        <span>{following.filter(f => followers.some(fo => fo.id === f.id)).length} Mutual</span>
                    </div>
                </div>

                <div className="user-list">
                    {filteredUsers().map((user) => (
                        <div 
                            key={user.id} 
                            className={`user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                            onClick={() => setSelectedUser(user)}
                        >
                            <div className="user-avatar">
                                {user.fullName.substring(0, 2).toUpperCase()}
                                <span className="status-dot online"></span>
                            </div>
                            <div className="user-info">
                                <div className="user-name-row">
                                    <span className="user-name">{user.fullName}</span>
                                    {user.time && <span className="message-time">{user.time}</span>}
                                </div>
                                <div className="user-status-row">
                                    <span className="last-message">
                                        {user.lastMessage || 'Active now'}
                                    </span>
                                    <div className="badges">
                                        {user.isFollowing && <span className="badge following">FOLLOWING</span>}
                                        {user.isFollower && <span className="badge follower">FOLLOWER</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredUsers().length === 0 && (
                        <div className="empty-list">No users found</div>
                    )}
                </div>
            </div>

            <div className="chat-main">
                {selectedUser ? (
                    <>
                        <div className="chat-header">
                            <button className="back-btn" onClick={() => setSelectedUser(null)}>
                                <ArrowLeft size={20} />
                            </button>
                            <div className="chat-user-avatar">
                                {selectedUser.fullName.substring(0, 2).toUpperCase()}
                                <span className="status-dot online"></span>
                            </div>
                            <div className="chat-user-info">
                                <h3>{selectedUser.fullName}</h3>
                                <p>Active now</p>
                            </div>
                        </div>

                        <div className="messages-viewport" ref={scrollRef}>
                            {messages.length === 0 ? (
                                <div className="chat-welcome">
                                    <div className="welcome-icon">
                                        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path>
                                        </svg>
                                    </div>
                                    <h2>Your conversation with {selectedUser.fullName}</h2>
                                    <p>Start the conversation by sending a message</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div 
                                        key={msg.id} 
                                        className={`message-bubble-wrapper ${msg.senderId == currentUserId ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-bubble">
                                            {msg.content}
                                            <span className="msg-time">{formatTime(msg.createdAt)}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <form className="chat-input-area" onSubmit={handleSendMessage}>
                            <div className="input-actions-left">
                                <button type="button" className="action-btn"><Paperclip size={20} /></button>
                                <button type="button" className="action-btn"><Smile size={20} /></button>
                            </div>
                            <input 
                                type="text" 
                                placeholder="Type a message..." 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <div className="input-actions-right">
                                <button type="submit" className="send-btn">
                                    <Send size={20} />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <div className="logo-placeholder">CC</div>
                        <h2>Select a conversation to start chatting</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
