// Profile page functionality
let profileUserId = null;
let currentUserId = null;
let profileUserData = null; // Global store for the loaded user
let currentTab = 'posts';

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    profileUserId = getQueryParam('userId') || currentUserId;

    if (!profileUserId) {
        console.warn('No profile ID found, redirecting...');
        window.location.href = 'home.html';
        return;
    }

    await loadProfile();
    loadUserPosts();
    loadUserProjects(); // Added to populate the movies split
});

// Load user applications and their statuses
async function loadUserApplications() {
    const container = document.getElementById('applicationsContent');
    if (!container) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/events/applications/user/${profileUserId}`);
        if (!response.ok) return;

        const applications = await response.json();
        if (applications.length === 0) return;

        // Fetch all events to get titles
        const eventsRes = await fetch(`${API_BASE_URL}/api/events`);
        const allEvents = await eventsRes.json();
        const eventMap = new Map(allEvents.map(e => [e.id, e]));

        container.innerHTML = applications.map(app => {
            const event = eventMap.get(app.eventId) || { title: 'Unknown Event' };
            const statusClass = app.status === 'shortlisted' ? 'status-shortlisted' : 
                                app.status === 'rejected' ? 'status-rejected' : 'status-pending';
            
            return `
            <div class="post-card legacy-post-style application-card" style="padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin: 0; color: #fff; font-size: 18px;">${event.title}</h4>
                        <p style="margin: 5px 0; color: #888; font-size: 13px;">Applied on ${new Date(app.appliedAt).toLocaleDateString()}</p>
                        <div style="margin-top: 10px;">
                            <span class="status-badge ${statusClass}" style="padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase;">
                                ${app.status.toUpperCase()}
                            </span>
                        </div>
                    </div>
                    <button class="btn-action" onclick="window.location.href='launch-audition.html'" style="background: none; border: 1px solid #444; color: #ccc; padding: 5px 15px; border-radius: 8px; cursor: pointer; font-size: 12px;">View Event</button>
                </div>
            </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading applications:', error);
    }
}

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

    const bioEl = document.getElementById('profileBio');
    if (bioEl) bioEl.textContent = user.bio || 'No bio added yet.';
    
    // Set Profile Info Card fields
    const emailEl = document.getElementById('profileEmail');
    if (emailEl) emailEl.textContent = user.email || 'Not Provided';
    
    const locationEl = document.getElementById('profileLocation');
    if (locationEl) locationEl.textContent = (user.location || 'Not Specified').toUpperCase();

    // Set Main Profile Image
    const imgEl = document.getElementById('profileImage');
    if (imgEl) {
        imgEl.src = user.profilePicture || 'https://via.placeholder.com/180';
    }

    // Set Professional Overview (Prioritize these to ensure they load before craft details)
    const expEl = document.getElementById('profileExperience');
    if (expEl) expEl.textContent = user.experience || 'Fresher / Professional';

    const langEl = document.getElementById('profileLanguages');
    if (langEl) langEl.textContent = user.languages || 'English / Multiple';

    const roleDetailEl = document.getElementById('profileRoleDetail');
    if (roleDetailEl) roleDetailEl.textContent = user.role || 'Professional';

    // Premium Fields Logic (Phone, Availability, Budget)
    const availEl = document.getElementById('profileAvailability');
    if (availEl) {
        const status = user.availability || 'Available';
        let availText = status;
        if (user.availableFrom && user.availableTo) {
            const from = new Date(user.availableFrom).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            const to = new Date(user.availableTo).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            availText += ` (${from} - ${to})`;
        }
        availEl.setAttribute('data-full-value', availText);
        availEl.textContent = '********';
        availEl.style.color = (status === 'Busy') ? '#ef4444' : '#10b981';
    }

    const phoneEl = document.getElementById('profilePhone');
    if (phoneEl) {
        phoneEl.setAttribute('data-full-value', user.phone || 'Not Provided');
        phoneEl.textContent = '********';
    }

    const budgetEl = document.getElementById('profileBudget');
    if (budgetEl) {
        budgetEl.setAttribute('data-full-value', user.budgetQuote || 'Not Specified');
        budgetEl.textContent = '********';
    }

    // Check if current user has already unlocked premium (local storage simulation)
    const isUnlocked = localStorage.getItem(`premium_unlocked_${profileUserId}`) === 'true';
    const isOwnProfile = String(profileUserId) === String(currentUserId);
    
    if (isUnlocked || isOwnProfile) {
        revealPremiumData();
    }

    // Render Skills Tags (Better pill styling)
    const skillsContainer = document.getElementById('skillsContainer');
    if (skillsContainer) {
        if (user.skills && user.skills.trim() !== '') {
            const skillsArr = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
            skillsContainer.innerHTML = skillsArr.map(s => `
                <span class="role-pill" style="background: #f1f5f9; color: #334155; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${s}</span>
            `).join('');
            
            const skillsCountEl = document.getElementById('skillsCount');
            if (skillsCountEl) skillsCountEl.textContent = skillsArr.length;
        } else {
            skillsContainer.innerHTML = '<span style="color: #94a3b8; font-size: 13px; font-style: italic;">No skills added yet</span>';
        }
    }

    // Render Social Links (Expanded to match User.java fields)
    const socialLinks = document.getElementById('socialLinks');
    if (socialLinks) {
        const platforms = [
            { key: 'instagram', icon: 'fa-brands fa-instagram', color: '#e4405f', title: 'Instagram' },
            { key: 'youtube', icon: 'fa-brands fa-youtube', color: '#ff0000', title: 'YouTube' },
            { key: 'tiktok', icon: 'fa-brands fa-tiktok', color: '#000000', title: 'TikTok' },
            { key: 'twitter', icon: 'fa-brands fa-x-twitter', color: '#000000', title: 'X (Twitter)' },
            { key: 'facebook', icon: 'fa-brands fa-facebook', color: '#1877f2', title: 'Facebook' },
            { key: 'vimeo', icon: 'fa-brands fa-vimeo', color: '#1ab7ea', title: 'Vimeo' },
            { key: 'behance', icon: 'fa-brands fa-behance', color: '#1769ff', title: 'Behance' },
            { key: 'linkedinProfile', icon: 'fa-brands fa-linkedin', color: '#0077b5', title: 'LinkedIn' },
            { key: 'threads', icon: 'fa-brands fa-threads', color: '#000000', title: 'Threads' },
            { key: 'personalWebsite', icon: 'fa-solid fa-globe', color: '#64748b', title: 'Website' }
        ];

        const socialHtml = platforms
            .filter(p => user[p.key] && user[p.key].trim() !== '')
            .map(p => {
                let url = user[p.key];
                if (!url.startsWith('http')) url = 'https://' + url;
                return `<a href="${url}" target="_blank" title="${p.title}" style="color: ${p.color}; font-size: 20px; transition: transform 0.2s ease; display: inline-block;">
                    <i class="${p.icon}"></i>
                </a>`;
            }).join('');
        
        socialLinks.innerHTML = socialHtml || '<span style="color: #94a3b8; font-size: 13px; font-style: italic;">No links added</span>';
    }

    // Populate Physical & Professional Specs (ONLY FOR ACTORS)
    const isActorRole = (user.role || '').toLowerCase().includes('actor');
    const specFields = [
        { ids: ['profileGender'], parents: ['specGender'], value: user.gender },
        { ids: ['profileAge'], parents: ['specAge'], value: user.age },
        { ids: ['profileSkinTone'], parents: ['specSkin'], value: user.skinTone },
        { ids: ['profileHeight'], parents: ['specHeight'], value: user.height }
    ];

    specFields.forEach(field => {
        const val = field.value ? field.value.toString().trim() : '';
        const parentEls = field.parents.map(pid => document.getElementById(pid)).filter(p => p);
        
        if (isActorRole && val && val !== '' && val.toLowerCase() !== 'not specified') {
            field.ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = val;
            });
            parentEls.forEach(p => p.style.display = 'flex');
        } else {
            parentEls.forEach(p => p.style.display = 'none');
        }
    });

    // Render Craft Specific Details (Call last in case of specific role errors)
    try {
        renderCraftDetails(user);
    } catch (e) {
        console.error('Craft details error:', e);
    }

    // Update Stats Bar
    const followersEl = document.getElementById('followerCount');
    if (followersEl) followersEl.textContent = user.followers || '0';
    
    const followingEl = document.getElementById('followingCount');
    if (followingEl) followingEl.textContent = user.following || '0';

    const projectsCountEl = document.getElementById('projectsCount');
    if (projectsCountEl) projectsCountEl.textContent = user.projectsCount || '0';

    // Update Header Navigation
    const headerName = document.getElementById('userNameHeader');
    if (headerName) headerName.textContent = (user.name || 'User').toLowerCase();

    // Set Page Title
    document.title = `${user.name || 'User'} | CrewCanvas Profile`;

    // Notify ProfileHandler for global sync
    if (user.id == getCurrentUserId() && typeof ProfileHandler !== 'undefined') {
        ProfileHandler.user = user;
        ProfileHandler.updateGlobalHeader();
    }

    // Set up Follow/Edit Button
    const actionBtn = document.getElementById('actionButton');
    // isOwnProfile is already declared above
    
    if (actionBtn) {
        if (isOwnProfile) {
            actionBtn.textContent = 'Edit Profile';
            actionBtn.className = 'action-button primary';
        } else {
            // Set initial state from ProfileHandler
            if (typeof ProfileHandler !== 'undefined' && ProfileHandler.isFollowing(profileUserId)) {
                actionBtn.textContent = 'Unfollow';
                actionBtn.classList.add('following');
            } else {
                actionBtn.textContent = 'Follow';
                actionBtn.classList.remove('following');
            }
        }

        actionBtn.onclick = async () => {
            if (isOwnProfile) {
                window.location.href = 'edit-profile.html';
            } else {
                if (typeof ProfileHandler !== 'undefined') {
                    await ProfileHandler.toggleFollow(profileUserId, actionBtn);
                }
            }
        };
    }

    // Set up Message Button
    const messageBtn = document.querySelector('button[onclick="openMessage()"]');
    if (messageBtn) {
        if (isOwnProfile) {
            messageBtn.style.display = 'none';
        }
    }

    // Calculate and Update Profile Score
    if (isOwnProfile) {
        const score = calculateProfileScore(user);
        updateProfileScoreUI(score);
    }
}

/**
 * Open Messaging with this user
 */
function openMessage() {
    if (!profileUserId) return;
    window.location.href = `messages.html?userId=${profileUserId}`;
}

// Calculate Profile Completeness Score
function calculateProfileScore(user) {
    let score = 0;
    const weights = {
        name: 10,
        profilePicture: 15,
        bio: 15,
        role: 10,
        location: 10,
        phone: 5,
        skills: 15,
        social: 10, // At least one social link
        projects: 10 // At least one project
    };

    if (user.name && user.name.trim() !== '') score += weights.name;
    if (user.profilePicture && !user.profilePicture.includes('placeholder')) score += weights.profilePicture;
    if (user.bio && user.bio.trim().length > 10) score += weights.bio;
    if (user.role && user.role !== 'Film Professional') score += weights.role;
    if (user.location && user.location !== 'Not Specified') score += weights.location;
    if (user.phone && user.phone !== 'Not Provided') score += weights.phone;
    
    if (user.skills && user.skills.split(',').filter(s => s.trim() !== '').length > 0) {
        score += weights.skills;
    }

    if (user.instagram || user.youtube || user.facebook || user.twitter) {
        score += weights.social;
    }

    // Projects count from user object or local display
    const projectsCount = parseInt(user.projectsCount) || 0;
    if (projectsCount > 0) {
        score += weights.projects;
    }

    return Math.min(100, score);
}

// Render Craft Specific Details
function renderCraftDetails(user) {
    const list = document.getElementById('craftDetailsList');
    const quickStatsContainer = document.getElementById('profileQuickStats');
    
    // Don't return early if list is missing, just skip its population

    let details = [];
    let quickStats = [];
    let craftName = user.role || 'Professional';
    const skillsText = (user.skills || '').toLowerCase();
    const roleKey = craftName.trim().toLowerCase();

    // Role or Skill-based mapping (More inclusive check)
    const isActor = roleKey.includes('actor') || skillsText.includes('actor');
    const isDirector = roleKey.includes('director') || skillsText.includes('director');
    const isEditor = roleKey.includes('editor') || skillsText.includes('editor');
    const isDOP = roleKey.includes('dop') || roleKey.includes('cinematographer') || skillsText.includes('dop') || skillsText.includes('cinematographer');
    const isMusic = roleKey.includes('music') || skillsText.includes('music');

    if (isDirector) {
        quickStats = [
            { label: 'GENRES', value: user.genres },
            { label: 'PROJECTS', value: user.projectsDirected }
        ];
        details = [
            { label: 'Budget Handled', value: user.budgetHandled },
            { label: 'Team Size', value: user.teamSizeHandled },
            { label: 'Vision Statement', value: user.visionStatement }
        ];
    } else if (isEditor) {
        quickStats = [
            { label: 'SOFTWARE', value: user.editingSoftware }
        ];
        details = [
            { label: 'Editing Style', value: user.editingStyle },
            { label: 'Portfolio Videos', value: user.portfolioVideos, isUrl: true },
            { label: 'Turnaround Time', value: user.turnaroundTime }
        ];
    } else if (isDOP) {
        quickStats = [
            { label: 'CAMERA', value: user.cameraExpertise }
        ];
        details = [
            { label: 'Lighting Style', value: user.lightingStyle }
        ];
    } else if (isMusic) {
        quickStats = [
            { label: 'DAWs', value: user.daws }
        ];
        details = [
            { label: 'Instruments', value: user.instruments },
            { label: 'Sample Tracks', value: user.sampleTracks, isUrl: true }
        ];
    } else if (roleKey.includes('colorist')) {
        quickStats = [
            { label: 'SOFTWARE', value: user.colorSoftware }
        ];
        details = [
            { label: 'Hardware Panel', value: user.colorPanel },
            { label: 'Monitor', value: user.colorMonitor }
        ];
    } else if (roleKey.includes('writer')) {
        quickStats = [
            { label: 'GENRE', value: user.writerGenre }
        ];
        details = [
            { label: 'Software', value: user.writerSoftware },
            { label: 'Scripts', value: user.writerScripts }
        ];
    } else if (roleKey.includes('vfx') || roleKey.includes('animator')) {
        quickStats = [
            { label: 'STACK', value: user.vfxSoftware }
        ];
        details = [
            { label: 'Specialty', value: user.vfxSpecialty }
        ];
    } else {
        // Fallback for others
        details = [];
    }

    // Add global budget quote if available
    // Physical specs and budget are already displayed in the Specs card below
    /*
    if (user.budgetQuote && user.budgetQuote !== 'Not Specified') {
        quickStats.push({ label: 'QUOTE', value: user.budgetQuote });
    }
    if (user.gender) quickStats.push({ label: 'GENDER', value: user.gender });
    if (user.age) quickStats.push({ label: 'AGE', value: user.age });
    if (user.skinTone) quickStats.push({ label: 'SKIN', value: user.skinTone });
    if (user.height) quickStats.push({ label: 'HT', value: user.height });
    */

    // Populate Quick Stats (Hero Section)
    if (quickStatsContainer) {
        const filteredQuick = quickStats.filter(q => q.value && q.value.trim() !== '' && q.value !== 'Not Specified');
        quickStatsContainer.innerHTML = filteredQuick.map(q => `
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 5px;">
                <span style="color: #94a3b8; font-size: 9px;">${q.label}</span> ${q.value}
            </div>
        `).join('');
    }

    // Filter out empty or placeholder values for main card (Show "Not Specified" instead of hiding)
    const processedDetails = details.map(d => ({
        ...d,
        value: (d.value && d.value.toString().trim() !== '' && d.value !== 'loading...') ? d.value : 'Not Specified'
    }));

    if (processedDetails.length > 0) {
        list.style.display = 'flex'; 
        list.innerHTML = processedDetails.map(d => `
            <div class="info-item">
                <span class="label">${d.label}</span>
                <span class="value">
                    ${d.isUrl && d.value !== 'Not Specified' ? `<a href="${d.value.startsWith('http') ? d.value : 'https://' + d.value}" target="_blank" style="color: var(--primary-orange); text-decoration: none; font-weight:700;">View Portfolio <i class="fa-solid fa-external-link" style="font-size: 10px;"></i></a>` : d.value}
                </span>
            </div>
        `).join('');
    } else {
        list.style.display = 'none';
    }
}

// Update the Score UI
function updateProfileScoreUI(score) {
    const container = document.getElementById('profileScoreContainer');
    const circle = document.getElementById('scoreProgressCircle');
    const text = document.getElementById('scorePercentageText');
    const status = document.getElementById('scoreStatusText');

    if (!container || !circle || !text || !status) return;

    container.style.display = 'flex';
    text.textContent = `${score}%`;
    
    // SVG Dash Array Calculation
    // circumference = 2 * pi * r = 2 * 3.14 * 16 = 100.48 (rounded to 100 for dasharray)
    const offset = 100 - score;
    circle.style.strokeDashoffset = offset;

    // Status Text
    if (score < 30) status.textContent = 'Weak';
    else if (score < 60) status.textContent = 'Getting There';
    else if (score < 90) status.textContent = 'Strong';
    else status.textContent = 'Master';

    // Color feedback
    if (score < 50) circle.style.stroke = '#ef4444'; // Red
    else if (score < 80) circle.style.stroke = '#f59e0b'; // Amber
    else circle.style.stroke = '#10b981'; // Green
}

// Legacy functions for compatibility
function checkFollowStatus() {
    if (typeof ProfileHandler !== 'undefined') {
        ProfileHandler.syncFollowButtons();
    }
}

function handleAction() {
    const actionBtn = document.getElementById('actionButton');
    if (actionBtn) actionBtn.click();
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
            container.innerHTML = '<div class="compact-card" style="text-align:center; padding:30px; color:#64748b; font-size:13px;">No activity yet.</div>';
            return;
        }

        container.innerHTML = posts.map(post => {
            let images = [];
            if (post.imageUrls && post.imageUrls.length > 0) {
                images = post.imageUrls;
            } else if (post.imageUrl) {
                images = post.imageUrl.split(',');
            }

            let mediaHtml = '';
            if (images.length === 1) {
                mediaHtml = `<div class="compact-image" style="height: auto; max-height: 600px;"><img src="${images[0]}" alt="Post" style="object-fit: contain; background: #000;"></div>`;
            }

            return `
            <div class="compact-card" style="padding: 25px;">
                <div class="card-header-small">
                    <div class="icon-circle-small" style="width: 40px; height: 40px;">${(profileUserData?.name || 'U')[0]}</div>
                    <div>
                        <p class="card-title-small" style="font-size: 16px;">${profileUserData?.name || 'Creative'}</p>
                        <p class="card-subtitle-small">SHARED POST</p>
                    </div>
                </div>
                <div class="compact-text" style="height: auto; max-height: none; -webkit-line-clamp: unset; font-size: 14px; margin: 15px 0;">${post.content}</div>
                ${mediaHtml}
            </div>
            `;
        }).join('');
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
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const projects = await response.json();
        
        const projectsCountEl = document.getElementById('projectsCount');
        if (projectsCountEl) projectsCountEl.textContent = projects.length;

        // Recalculate score now that projects are loaded
        if (profileUserId == currentUserId && profileUserData) {
            profileUserData.projectsCount = projects.length;
            const score = calculateProfileScore(profileUserData);
            updateProfileScoreUI(score);
        }

        if (!projects || projects.length === 0) {
            container.innerHTML = '<div class="compact-card" style="text-align:center; padding:30px; color:#64748b; font-size:13px;">No projects added yet.</div>';
            return;
        }

        container.innerHTML = projects.map(project => `
            <div class="compact-card" style="padding: 25px;">
                <div class="card-header-small">
                    <div class="icon-circle-small" style="width: 40px; height: 40px;"><i class="fa-solid fa-clapperboard"></i></div>
                    <div>
                        <p class="card-title-small" style="font-size: 18px;">${project.title}</p>
                        <p class="card-subtitle-small">${project.year || 'Released'} • ${project.genre || 'PORTFOLIO'}</p>
                    </div>
                </div>
                <div class="compact-role-badge" style="font-size: 11px; padding: 5px 12px;">${(project.role || 'Professional').toUpperCase()}</div>
                <div class="compact-text" style="height: auto; max-height: none; -webkit-line-clamp: unset; font-size: 14px; margin: 15px 0;">${project.description || 'No description provided.'}</div>
                ${project.imageUrl ? `
                    <div class="compact-image" style="height: auto; max-height: 600px;">
                        <img src="${project.imageUrl}" alt="${project.title}" style="object-fit: contain; background: #000;">
                    </div>
                ` : ''}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <div class="card-footer-small" style="font-size: 10px; border: none; padding: 0;">FILM PROJECT • ID: ${project.id}</div>
                    ${project.videoUrl ? `
                        <a href="${project.videoUrl.startsWith('http') ? project.videoUrl : 'https://' + project.videoUrl}" target="_blank" style="background: var(--primary-orange); color: white; padding: 6px 15px; border-radius: 20px; text-decoration: none; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                            <i class="fa-solid fa-play"></i> Watch
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('[ProjectLoader] Error:', error);
    }
}

function switchTab(tab, btn) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Update content
    if (tab === 'projects') {
        document.getElementById('projectsContent').style.display = 'block';
        document.getElementById('postsContent').style.display = 'none';
    } else {
        document.getElementById('projectsContent').style.display = 'none';
        document.getElementById('postsContent').style.display = 'block';
    }
}

// Premium Visibility Logic
function showPremiumModal() {
    document.getElementById('premiumModal').style.display = 'flex';
}

function hidePremiumModal() {
    document.getElementById('premiumModal').style.display = 'none';
}

function unlockPremium() {
    const code = document.getElementById('premiumCode').value.trim().toLowerCase();
    if (code === 'free') {
        localStorage.setItem(`premium_unlocked_${profileUserId}`, 'true');
        revealPremiumData();
        hidePremiumModal();
        
        // Show success effect
        const premiumCard = document.querySelector('.premium-card');
        if (premiumCard) {
            premiumCard.style.border = '2px solid #10b981';
            premiumCard.style.background = 'linear-gradient(to bottom, #ffffff, #f0fdf4)';
        }
    } else {
        alert('Invalid access code. Use "FREE" for instant access.');
    }
}

function revealPremiumData() {
    const overlay = document.getElementById('premiumOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.style.display = 'none', 300);
    }
    
    const premiumVals = document.querySelectorAll('.premium-val');
    premiumVals.forEach(el => {
        const fullVal = el.getAttribute('data-full-value');
        if (fullVal) {
            el.textContent = fullVal;
            el.style.filter = 'none';
            el.style.color = 'inherit'; // Changed from var(--text-dark) for compatibility
        }
    });

    // Special handling for availability color
    const availEl = document.getElementById('profileAvailability');
    if (availEl && profileUserData) {
        const status = profileUserData.availability || 'Available';
        availEl.style.color = (status === 'Busy') ? '#ef4444' : '#10b981';
    }
}
