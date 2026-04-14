const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}`;

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

// Format time
function formatTime(timeString) {
    if (!timeString) return '';
    const date = new Date(timeString);
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

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            reject(new Error('File size must be less than 5MB'));
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

// Get initials from name
function getAvatarFallback(name) {
    if (!name) return '?';
    const words = name.trim().split(/\s+/);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

// Render avatar or fallback
function renderAvatar(user, className = '') {
    const style = className.includes('nav-avatar') ? 'width: 40px; height: 40px; object-fit: cover; border-radius: 50%;' : '';
    if (user.profilePicture && user.profilePicture.length > 50) { // Check if it's a real image/base64 and not a short placeholder string
        return `<img src="${user.profilePicture}" alt="${user.name}" class="${className}" style="${style}" onerror="this.onerror=null; this.outerHTML=renderAvatarFallback('${user.name}', '${className}')">`;
    } else {
        return renderAvatarFallback(user.name, className);
    }
}

// Render initials fallback
function renderAvatarFallback(name, className = '') {
    const initials = getAvatarFallback(name);
    // Use application theme orange
    const background = 'var(--primary-orange, #ff8c00)';
    
    return `
        <div class="avatar-fallback ${className}" style="background: ${background}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; width: 40px; height: 40px; min-width: 40px; min-height: 40px; border-radius: 50% !important; text-transform: uppercase; font-size: 14px; margin: 0 auto;">
            ${initials}
        </div>
    `;
}

// Initialize Universal Bottom Navigation for Mobile
function initUniversalBottomNav() {
    const path = window.location.pathname;
    const currentPage = path.split('/').pop() || 'home.html';
    
    // Do NOT show on login/register or edit profile pages
    if (currentPage === 'index.html' || currentPage === 'edit-profile.html' || path === '/') return;

    // Only proceed if bottom-nav isn't already there
    if (document.querySelector('.bottom-nav')) return;

    const navHtml = `
    <div class="bottom-nav">
        <a href="feed.html" class="nav-item ${currentPage.includes('feed') ? 'active' : ''}">
            <span class="icon">📰</span> <span>Feed</span>
        </a>
        <a href="home.html" class="nav-item ${currentPage.includes('home') ? 'active' : ''}">
            <span class="icon">🏠</span> <span>Dashboard</span>
        </a>
        <a href="crew-search.html" class="nav-item ${currentPage.includes('crew-search') ? 'active' : ''}">
            <span class="icon">🔍</span> <span>Crew Search</span>
        </a>
        <a href="messages.html" class="nav-item ${currentPage.includes('messages') ? 'active' : ''}">
            <span class="icon">💬</span> <span>Messages</span>
        </a>
        <a href="launch-audition.html" class="nav-item ${currentPage.includes('launch-audition') || currentPage.includes('event') ? 'active' : ''}">
            <span class="icon">🎬</span> <span>Events</span>
        </a>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', navHtml);
}

// Sidebar Toggle logic
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

function initSidebarToggle() {
    const header = document.querySelector('.top-header, .profile-top-nav');
    // For mobile only (based on window width)
    if (window.innerWidth > 1080) return;
    
    if (header && !header.querySelector('.mobile-brand-name')) {
        const hamburgerHtml = `
            <div class="header-left-group" id="mobileHeaderLeft">
                <span class="mobile-brand-name">CrewCanvas</span>
            </div>
        `;
        header.insertAdjacentHTML('afterbegin', hamburgerHtml);
    }

    // Ensure sidebar-overlay exists
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    // Inject bottom nav on mobile if missing
    initUniversalBottomNav();
    
    // Initialize sidebar toggle
    initSidebarToggle();
    
    // Listen for resize to handle orientation changes or window resizing
    window.addEventListener('resize', debounce(() => {
        initUniversalBottomNav();
        initSidebarToggle();
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
        getAvatarFallback,
        renderAvatar,
        renderAvatarFallback,
        initUniversalBottomNav
    };
}
