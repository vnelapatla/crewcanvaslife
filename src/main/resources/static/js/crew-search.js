// Crew Search functionality
let allUsers = [];
let followingIds = new Set();
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
    
    // Load state and then default view
    await loadFollowingIds();
    await loadAllUsers();
});

// Search input debounce handler
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', debounce(async (e) => {
        const query = e.target.value.trim().toLowerCase();
        
        if (currentSearchTab === 'find') {
            const response = await fetch(`${API_BASE_URL}/api/profile/search?query=${query}`);
            const users = await response.json();
            displayUsers(users);
        } else {
            // Search within Connections list
            const activeSubTab = document.getElementById('followingTab').classList.contains('active') ? 'following' : 'followers';
            const userId = getCurrentUserId();
            const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/${activeSubTab}?t=${Date.now()}`);
            const users = await response.json();
            
            const filtered = users.filter(u => 
                u.name.toLowerCase().includes(query) || 
                (u.role && u.role.toLowerCase().includes(query)) ||
                (u.location && u.location.toLowerCase().includes(query))
            );
            displayUsers(filtered, activeSubTab === 'following');
        }
    }, 500));
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

// Load all users for the 'Find Crew' tab
async function loadAllUsers() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/search?query=`);
        allUsers = await res.json();
        if (currentSearchTab === 'find') {
            displayUsers(allUsers);
        }
        const totalBadge = document.getElementById('totalCrewCount');
        if (totalBadge) {
            // Filter out current user from count
            const currentUserId = String(getCurrentUserId());
            const realTotal = allUsers.filter(u => String(getUserId(u)) !== currentUserId).length;
            totalBadge.innerText = realTotal;
        }
    } catch (e) { console.error("Error loading all users:", e); }
}

// Display users uniformly
function displayUsers(users, forceFollowingState = false) {
    const container = document.getElementById('searchResults');
    const currentUserId = String(getCurrentUserId());
    
    if (!users || users.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><h2>No crew found here.</h2></div>`;
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
        const isFollowed = forceFollowingState || followingIds.has(String(getUserId(user)));
        return createUserCard(user, isFollowed);
    }).join('');
}

// Tab Switching Logic
function switchSearchTab(tab) {
    currentSearchTab = tab;
    
    // UI Classes
    document.getElementById('findCrewCard').classList.remove('active');
    document.getElementById('followingCountCard').classList.remove('active');
    document.getElementById('connectionsCard').classList.remove('active');
    document.querySelector('.toggle-switch-container').style.display = (tab === 'find' ? 'none' : 'flex');
    
    if (tab === 'find') {
        document.getElementById('findCrewCard').classList.add('active');
        document.getElementById('searchInput').value = '';
        displayUsers(allUsers);
    } else {
        // Highlighting handled by switchConnectionTab
    }
}

function switchConnectionTab(subTab) {
    currentSearchTab = 'connections';
    document.getElementById('followingTab').classList.remove('active');
    document.getElementById('followersTab').classList.remove('active');
    document.getElementById('followingCountCard').classList.remove('active');
    document.getElementById('connectionsCard').classList.remove('active');
    
    if (subTab === 'following') {
        document.getElementById('followingTab').classList.add('active');
        document.getElementById('followingCountCard').classList.add('active');
        loadConnections('following');
    } else {
        document.getElementById('followersTab').classList.add('active');
        document.getElementById('connectionsCard').classList.add('active');
        loadConnections('followers');
    }
}

async function loadConnections(type) {
    const userId = getCurrentUserId();
    const container = document.getElementById('searchResults');
    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center;">Loading...</div>';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userId}/${type}?t=${Date.now()}`);
        const users = await res.json();
        
        if (currentSearchTab !== 'connections') return;
        
        // Ensure accurate button state
        await loadFollowingIds();
        displayUsers(users, type === 'following');
    } catch (e) { console.error("Error loading connections:", e); }
}

// User Card Generation
function createUserCard(user, isFollowing) {
    const userId = getUserId(user);
    return `
        <div class="crew-card">
            ${renderAvatar(user, 'user-img')}
            <h3>${user.name}</h3>
            <p class="role">${user.role || 'Film Professional'}</p>
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
                ${isFollowing ? 
                    `<button class="btn-message" onclick="startMessage(${userId})"><i class="fas fa-comment"></i></button>
                     <button class="btn-following" id="follow-btn-${userId}" onclick="unfollowUser(${userId})"><i class="fas fa-user-minus"></i> Unfollow</button>` :
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
        if (document.getElementById('followingTab').classList.contains('active')) {
            loadConnections('following'); // Refresh following list to remove the user
        } else {
            updateUI(targetId, false);
        }
    }
}

function updateUI(id, isFollowing) {
    const btn = document.getElementById(`follow-btn-${id}`);
    const count = document.getElementById(`followers-count-${id}`);
    if (btn) {
        btn.innerHTML = isFollowing ? '<i class="fas fa-user-minus"></i> Unfollow' : '<i class="fas fa-user-plus"></i> Follow';
        btn.className = isFollowing ? 'btn-following' : 'btn-follow';
        btn.onclick = () => isFollowing ? unfollowUser(id) : followUser(id);
    }
    if (count) {
        let val = parseInt(count.innerText);
        count.innerText = isFollowing ? val + 1 : Math.max(0, val - 1);
    }
}
