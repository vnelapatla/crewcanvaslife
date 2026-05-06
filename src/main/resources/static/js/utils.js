let API_BASE_URL = ''; // Use relative paths by default for better compatibility

// CC-MAY-002: Multi-Language Support [M Sumanth] - Global Translation Engine
window.Translations = {
    'en': {
        'nav_feed': 'Feed',
        'nav_dashboard': 'Dashboard',
        'nav_search': 'Search',
        'nav_messages': 'Messages',
        'nav_events': 'Events',
        'post_placeholder': "Share your latest project or news...",
        'btn_post': 'Post',
        'btn_media': 'Media',
        'btn_poll': 'Poll',
        'search_placeholder': 'Search posts, accounts, topics...',
        'lang_en': 'English',
        'lang_hi': 'हिन्दी (Hindi)',
        'lang_te': 'తెలుగు (Telugu)'
    },
    'hi': {
        'nav_feed': 'फ़ीड',
        'nav_dashboard': 'डैशबोर्ड',
        'nav_search': 'खोजें',
        'nav_messages': 'संदेश',
        'nav_events': 'इवेंट्स',
        'post_placeholder': "अपनी नवीनतम परियोजना या समाचार साझा करें...",
        'btn_post': 'पोस्ट करें',
        'btn_media': 'मीडिया',
        'btn_poll': 'पोल',
        'search_placeholder': 'पोस्ट, खाते, विषय खोजें...',
        'lang_en': 'English',
        'lang_hi': 'हिन्दी',
        'lang_te': 'తెలుగు'
    },
    'te': {
        'nav_feed': 'ఫీడ్',
        'nav_dashboard': 'డాష్‌బోర్డ్',
        'nav_search': 'వెతకండి',
        'nav_messages': 'సందేశాలు',
        'nav_events': 'ఈవెంట్‌లు',
        'post_placeholder': "మీ తాజా ప్రాజెక్ట్ లేదా వార్తలను పంచుకోండి...",
        'btn_post': 'పోస్ట్',
        'btn_media': 'మీడియా',
        'btn_poll': 'పోల్',
        'search_placeholder': 'పోస్ట్లు, ఖాతాలు, అంశాలను వెతకండి...',
        'lang_en': 'English',
        'lang_hi': 'హిందీ',
        'lang_te': 'తెలుగు'
    }
};

window.currentLang = localStorage.getItem('appLang') || 'en';

function t(key) {
    const langSet = window.Translations[window.currentLang] || window.Translations['en'];
    return langSet[key] || key;
}

function setLanguage(lang) {
    if (window.Translations[lang]) {
        window.currentLang = lang;
        localStorage.setItem('appLang', lang);
        // Refresh UI
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = t(key);
            } else {
                el.innerText = t(key);
            }
        });
        // Language change toast removed as requested
    }
}

// Fallback for local file opening (file://) or if we need to force a specific backend
if (window.location.protocol === 'file:') {
    API_BASE_URL = 'http://localhost:8081';
}

// Check if user is authenticated
function checkAuth() {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');

    if (!userId || !userEmail) {
        // Save current URL to redirect back after login (especially for shared links)
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
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
    
    // Always return absolute format as requested by the user
    return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
    });
}

/**
 * Formats a date value (string, object, or Date) to YYYY-MM-DD
 * required by <input type="date">
 */
function formatDateForInput(val) {
    if (!val) return '';
    
    // 1. If it's a string
    if (typeof val === 'string') {
        if (val.includes('T')) return val.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
    }
    
    // 2. If it's a Java LocalDate object {year, month, day}
    if (typeof val === 'object' && val.year) {
        const y = val.year;
        const m = String(val.monthValue || val.month || '').padStart(2, '0');
        const d = String(val.dayOfMonth || val.day || '').padStart(2, '0');
        if (y && m !== '00' && d !== '00') return `${y}-${m}-${d}`;
    }
    
    // 3. If it's a Date object
    if (val instanceof Date && !isNaN(val.getTime())) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const day = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    return '';
}

function parseSafeDate(dateString) {
    if (!dateString) return null;
    
    // 1. Direct parse (Modern browsers handle ISO strings well)
    let date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;

    // 2. Try fixing common ISO-like formats (space to T)
    let fixed = dateString.replace(' ', 'T');
    date = new Date(fixed);
    if (!isNaN(date.getTime())) return date;

    // 3. Fallback for strings that *might* be UTC but lack 'Z'
    // ONLY do this if the date is very far in the past or future (heuristic)
    // Actually, it's safer to just try parsing it as is.
    
    // 4. Handle Java object format if it leaks through
    if (typeof dateString === 'object' && dateString.year) {
        const d = new Date(dateString.year, (dateString.monthValue || dateString.month || 1) - 1, dateString.dayOfMonth || dateString.day || 1);
        if (dateString.hour !== undefined) d.setHours(dateString.hour, dateString.minute || 0, dateString.second || 0);
        return d;
    }

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

/**
 * Global utility to decrypt/decode messages if they are Base64 encoded
 */
function decryptMessage(encodedText) {
    if (!encodedText || encodedText.length < 4) return encodedText;
    
    // If AdvancedMessaging is already available, use its more robust version
    if (typeof AdvancedMessaging !== 'undefined' && typeof AdvancedMessaging.decrypt === 'function') {
        return AdvancedMessaging.decrypt(encodedText);
    }
    
    try {
        // Only attempt decryption if it looks like a Base64 string (no spaces)
        if (/\s/.test(encodedText)) return encodedText;
        
        // Handle URL-safe base64 (replace - with + and _ with /) 
        // and handle missing padding if necessary
        let normalized = encodedText.replace(/-/g, '+').replace(/_/g, '/');
        
        // Basic Base64 decode fallback
        return decodeURIComponent(escape(atob(normalized)));
    } catch (e) {
        return encodedText; // Return original if not base64 or decoding fails
    }
}

/**
 * Returns the professional display status of a user
 * If verified, returns "VERIFIED PROFESSIONAL [ROLE]"
 * Otherwise returns their userType (e.g. Explorer, Content Creator)
 */
function getUserDisplayStatus(user) {
    if (!user) return 'EXPLORER';
    
    if (user.isVerifiedProfessional === true) {
        // Primary role from user.role, fallback to "Film Professional" if not specified
        const primaryRole = user.role || 'Film Professional';
        return `VERIFIED PROFESSIONAL ${primaryRole.toUpperCase()}`;
    }
    
    // If not verified, return userType (Explorer, YouTuber, etc.)
    return (user.userType || 'Explorer').toUpperCase();
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

/**
 * Sound Notification System
 */
const AppSounds = {
    notification: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
    message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
    like: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'
};

let lastSoundPlayTime = {};
function playSound(type) {
    try {
        const now = Date.now();
        // Prevent playing the same sound multiple times within 500ms
        if (lastSoundPlayTime[type] && (now - lastSoundPlayTime[type] < 500)) {
            return;
        }
        lastSoundPlayTime[type] = now;

        const soundUrl = AppSounds[type] || AppSounds.notification;
        const audio = new Audio(soundUrl);
        audio.volume = 0.5;
        
        // Handle browser autoplay restrictions
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn(`Sound playback failed for ${type}:`, error);
            });
        }
    } catch (e) {
        console.error("Error playing sound:", e);
    }
}


// Render a colored circle with initials as an avatar fallback


/**
 * Returns a default image URL based on the event type
 */
function getEventDefaultImage(eventType) {
    const type = (eventType || '').toLowerCase();
    const basePath = 'images/defaults/';
    
    if (type.includes('audition')) return basePath + 'audition.png';
    if (type.includes('workshop')) return basePath + 'workshop.png';
    if (type.includes('course')) return basePath + 'course.png';
    if (type.includes('contest')) return basePath + 'contest.png';
    
    // Default fallback
    return 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80';
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

/**
 * Utility to copy text to clipboard with feedback
 */
async function copyToClipboard(text, successMsg = 'Link copied to clipboard!') {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for non-secure contexts or older browsers
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            textArea.remove();
        }
        showMessage(successMsg, 'success');
        return true;
    } catch (err) {
        console.error('Failed to copy: ', err);
        showMessage('Failed to copy link', 'error');
        return false;
    }
}

/**
 * Universal sharing function for posts and events
 */
function shareContent(type, id, title = '') {
    const baseUrl = window.location.origin + window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/'));
    let shareUrl = '';
    
    if (type === 'post') {
        shareUrl = `${window.location.origin}/share/post/${id}`;
    } else if (type === 'event') {
        shareUrl = `${window.location.origin}/share/event/${id}`;
    } else if (type === 'profile') {
        shareUrl = `${window.location.origin}/share/deck/${id}`;
    } else {
        shareUrl = window.location.href;
    }

    copyToClipboard(shareUrl, `Link to ${type} copied!`);
    
    // Optional: Web Share API for mobile devices
    if (navigator.share) {
        navigator.share({
            title: title || `Check out this ${type} on CrewCanvas`,
            url: shareUrl
        }).catch(console.error);
    }
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

// Helper to check if a source is a video
function isVideoFile(src) {
    if (!src) return false;
    if (typeof src !== 'string') return false;
    if (src.startsWith('data:video/')) return true;
    return src.toLowerCase().match(/\.(mp4|webm|ogg|mov|avi|flv|wmv)($|\?)/i);
}

// Double tap to like feature (Mobile only)
let lastTapTime = 0;
let lastTapPostId = null;

function handleDoubleTap(postId, event) {
    // Only enable for mobile/tablet as requested
    if (window.innerWidth > 1024) return;

    // Avoid triggering on buttons, links, or interactive elements
    if (event.target.closest('button') || event.target.closest('a') || 
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
        return;
    }

    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    // Check if taps are on the same post and within the delay
    if (lastTapPostId === postId && (now - lastTapTime < DOUBLE_PRESS_DELAY)) {
        event.preventDefault(); // Prevent default double-tap zoom/blink
        
        const postCard = event.target.closest('.post-card');
        
        if (typeof likePost === 'function') {
            const likesCount = document.getElementById(`likes-count-${postId}`);
            const btn = likesCount ? likesCount.parentElement : null;
            if (btn && !btn.classList.contains('liked')) {
                likePost(postId);
            } else if (!btn) {
                likePost(postId);
            }
            
            showLikeAnimation(event, postCard);
        }
        // Reset
        lastTapTime = 0;
        lastTapPostId = null;
    } else {
        lastTapTime = now;
        lastTapPostId = postId;
    }
}

function showLikeAnimation(event, container) {
    const heart = document.createElement('div');
    heart.innerHTML = '<i class="fa-solid fa-heart"></i>';
    
    // If we have a container (post-card), we use absolute centering
    // If not, we fallback to tap position (fixed)
    const isLocal = !!container;
    const parent = container || document.body;
    
    heart.style.cssText = `
        position: ${isLocal ? 'absolute' : 'fixed'};
        top: ${isLocal ? '50%' : (event.clientY || window.innerHeight/2) + 'px'};
        left: ${isLocal ? '50%' : (event.clientX || window.innerWidth/2) + 'px'};
        transform: translate(-50%, -50%) scale(0);
        color: white;
        font-size: 100px;
        text-shadow: 0 0 50px rgba(255, 45, 85, 0.8), 0 0 20px rgba(255, 45, 85, 0.4);
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        z-index: 100;
        animation: premiumHeartFade 0.8s cubic-bezier(0.17, 0.89, 0.32, 1.49) forwards;
        filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));
        will-change: transform, opacity;
    `;
    parent.appendChild(heart);
    setTimeout(() => heart.remove(), 800);
}

// Helper to render media content (image or video)
function renderMediaContent(src, className = 'post-image') {
    if (isVideoFile(src)) {
        return `<video src="${src}" class="${className}" controls muted playsinline style="width:100%; display:block;"></video>`;
    } else {
        return `<img src="${src}" class="${className}" alt="Media content" loading="lazy">`;
    }
}

/**
 * Opens a Base64 string in a new tab as a Blob URL (Prevents forced downloads)
 */
function viewFileFromBase64(base64Data) {
    if (!base64Data) return;
    
    try {
        const parts = base64Data.split(';base64,');
        if (parts.length < 2) {
            window.open(base64Data, '_blank');
            return;
        }

        const contentType = parts[0].split(':')[1] || 'application/pdf';
        const byteCharacters = atob(parts[1]);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        const blob = new Blob(byteArrays, {type: contentType});
        const blobUrl = URL.createObjectURL(blob);
        
        // USE A TEMPORARY LINK (Most robust method)
        const link = document.createElement('a');
        link.href = blobUrl;
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        }, 100);
        
    } catch (e) {
        console.error("View Error:", e);
        window.open(base64Data, '_blank');
    }
}

/**
 * Displays an image in a full-screen premium modal
 */
function viewImageFull(src) {
    if (!src) return;
    
    let modal = document.getElementById('imageFullModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'imageFullModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85); z-index: 10000000;
            display: flex; align-items: center; justify-content: center;
            opacity: 0; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            cursor: zoom-out;
        `;
        modal.innerHTML = `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">
                <img id="fullImageContent" src="" style="max-width: 95vw; max-height: 90vh; object-fit: contain; border-radius: 12px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); transform: scale(0.9); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);">
                <div style="position: absolute; top: 25px; right: 25px; display: flex; gap: 12px;">
                    <a id="fullImageDownload" href="#" download="image.jpg" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); color: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; text-decoration: none; transition: all 0.2s; border: 1px solid rgba(255,255,255,0.1);"><i class="fa-solid fa-download"></i></a>
                    <button onclick="document.getElementById('imageFullModal').click()" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); color: white; width: 44px; height: 44px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; transition: all 0.2s;"><i class="fa-solid fa-xmark"></i></button>
                </div>
            </div>
            <style>
                #imageFullModal a:hover, #imageFullModal button:hover { background: rgba(255,255,255,0.2) !important; transform: scale(1.05); }
            </style>
        `;
        document.body.appendChild(modal);
        modal.onclick = (e) => {
            if (e.target.id !== 'fullImageContent' && !e.target.closest('a')) {
                modal.style.opacity = '0';
                modal.querySelector('img').style.transform = 'scale(0.9)';
                setTimeout(() => modal.style.display = 'none', 300);
            }
        };
    }
    
    const img = document.getElementById('fullImageContent');
    const downloadBtn = document.getElementById('fullImageDownload');
    img.src = src;
    if (downloadBtn) {
        downloadBtn.href = src;
        const fileName = (typeof src === 'string' && src.startsWith('http')) ? src.split('/').pop().split('?')[0] : 'image.jpg';
        downloadBtn.download = fileName || 'image.jpg';
    }
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        img.style.transform = 'scale(1)';
    }, 10);
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

    @keyframes premiumHeartFade {
        0% { transform: translate(-50%, -50%) scale(0) rotate(-15deg); opacity: 0; }
        25% { transform: translate(-50%, -50%) scale(1.3) rotate(5deg); opacity: 0.9; }
        50% { transform: translate(-50%, -50%) scale(1) rotate(0deg); opacity: 0.8; }
        80% { transform: translate(-50%, -50%) scale(1.1) rotate(0deg); opacity: 0.4; }
        100% { transform: translate(-50%, -50%) scale(2) rotate(0deg); opacity: 0; }
    }

    .back-nav-btn {
        background: transparent;
        border: none;
        color: #64748b;
        font-size: 18px;
        padding: 8px;
        margin-right: 5px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s;
    }

    .back-nav-btn:hover {
        background: #f1f5f9;
        color: #ff8c00;
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
    if (user && user.profilePicture && user.profilePicture.trim().length > 0) { 
        return `<img src="${user.profilePicture}" alt="${user.name}" class="${className}" style="${style}" onerror="this.onerror=null; this.outerHTML=renderAvatarFallback('${user.name}', '${className}', '${size}')">`;
    } else {
        return renderAvatarFallback(user ? user.name : 'User', className, size);
    }
}

// Render initials fallback
function renderAvatarFallback(name, className = '', size = '40px') {
    const initials = getAvatarFallback(name);
    const background = '#e1e9ee';
    const color = '#7a8b98';
    const fontSize = parseInt(size) * 0.4;
    
    return `
        <div class="avatar-fallback ${className}" style="background: ${background}; color: ${color}; display: flex; align-items: center; justify-content: center; font-weight: 800; width: ${size}; height: ${size}; min-width: ${size}; min-height: ${size}; border-radius: 50% !important; text-transform: uppercase; font-size: ${fontSize}px; margin: 0 auto;">
            ${initials}
        </div>
    `;
}

// Global path variables for navigation
const path = window.location.pathname;
const currentPage = path.split("/").pop() || 'index.html';

// Helper to check if current page is an authentication page
function isAuthPage() {
    const authPages = ['index.html', 'register.html', 'forgot-password.html', 'reset-password.html', 'pass.html', 'scan.html', 'shared-audition.html'];
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
            ${getCurrentUserIsAdmin() ? `
            <a href="admin-insights.html" class="nav-item ${currentPage.includes('admin-insights.html') ? 'active' : ''}">
                <i class="fa-solid fa-chart-line"></i> Performance Insights
            </a>
            ` : ''}
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

    // Standardized Header HTML (Compact Version requested by user)
    const userId = localStorage.getItem('userId');
    const avatarVisible = (userAvatar && typeof userAvatar === 'string' && userAvatar.length > 10);
    
    const isPrimaryPage = currentPage.includes('feed.html') || currentPage.includes('home.html') || currentPage.includes('index.html');
    
    if (userId) {
        header.innerHTML = `
            <div class="header-left">
                <h2 class="brand-logo" onclick="window.location.href='home.html'">CrewCanvas</h2>
            </div>
            <div class="status-bar" style="gap: 12px; display: flex; align-items: center;">
                <a href="notifications.html" class="notification-icon-link" title="Notifications" style="color: #64748b; font-size: 18px; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 50%; background: #f8fafc; transition: all 0.2s; position: relative;">
                    <i class="fa-solid fa-bell"></i>
                    <span id="notifBadgeHeader" class="notif-pill" style="display:none; position: absolute; top: -2px; right: -2px; min-width: 14px; height: 14px; font-size: 8px;">0</span>
                </a>
                <div class="user-profile-box" onclick="ProfileHandler.toggleProfileDropdown()">
                    <div class="user-initials" id="userInitialsSmall" style="${avatarVisible ? 'display:none' : 'display:flex'}; width: 24px; height: 24px; font-size: 11px;">${initials}</div>
                    <img id="userAvatarSmall" src="${avatarVisible ? userAvatar : ''}" alt="" loading="lazy" style="${avatarVisible ? 'display:block' : 'display:none'}; width:24px; height:24px; border-radius:50%; object-fit:cover;">
                    
                    <div class="profile-dropdown-menu" id="profileDropdown">
                        <a href="profile.html" class="dropdown-item profile-link"><i class="fas fa-user"></i> My Profile</a>
                        <a href="edit-profile.html" class="dropdown-item edit-link"><i class="fas fa-user-edit"></i> Edit Profile</a>
                        <a href="settings.html" class="dropdown-item settings-link"><i class="fas fa-cog"></i> Settings</a>
                        <a href="about.html" class="dropdown-item about-link"><i class="fas fa-circle-info" style="color: #0d9488;"></i> About Crew Canvas</a>
                        <a href="mailto:crewcanvas2@gmail.com" class="dropdown-item contact-link"><i class="fas fa-envelope" style="color: #ff8c00;"></i> Contact & Collaborations</a>
                        ${isAdmin ? `<a href="admin-insights.html" class="dropdown-item"><i class="fas fa-chart-line" style="color: #3b82f6;"></i> Performance Insights</a>` : ''}
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
    } else {
        // Guest Header
        header.innerHTML = `
            <div class="header-left">
                <h2 class="brand-logo" onclick="window.location.href='index.html'">CrewCanvas</h2>
            </div>
            <div class="status-bar">
                <a href="index.html" style="color: #1e293b; text-decoration: none; font-weight: 700; font-size: 13px; background: #f1f5f9; padding: 8px 18px; border-radius: 50px;">Login</a>
            </div>
        `;
    }
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
    
    // Core Identity (Max 40)
    if (user.name) score += 10;
    if (user.email) score += 10;
    if (user.phone) score += 10;
    if (user.bio) score += 10;
    
    // Professional Assets (Max 40)
    if (user.resume) score += 15;
    if (user.showreel || user.portfolioVideos) score += 15;
    if (user.skills) score += 10;
    
    // Media & Craft (Max 20)
    if (user.recentPictures && user.recentPictures.length > 5) score += 10;
    if (user.role && user.experience) score += 10;
    
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

            sockScript.onload = () => {
                const stompScript = document.createElement('script');
                stompScript.src = "https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js";
                document.head.appendChild(stompScript);
                stompScript.onload = () => this.establishConnection(userId);
            };
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
        
        // Play specific sound based on type
        const type = (notification.type || '').toUpperCase();
        if (type === 'MESSAGE') {
            playSound('message');
        } else if (type === 'LIKE') {
            playSound('like');
        } else {
            playSound('notification');
        }

        // Show a temporary toast
        let displayContent = notification.content;
        if (type === 'MESSAGE') {
            displayContent = decryptMessage(displayContent);
        }
        showMessage(`New ${notification.type.toLowerCase()}: ${displayContent}`);
        
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
                
                // Update both potential badge IDs
                const badges = [document.getElementById('notifBadge'), document.getElementById('notifBadgeHeader')];
                badges.forEach(badge => {
                    if (badge) {
                        if (this.unreadCount > 0) {
                            badge.textContent = this.unreadCount;
                            badge.style.display = 'inline-flex';
                        } else {
                            badge.style.display = 'none';
                        }
                    }
                });
            }
        } catch (e) {
            console.error("Badge update failed:", e);
        }
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
            case 'NEW_EVENT':
                window.location.href = `event.html`;
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

/**
 * Toggles password visibility for a given input field
 * @param {string} inputId - The ID of the password input
 * @param {HTMLElement} icon - The icon element clicked
 */
function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input || !icon) return;
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

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
        NotificationHandler,
        formatDateForInput,
        shareContent
    };
}

/**
 * Safely opens a file (URL or Base64) in a new tab
 */
function openBase64InNewTab(data, contentType = '', fileName = '') {
    try {
        if (!data) return;
        
        // Case 1: It's a standard URL (HTTP or relative)
        if (data.startsWith('http') || (data.startsWith('/') && !data.startsWith('/9j/') && !data.startsWith('data:'))) {
            window.open(data, '_blank');
            return;
        }

        // Case 2: It's Base64 data
        let actualContentType = contentType;
        let realData = data;

        if (data.includes(";base64,")) {
            let parts = data.split(";base64,");
            actualContentType = parts[0].split(":")[1];
            realData = parts[1];
        } else if (data.startsWith('data:')) {
            let parts = data.split(",");
            actualContentType = parts[0].split(":")[1].split(";")[0];
            realData = parts[1];
        }
        
        // Sanitize
        realData = realData.replace(/\s/g, '');

        try {
            const byteCharacters = atob(realData);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: actualContentType || 'application/octet-stream' });
            
            const blobUrl = URL.createObjectURL(blob);
            const win = window.open(blobUrl, '_blank');
            
            if (!win || win.closed || typeof win.closed == 'undefined') {
                const link = document.createElement('a');
                link.href = blobUrl;
                const finalExt = actualContentType.split('/')[1] || 'file';
                link.download = fileName || `file_${Date.now()}.${finalExt}`;
                link.click();
            }
        } catch (innerError) {
            console.error("Base64 conversion failed:", innerError);
            window.open(data, '_blank');
        }
    } catch (e) {
        console.error("Critical error opening file:", e);
    }
}

/**
 * Calculates profile completion percentage based on core requirements
 * Required: Name, Email, Phone, Bio, Resume, Video, and 5+ Recent Images
 */
function calculateProfileScore(user) {
    if (!user) return 0;
    let score = 0;
    
    // Core Info (40%)
    if (user.name) score += 10;
    if (user.email) score += 10;
    if (user.phone && !user.phone.includes('X')) score += 10;
    if (user.bio && user.bio.length > 10) score += 10;
    
    // Media (30%)
    if (user.resume) score += 15;
    if (user.showreel || user.portfolioVideos) score += 15;
    
    // Recent Pictures (30%)
    if (user.recentPictures) {
        try {
            const pics = JSON.parse(user.recentPictures);
            if (Array.isArray(pics)) {
                if (pics.length >= 5) score += 30;
                else if (pics.length > 0) score += (pics.length * 6); // 6% per photo up to 30%
            }
        } catch (e) {
            // Handle legacy comma-separated string
            const pics = user.recentPictures.split(',').filter(p => p.trim());
            if (pics.length >= 5) score += 30;
            else if (pics.length > 0) score += (pics.length * 6);
        }
    }
    
    return Math.min(100, score);
}
