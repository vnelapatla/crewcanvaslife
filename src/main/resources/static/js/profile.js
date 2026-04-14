// Profile page functionality
let profileUserId = null;
let currentUserId = null;
let profileUserData = null; // Global store for the loaded user
let currentTab = 'posts';

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    profileUserId = getQueryParam('userId') || currentUserId;

    await loadProfile();
    loadUserPosts();
    loadUserProjects(); // Added to populate the movies split
});

// Load profile data
async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${profileUserId}`);
        if (response.ok) {
            profileUserData = await response.json();
            displayProfile(profileUserData);
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
    if (!user) return;
    
    // Set Profile Identity
    const nameEl = document.getElementById('profileName');
    if (nameEl) nameEl.textContent = user.name || 'Anonymous User';
    
    const roleBadge = document.getElementById('profileRoleBadge');
    if (roleBadge) roleBadge.textContent = user.role || 'Film Professional';
    
    // Set Profile Info Card fields
    const emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = user.email || 'Not Provided';
    
    const phoneEl = document.getElementById('profilePhone');
    if (phoneEl) phoneEl.textContent = user.phone || 'Not Provided';
    
    const locationEl = document.getElementById('profileLocation');
    if (locationEl) locationEl.textContent = (user.location || 'Not Specified').toUpperCase();

    // Set Main Profile Image
    const avatarContainer = document.getElementById('profileAvatarContainer');
    if (avatarContainer) {
        if (user.profilePicture && user.profilePicture.length > 50) {
            avatarContainer.innerHTML = `<img src="${user.profilePicture}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            const initials = getAvatarFallback(user.name);
            avatarContainer.innerHTML = `<div class="avatar-fallback" style="font-size: 48px; font-weight: 800; color: #444;">${initials}</div>`;
        }
    }

    // Render Skills Tags
    const skillsContainer = document.getElementById('skillsContainer');
    if (skillsContainer) {
        if (user.skills) {
            const skillsArr = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
            if (skillsArr.length > 0) {
                skillsContainer.innerHTML = skillsArr.map(s => `<span class="empty-badge">${s}</span>`).join('');
            } else {
                skillsContainer.innerHTML = '<span class="empty-text">No skills added yet</span>';
            }
        } else {
            skillsContainer.innerHTML = '<span class="empty-text">No skills added yet</span>';
        }
    }

    // Render Social Links
    const socialContainer = document.getElementById('socialLinksContainer');
    if (socialContainer) {
        let socialHtml = '';
        if (user.linkedinProfile) socialHtml += `<a href="${user.linkedinProfile}" target="_blank" class="social-pill">LinkedIn</a>`;
        if (user.instagram) socialHtml += `<a href="${user.instagram}" target="_blank" class="social-pill">Instagram</a>`;
        if (user.personalWebsite) socialHtml += `<a href="${user.personalWebsite}" target="_blank" class="social-pill">Website</a>`;
        
        socialContainer.innerHTML = socialHtml || '<span class="empty-text">No social links added</span>';
    }

    // Update Stats Bar
    const followersEl = document.getElementById('countFollowers');
    if (followersEl) followersEl.textContent = user.followers || '0';
    
    const followingEl = document.getElementById('countFollowing');
    if (followingEl) followingEl.textContent = user.following || '0';

    // Update Tab Counts If Explicitly present
    const projectsCount = document.getElementById('projectsCount');
    if (projectsCount) projectsCount.textContent = user.projectsCount || '0';

    const skillsCount = document.getElementById('skillsCount');
    if (skillsCount && user.skills) {
        skillsCount.textContent = user.skills.split(',').filter(s => s.trim()).length;
    }

    // Update Header Navigation
    const headerName = document.getElementById('userNameHeader');
    if (headerName) headerName.textContent = user.name.toLowerCase();

    // Set Page Title & Banner Polish
    document.title = `${user.name} | CrewCanvas Profile`;
    const bannerBg = document.querySelector('.banner-bg-blurred');
    if (bannerBg && user.profilePicture) {
        bannerBg.style.backgroundImage = `url('${user.profilePicture}')`;
        bannerBg.style.backgroundSize = 'cover';
        bannerBg.style.backgroundPosition = 'center';
        bannerBg.style.filter = 'blur(40px) brightness(0.4)';
    }

    // Notify ProfileHandler for global sync
    if (user.id == getCurrentUserId() && typeof ProfileHandler !== 'undefined') {
        ProfileHandler.user = user;
        ProfileHandler.updateGlobalHeader();
    }
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

        const postsCountEl = document.getElementById('postsCount');
        if (postsCountEl) postsCountEl.textContent = posts.length;

        const container = document.getElementById('postsContent');
        if (posts.length === 0) {
            // Keep the placeholder shown in HTML
            return;
        }

        container.innerHTML = posts.map(post => {
            // Handle both legacy string arrays and new List format
            let images = [];
            if (post.imageUrls && post.imageUrls.length > 0) {
                images = post.imageUrls;
            } else if (post.imageUrl) {
                images = post.imageUrl.split(',');
            }

            let mediaHtml = '';
            if (images.length === 1) {
                mediaHtml = `<div class="post-media-wrap"><img src="${images[0]}" class="post-img-fluid" alt="Post content"></div>`;
            } else if (images.length > 1) {
                mediaHtml = `
                    <div class="post-slider-container">
                        <div id="slider-${post.id}" class="post-slider" onscroll="updateSliderDots(${post.id})">
                            ${images.map(img => `<div class="post-slider-item"><img src="${img}" alt="Post content"></div>`).join('')}
                        </div>
                        <button class="slider-nav-btn prev" onclick="moveSlider(${post.id}, -1)">❮</button>
                        <button class="slider-nav-btn next" onclick="moveSlider(${post.id}, 1)">❯</button>
                        <div class="slider-dots" id="dots-${post.id}">
                            ${images.map((_, i) => `<span class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
                        </div>
                    </div>
                `;
            }

            return `
            <div class="post-card legacy-post-style" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="user-info">
                        <div class="mini-avatar">${(profileUserData?.name || 'U')[0]}</div>
                        <div>
                            <h4 class="user-name">${profileUserData?.name || 'Creative'}</h4>
                            <span class="post-date">SHARED POST</span>
                        </div>
                    </div>
                </div>
                <div class="post-body">
                    <p class="post-text">${post.content}</p>
                    ${mediaHtml}
                </div>
                <div class="post-footer">
                    <button class="footer-btn">❤️ ${post.likes || 0}</button>
                    <button class="footer-btn">💬 ${post.comments || 0}</button>
                </div>
            </div>
            `;
        }).join('');
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
    const container = document.getElementById('projectsContent');
    if (!container) return;

    try {
        const idToFetch = Number(profileUserId);
        console.log(`[ProjectLoader] Fetching projects for User ID: ${idToFetch}`);
        
        const response = await fetch(`${API_BASE_URL}/api/projects/user/${idToFetch}`);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const projects = await response.json();
        console.log(`[ProjectLoader] Received ${projects.length} projects:`, projects);

        const projectsCountEl = document.getElementById('projectsCount');
        if (projectsCountEl) projectsCountEl.textContent = projects.length;

        if (!projects || projects.length === 0) {
            console.log('[ProjectLoader] No projects found, keeping placeholder.');
            return;
        }

        // Clear the placeholder and render projects as full cards (similar to posts)
        container.innerHTML = projects.map(project => `
            <div class="post-card legacy-post-style project-card-v2">
                <div class="post-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <div class="user-info">
                        <div class="mini-avatar" style="background:#333; color:var(--orange-active);">🎬</div>
                        <div>
                            <h4 class="user-name">${project.title}</h4>
                            <span class="post-date">${project.year || 'Released'} • PORTFOLIO</span>
                        </div>
                    </div>
                </div>
                <div class="post-body" style="padding: 20px;">
                    <div class="project-role-banner" style="margin-bottom:15px;">
                        <span class="role-pill" style="font-size:12px; padding:6px 15px; background:rgba(255,138,0,0.15);">${(project.role || 'Professional').toUpperCase()}</span>
                    </div>
                    <p class="post-text" style="font-size:15px; line-height:1.6; color:#bbb;">${project.description || 'No project description provided.'}</p>
                    ${project.imageUrl ? `
                        <div class="post-media-wrap" style="margin-top:20px; border: 1px solid rgba(255,255,255,0.1);">
                            <img src="${project.imageUrl}" class="post-img-fluid" alt="${project.title}" style="max-height: 500px; object-fit: contain; width: 100%; background: #000;">
                        </div>
                    ` : ''}
                </div>
                <div class="post-footer" style="opacity:0.5; font-size:12px;">
                    <span style="padding-left:25px;">FILM PROJECT • PROJECT ID: ${project.id}</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('[ProjectLoader] Error:', error);
    }
}

// Show add project modal
function showAddProject() {
    showMessage('Add project functionality coming soon!', 'info');
}

// Post Slider Navigation
function moveSlider(postId, direction) {
    const slider = document.getElementById(`slider-${postId}`);
    if (slider) {
        const itemWidth = slider.offsetWidth;
        slider.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
        // The dots will update via scroll event or manual trigger
        setTimeout(() => updateSliderDots(postId), 350);
    }
}

function updateSliderDots(postId) {
    const slider = document.getElementById(`slider-${postId}`);
    const dotsContainer = document.getElementById(`dots-${postId}`);
    if (slider && dotsContainer) {
        const index = Math.round(slider.scrollLeft / slider.offsetWidth);
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
}
