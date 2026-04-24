// Crew Search functionality
let allUsers = [];
let followingIds = new Set();
let followerIds = new Set(); // People who follow ME
let currentSearchTab = 'find'; // 'find' or 'connections'

// Helper to get ID regardless of property name (id vs userId)
function getUserId(user) {
    if (!user) return null;
    return user.id || user.userId || user.ID || user.userID || (typeof user !== 'object' ? user : null);
}


document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    
    // Initial UI Setup
    const toggleContainer = document.querySelector('.toggle-switch-container');
    if (toggleContainer) toggleContainer.style.display = 'none';
    
    // Load state in parallel for better performance
    Promise.all([
        loadFollowingIds(),
        loadFollowerIds(),
        loadAllUsers()
    ]).catch(e => console.error("Parallel load failed:", e));
});

// Search input debounce handler
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e) => {
        searchUsers();
    }, 500));
}

// Global search function
async function searchUsers() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    
    const query = input.value.trim().toLowerCase();
    console.log("Searching for:", query, "in tab:", currentSearchTab);
    
    try {
        if (currentSearchTab === 'find') {
            const response = await fetch(`${API_BASE_URL}/api/profile/search?query=${query}`);
            if (response.ok) {
                const users = await response.json();
                displayUsers(users);
            }
        } else {
            // Search within Connections list
            const activeSubTab = document.getElementById('followingTab').classList.contains('active') ? 'following' : 'followers';
            const userId = getCurrentUserId();
            const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/${activeSubTab}?t=${Date.now()}`);
            if (response.ok) {
                const users = await response.json();
                const filtered = users.filter(u => 
                    u.name.toLowerCase().includes(query) || 
                    (u.role && u.role.toLowerCase().includes(query)) ||
                    (u.location && u.location.toLowerCase().includes(query))
                );
                displayUsers(filtered, activeSubTab === 'following');
            }
        }
    } catch (err) {
        console.error("Search error:", err);
    }
}

// Load Following IDs (The list of people YOU follow)
async function loadFollowingIds() {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userId}/following?t=${Date.now()}`);
        if (res.ok) {
            const users = await res.json();
            followingIds = new Set();
            users.forEach(u => {
                const id = getUserId(u);
                if (id) followingIds.add(String(id));
            });
        }
        
        // Update Dashboard Stats
        const profileRes = await fetch(`${API_BASE_URL}/api/profile/${userId}?t=${Date.now()}`);
        if (profileRes.ok) {
            const user = await profileRes.json();
            const followingsBadge = document.getElementById('myFollowingCount');
            const followersBadge = document.getElementById('myConnectionsCount');
            if (followingsBadge) followingsBadge.innerText = user.following || 0;
            if (followersBadge) followersBadge.innerText = user.followers || 0;
        }
    } catch (e) { console.error("Error loading relationships:", e); }
}

// Load Follower IDs (The list of people who follow YOU)
async function loadFollowerIds() {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userId}/followers?t=${Date.now()}`);
        if (res.ok) {
            const users = await res.json();
            followerIds = new Set();
            users.forEach(u => {
                const id = getUserId(u);
                if (id) followerIds.add(String(id));
            });
        }
    } catch (e) { console.error("Error loading followers:", e); }
}

async function loadAllUsers() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/search?query=`);
        allUsers = await res.json();
        if (currentSearchTab === 'find') {
            displayUsers(allUsers);
        }
        
        // Count visibility logic: Only admin sees total count
        const totalBadge = document.getElementById('totalCrewCount');
        if (totalBadge) {
            const isAdmin = getCurrentUserIsAdmin();
            if (isAdmin) {
                const currentUserId = String(getCurrentUserId());
                const realTotal = allUsers.filter(u => String(getUserId(u)) !== currentUserId).length;
                totalBadge.innerText = realTotal;
                totalBadge.style.display = 'flex'; // Show for admin
            } else {
                totalBadge.style.display = 'none'; // Hide for others
            }
        }
    } catch (e) { console.error("Error loading all users:", e); }
}

// Display users uniformly
function displayUsers(users, forceFollowingState = false) {
    const container = document.getElementById('searchResults');
    const currentUserId = String(getCurrentUserId());
    
    if (!users || users.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">No crew found.</div>`;
        return;
    }

    const finalUsers = [];
    const seenIds = new Set();
    
    users.forEach(u => {
        const id = String(getUserId(u));
        if (id !== currentUserId && !seenIds.has(id)) {
            finalUsers.push(u);
            seenIds.add(id);
        }
    });

    container.innerHTML = finalUsers.map(user => {
        const id = String(getUserId(user));
        const isFollowed = forceFollowingState || followingIds.has(id);
        const canMessage = followerIds.has(id);
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
        displayUsers(allUsers);
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
        
        await loadFollowingIds();
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
                    `<button class="btn-following" id="follow-btn-${userId}" onclick="unfollowUser(${userId})"><i class="fas fa-user-minus"></i> Unfollow</button>` :
                    `<button class="btn-follow" id="follow-btn-${userId}" onclick="followUser(${userId})"><i class="fas fa-user-plus"></i> Follow</button>`
                }
            </div>
        </div>
    `;
}

function startMessage(id) {
    window.location.href = `messages.html?userId=${id}`;
}

function viewProfile(id) { window.location.href = `profile.html?userId=${id}`; }

// Action Handlers
async function followUser(targetId) {
    const currentId = getCurrentUserId();
    const res = await fetch(`${API_BASE_URL}/api/profile/${targetId}/follow?followerId=${currentId}`, { method: 'POST' });
    if (res.ok) {
        showMessage("Followed successfully!", "success");
        await loadFollowingIds();
        updateUI(targetId, true);
    } else {
        const msg = await res.text();
        if (msg.includes("Already")) { updateUI(targetId, true); }
        else showMessage("Error following user", "error");
    }
}

async function unfollowUser(targetId) {
    const currentId = getCurrentUserId();
    const res = await fetch(`${API_BASE_URL}/api/profile/${targetId}/unfollow?followerId=${currentId}`, { method: 'DELETE' });
    if (res.ok) {
        showMessage("Unfollowed", "success");
        await loadFollowingIds();
        updateUI(targetId, false);
    }
}


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
