// Crew Search functionality
let allUsers = [];
let followingIds = new Set();
let currentSearchTab = 'find';

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadFollowingIds();
    loadAllUsers();
});

// Load IDs of people the current user follows
async function loadFollowingIds() {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/following`);
        const users = await response.json();
        followingIds = new Set(users.map(u => u.id));
        // Update badge
        const badge = document.getElementById('myConnectionsCount');
        if (badge) badge.innerText = users.length;
    } catch (error) {
        console.error('Error loading following IDs:', error);
    }
}

// Load all users
async function loadAllUsers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/search?query=`);
        allUsers = await response.json();
        
        const currentUserId = getCurrentUserId();
        const filteredUsers = allUsers.filter(u => u.id != currentUserId);
        
        // Update the badge count
        document.getElementById('totalCrewCount').innerText = filteredUsers.length;
        
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
    const query = queryInput.value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/search?query=${query}`);
        const users = await response.json();
        const currentUserId = getCurrentUserId();
        const filteredUsers = users.filter(u => u.id != currentUserId);

        if (currentSearchTab === 'find') {
            displayUsers(filteredUsers);
        }
    } catch (error) {
        console.error('Error searching users:', error);
    }
}, 500);

// Display users
function displayUsers(users) {
    const container = document.getElementById('searchResults');
    const currentUserId = getCurrentUserId();

    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <h2 style="font-size: 20px; color: var(--text-dark);">No crew found</h2>
                <p style="color: var(--text-muted);">Try a different search term or category.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = users.filter(u => u.id != currentUserId).map(user => {
        const isFollowing = followingIds.has(user.id);
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
        loadAllUsers();
    } else {
        document.getElementById('connectionsCard').classList.add('active');
        document.getElementById('searchInput').placeholder = "Search people you follow...";
        loadFollowing();
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
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/following`);
        const users = await response.json();

        // Update badge
        document.getElementById('myConnectionsCount').innerText = users.length;

        const container = document.getElementById('searchResults');
        if (users.length === 0 && currentSearchTab === 'connections') {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h2 style="font-size: 20px; color: var(--text-dark);">Not following anyone</h2>
                    <p style="color: var(--text-muted);">Go to 'Find Crew' to grow your network.</p>
                </div>
            `;
            return;
        }

        if (currentSearchTab === 'connections') {
            container.innerHTML = users.map(user => createUserCard(user, true)).join('');
        }
    } catch (error) {
        console.error('Error loading following:', error);
    }
}

// Load followers
async function loadFollowers() {
    const userId = getCurrentUserId();
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/followers`);
        const users = await response.json();

        const container = document.getElementById('searchResults');
        if (users.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h2 style="font-size: 20px; color: var(--text-dark);">No followers yet</h2>
                    <p style="color: var(--text-muted);">Post updates and connect with others to get followers.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(user => createUserCard(user, false)).join('');
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
                    `<button class="btn-following" onclick="unfollowUser(${user.id})" onmouseover="this.innerText='Unfollow'" onmouseout="this.innerText='Following'">Following</button>` :
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
        btn.onclick = () => unfollowUser(userId);
        // Set hover effect
        btn.onmouseover = () => btn.innerText = 'Unfollow';
        btn.onmouseout = () => btn.innerText = 'Following';
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
