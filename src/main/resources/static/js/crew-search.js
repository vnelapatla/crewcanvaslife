// Crew Search functionality
let allUsers = [];
let currentSearchTab = 'find'; // 'find' or 'connections'
let currentUserId = null;
let currentPage = 0;
let isLoading = false;
let hasMore = true;
const PAGE_SIZE = 15;

// Helper to get ID regardless of property name (id vs userId)
function getUserId(user) {
    if (!user) return null;
    return user.id || user.userId || user.ID || user.userID || (typeof user !== 'object' ? user : null);
}

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    
    // Initial UI Setup
    const toggleContainer = document.querySelector('.toggle-switch-container');
    if (toggleContainer) toggleContainer.style.display = 'none';
    
    try {
        // 1. Initialize ProfileHandler (Optimized to ONE request)
        await ProfileHandler.init();
        
        // 2. Load first page of users
        await loadUsersPage(0, true);
        
        // 3. Update dashboard stats from already cached profile data if possible
        const cachedUser = userCache.get(currentUserId);
        if (cachedUser) {
            updateStatsUI(cachedUser);
        } else {
            updateDashboardStats();
        }
        
        setupInfiniteScroll();
    } catch (e) { 
        console.error("Initial load failed:", e); 
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
        currentPage = 0;
        hasMore = true;
        if (container) container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading crew...</div>';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/search?query=${query}&page=${page}&size=${PAGE_SIZE}&t=${Date.now()}`);
        if (response.ok) {
            const data = await response.json();
            const users = data.content || [];
            
            if (users.length < PAGE_SIZE) hasMore = false;

            if (refresh) {
                displayUsers(users);
                allUsers = users; // Cache current search set
            } else {
                appendUsers(users);
                allUsers = [...allUsers, ...users];
            }
            
            currentPage = page + 1;
            
            // Update admin total count if needed
            const totalBadge = document.getElementById('totalCrewCount');
            if (totalBadge && getCurrentUserIsAdmin()) {
                totalBadge.innerText = data.totalElements || allUsers.length;
                totalBadge.style.display = 'flex';
            }
        } else {
            hasMore = false;
            if (refresh) container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">No results found.</div>';
        }
    } catch (e) { 
        console.error("Error loading users:", e);
    } finally {
        isLoading = false;
        if (loader) loader.style.opacity = '0';
    }
}

function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore && currentSearchTab === 'find') {
            loadUsersPage(currentPage);
        }
    }, { threshold: 0.1 });

    const loader = document.querySelector('.scroll-load');
    if (loader) observer.observe(loader);
}

// Display users uniformly
function displayUsers(users, forceFollowingState = false) {
    const container = document.getElementById('searchResults');
    if (!container) return;
    
    if (!users || users.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No crew found.</div>`;
        return;
    }

    container.innerHTML = filterAndMapUsers(users, forceFollowingState);
}

function appendUsers(users, forceFollowingState = false) {
    const container = document.getElementById('searchResults');
    if (!container || !users || users.length === 0) return;
    
    container.insertAdjacentHTML('beforeend', filterAndMapUsers(users, forceFollowingState));
}

function filterAndMapUsers(users, forceFollowingState) {
    const currentUserIdStr = String(currentUserId);
    const seenIds = new Set();
    
    return users.filter(u => {
        const id = parseInt(getUserId(u));
        if (id == currentUserIdStr) return false;
        if (currentSearchTab === 'find' && ProfileHandler.isFollowing(id)) return false;
        if (seenIds.has(id)) return false;
        seenIds.add(id);
        return true;
    }).map(user => {
        const id = parseInt(getUserId(user));
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
    const messageBtn = canMessage ? `<button class="btn-message" onclick="startMessage(${userId})"><i class="fa-solid fa-paper-plane"></i></button>` : '';
    
    return `
        <div class="crew-card">
            ${renderAvatar(user, 'user-img')}
            <h3>${user.name}</h3>
            <p class="role" style="color: ${user.isVerifiedProfessional === true ? '#ff8c00' : '#64748b'}; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; margin-bottom: 5px;">
                ${user.isVerifiedProfessional === true ? 'FILM PROFESSIONAL' : (user.userType || 'Explorer')}
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
                <button class="btn-profile" onclick="viewProfile(${userId})">Profile</button>
                ${messageBtn}
                ${isFollowing ? 
                    `<button class="btn-following" id="follow-btn-${userId}" data-user-id="${userId}" onclick="ProfileHandler.toggleFollow(${userId}, this)"><i class="fas fa-user-minus"></i> Unfollow</button>` :
                    `<button class="btn-follow" id="follow-btn-${userId}" data-user-id="${userId}" onclick="ProfileHandler.toggleFollow(${userId}, this)"><i class="fas fa-user-plus"></i> Follow</button>`
                }
            </div>
        </div>
    `;
}

function startMessage(id) {
    window.location.href = `messages.html?userId=${id}`;
}

function viewProfile(id) { window.location.href = `profile.html?userId=${id}`; }

// These are now handled by ProfileHandler


function updateUI(id, isFollowing) {
    const btn = document.getElementById(`follow-btn-${id}`);
    const count = document.getElementById(`followers-count-${id}`);
    if (btn) {
        btn.innerHTML = isFollowing ? '<i class="fas fa-user-minus"></i> Unfollow' : '<i class="fas fa-user-plus"></i> Follow';
        btn.className = isFollowing ? 'btn-following' : 'btn-follow';
        // Add this missing line to update the click function
        btn.onclick = () => isFollowing ? unfollowUser(id) : followUser(id);
    }
    if (count) {
        let val = parseInt(count.innerText);
        count.innerText = isFollowing ? val + 1 : Math.max(0, val - 1);
    }
}
