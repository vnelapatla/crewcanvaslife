let API_BASE_URL = ''; // Use relative paths by default for better compatibility

// Fallback for local file opening (file://) or if we need to force a specific backend
if (window.location.protocol === 'file:') {
    API_BASE_URL = 'http://localhost:8080';
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
    return localStorage.getItem('userEmail');
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

// Show toast notification
function showMessage(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#ff8800'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Format date to readable string
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return 'Just now';

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Less than 1 day
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Less than 1 week
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Default format
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
    
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get query parameter from URL
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Upload image to base64 (for demo purposes)
async function uploadImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve(null);
            return;
        }

        // Check file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            showMessage('File size must be less than 50MB', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
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

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
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

// Initialize Universal Bottom Navigation for Mobile
// Global path variables for navigation
const path = window.location.pathname;
const currentPage = path.split("/").pop() || 'index.html';

// Initialize Universal Bottom Navigation for Mobile
function initUniversalBottomNav() {
    // Only show on mobile
    if (window.innerWidth > 1080) return;

    // Do NOT show on login/register or edit profile pages
    if (currentPage === 'index.html' || currentPage === 'register.html' || path === '/') return;

    // Only proceed if bottom-nav isn't already there
    if (document.querySelector('.bottom-nav')) return;

    const navHtml = `
    <div class="bottom-nav">
        <a href="feed.html" class="nav-item ${currentPage.includes('feed') ? 'active' : ''}">
            <i class="fa-solid fa-newspaper icon"></i> <span>Feed</span>
        </a>
        <a href="home.html" class="nav-item ${currentPage.includes('home') ? 'active' : ''}">
            <i class="fa-solid fa-house icon"></i> <span>Dashboard</span>
        </a>
        <a href="crew-search.html" class="nav-item ${currentPage.includes('crew-search') ? 'active' : ''}">
            <i class="fa-solid fa-magnifying-glass icon"></i> <span>Search</span>
        </a>
        <a href="messages.html" class="nav-item ${currentPage.includes('messages') ? 'active' : ''}">
            <i class="fa-solid fa-message icon"></i> <span>Messages</span>
        </a>
        <a href="event.html" class="nav-item ${currentPage.includes('event') ? 'active' : ''}">
            <i class="fa-solid fa-clapperboard icon"></i> <span>Events</span>
        </a>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', navHtml);
}

// Initialize Universal Header for all pages
function initUniversalHeader() {
    const header = document.querySelector('.top-header');
    if (!header) return;

    // Standardized Header HTML (Matches user screenshot)
    header.innerHTML = `
        <div class="header-left" style="display: flex; align-items: center; gap: 15px;">
            <h2 class="brand-logo" onclick="window.location.href='home.html'" style="color: var(--primary-orange); font-size: 22px; font-weight: 900; margin: 0; cursor: pointer; letter-spacing: -0.5px;">CrewCanvas</h2>
            <i class="fa-solid fa-bell notification-bell-icon" style="color: #fcd34d; font-size: 20px; cursor: pointer;"></i>
        </div>
        <div class="status-bar">
            <div class="user-profile-box" onclick="ProfileHandler.toggleProfileDropdown()">
                <div class="user-initials" id="userInitialsSmall">U</div>
                <img id="userAvatarSmall" src="" alt="" style="display:none; width:32px; height:32px; border-radius:50%; object-fit:cover;">
                <span id="userNameHeader">User</span>
                <i class="fa-solid fa-chevron-down" style="font-size: 10px; margin-left: 5px; opacity: 0.5;"></i>
                <div class="profile-dropdown-menu" id="profileDropdown">
                    <a href="profile.html" class="dropdown-item profile-link"><i class="fas fa-user"></i> My Profile</a>
                    <a href="edit-profile.html" class="dropdown-item edit-link"><i class="fas fa-user-edit"></i> Edit Profile</a>
                    <a href="settings.html" class="dropdown-item settings-link"><i class="fas fa-cog"></i> Settings</a>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item logout-link" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        </div>
    `;
    // Styles are now handled in main.css for better performance
    header.classList.add('top-header');
    
    // Re-sync profile data if ProfileHandler is ready
    if (typeof ProfileHandler !== 'undefined' && ProfileHandler.user) {
        ProfileHandler.updateGlobalHeader();
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

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Inject standard header immediately
        initUniversalHeader();
    } catch (e) { console.error("Header init failed:", e); }
    
    try {
        // Inject bottom nav on mobile if missing
        initUniversalBottomNav();
    } catch (e) { console.error("Bottom nav init failed:", e); }
    
    try {
        // Defer non-critical initialization to avoid blocking the main thread
        setTimeout(() => {
            initSidebarToggle();
        }, 0);
    } catch (e) { console.error("Sidebar toggle init failed:", e); }
    
    // Listen for resize to handle orientation changes or window resizing
    window.addEventListener('resize', debounce(() => {
        try {
            initUniversalHeader();
            initUniversalBottomNav();
            initSidebarToggle();
        } catch (e) {}
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
        initUniversalBottomNav
    };
}
