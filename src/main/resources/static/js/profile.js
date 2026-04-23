// Profile page functionality
let profileUserId = null;
let currentUserId = null;
let profileUserData = null; 

document.addEventListener('DOMContentLoaded', async () => {
    try {
        checkAuth();
        currentUserId = getCurrentUserId();
        profileUserId = getQueryParam('userId') || currentUserId;

        if (!profileUserId) {
            window.location.href = 'home.html';
            return;
        }

        // --- OPTIMIZATION: Immediate UI update from cache if this is the current user ---
        if (profileUserId === currentUserId) {
            const cachedName = localStorage.getItem('userName');
            const cachedAvatar = localStorage.getItem('userAvatar');
            if (cachedName) {
                displayProfile({ 
                    name: cachedName, 
                    profilePicture: cachedAvatar,
                    bio: 'Loading fresh data...',
                    location: '...',
                    experience: '...'
                });
            }
        }

        // Load all data in parallel for "reactive fast" performance
        Promise.all([
            loadProfile(),
            loadUserProjects(),
            loadUserPosts(),
            loadFollowers()
        ]).catch(err => {
            console.error("Profile parallel load error:", err);
            showMessage("Some data failed to load. Please refresh.", "info");
        });
    } catch (globalError) {
        console.error("Critical Profile Init Error:", globalError);
    }
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
    document.getElementById('profileBio').textContent = user.bio || 'Add a short bio about yourself and your film industry experience.';
    document.getElementById('profileLocation').textContent = user.location || 'Unknown';
    document.getElementById('profileExperience').textContent = user.experience || 'Junior';
    document.getElementById('profileEmail').textContent = user.email || 'Data Not Available';
    document.getElementById('profilePhone').textContent = user.phone || 'Data Not Available';

    const avatarContainer = document.getElementById('profileAvatarContainer');
    if (avatarContainer) {
        avatarContainer.innerHTML = renderAvatar(user, 'main-avatar', '180px');
    }

    // Skills
    const skillsContainer = document.getElementById('skillsContainer');
    const skillCountEl = document.getElementById('skillCount');
    if (user.skills && user.skills.trim() !== '') {
        const skillsArr = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
        skillsContainer.innerHTML = skillsArr.map(s => `<span class="skill-tag">${s}</span>`).join('');
        skillCountEl.textContent = skillsArr.length;
    } else {
        skillsContainer.innerHTML = '<span class="text-muted" style="font-size: 13px;">Data Not Available</span>';
        skillCountEl.textContent = '0';
    }

    // Social Links
    const socialLinks = document.getElementById('socialLinks');
    const platforms = [
        { key: 'instagram', icon: 'fa-brands fa-instagram', color: '#e4405f' },
        { key: 'youtube', icon: 'fa-brands fa-youtube', color: '#ff0000' },
        { key: 'tiktok', icon: 'fa-brands fa-tiktok', color: '#000' },
        { key: 'twitter', icon: 'fa-brands fa-x-twitter', color: '#000' }
    ];

    const activePlatforms = platforms.filter(p => user[p.key]);
    if (activePlatforms.length > 0) {
        socialLinks.innerHTML = activePlatforms
            .map(p => `<a href="${user[p.key]}" target="_blank" style="color: ${p.color}; font-size: 24px;"><i class="${p.icon}"></i></a>`)
            .join('');
    } else {
        socialLinks.innerHTML = '<span class="text-muted" style="font-size: 13px;">Data Not Available</span>';
    }

    // Populate Hidden Private Fields
    const budgetMovie = document.getElementById('profileBudgetMovie');
    const budgetWeb = document.getElementById('profileBudgetWeb');
    const availFrom = document.getElementById('profileAvailFrom');
    const availTo = document.getElementById('profileAvailTo');

    if (availFrom) availFrom.textContent = user.availabilityFrom || 'Data Not Available';
    if (availTo) availTo.textContent = user.availabilityTo || 'Data Not Available';

    // Profile Strength Score
    const strengthBox = document.getElementById('profileStrengthBox');
    const strengthText = document.getElementById('strengthText');
    const strengthBar = document.getElementById('strengthBar');
    
    if (strengthBox && strengthText && strengthBar) {
        strengthBox.style.display = 'block';
        const score = user.profileScore !== undefined ? user.profileScore : calculateProfileScore(user);
        strengthText.textContent = `${score}%`;
        
        // Timeout to allow the progress bar animation to trigger
        setTimeout(() => {
            strengthBar.style.width = `${score}%`;
        }, 100);
    }

    // Dynamic Craft Specifications
    displayCraftSpecs(user);
}

function displayCraftSpecs(user) {
    const container = document.getElementById('craftSpecsContainer');
    const card = document.getElementById('craftSpecsCard');
    if (!container || !card) return;

    const role = user.role || '';
    
    if (!role) {
        card.style.display = 'none';
        return;
    }

    const craftMapping = {
        'Director': [
            { label: 'Genres', key: 'genres' },
            { label: 'Projects Directed', key: 'projectsDirected' },
            { label: 'Budget Handled', key: 'budgetHandled' },
            { label: 'Team Size', key: 'teamSize' },
            { label: 'Showreel', key: 'showreel', isLink: true },
            { label: 'Vision Statement', key: 'visionStatement' }
        ],
        'Actor': [
            { label: 'Height (cm)', key: 'height' },
            { label: 'Weight (kg)', key: 'weight' },
            { label: 'Age Range', key: 'ageRange' },
            { label: 'Gender', key: 'gender' },
            { label: 'Body Type', key: 'bodyType' },
            { label: 'Languages', key: 'languages' }
        ],
        'Editor': [
            { label: 'Software', key: 'editingSoftware' },
            { label: 'Style', key: 'editingStyle' },
            { label: 'Portfolio', key: 'portfolioVideos', isLink: true },
            { label: 'Turnaround', key: 'turnaroundTime' },
            { label: 'Details', key: 'experienceDetails' }
        ],
        'Music Director': [
            { label: 'DAWs', key: 'daws' },
            { label: 'Instruments', key: 'instruments' },
            { label: 'Sample Tracks', key: 'sampleTracks', isLink: true },
            { label: 'Experience', key: 'musicExperience' }
        ],
        'DOP': [
            { label: 'Camera Expertise', key: 'cameraExpertise' },
            { label: 'Showreel', key: 'showreel', isLink: true }
        ]
    };

    let fields = [];
    for (const [key, val] of Object.entries(craftMapping)) {
        if (role.toLowerCase().includes(key.toLowerCase())) {
            fields = val;
            break;
        }
    }

    const activeFields = fields.filter(f => user[f.key]);

    if (activeFields.length > 0) {
        card.style.display = 'block';
        container.innerHTML = activeFields.map(f => `
            <div class="data-row">
                <span class="label">${f.label}</span>
                <span class="value">${f.isLink ? `<a href="${user[f.key]}" target="_blank" style="color:var(--primary-orange); text-decoration:none;">View <i class="fa-solid fa-external-link" style="font-size:10px;"></i></a>` : user[f.key]}</span>
            </div>
        `).join('');
    } else {
        card.style.display = 'none';
    }
}

async function loadUserProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/user/${profileUserId}`);
        if (response.ok) {
            const projects = await response.json();
            document.getElementById('projectCount').textContent = projects.length;
            const grid = document.getElementById('projectsGrid');
            
            if (!projects || projects.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">No projects.</div>';
                return;
            }

            grid.innerHTML = projects.map(p => `
                <div class="project-item">
                    <img src="${p.imageUrl || 'https://via.placeholder.com/200x300?text=No+Poster'}" alt="${p.title}" loading="lazy">
                    <div class="project-meta">
                        <h4>${p.title}</h4>
                        <p>${p.role} • ${p.year || ''}</p>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadUserPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${profileUserId}`);
        if (response.ok) {
            const posts = await response.json();
            const postCountEl = document.getElementById('postCount');
            if (postCountEl) postCountEl.textContent = posts.length;
            
            const container = document.getElementById('postsContent');
            
            if (!posts || posts.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-muted); font-size:12px;">No posts yet.</div>';
                return;
            }

            container.innerHTML = posts.map(post => renderPostHTML(post)).join('');
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function renderPostHTML(post) {
    let images = [];
    if (post.imageUrls && post.imageUrls.length > 0) {
        images = post.imageUrls;
    } else if (post.imageUrl) {
        images = post.imageUrl.split(',');
    }

    let mediaHtml = '';
    if (images.length === 1) {
        mediaHtml = `<img src="${images[0]}" class="post-image" alt="Post content" loading="lazy">`;
    } else if (images.length > 1) {
        mediaHtml = `
            <div class="post-slider-container">
                <div id="slider-${post.id}" class="post-slider" onscroll="updateSliderDots(${post.id})">
                    ${images.map(img => `
                        <div class="post-slider-item">
                            <img src="${img}" alt="Post content" loading="lazy">
                        </div>
                    `).join('')}
                </div>
                <button class="slider-nav-btn prev" onclick="moveSlider(${post.id}, -1)">❮</button>
                <button class="slider-nav-btn next" onclick="moveSlider(${post.id}, 1)">❯</button>
                <div class="slider-dots" id="dots-${post.id}">
                    ${images.map((_, i) => `<span class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
                </div>
            </div>
        `;
    }
    
    const link = (post.externalLinks && post.externalLinks.length > 0) ? post.externalLinks[0] : post.externalLink;
    
    let pollHtml = '';
    if (post.isPoll) {
        const votes = post.pollVotes || {};
        const totalVotes = Object.keys(votes).length;
        const optionVotes = {};
        if (post.pollOptions) {
            post.pollOptions.forEach((_, i) => optionVotes[i] = 0);
            Object.values(votes).forEach(optIdx => {
                if (optionVotes[optIdx] !== undefined) optionVotes[optIdx]++;
            });
        }

        const userVotedOption = votes[currentUserId];

        pollHtml = `
            <div class="poll-container">
                <h4 class="poll-question">${post.pollQuestion}</h4>
                <div class="poll-options">
                    ${(post.pollOptions || []).map((opt, i) => {
                        const count = optionVotes[i] || 0;
                        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const isSelected = userVotedOption === i;
                        return `
                            <div class="poll-option ${isSelected ? 'selected' : ''}" onclick="votePoll(${post.id}, ${i})">
                                <div class="poll-progress" style="width: ${percent}%"></div>
                                <div class="poll-option-content">
                                    <span class="poll-option-text">${opt}</span>
                                    <span class="poll-percent">${percent}%</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="poll-stats">
                    <i class="fa-solid fa-users-viewfinder"></i> ${totalVotes} votes
                </div>
            </div>
        `;
    }

    return `
    <div class="post-card" data-post-id="${post.id}">
        <div class="post-header">
            <div class="post-user-info">
                ${renderAvatar(profileUserData || { name: 'User' }, 'post-avatar', '40px')}
                <div>
                    <h4 style="margin:0; font-size:14px; color:#fff;">${profileUserData?.name || 'User'}</h4>
                    <span style="font-size:11px; color:#888;">${formatDate(post.createdAt)}</span>
                </div>
            </div>
            ${post.userId == currentUserId ? `
                <div class="post-actions-menu">
                    <button onclick="editPost(${post.id}, '${(post.content || "").replace(/'/g, "\\'")}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deletePost(${post.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            ` : ''}
        </div>
        <div class="post-content">
            ${post.content ? `<p>${post.content}</p>` : ''}
            ${pollHtml}
            ${link ? `<a href="${link}" target="_blank" style="color:var(--primary-orange); text-decoration:none; font-size:12px; display:block; margin-bottom:10px;">🔗 ${link}</a>` : ''}
            ${mediaHtml}
        </div>
        <div class="post-footer">
            <button class="post-action-btn ${post.likedByUsers && post.likedByUsers.includes(parseInt(currentUserId)) ? 'liked' : ''}" onclick="likePost(${post.id})">
                <i class="fa-solid fa-heart"></i> <span id="likes-count-${post.id}">${post.likes || 0}</span>
            </button>
            <button class="post-action-btn" onclick="toggleCommentBox(${post.id})">
                <i class="fa-solid fa-comment"></i> <span>${post.commentsCount || 0}</span>
            </button>
        </div>
        
        <div id="comment-box-${post.id}" style="display:none; padding:15px; border-top:1px solid var(--border-dim); margin-top:15px;">
            <div id="comments-list-${post.id}" style="margin-bottom:10px; max-height: 150px; overflow-y: auto;">
                ${post.actualComments && post.actualComments.length > 0 
                    ? post.actualComments.map(c => `<div style="font-size:12px; margin-bottom:8px; color:#ccc; padding:8px; background:rgba(255,255,255,0.03); border-radius:6px;">${c}</div>`).join('') 
                    : '<div style="font-size:11px; color:#666;">No comments yet.</div>'}
            </div>
            <div style="display:flex; gap:8px;">
                <input type="text" id="comment-input-${post.id}" placeholder="Write a comment..." style="flex:1; background:#000; border:1px solid var(--border-dim); border-radius:6px; padding:8px; color:#fff; font-size:12px;">
                <button onclick="commentPost(${post.id})" style="background:var(--primary-orange); border:none; color:#fff; border-radius:6px; padding:0 12px; cursor:pointer; font-size:12px;">Post</button>
            </div>
        </div>
    </div>
    `;
}

// Post Action Functions
async function deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}?userId=${currentUserId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showMessage('Post deleted');
            loadUserPosts();
        }
    } catch (e) { console.error(e); }
}

async function editPost(postId, currentContent) {
    const newContent = prompt("Edit your post:", currentContent);
    if (newContent !== null && newContent.trim() !== "") {
        try {
            const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newContent.trim() })
            });
            if (response.ok) {
                showMessage('Post updated!');
                loadUserPosts();
            }
        } catch (e) { console.error(e); }
    }
}

async function likePost(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId })
        });
        if (response.ok) {
            const updatedPost = await response.json();
            const likesCount = document.getElementById(`likes-count-${postId}`);
            if (likesCount) {
                likesCount.textContent = updatedPost.likes;
                likesCount.parentElement.classList.toggle('liked', updatedPost.likedByUsers.includes(parseInt(currentUserId)));
            }
        }
    } catch (e) { console.error(e); }
}

function toggleCommentBox(postId) {
    const box = document.getElementById(`comment-box-${postId}`);
    if (box) box.style.display = box.style.display === 'none' ? 'block' : 'none';
}

async function commentPost(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input ? input.value.trim() : "";
    if (!text) return;

    try {
        const userRes = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
        let userName = "A User";
        if (userRes.ok) {
            const profile = await userRes.json();
            userName = profile.name || userName;
        }

        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: `**${userName}**: ${text}` })
        });
        if (response.ok) {
            showMessage('Comment added!');
            input.value = '';
            loadUserPosts();
        }
    } catch (e) { console.error(e); }
}

function moveSlider(postId, direction) {
    const slider = document.getElementById(`slider-${postId}`);
    if (slider) slider.scrollBy({ left: direction * slider.offsetWidth, behavior: 'smooth' });
}

function updateSliderDots(postId) {
    const slider = document.getElementById(`slider-${postId}`);
    const dotsContainer = document.getElementById(`dots-${postId}`);
    if (slider && dotsContainer) {
        const index = Math.round(slider.scrollLeft / slider.offsetWidth);
        dotsContainer.querySelectorAll('.slider-dot').forEach((dot, i) => dot.classList.toggle('active', i === index));
    }
}

async function votePoll(postId, optionIndex) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUserId, optionIndex: optionIndex })
        });
        if (response.ok) loadUserPosts();
    } catch (e) { console.error(e); }
}

async function loadFollowers() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${profileUserId}/followers`);
        if (response.ok) {
            const followers = await response.json();
            document.getElementById('followerCount').textContent = followers.length;
        }
    } catch (error) {
        console.error('Error loading followers:', error);
    }
}

function unlockPrivateInfo() {
    const code = document.getElementById('unlockCodeInput').value.trim();
    if (code.toUpperCase() === 'FREE') {
        document.getElementById('privateLockedState').style.display = 'none';
        document.getElementById('privateUnlockedState').style.display = 'block';
        showMessage('Private information unlocked!', 'success');
    } else {
        alert('Invalid access code.');
    }
}
