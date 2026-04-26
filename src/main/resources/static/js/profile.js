// Profile page functionality
let profileUserId = null;
let currentUserId = null;
let profileUserData = null; 
let editingPostId = null;
let editingImages = [];

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
        refreshProfileData();
        setupEditImageUpload();
    } catch (globalError) {
        console.error("Critical Profile Init Error:", globalError);
    }
});

async function refreshProfileData() {
    return Promise.all([
        loadProfile(),
        loadUserProjects(),
        loadUserPosts(),
        loadFollowers(),
        loadFollowing()
    ]).catch(err => {
        console.error("Profile parallel load error:", err);
    });
}

async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${profileUserId}`);
        if (response.ok) {
            profileUserData = await response.json();
            
            // Ensure ProfileHandler is initialized before displaying
            if (typeof ProfileHandler !== 'undefined') {
                await ProfileHandler.init();
            }
            
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
    
    const statusEl = document.getElementById('profileStatus');
    if (statusEl) {
        const tier = (user.userType || 'Explorer').toUpperCase();
        if (user.isVerifiedProfessional) {
            statusEl.innerHTML = `${tier} <i class="fa-solid fa-circle-check" style="color:var(--primary-orange); margin-left:5px;" title="Verified Film Professional"></i>`;
            statusEl.style.color = 'var(--primary-orange)';
        } else {
            statusEl.textContent = tier;
            statusEl.style.color = 'var(--text-muted)';
        }
    }

    document.getElementById('profileBio').textContent = user.bio || 'Add a short bio about yourself and your film industry experience.';
    document.getElementById('profileLocation').textContent = user.location || 'Unknown';
    document.getElementById('profileExperience').textContent = user.experience || 'Junior';
    document.getElementById('profileEmail').textContent = user.email || 'Data Not Available';
    document.getElementById('profilePhone').textContent = user.phone || 'Data Not Available';
    
    // Followers & Following counts from user object
    if (document.getElementById('followerCount')) document.getElementById('followerCount').textContent = user.followers || 0;
    if (document.getElementById('followingCount')) document.getElementById('followingCount').textContent = user.following || 0;

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

    if (budgetMovie) budgetMovie.textContent = user.expectedMovieRemuneration || user.budgetMovie || 'Data Not Available';
    if (budgetWeb) budgetWeb.textContent = user.expectedWebseriesRemuneration || user.budgetWebseries || 'Data Not Available';
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

    // Profile Actions (Edit vs Follow/Message)
    const actionsContainer = document.getElementById('profileActionsContainer');
    if (actionsContainer) {
        const isCurrentUser = profileUserId === currentUserId;
        if (isCurrentUser) {
            actionsContainer.innerHTML = `
                <a href="edit-profile.html" class="action-btn btn-primary">
                    <i class="fa-solid fa-user-edit"></i> Edit Profile
                </a>
            `;
        } else {
            const isFollowing = typeof ProfileHandler !== 'undefined' ? ProfileHandler.isFollowing(profileUserId) : false;
            const isFollower = typeof ProfileHandler !== 'undefined' ? ProfileHandler.isFollower(profileUserId) : false;
            const isAdmin = getCurrentUserIsAdmin();
            
            // Logic: Admin can message anyone. Others need to be mutual followers OR messaging their own followers.
            // Both "mutual" and "send to followers" effectively mean the profile user must follow the current user.
            const canMessage = isAdmin || isFollower;

            let followBtnHtml = `
                <button class="action-btn btn-primary btn-follow ${isFollowing ? 'following' : ''}" 
                        data-user-id="${profileUserId}" 
                        onclick="ProfileHandler.toggleFollow('${profileUserId}', this)">
                    <i class="fa-solid ${isFollowing ? 'fa-check' : 'fa-user-plus'}"></i> 
                    ${isFollowing ? 'Following' : 'Follow'}
                </button>
            `;

            let messageBtnHtml = '';
            if (canMessage) {
                messageBtnHtml = `
                    <a href="messages.html?chatWith=${profileUserId}" class="action-btn btn-secondary">
                        <i class="fa-solid fa-envelope"></i> Message
                    </a>
                `;
            } else {
                messageBtnHtml = `
                    <button class="action-btn btn-secondary" style="opacity: 0.6; cursor: not-allowed;" onclick="showMessage('You can only message your followers or mutual connections.', 'info')">
                        <i class="fa-solid fa-lock"></i> Message
                    </button>
                `;
            }

            actionsContainer.innerHTML = followBtnHtml + messageBtnHtml;
        }
    }
}

function displayCraftSpecs(user) {
    const container = document.getElementById('craftSpecsContainer');
    const card = document.getElementById('craftSpecsCard');
    if (!container || !card) return;

    const role = user.role || '';
    const isCurrentUser = profileUserId === currentUserId;
    
    if (!role) {
        card.style.display = 'block';
        if (isCurrentUser) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; background:rgba(255,140,0,0.05); border-radius:15px; border:1px dashed var(--primary-orange);">
                    <i class="fa-solid fa-briefcase" style="font-size:30px; color:var(--primary-orange); margin-bottom:15px; opacity:0.8;"></i>
                    <h4 style="font-size:15px; margin-bottom:8px; color:#fff;">Craft Not Selected</h4>
                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:20px; line-height:1.4;">Select your professional role to unlock craft-specific fields and gain more visibility.</p>
                    <a href="edit-profile.html" style="display:inline-block; background:var(--primary-orange); color:white; padding:10px 25px; border-radius:30px; text-decoration:none; font-size:12px; font-weight:800; transition:0.3s; box-shadow: 0 4px 15px rgba(255,140,0,0.3);">CHOOSE CRAFT</a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align:center; padding:30px; opacity:0.6;">
                    <i class="fa-solid fa-user-clock" style="font-size:30px; color:var(--text-muted); margin-bottom:15px;"></i>
                    <h4 style="font-size:14px; margin-bottom:8px; color:#fff;">Not Specified</h4>
                    <p style="font-size:12px; color:var(--text-muted);">This user has not yet specified their primary craft in the film industry.</p>
                </div>
            `;
        }
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
        ],
        'Aspirant': [
            { label: 'Interests', key: 'interests' },
            { label: 'Occupation', key: 'occupation' },
            { label: 'Industry Goals', key: 'goals' },
            { label: 'Learning', key: 'learningResources' }
        ],
        'Content Creator': [
            { label: 'Interests', key: 'interests' },
            { label: 'Occupation', key: 'occupation' },
            { label: 'Goals', key: 'goals' },
            { label: 'Resources', key: 'learningResources' }
        ],
        'Explorer': [
            { label: 'Interests', key: 'interests' },
            { label: 'Occupation', key: 'occupation' }
        ]
    };

    let fields = [];
    let matched = false;
    for (const [key, val] of Object.entries(craftMapping)) {
        if (role.toLowerCase().includes(key.toLowerCase())) {
            fields = fields.concat(val);
            matched = true;
        }
    }

    if (!matched) {
        fields = [
            { label: 'Interests', key: 'interests' },
            { label: 'Occupation', key: 'occupation' },
            { label: 'Industry Goals', key: 'goals' },
            { label: 'Learning', key: 'learningResources' }
        ];
    }

    // De-duplicate fields by key
    fields = Array.from(new Map(fields.map(item => [item['key'], item])).values());

    const activeFields = fields.filter(f => user[f.key] && user[f.key].toString().trim() !== '');

    if (activeFields.length > 0) {
        card.style.display = 'block';
        container.innerHTML = activeFields.map(f => `
            <div class="data-row">
                <span class="label">${f.label}</span>
                <span class="value">${f.isLink ? `<a href="${user[f.key]}" target="_blank" style="color:var(--primary-orange); text-decoration:none;">View <i class="fa-solid fa-external-link" style="font-size:10px;"></i></a>` : user[f.key]}</span>
            </div>
        `).join('');
    } else {
        // If role exists but no specs are filled
        card.style.display = 'block';
        if (isCurrentUser) {
            container.innerHTML = `
                <div style="text-align:center; padding:20px;">
                    <p style="font-size:12px; color:var(--text-muted); margin-bottom:15px;">You have selected <b>${role}</b> as your role, but haven't filled in the specific details yet.</p>
                    <a href="edit-profile.html" style="color:var(--primary-orange); text-decoration:none; font-size:12px; font-weight:700;">Complete ${role} Profile →</a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align:center; padding:20px; opacity:0.6;">
                    <p style="font-size:12px; color:var(--text-muted);">No specific details provided for this role.</p>
                </div>
            `;
        }
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

            grid.innerHTML = projects.map(p => {
                const userEmail = getCurrentUserEmail();
                const isAdmin = getCurrentUserIsAdmin() || userEmail === 'crewcanvas2@gmail.com';
                const verifyBtn = (isAdmin && !p.verified) ? 
                    `<button onclick="verifyProject(${p.id})" style="position:absolute; top:10px; right:10px; background:rgba(255,255,255,0.9); border:1px solid var(--primary-orange); color:var(--primary-orange); padding:4px 10px; border-radius:15px; font-size:10px; font-weight:800; cursor:pointer; z-index:10;">VERIFY</button>` : '';

                return `
                <div class="project-item" style="position:relative;">
                    ${verifyBtn}
                    <img src="${p.imageUrl || 'https://via.placeholder.com/200x300?text=No+Poster'}" alt="${p.title}" loading="lazy">
                    <div class="project-meta">
                        <h4>${p.title} ${p.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--primary-orange); margin-left:5px;" title="Verified Project"></i>' : ''}</h4>
                        <p>${p.role} • ${p.year || ''}</p>
                        ${p.videoUrl ? `<a href="${p.videoUrl}" target="_blank" style="color:var(--primary-orange); text-decoration:none; font-size:11px; margin-top:5px; display:inline-block; font-weight:700;">VIEW PROJECT <i class="fa-solid fa-external-link" style="font-size:9px;"></i></a>` : ''}
                    </div>
                </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

async function loadUserPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/user/${profileUserId}?size=10`);
        if (response.ok) {
            const data = await response.json();
            const posts = data.content || data; // Handle both paginated and direct list
            const totalElements = data.totalElements !== undefined ? data.totalElements : posts.length;
            
            const postCountEl = document.getElementById('postCount');
            if (postCountEl) postCountEl.textContent = totalElements;
            
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
                    <button onclick="editPost(${post.id})" title="Edit"><i class="fa-solid fa-pen"></i></button>
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
                <i class="fa-solid fa-comment"></i> <span>${post.comments || 0}</span>
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

async function editPost(postId) {
    editingPostId = postId;
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`);
        if (response.ok) {
            const post = await response.json();
            
            // Populate content
            document.getElementById('editPostContent').value = post.content || '';
            
            // Populate images
            editingImages = [];
            if (post.imageUrls) {
                editingImages = [...post.imageUrls];
            } else if (post.imageUrl) {
                editingImages = post.imageUrl.split(',').filter(s => s.trim() !== '');
            }
            
            renderEditImagePreviews();
            
            // Show Modal
            document.getElementById('editPostModal').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        } else {
            showMessage('We couldn’t load the post details. Please refresh the page.', 'error');
        }
    } catch (e) {
        console.error('Error fetching post for edit:', e);
        showMessage('Oops! Something went wrong while loading the post.', 'error');
    }
}

function closeEditModal() {
    document.getElementById('editPostModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    editingPostId = null;
    editingImages = [];
}

function renderEditImagePreviews() {
    const container = document.getElementById('editImagePreviewContainer');
    if (!container) return;
    
    container.innerHTML = editingImages.map((img, index) => `
        <div class="preview-item">
            <img src="${img}" alt="Preview">
            <button class="remove-img-btn" onclick="removeEditingImage(${index})">✕</button>
        </div>
    `).join('');
}

function removeEditingImage(index) {
    editingImages.splice(index, 1);
    renderEditImagePreviews();
}

function setupEditImageUpload() {
    const imageInput = document.getElementById('editPostImage');
    if (!imageInput) return;

    imageInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            try {
                const base64 = await uploadImage(file);
                if (base64) {
                    editingImages.push(base64);
                }
            } catch (error) {
                showMessage('Image upload failed. Please try again.', 'error');
            }
        }
        renderEditImagePreviews();
        imageInput.value = ''; // Reset
    };
}

async function saveEditPost() {
    const saveBtn = document.getElementById('saveEditBtn');
    const content = document.getElementById('editPostContent').value.trim();
    
    if (!content && editingImages.length === 0) {
        showMessage('Post cannot be empty', 'error');
        return;
    }

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        }

        const response = await fetch(`${API_BASE_URL}/api/posts/${editingPostId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                imageUrls: editingImages
            })
        });

        if (response.ok) {
            showMessage('Post updated successfully!', 'success');
            closeEditModal();
            loadUserPosts();
        } else {
            showMessage('We couldn’t update your post. Please check your connection.', 'error');
        }
    } catch (error) {
        console.error('Error saving post:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
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
            const el = document.getElementById('followerCount');
            if (el) el.textContent = followers.length;
        }
    } catch (error) {
        console.error('Error loading followers:', error);
    }
}

async function loadFollowing() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${profileUserId}/following`);
        if (response.ok) {
            const following = await response.json();
            const el = document.getElementById('followingCount');
            if (el) el.textContent = following.length;
        }
    } catch (error) {
        console.error('Error loading following:', error);
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

async function verifyProject(projectId) {
    if (!confirm('Verify this project as official? This will also promote the user to Film Professional status.')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/verify`, {
            method: 'POST'
        });

        if (response.ok) {
            alert('Project verified successfully! User is now a Film Professional.');
            location.reload();
        }
    } catch (err) {
        console.error('Error verifying project:', err);
    }
}
