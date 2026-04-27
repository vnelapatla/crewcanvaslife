let API_BASE_URL = ''; // Use relative paths by default for better compatibility

// Fallback for local file opening (file://) or if we need to force a specific backend
if (window.location.protocol === 'file:') {
    API_BASE_URL = 'http://localhost:8081';
}

// Check if user is authenticated
function checkAuth() {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');

    if (!userId || !userEmail) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Get current user ID
function getCurrentUserId() {
    return localStorage.getItem('userId');
}

// Get current user email
function getCurrentUserEmail() {
    const email = localStorage.getItem('userEmail');
    return email ? email.toLowerCase().trim() : '';
}

// Get current user admin status
function getCurrentUserIsAdmin() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const isHardcodedAdmin = getCurrentUserEmail() === 'crewcanvas2@gmail.com';
    return isAdmin || isHardcodedAdmin;
}

// Fetch user profile by ID (Cached)
const userCache = new Map();
async function getUserProfile(userId) {
    if (!userId) return null;
    if (userCache.has(userId)) return userCache.get(userId);

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
        if (response.ok) {
            const user = await response.json();
            userCache.set(userId, user);
            return user;
        }
    } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
    }
    return null;
}

// Show a premium toast notification
function showMessage(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            z-index: 10000000; display: flex; flex-direction: column; align-items: center; gap: 8px;
            pointer-events: none; width: auto; max-width: 90vw;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `premium-toast ${type}`;
    toast.style.pointerEvents = 'auto';
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'circle-xmark';
    if (type === 'warning') icon = 'triangle-exclamation';

    toast.innerHTML = `
        <i class="fa-solid fa-${icon}"></i>
        <span class="toast-msg">${message}</span>
    `;
    
    container.appendChild(toast);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        toast.classList.add('out');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Format date to readable string (Robust version)
function formatDate(dateString) {
    if (!dateString) return '';
    
    // Try to use parseSafeDate if available
    let date;
    if (typeof parseSafeDate === 'function') {
        date = parseSafeDate(dateString);
    } else {
        date = new Date(dateString);
    }
    
    if (!date || isNaN(date.getTime())) return dateString;
    
    const now = new Date();
    const diff = now - date;

    // Relative time ONLY for past events within the last 7 days
    if (diff > 0 && diff < 604800000) {
        if (diff < 60000) return 'Just now';
        
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        }
        
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        }
        
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }

    // Absolute format for future dates or older past dates
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
    });
}

function parseSafeDate(dateString) {
    if (!dateString) return null;
    
    // 1. Direct parse
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;

    // 2. Try fixing common ISO-like formats
    let fixed = dateString.replace(' ', 'T');
    
    // If it lacks a timezone but has T, try assuming UTC if it looks like a full ISO string
    if (fixed.includes('T') && !fixed.includes('Z') && !/[+-]\d{2}:\d{2}$/.test(fixed)) {
        const utcDate = new Date(fixed + 'Z');
        if (!isNaN(utcDate.getTime())) return utcDate;
    }

    date = new Date(fixed);
    if (!isNaN(date.getTime())) return date;

    // 3. Last ditch effort for very weird formats
    try {
        const cleaned = dateString.replace(/[^\d-T:.Z+]/g, '');
        const d = new Date(cleaned);
        if (!isNaN(d.getTime())) return d;
    } catch (e) {}

    return null;
}

// Format time
function formatTime(timeString) {
    if (!timeString) return '';
    const date = parseSafeDate(timeString);
    if (!date) return '';
    
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
}

// Get User ID from various object structures
function getUserId(user) {
    if (!user) return null;
    if (typeof user !== 'object') return user;
    return user.id || user.userId || user.senderId || user.receiverId || user.ID || user.userID;
}

// Debounce function to limit frequent calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Truncate text with ellipsis
function truncateText(text, length = 30) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
}


// Render a colored circle with initials as an avatar fallback
function renderAvatarFallback(name, className = '', size = '40px') {
    const initials = (name || 'U').charAt(0).toUpperCase();
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50', '#ffc107', '#ff9800', '#ff5722'];
    const charCode = initials.charCodeAt(0);
    const color = colors[charCode % colors.length];
    
    return `<div class="${className}" style="width: ${size}; height: ${size}; border-radius: 50%; background: ${color}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: calc(${size} * 0.4); flex-shrink: 0;">${initials}</div>`;
}

// Get query parameter from URL
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

async function uploadImage(file, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }

        // Check file size (hard limit 50MB for safety)
        if (file.size > 50 * 1024 * 1024) {
            showMessage('File size must be less than 50MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target.result;
            // Only compress if it's an image
            if (file.type.startsWith('image/')) {
                try {
                    const compressed = await compressImage(result, maxWidth, quality);
                    resolve(compressed);
                } catch (err) {
                    console.error("Compression failed, using original:", err);
                    resolve(result);
                }
            } else {
                // For non-images (PDF, docs), just return the raw base64
                resolve(result);
            }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

// Compress image using Canvas
async function compressImage(base64Str, maxWidth = 1200, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
    });
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.clear();
        window.location.href = 'index.html';
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS animations and Premium Toast Styles
const style = document.createElement('style');
style.textContent = `
    .premium-toast {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 16px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        color: white;
        font-size: 13px;
        font-weight: 500;
        line-height: 1.4;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
        animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        white-space: normal;
        word-break: break-word;
        overflow-wrap: anywhere;
        max-width: 85vw;
        pointer-events: auto;
        text-align: left;
    }

    .premium-toast .toast-msg {
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .premium-toast.success i { color: #10b981; }
    .premium-toast.error i { color: #ef4444; }
    .premium-toast.warning i { color: #f59e0b; }
    .premium-toast.info i { color: #3b82f6; }

    .premium-toast.out {
        animation: toastSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes toastSlideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    @keyframes toastSlideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-20px); opacity: 0; }
    }

    @media (max-width: 768px) {
        #toast-container {
            top: auto !important;
            bottom: 90px !important;
        }
        @keyframes toastSlideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        @keyframes toastSlideOut {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(20px); opacity: 0; }
        }
    }
`;
document.head.appendChild(style);

// Get initials from name (First initial + Last initial)
function getAvatarFallback(name) {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    // First letter of first word + First letter of last word
    const firstInitial = words[0].charAt(0);
    const lastInitial = words[words.length - 1].charAt(0);
    return (firstInitial + lastInitial).toUpperCase();
}

// Render avatar or fallback
function renderAvatar(user, className = '', size = '40px') {
    const style = `width: ${size}; height: ${size}; min-width: ${size}; min-height: ${size}; object-fit: cover; border-radius: 50%;`;
    if (user && user.profilePicture && user.profilePicture.length > 50) { 
        return `<img src="${user.profilePicture}" alt="${user.name}" class="${className}" style="${style}" onerror="this.onerror=null; this.outerHTML=renderAvatarFallback('${user.name}', '${className}', '${size}')">`;
    } else {
        return renderAvatarFallback(user ? user.name : 'User', className, size);
    }
}

// Render initials fallback
function renderAvatarFallback(name, className = '', size = '40px') {
    const initials = getAvatarFallback(name);
    const background = 'var(--primary-orange, #ff8c00)';
    const fontSize = parseInt(size) * 0.4;
    
    return `
        <div class="avatar-fallback ${className}" style="background: ${background}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; width: ${size}; height: ${size}; min-width: ${size}; min-height: ${size}; border-radius: 50% !important; text-transform: uppercase; font-size: ${fontSize}px; margin: 0 auto;">
            ${initials}
        </div>
    `;
}

// Global path variables for navigation
const path = window.location.pathname;
const currentPage = path.split("/").pop() || 'index.html';

// Helper to check if current page is an authentication page
function isAuthPage() {
    const authPages = ['index.html', 'register.html', 'forgot-password.html', 'reset-password.html'];
    return authPages.includes(currentPage) || path === '/' || path === '';
}

// Initialize Universal Bottom Navigation for Mobile
function initUniversalBottomNav() {
    // Only show on mobile
    if (window.innerWidth > 1024) return;

    // Do NOT show on auth pages
    if (isAuthPage()) return;

    // Only proceed if bottom-nav isn't already there
    if (document.querySelector('.bottom-nav')) return;

    const navHtml = `
    <div class="bottom-nav">
        <a href="feed.html" class="nav-item ${currentPage.includes('feed.html') ? 'active' : ''}">
            <i class="fa-solid fa-newspaper icon"></i> <span>Feed</span>
        </a>
        <a href="home.html" class="nav-item ${currentPage.includes('home.html') ? 'active' : ''}">
            <i class="fa-solid fa-house icon"></i> <span>Dashboard</span>
        </a>
        <a href="crew-search.html" class="nav-item ${currentPage.includes('crew-search.html') ? 'active' : ''}">
            <i class="fa-solid fa-magnifying-glass icon"></i> <span>Search</span>
        </a>
        <a href="messages.html" class="nav-item ${currentPage.includes('messages.html') ? 'active' : ''}">
            <i class="fa-solid fa-message icon"></i> <span>Messages</span>
        </a>
        <a href="event.html" class="nav-item ${currentPage.includes('event.html') ? 'active' : ''}">
            <i class="fa-solid fa-clapperboard icon"></i> <span>Events</span>
        </a>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', navHtml);
}

// Initialize Universal Sidebar for Desktop
function initUniversalSidebar() {
    // Only show on desktop
    if (window.innerWidth <= 1024) return;

    // Do NOT show on auth pages
    if (isAuthPage()) return;

    let sidebar = document.querySelector('.sidebar');
    
    // If sidebar doesn't exist, create it
    if (!sidebar) {
        sidebar = document.createElement('aside');
        sidebar.className = 'sidebar';
        document.body.prepend(sidebar);
    }

    const navHtml = `
        <div class="brand">
            <h2>CC</h2>
            <p>Where all crafts connect</p>
        </div>
        <nav class="nav-menu">
            <a href="feed.html" class="nav-item ${currentPage.includes('feed.html') ? 'active' : ''}">
                <i class="fa-solid fa-newspaper"></i> Feed
            </a>
            <a href="home.html" class="nav-item ${currentPage.includes('home.html') ? 'active' : ''}">
                <i class="fa-solid fa-house"></i> Dashboard
            </a>
            <a href="crew-search.html" class="nav-item ${currentPage.includes('crew-search.html') ? 'active' : ''}">
                <i class="fa-solid fa-magnifying-glass"></i> Crew Search
            </a>
            <a href="messages.html" class="nav-item ${currentPage.includes('messages.html') ? 'active' : ''}">
                <i class="fa-solid fa-message"></i> Messages
            </a>
            <a href="event.html" class="nav-item ${currentPage.includes('event.html') ? 'active' : ''}">
                <i class="fa-solid fa-clapperboard"></i> Events
            </a>
            <a href="profile.html" class="nav-item ${currentPage.includes('profile.html') && !window.location.search.includes('userId') ? 'active' : ''}">
                <i class="fa-solid fa-user"></i> My Profile
            </a>
        </nav>
    `;

    sidebar.innerHTML = navHtml;
    
    // Add class to body to handle main-content margins
    document.body.classList.add('with-sidebar');
}

// Initialize Universal Header for all pages
function initUniversalHeader() {
    // Do NOT show on auth pages
    if (isAuthPage()) return;

    const header = document.querySelector('.top-header');
    if (!header) return;

    const userName = localStorage.getItem('userName') || 'User';
    const userAvatar = localStorage.getItem('userAvatar');
    const userEmail = getCurrentUserEmail();
    const isAdmin = getCurrentUserIsAdmin();
    
    // Get initials for fallback
    const initials = getAvatarFallback(userName);
    const adminBadge = isAdmin ? '<span style="background:var(--primary-orange); color:#fff; font-size:9px; padding:2px 6px; border-radius:10px; margin-left:5px; font-weight:800; vertical-align:middle; text-transform:uppercase;">ADMIN</span>' : '';

    // Standardized Header HTML (Matches user screenshot)
    header.innerHTML = `
        <div class="header-left">
            <h2 class="brand-logo">CrewCanvas</h2>
        </div>
        <div class="status-bar">
            <div class="user-profile-box" onclick="ProfileHandler.toggleProfileDropdown()">
                <div class="user-initials" id="userInitialsSmall" style="${(userAvatar && userAvatar.length > 10) ? 'display:none' : 'display:flex'}">${initials}</div>
                <img id="userAvatarSmall" src="${(userAvatar && userAvatar.length > 10) ? userAvatar : ''}" alt="" loading="lazy" style="${(userAvatar && userAvatar.length > 10) ? 'display:block' : 'display:none'}; width:28px; height:28px; border-radius:50%; object-fit:cover; border: 1px solid #f1f5f9;">
                <span id="userNameHeader" style="font-size: 14px; font-weight: 700; color: #1e293b; margin-left: 2px;">${userName}${adminBadge}</span>
                <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 4px; opacity: 0.4;"></i>
                
                <div class="profile-dropdown-menu" id="profileDropdown">
                    <a href="profile.html" class="dropdown-item profile-link"><i class="fas fa-user"></i> My Profile</a>
                    <a href="edit-profile.html" class="dropdown-item edit-link"><i class="fas fa-user-edit"></i> Edit Profile</a>
                    <a href="settings.html" class="dropdown-item settings-link"><i class="fas fa-cog"></i> Settings</a>
                    <a href="notifications.html" class="dropdown-item notifications-link">
                        <i class="fas fa-bell" style="color: #fcd34d;"></i> Notifications 
                        <span id="notifBadge" class="notif-pill" style="display:none;">0</span>
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-link" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        </div>
    `;
    header.classList.add('top-header');
    
    // Sync with ProfileHandler if it exists
    if (typeof ProfileHandler !== 'undefined' && typeof ProfileHandler.updateHeader === 'function') {
        ProfileHandler.updateHeader();
    }
}

// Sidebar Toggle logic (Used for desktop if needed, but primarily mobile drawer)
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
    
    // Prevent scrolling when sidebar is open
    if (sidebar && sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

function initSidebarToggle() {
    // On mobile, we use bottom nav instead of sidebar drawer as per user request
    if (window.innerWidth <= 1080) {
        const existingToggle = document.querySelector('.sidebar-toggle');
        if (existingToggle) existingToggle.remove();
        return;
    }

    const header = document.querySelector('.top-header');
    if (!header) return;

    // Check if we already have the toggle
    if (header.querySelector('.sidebar-toggle')) return;

    // Create the toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sidebar-toggle';
    toggleBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    toggleBtn.onclick = toggleSidebar;

    // Insert at the beginning of the header
    header.prepend(toggleBtn);

    // Ensure sidebar-overlay exists
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    }
    
    // Also add close button to sidebar if missing
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && !sidebar.querySelector('.sidebar-close-btn')) {
        const closeBtn = document.createElement('div');
        closeBtn.className = 'sidebar-close-btn';
        closeBtn.innerHTML = '<i class="fa-solid fa-times"></i>';
        closeBtn.onclick = toggleSidebar;
        sidebar.appendChild(closeBtn);
    }
}

/**
 * Calculates profile completion score on the client side as a fallback
 */
function calculateProfileScore(user) {
    if (!user) return 0;
    let score = 0;
    
    // Identity (Max 25)
    if (user.name) score += 10;
    if (user.phone) score += 5;
    if (user.location) score += 5;
    if (user.bio) score += 5;
    
    // Visuals (Max 20)
    if (user.profilePicture) score += 10;
    if (user.coverImage) score += 10;
    
    // Professional (Max 30)
    if (user.role) score += 10;
    if (user.skills) score += 10;
    if (user.experience) score += 10;
    
    // Portfolio & Social (Max 25)
    if (user.showreel || user.portfolioVideos) score += 15;
    if (user.instagram || user.youtube || user.twitter || user.tiktok) score += 10;
    
    return Math.min(score, 100);
}

/**
 * NotificationHandler - Manages real-time notifications via WebSocket
 */
const NotificationHandler = {
    stompClient: null,
    unreadCount: 0,
    notifications: [],

    init: async function() {
        const userId = getCurrentUserId();
        if (!userId || isAuthPage()) return;

        // 1. Fetch existing unread count
        this.updateBadge();

        // 2. Setup WebSocket connection
        this.connectWebSocket(userId);
        
        // 3. Global click listener to close dropdown
        document.addEventListener('click', (e) => {
            const dropdown = document.getElementById('notificationsDropdown');
            const bell = document.querySelector('.notification-bell-icon');
            if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(e.target) && e.target !== bell) {
                dropdown.classList.remove('active');
            }
        });
    },

    connectWebSocket: function(userId) {
        // Only load if not already present
        if (typeof SockJS === 'undefined' || typeof Stomp === 'undefined') {
            const sockScript = document.createElement('script');
            sockScript.src = "https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.6.1/sockjs.min.js";
            document.head.appendChild(sockScript);

            const stompScript = document.createElement('script');
            stompScript.src = "https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js";
            document.head.appendChild(stompScript);

            stompScript.onload = () => this.establishConnection(userId);
        } else {
            this.establishConnection(userId);
        }
    },

    establishConnection: function(userId) {
        try {
            const socket = new SockJS(`${API_BASE_URL}/ws-chat`);
            this.stompClient = Stomp.over(socket);
            this.stompClient.debug = null; // Disable logging

            this.stompClient.connect({}, (frame) => {
                // Standard Notifications
                this.stompClient.subscribe(`/user/${userId}/queue/notifications`, (message) => {
                    try {
                        const notification = JSON.parse(message.body);
                        this.handleIncomingNotification(notification);
                    } catch (e) {
                        console.error('Error parsing notification:', e);
                    }
                });
            }, (error) => {
                // Only retry if not already connected
                if (this.stompClient && !this.stompClient.connected) {
                    setTimeout(() => this.establishConnection(userId), 10000); // Back off to 10s
                }
            });
        } catch (e) {
            console.error('WebSocket connection failed:', e);
        }
    },

    handleIncomingNotification: function(notification) {
        this.unreadCount++;
        this.updateBadge();
        
        // Show a temporary toast
        showMessage(`New ${notification.type.toLowerCase()}: ${notification.content}`);
        
        // If on notifications page, refresh it
        if (window.location.pathname.includes('notifications.html') && typeof loadNotifications === 'function') {
            loadNotifications();
        }
    },

    updateBadge: async function() {
        const userId = getCurrentUserId();
        if (!userId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications/${userId}/unread-count`);
            if (res.ok) {
                const data = await res.json();
                this.unreadCount = data.count;
                const badge = document.getElementById('notifBadge');
                if (badge) {
                    if (this.unreadCount > 0) {
                        badge.textContent = this.unreadCount;
                        badge.style.display = 'inline-flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            }
        } catch (e) {}
    },

    toggleDropdown: function(event) {
        // Redirection handled by link href="notifications.html"
        // But if called manually, just redirect
        window.location.href = 'notifications.html';
    },

    fetchNotifications: async function() {
        const userId = getCurrentUserId();
        if (!userId) return;

        const list = document.getElementById('notificationsList');
        if (!list) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications/${userId}`);
            if (res.ok) {
                const notifications = await res.json();
                this.renderNotifications(notifications);
            }
        } catch (e) {
            list.innerHTML = '<div class="notif-empty">Failed to load notifications</div>';
        }
    },

    renderNotifications: function(notifications) {
        const list = document.getElementById('notificationsList');
        if (!list) return;

        if (notifications.length === 0) {
            list.innerHTML = '<div class="notif-empty"><i class="fas fa-bell-slash"></i> No notifications yet</div>';
            return;
        }

        list.innerHTML = notifications.map(n => `
            <div class="notification-item ${n.read ? '' : 'unread'}" onclick="NotificationHandler.handleNotificationClick(${n.id}, '${n.type}', '${n.targetId}')">
                ${n.actorAvatar ? 
                    `<img src="${n.actorAvatar}" class="notif-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(n.actorName || 'User')}?background=random'">` : 
                    renderAvatarFallback(n.actorName || 'System', 'notif-avatar', '45px')
                }
                <div class="notification-content">
                    <p><strong>${n.actorName || 'System'}</strong> ${n.content}</p>
                    <span class="notif-time">${formatDate(n.createdAt)}</span>
                </div>
            </div>
        `).join('');
    },

    handleNotificationClick: async function(id, type, targetId) {
        // Mark as read
        try {
            await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, { method: 'POST' });
        } catch (e) {}

        // Navigate based on type
        switch(type) {
            case 'FOLLOW':
                window.location.href = `profile.html?userId=${targetId}`;
                break;
            case 'LIKE':
                window.location.href = `feed.html?postId=${targetId}`;
                break;
            case 'COMMENT':
                window.location.href = `feed.html?postId=${targetId}`;
                break;
            case 'MESSAGE':
                window.location.href = `messages.html?userId=${targetId}`;
                break;
            case 'SHORTLIST':
            case 'REJECT':
            case 'APPLICATION':
                window.location.href = `event.html`; // Or a specific application page if it exists
                break;
            case 'VERIFY':
                window.location.href = `profile.html`;
                break;
            default:
                this.updateBadge(); // Just refresh badge
        }
    },

    markAllAsRead: async function() {
        const userId = getCurrentUserId();
        if (!userId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications/user/${userId}/read-all`, { method: 'POST' });
            if (res.ok) {
                this.unreadCount = 0;
                this.updateBadge();
                this.fetchNotifications();
            }
        } catch (e) {}
    },

    clearAllNotifications: async function() {
        const userId = getCurrentUserId();
        if (!userId) return;

        if (!confirm('Are you sure you want to clear all notifications?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/notifications/user/${userId}`, { method: 'DELETE' });
            if (res.ok) {
                this.unreadCount = 0;
                this.updateBadge();
                showMessage('Notifications cleared');
                
                // If on notifications page, refresh it
                if (window.location.pathname.includes('notifications.html') && typeof loadNotifications === 'function') {
                    loadNotifications();
                } else {
                    this.fetchNotifications();
                }
            }
        } catch (e) {
            console.error('Error clearing notifications:', e);
        }
    }
};

// Global state to track width category
let currentWidthCategory = window.innerWidth <= 1024 ? 'mobile' : 'desktop';

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    // Show a slim progress bar at the top to indicate page is loading
    const loadingBar = document.createElement('div');
    loadingBar.id = 'global-loading-bar';
    loadingBar.style.cssText = `
        position: fixed; top: 0; left: 0; height: 3px; 
        background: var(--primary-orange, #ff8c00); 
        width: 0%; z-index: 100000; transition: width 0.4s ease;
    `;
    document.body.prepend(loadingBar);
    
    // Simulate progress
    setTimeout(() => { if(loadingBar) loadingBar.style.width = '30%'; }, 100);
    setTimeout(() => { if(loadingBar) loadingBar.style.width = '60%'; }, 500);

    try {
        // Inject standard header immediately
        initUniversalHeader();
        // Init notifications
        NotificationHandler.init();
    } catch (e) { console.error("Header init failed:", e); }
    
    try {
        // Inject bottom nav on mobile if missing
        initUniversalBottomNav();
        // Inject sidebar on desktop
        initUniversalSidebar();
    } catch (e) { console.error("Nav init failed:", e); }
    
    try {
        // Defer non-critical initialization
        setTimeout(() => {
            initSidebarToggle();
            // Complete loading bar
            if(loadingBar) {
                loadingBar.style.width = '100%';
                setTimeout(() => {
                    loadingBar.style.opacity = '0';
                    setTimeout(() => loadingBar.remove(), 400);
                }, 200);
            }
        }, 300);
    } catch (e) { console.error("Sidebar toggle init failed:", e); }
    
    // Listen for resize but only re-init if category changed to avoid flickering on mobile
    window.addEventListener('resize', debounce(() => {
        const newCategory = window.innerWidth <= 1024 ? 'mobile' : 'desktop';
        if (newCategory !== currentWidthCategory) {
            currentWidthCategory = newCategory;
            try {
                initUniversalHeader();
                initUniversalBottomNav();
                initUniversalSidebar();
                initSidebarToggle();
            } catch (e) { console.error("Resize init failed:", e); }
        }
    }, 250));
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        API_BASE_URL,
        checkAuth,
        getCurrentUserId,
        getCurrentUserEmail,
        showMessage,
        formatDate,
        formatTime,
        getQueryParam,
        uploadImage,
        logout,
        isValidEmail,
        truncateText,
        debounce,
        getUserProfile,
        renderAvatar,
        renderAvatarFallback,
        calculateProfileScore,
        initUniversalBottomNav,
        NotificationHandler
    };
}
