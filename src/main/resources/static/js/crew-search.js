// Crew Search functionality
let allUsers = [];
let currentSearchTab = 'find'; // 'find' or 'connections'
let currentUserId = null;
let currentSearchPage = 0;
let isLoading = false;
let hasMore = true;
const PAGE_SIZE = 15;

// Helper to get ID regardless of property name (id vs userId)
function getUserId(user) {
    if (!user) return null;
    return user.id || user.userId || user.ID || user.userID || (typeof user !== 'object' ? user : null);
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuth()) return;
    currentUserId = getCurrentUserId();
    
    // Initial UI Setup
    const toggleContainer = document.querySelector('.toggle-switch-container');
    if (toggleContainer) toggleContainer.style.display = 'none';
    
    try {
        console.log("Crew Search: Starting initialization...");
        // 1. Initialize ProfileHandler (Optimized to ONE request)
        await ProfileHandler.init();
        console.log("Crew Search: ProfileHandler initialized.");
        
        // 2. Load first page of users
        await loadUsersPage(0, true);
        console.log("Crew Search: First page loaded.");
        
        // 3. Update dashboard stats from already cached profile data if possible
        const cachedUser = window.userCache ? window.userCache.get(currentUserId) : null;
        if (cachedUser) {
            console.log("Crew Search: Using cached user stats.");
            updateStatsUI(cachedUser);
        } else {
            console.log("Crew Search: Fetching user stats...");
            updateDashboardStats();
        }
        
        setupInfiniteScroll();
    } catch (e) { 
        console.error("Crew Search: Initial load failed:", e); 
        const container = document.getElementById('searchResults');
        if (container) container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;">Error: ${e.message}. Please refresh.</div>`;
    }
});

// Callback for ProfileHandler to refresh counts
function refreshProfileData() {
    updateDashboardStats();
}

// Search input debounce handler
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e) => {
        hasMore = true;
        loadUsersPage(0, true);
    }, 500));
}

// Dashboard stats update helper
async function updateDashboardStats() {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
        const profileRes = await fetch(`${API_BASE_URL}/api/profile/${userId}?t=${Date.now()}`);
        if (profileRes.ok) {
            const user = await profileRes.json();
            updateStatsUI(user);
        }
    } catch (e) { console.error("Error updating stats:", e); }
}

function updateStatsUI(user) {
    const followingsBadge = document.getElementById('myFollowingCount');
    const followersBadge = document.getElementById('myConnectionsCount');
    if (followingsBadge) followingsBadge.innerText = user.following || 0;
    if (followersBadge) followersBadge.innerText = user.followers || 0;
}

async function loadUsersPage(page = 0, refresh = false) {
    if (isLoading || (!hasMore && !refresh)) return;
    
    isLoading = true;
    const query = document.getElementById('searchInput')?.value.trim() || '';
    const container = document.getElementById('searchResults');
    const loader = document.querySelector('.scroll-load');
    
    if (loader) loader.style.opacity = '1';
    if (refresh) {
        currentSearchPage = 0;
        hasMore = true;
        if (container) container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading crew...</div>';
    }

    try {
        const excludeFollowed = (currentSearchTab === 'find');
        const userIdParam = currentUserId ? `&currentUserId=${currentUserId}` : '';
        const url = `${API_BASE_URL}/api/profile/search?query=${encodeURIComponent(query)}${userIdParam}&excludeFollowed=${excludeFollowed}&page=${page}&size=${PAGE_SIZE}&t=${Date.now()}`;
        console.log("Crew Search: Fetching users from:", url);
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log("Crew Search: Received data:", data);
            
            const users = Array.isArray(data) ? data : (data.content || []);
            console.log("Crew Search: Final users array to display:", users);
            
            if (!Array.isArray(users)) {
                console.warn("Crew Search: Expected users to be an array, got:", typeof users);
            }
            
            if (users.length < PAGE_SIZE) hasMore = false;

            if (refresh) {
                displayUsers(users);
                allUsers = users; // Cache current search set
            } else {
                appendUsers(users);
                allUsers = [...allUsers, ...users];
            }
            
            currentSearchPage = page + 1;
            
            // Update admin total count if needed
            const totalBadge = document.getElementById('totalCrewCount');
            if (totalBadge && typeof getCurrentUserIsAdmin === 'function' && getCurrentUserIsAdmin()) {
                totalBadge.innerText = data.totalElements || allUsers.length;
                totalBadge.style.display = 'flex';
            }
        } else {
            const errText = await response.text();
            console.error("Crew Search: API Error:", response.status, errText);
            hasMore = false;
            if (refresh) container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No results found or error occurred.</div>';
        }
    } catch (e) { 
        console.error("Crew Search: Fetch Exception:", e);
        if (refresh && container) container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: red;">Failed to connect to server.</div>`;
    } finally {
        isLoading = false;
        if (loader) loader.style.opacity = '0';
    }
}

function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore && currentSearchTab === 'find') {
            loadUsersPage(currentSearchPage);
        }
    }, { threshold: 0.1 });

    const loader = document.querySelector('.scroll-load');
    if (loader) observer.observe(loader);
}

function displayUsers(users, forceFollowingState = false) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    console.log(`displayUsers called with ${users ? users.length : 0} users`);
    if (!users || users.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No crew found.</div>`;
        return;
    }

    const html = filterAndMapUsers(users, forceFollowingState);
    if (!html || html.trim() === '') {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No results found (filtered).</div>`;
    } else {
        container.innerHTML = html;
    }
}

function appendUsers(users, forceFollowingState = false) {
    const container = document.getElementById('searchResults');
    if (!container || !users || users.length === 0) return;
    
    container.insertAdjacentHTML('beforeend', filterAndMapUsers(users, forceFollowingState));
}

function filterAndMapUsers(users, forceFollowingState) {
    const currentUserIdStr = String(currentUserId);
    const seenIds = new Set();
    console.log("Filtering users for currentUserId:", currentUserIdStr);
    
    const filtered = users.filter(u => {
        const userId = getUserId(u);
        if (!userId) {
            console.warn("User object missing ID:", u);
            return false;
        }
        const id = String(userId);
        if (id === currentUserIdStr) return false;
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
    });

    console.log(`Filtered ${users.length} users down to ${filtered.length}`);

    return filtered.map(user => {
        const id = getUserId(user);
        const isFollowed = forceFollowingState || ProfileHandler.isFollowing(id);
        const isAdmin = typeof getCurrentUserIsAdmin === 'function' ? getCurrentUserIsAdmin() : false;
        const canMessage = isAdmin || ProfileHandler.isFollower(id);
        return createUserCard(user, isFollowed, canMessage);
    }).join('');
}

// Tab Switching Logic
function switchSearchTab(tab) {
    if (currentSearchTab === tab && tab === 'find') return;
    currentSearchTab = tab;
    
    document.querySelectorAll('.feature-card').forEach(c => c.classList.remove('active'));
    
    const toggleContainer = document.querySelector('.toggle-switch-container');
    if (toggleContainer) {
        toggleContainer.style.display = (tab === 'find' ? 'none' : 'flex');
    }
    
    if (tab === 'find') {
        const card = document.getElementById('findCrewCard');
        if (card) card.classList.add('active');
        const input = document.getElementById('searchInput');
        if (input) input.value = '';
        loadUsersPage(0, true);
    }
}

function switchConnectionTab(subTab) {
    currentSearchTab = 'connections';
    
    // UI Classes - Update active states for both buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    
    const followersTab = document.getElementById('followersTab');
    const followingTab = document.getElementById('followingTab');
    const followersCard = document.getElementById('connectionsCard'); // This is the followers card
    const followingCard = document.getElementById('followingCard');
    const findCrewCard = document.getElementById('findCrewCard');
    
    if (subTab === 'followers') {
        if (followersTab) followersTab.classList.add('active');
        if (followersCard) followersCard.classList.add('active');
        if (followingCard) followingCard.classList.remove('active');
    } else {
        if (followingTab) followingTab.classList.add('active');
        if (followingCard) followingCard.classList.add('active');
        if (followersCard) followersCard.classList.remove('active');
    }
    
    if (findCrewCard) findCrewCard.classList.remove('active');
    
    loadConnections(subTab);
}

async function loadConnections(type) {
    const userId = getCurrentUserId();
    const container = document.getElementById('searchResults');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading connections...</div>';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userId}/${type}?t=${Date.now()}`);
        const users = await res.json();
        
        if (currentSearchTab !== 'connections') return;
        
        await ProfileHandler.init();
        displayUsers(users, type === 'following');
    } catch (e) { console.error("Error loading connections:", e); }
}

// User Card Generation
function createUserCard(user, isFollowing, canMessage) {
    const userId = getUserId(user);
    const messageBtn = canMessage ? `<button class="btn-message" onclick="startMessage('${userId}')"><i class="fa-solid fa-paper-plane"></i></button>` : '';
    
    // Admin-only profile completion percentage
    const isAdmin = typeof getCurrentUserIsAdmin === 'function' ? getCurrentUserIsAdmin() : false;
    const profileCompletion = (isAdmin && user.profileScore != null) ? 
        `<div class="profile-completion-admin" style="margin-bottom: 15px; font-size: 11px; color: #64748b; background: #f1f5f9; padding: 6px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #e2e8f0;">
            <i class="fa-solid fa-chart-pie" style="color: #ff8c00;"></i>
            <span>Profile: <b>${user.profileScore}%</b> filled</span>
         </div>` : '';
    
    return `
        <div class="crew-card">
            ${profileCompletion}
            ${renderAvatar(user, 'user-img')}
            <h3>${user.name}</h3>
            <p class="role" style="color: ${user.isVerifiedProfessional === true ? '#ff8c00' : '#64748b'}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 5px;">
                ${typeof getUserDisplayStatus === 'function' ? getUserDisplayStatus(user) : (user.isVerifiedProfessional === true ? 'FILM PROFESSIONAL' : (user.userType || 'Explorer'))}
            </p>
            <p class="location">${user.location || 'Location not specified'}</p>
            
            <div class="stats" style="margin-top: 15px;">
                <div class="stat">
                    <span class="stat-value" id="followers-count-${userId}">${user.followers || 0}</span>
                    <span class="stat-label">Followers</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${user.following || 0}</span>
                    <span class="stat-label">Following</span>
                </div>
            </div>

            <div class="actions" style="margin-top: 15px;">
                <button class="btn-profile" onclick="viewProfile('${userId}')">Profile</button>
                ${messageBtn}
                ${isFollowing ? 
                    `<button class="btn-following" id="follow-btn-${userId}" data-user-id="${userId}" onclick="ProfileHandler.toggleFollow('${userId}', this)"><i class="fas fa-user-minus"></i> Unfollow</button>` :
                    `<button class="btn-follow" id="follow-btn-${userId}" data-user-id="${userId}" onclick="ProfileHandler.toggleFollow('${userId}', this)"><i class="fas fa-user-plus"></i> Follow</button>`
                }
            </div>
        </div>
    `;
}

// Functions viewProfile and startMessage are used in createUserCard
function viewProfile(id) { 
    if (!id || id === 'null' || id === 'undefined') {
        console.error("Cannot view profile: Invalid ID", id);
        return;
    }
    window.location.href = `profile.html?userId=${id}`; 
}
function startMessage(id) { window.location.href = `messages.html?userId=${id}`; }
