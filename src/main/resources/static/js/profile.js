// Profile page functionality
let profileUserId = null;
let currentUserId = null;
let profileUserData = null; 

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
});

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
        console.error('Error:', error);
    }
}

function displayProfile(user) {
    if (!user) return;
    
    document.getElementById('profileName').textContent = user.name || 'Anonymous User';
    document.getElementById('profileRoleBadge').textContent = user.role || 'Film Professional';
    document.getElementById('profileBio').textContent = user.bio || 'No bio added yet.';
    document.getElementById('profileLocation').textContent = user.location || 'Unknown';
    document.getElementById('profileExperience').textContent = user.experience || 'Professional';
    document.getElementById('profileEmail').textContent = user.email || 'Not shared';
    document.getElementById('profilePhone').textContent = user.phone || 'Not provided';
    document.getElementById('profileImage').src = user.profilePicture || 'https://via.placeholder.com/180';

    // Skills
    const skillsContainer = document.getElementById('skillsContainer');
    if (user.skills) {
        const skillsArr = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
        skillsContainer.innerHTML = skillsArr.map(s => `<span class="role-pill">${s}</span>`).join('');
    }

    // Craft Specific Details (RESTORED)
    const craftContainer = document.getElementById('craftDetailsContainer');
    let craftHtml = '';
    const role = (user.role || '').toLowerCase();

    if (role.includes('director')) {
        craftHtml += `<div class="info-item"><span class="label">Genres</span><span class="value">${user.genres || 'Not Specified'}</span></div>`;
        craftHtml += `<div class="info-item"><span class="label">Projects</span><span class="value">${user.projectsDirected || '0'}</span></div>`;
        craftHtml += `<div class="info-item"><span class="label">Budget Handled</span><span class="value">${user.budgetHandled || 'Not Specified'}</span></div>`;
    } else if (role.includes('editor')) {
        craftHtml += `<div class="info-item"><span class="label">Software</span><span class="value">${user.editingSoftware || 'Not Specified'}</span></div>`;
        craftHtml += `<div class="info-item"><span class="label">Portfolio</span><span class="value">${user.portfolioVideos ? `<a href="${user.portfolioVideos}" target="_blank">View</a>` : 'None'}</span></div>`;
    }
    
    craftContainer.innerHTML = craftHtml || '<p style="color:#888; font-size:12px;">No extra details provided.</p>';

    // Social Links (RESTORED)
    const socialLinks = document.getElementById('socialLinks');
    const platforms = [
        { key: 'instagram', icon: 'fa-brands fa-instagram', color: '#e4405f' },
        { key: 'youtube', icon: 'fa-brands fa-youtube', color: '#ff0000' },
        { key: 'tiktok', icon: 'fa-brands fa-tiktok', color: '#000' },
        { key: 'twitter', icon: 'fa-brands fa-x-twitter', color: '#000' }
    ];

    socialLinks.innerHTML = platforms
        .filter(p => user[p.key])
        .map(p => `<a href="${user[p.key]}" target="_blank" style="color: ${p.color}; font-size: 24px;"><i class="${p.icon}"></i></a>`)
        .join('') || '<span style="color:#888; font-size:12px;">No social links</span>';

    // Action Button
    const actionBtn = document.getElementById('actionButton');
    if (String(profileUserId) === String(currentUserId)) {
        actionBtn.textContent = 'Edit Profile';
        actionBtn.onclick = () => window.location.href = 'edit-profile.html';
    } else {
        actionBtn.textContent = 'Follow';
    }
}

async function loadUserPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${profileUserId}`);
        const posts = await response.json();
        const container = document.getElementById('postsContent');
        if (posts.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:30px; color:#888;">No activity yet.</div>';
            return;
        }
        container.innerHTML = posts.map(post => `
            <div class="post-card legacy-post-style" style="margin-bottom: 20px; padding: 25px;">
                <p style="color: #fff; font-size: 15px; line-height:1.6;">${post.content}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" style="width: 100%; border-radius: 12px; margin-top: 15px;">` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('projectsContent').style.display = tab === 'projects' ? 'block' : 'none';
    document.getElementById('postsContent').style.display = tab === 'posts' ? 'block' : 'none';
}
