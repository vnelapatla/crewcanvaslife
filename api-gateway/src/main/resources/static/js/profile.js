// Profile page functionality
let profileUserId = null;
let currentUserId = null;
let currentTab = 'posts';

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    profileUserId = getQueryParam('userId') || currentUserId;

    await loadProfile();
    loadUserPosts();
});

// Load profile data
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${profileUserId}`);
        if (response.ok) {
            const user = await response.json();
            displayProfile(user);
        } else {
            showMessage('Profile not found', 'error');
            window.location.href = 'home.html';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showMessage('Error loading profile', 'error');
    }
}

// Display profile data
function displayProfile(user) {
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileRole').textContent = (user.role || 'director').toLowerCase();
    document.getElementById('profileLocation').textContent = (user.location || 'HYDERABAD').toUpperCase();
    document.getElementById('profileEmail').textContent = (user.email || 'user@gmail.com').toUpperCase();
    
    // Set Phone
    const phoneValue = document.querySelector('.contact-box .value#profilePhone');
    if (phoneValue) {
        phoneValue.textContent = user.phone || '9951020428';
    }

    // Set images
    const avatarContainer = document.getElementById('profileAvatarContainer');
    if (avatarContainer) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        if (user.profileImage) {
            avatarContainer.innerHTML = `<img src="${user.profileImage}" alt="${user.name}">`;
        } else {
            avatarContainer.innerHTML = `<div id="profileAvatarInitial" class="avatar-fallback-large">${initials.substring(0, 1)}</div>`;
        }
    }

    // Update Header Navigation
    const headerName = document.getElementById('userNameHeader');
    if (headerName) headerName.textContent = user.name.toLowerCase();
    
    const headerAvatar = document.getElementById('userAvatarSmall');
    if (headerAvatar) {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        if (user.profileImage) {
            headerAvatar.innerHTML = `<img src="${user.profileImage}" alt="">`;
        } else {
            headerAvatar.innerHTML = `<span id="userInitialsSmall">${initials.substring(0, 2)}</span>`;
        }
    }

    // Set stats
    const postsCount = document.getElementById('postsCount');
    if (postsCount) postsCount.textContent = user.posts || 0;
    
    const followersCount = document.getElementById('followersCount');
    if (followersCount) followersCount.textContent = user.followers || 0;
}

// Handle follow/unfollow
async function handleAction() {
    const actionButton = document.getElementById('actionButton');
    if (!actionButton) return;
    const isFollowing = actionButton.textContent === 'Unfollow';

    try {
        const url = `${API_BASE_URL}/api/profile/${profileUserId}/${isFollowing ? 'unfollow' : 'follow'}?followerId=${currentUserId}`;
        const response = await fetch(url, {
            method: isFollowing ? 'DELETE' : 'POST'
        });

        if (response.ok) {
            actionButton.textContent = isFollowing ? 'Follow' : 'Unfollow';
            showMessage(isFollowing ? 'Unfollowed successfully' : 'Following!', 'success');
            loadProfile(); // Reload to update follower count
        }
    } catch (error) {
        console.error('Error:', error);
        showMessage('Error updating follow status', 'error');
    }
}

// Send message
function sendMessage() {
    window.location.href = `messages.html?userId=${profileUserId}`;
}

// Load user posts
async function loadUserPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${profileUserId}`);
        const posts = await response.json();

        const postsCount = document.getElementById('postsCount');
        if (postsCount) postsCount.textContent = posts.length;

        const container = document.getElementById('userPosts');
        if (posts.length === 0) {
            container.innerHTML = '<p class="no-data" style="grid-column: 1/-1; text-align: center; color: #aaa; margin-top: 40px;">No projects yet</p>';
            return;
        }

        const currentRole = document.getElementById('profileRole').textContent;

        container.innerHTML = posts.map(post => `
            <div class="project-card-advanced" onclick="viewPost(${post.id})">
                <div class="project-thumb">
                    <img src="${post.imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1000'}" alt="Project">
                </div>
                <div class="project-meta">
                    <h3>${post.content.substring(0, 15)}${post.content.length > 15 ? '...' : ''}</h3>
                    <p class="role-text">| ${currentRole}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function viewPost(postId) {
    // Placeholder for viewing post details
    console.log('Viewing post:', postId);
}

// Load user projects
async function loadUserProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/user/${profileUserId}`);
        const projects = await response.json();

        document.getElementById('projectsCount').textContent = projects.length;

        const container = document.getElementById('userProjects');
        if (projects.length === 0) {
            container.innerHTML = '<p class="no-data">No projects yet</p>';
            return;
        }

        container.innerHTML = projects.map(project => `
            <div class="project-card">
                ${project.imageUrl ? `<img src="${project.imageUrl}" alt="${project.title}">` : ''}
                <div class="project-info">
                    <h4>${project.title}</h4>
                    <p><strong>Role:</strong> ${project.role || 'N/A'}</p>
                    <p><strong>Year:</strong> ${project.year || 'N/A'}</p>
                    <p>${truncateText(project.description || '', 100)}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

// Show add project modal
function showAddProject() {
    showMessage('Add project functionality coming soon!', 'info');
}
