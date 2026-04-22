// Profile page functionality
let profileUserId = null;
let currentUserId = null;
let profileUserData = null; 
let currentTab = 'posts';

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    profileUserId = getQueryParam('userId') || currentUserId;

    if (!profileUserId) {
        window.location.href = 'home.html';
        return;
    }

    await loadProfile();
    loadUserPosts();
    loadUserProjects();
});

// Load profile data
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${profileUserId}`);
        if (response.ok) {
            profileUserData = await response.json();
            displayProfile(profileUserData);
        } else {
            window.location.href = 'home.html';
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Display profile data
function displayProfile(user) {
    if (!user) return;
    
    // Set Profile Identity
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = user.name || 'Anonymous User';
    
    const roleBadge = document.getElementById('profileRoleBadge');
    if (roleBadge) roleBadge.textContent = user.role || 'Film Professional';

    const bioEl = document.getElementById('profileBio');
    if (bioEl) bioEl.textContent = user.bio || 'No bio added yet.';
    
    const emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = user.email || 'Not Provided';
    
    const locationEl = document.getElementById('profileLocation');
    if (locationEl) locationEl.textContent = (user.location || 'Not Specified').toUpperCase();

    const imgEl = document.getElementById('profileImage');
    if (imgEl) imgEl.src = user.profilePicture || 'https://via.placeholder.com/180';

    const expEl = document.getElementById('profileExperience');
    if (expEl) expEl.textContent = user.experience || 'Professional';

    // Render Skills Tags
    const skillsContainer = document.getElementById('skillsContainer');
    if (skillsContainer) {
        if (user.skills && user.skills.trim() !== '') {
            const skillsArr = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
            skillsContainer.innerHTML = skillsArr.map(s => `
                <span class="role-pill" style="background: #f1f5f9; color: #334155; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${s}</span>
            `).join('');
        } else {
            skillsContainer.innerHTML = '<span style="color: #94a3b8; font-size: 13px; font-style: italic;">No skills added yet</span>';
        }
    }

    // Basic Stats
    const followersEl = document.getElementById('followerCount');
    if (followersEl) followersEl.textContent = user.followers || '0';
    
    const followingEl = document.getElementById('followingCount');
    if (followingEl) followingEl.textContent = user.following || '0';

    // Action Button
    const actionBtn = document.getElementById('actionButton');
    const isOwnProfile = String(profileUserId) === String(currentUserId);
    
    if (actionBtn) {
        if (isOwnProfile) {
            actionBtn.textContent = 'Edit Profile';
            actionBtn.onclick = () => window.location.href = 'edit-profile.html';
        } else {
            actionBtn.textContent = 'Follow';
            // Follow logic would go here
        }
    }
}

// Load user posts
async function loadUserPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${profileUserId}`);
        const posts = await response.json();
        const container = document.getElementById('postsContent');
        if (!container) return;
        
        if (posts.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:30px; color:#888;">No posts yet.</div>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post-card legacy-post-style" style="margin-bottom: 20px; padding: 20px;">
                <p style="color: #fff;">${post.content}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" style="width: 100%; border-radius: 12px; margin-top: 10px;">` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Load user projects
async function loadUserProjects() {
    const container = document.getElementById('projectsContent');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/user/${profileUserId}`);
        const projects = await response.json();
        
        if (projects.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:30px; color:#888;">No projects yet.</div>';
            return;
        }

        container.innerHTML = projects.map(p => `
            <div class="post-card legacy-post-style" style="margin-bottom: 20px; padding: 20px;">
                <h4 style="color: #fff; margin: 0;">${p.title}</h4>
                <p style="color: #888; font-size: 13px;">${p.role} • ${p.year}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('projectsContent').style.display = tab === 'projects' ? 'block' : 'none';
    document.getElementById('postsContent').style.display = tab === 'posts' ? 'block' : 'none';
}
