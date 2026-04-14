// Crew Search functionality
let allUsers = [];
let followingIds = new Set();
let currentSearchTab = 'find';

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    // Initially hide connection tabs
    const toggleContainer = document.querySelector('.toggle-switch-container');
    if (toggleContainer) toggleContainer.style.display = 'none';
    
    await loadFollowingIds();
    loadAllUsers();
});

// Load IDs of people the current user follows and update metrics
async function loadFollowingIds() {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
        console.log("Fetching following for user:", userId);
        const followingResponse = await fetch(`${API_BASE_URL}/api/profile/${userId}/following?t=${Date.now()}`);
        if (followingResponse.ok) {
            const followingUsers = await followingResponse.json();
            // Convert everything to String for bulletproof comparison
            followingIds = new Set(followingUsers.map(u => String(u.id || u.userId || u)));
            console.log("Followed IDs populated:", Array.from(followingIds));
        }
        
        // Fetch followers count for badge
        const followersResponse = await fetch(`${API_BASE_URL}/api/profile/${userId}/followers?t=${Date.now()}`);
        if (followersResponse.ok) {
            const followers = await followersResponse.json();
            const badge = document.getElementById('myConnectionsCount');
            if (badge) badge.innerText = followers.length;
        }
    } catch (error) {
        console.error('Error loading follower/following data:', error);
    }
}

// Load all users
async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/search?query=`);
        allUsers = await response.json();
        
        // Update the total crew count in the entire database
        document.getElementById('totalCrewCount').innerText = allUsers.length;
        
        const currentUserId = String(getCurrentUserId());
        // STRICTOR SELF-FILTER: Use String comparison
        const filteredUsers = allUsers.filter(u => String(u.id) !== currentUserId);
        
        if (currentSearchTab === 'find') {
            displayUsers(filteredUsers);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Search users
const searchUsers = debounce(async () => {
    const queryInput = document.getElementById('searchInput');
    if (!queryInput) return;
    const query = queryInput.value.toLowerCase();
    const currentUserId = getCurrentUserId();

    if (currentSearchTab === 'find') {
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/search?query=${query}`);
            const users = await response.json();
            const filteredUsers = users.filter(u => Number(u.id) != Number(currentUserId));
            displayUsers(filteredUsers);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    } else {
        // Search within connections (Following/Followers)
        // We can just filter the already displayed list or re-fetch
        const activeSubTab = document.getElementById('followingTab').classList.contains('active') ? 'following' : 'followers';
        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}/${activeSubTab}`);
            const users = await response.json();
            const filtered = users.filter(u => 
                u.name.toLowerCase().includes(query) || 
                (u.role && u.role.toLowerCase().includes(query))
            );
            
            const container = document.getElementById('searchResults');
            if (filtered.length === 0) {
                container.innerHTML = `<div class="empty-state" style="grid-column: 1/-1;"><h2>No matching crew in your ${activeSubTab}</h2></div>`;
                return;
            }
            
            container.innerHTML = filtered.map(user => {
                const isFollowing = activeSubTab === 'following' || followingIds.has(Number(user.id));
                return createUserCard(user, isFollowing);
            }).join('');
        } catch (error) {
            console.error('Error searching connections:', error);
        }
    }
}, 500);

// Display users
function displayUsers(users) {
    const container = document.getElementById('searchResults');
    const currentUserId = String(getCurrentUserId());

    if (!users || users.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <h2 style="font-size: 20px; color: var(--text-dark);">No crew found</h2>
                <p style="color: var(--text-muted);">Self-following is not enabled. Look for other creators!</p>
            </div>
        `;
        return;
    }

    // Secondary safety filter for self-follow
    const finalUsers = users.filter(u => String(u.id) !== currentUserId);

    container.innerHTML = finalUsers.map(user => {
        const isFollowing = followingIds.has(String(user.id || user.userId));
        return createUserCard(user, isFollowing);
    }).join('');
}

// Switch search tab
function switchSearchTab(tab) {
    currentSearchTab = tab;

    // Update UI active states
    document.getElementById('findCrewCard').classList.remove('active');
    document.getElementById('connectionsCard').classList.remove('active');

    if (tab === 'find') {
        document.getElementById('findCrewCard').classList.add('active');
        document.getElementById('searchInput').placeholder = "Browse all crew...";
        document.querySelector('.toggle-switch-container').style.display = 'none';
        loadAllUsers();
    } else {
        document.getElementById('connectionsCard').classList.add('active');
        document.getElementById('searchInput').placeholder = "Search your connections...";
        document.querySelector('.toggle-switch-container').style.display = 'flex';
        // Set default connection tab to following
        switchConnectionTab('following');
    }
}

// Switch connection tab
function switchConnectionTab(tab) {
    document.getElementById('followingTab').classList.remove('active');
    document.getElementById('followersTab').classList.remove('active');

    if (tab === 'following') {
        document.getElementById('followingTab').classList.add('active');
        loadFollowing();
    } else {
        document.getElementById('followersTab').classList.add('active');
        loadFollowers();
    }
}

// Load following
async function loadFollowing() {
    const userId = getCurrentUserId();
    try {
        // Refresh followingIds first to be sure
        await loadFollowingIds();
        
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/following?t=${Date.now()}`);
        const users = await response.json();

        const container = document.getElementById('searchResults');
        if (currentSearchTab !== 'connections') return;

        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h2 style="font-size: 20px; color: var(--text-dark);">Not following anyone</h2>
                    <p style="color: var(--text-muted);">Go to 'Find Crew' to grow your network.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(user => {
            const isFollowing = followingIds.has(String(user.id || user));
            return createUserCard(user, isFollowing || true); // Always true for following tab
        }).join('');
    } catch (error) {
        console.error('Error loading following:', error);
    }
}

// Load followers
async function loadFollowers() {
    const userId = getCurrentUserId();
    try {
        await loadFollowingIds(); // Ensure we have latest following status
        
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/followers?t=${Date.now()}`);
        const users = await response.json();

        const container = document.getElementById('searchResults');
        if (currentSearchTab !== 'connections') return;

        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h2 style="font-size: 20px; color: var(--text-dark);">No followers yet</h2>
                    <p style="color: var(--text-muted);">Post updates and connect with others to get followers.</p>
                </div>
            `;
            return;
        }

        // Check if we are following back
        container.innerHTML = users.map(user => {
            const isFollowing = followingIds.has(String(user.id || user));
            return createUserCard(user, isFollowing);
        }).join('');
    } catch (error) {
        console.error('Error loading followers:', error);
    }
}

// Create user card
function createUserCard(user, isFollowing) {
    return `
        <div class="crew-card">
            ${renderAvatar(user, 'user-img')}
            <h3>${user.name}</h3>
            <p class="role">${user.role || 'Film Professional'}</p>
            <p class="location">${user.location || 'Location not specified'}</p>
            
            <div class="stats">
                <div class="stat">
                    <span class="stat-value">${user.followers || 0}</span>
                    <span class="stat-label">Followers</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${user.following || 0}</span>
                    <span class="stat-label">Following</span>
                </div>
            </div>

            <div class="actions">
                <button class="btn-profile" onclick="viewProfile(${user.id})">Profile</button>
                ${isFollowing ? 
                    `<button class="btn-following" disabled>Following</button>` :
                    `<button class="btn-follow" id="follow-btn-${user.id}" onclick="followUser(${user.id})">Follow</button>`
                }
            </div>
        </div>
    `;
}

// View profile
function viewProfile(userId) {
    window.location.href = `profile.html?userId=${userId}`;
}

// Follow user
async function followUser(userId) {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;
    
    // Change UI state immediately (optimistic update)
    const btn = document.getElementById(`follow-btn-${userId}`);
    if (btn) {
        btn.innerText = 'Following';
        btn.classList.remove('btn-follow');
        btn.classList.add('btn-following');
        btn.disabled = true;
        btn.onclick = null;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/follow?followerId=${currentUserId}`, {
            method: 'POST'
        });

        if (response.ok) {
            showMessage('User followed successfully!', 'success');
            await loadFollowingIds(); // Update local set
            // No need to full reload unless we want to update stats counts
            // loadAllUsers(); 
        } else {
            // Revert on error
            if (btn) {
                btn.innerText = 'Follow';
                btn.classList.add('btn-follow');
                btn.classList.remove('btn-following');
                btn.onclick = () => followUser(userId);
                btn.onmouseover = null;
                btn.onmouseout = null;
            }
            showMessage('Could not follow user', 'error');
        }
    } catch (error) {
        showMessage('Error following user', 'error');
    }
}

// Unfollow user
async function unfollowUser(userId) {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/unfollow?followerId=${currentUserId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showMessage('Unfollowed successfully', 'success');
            await loadFollowingIds();
            if (currentSearchTab === 'connections') {
                loadFollowing();
            } else {
                loadAllUsers();
            }
        }
    } catch (error) {
        showMessage('Error unfollowing user', 'error');
    }
}
