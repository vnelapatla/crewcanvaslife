// Profile picture handling
function initializeProfilePicture() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;

    try {
        const user = JSON.parse(userStr);
        const profilePicture = document.querySelector('.user-profile img');
        if (!profilePicture) return;

        // Set alt text immediately
        profilePicture.alt = user.name;

        // Create a new image to preload
        const img = new Image();
        img.onload = function() {
            profilePicture.src = this.src;
        };
        img.onerror = function() {
            console.log('Profile picture failed to load, using default');
            profilePicture.src = '/images/profile.jpg';
        };

        // Start loading the image
        if (user.picture) {
            img.src = user.picture;
        } else {
            img.src = '/images/profile.jpg';
        }

        // Update user name
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }
    } catch (error) {
        console.error('Error handling profile picture:', error);
    }
}

// Initialize as soon as possible
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProfilePicture);
} else {
    initializeProfilePicture();
}

// Function to refresh profile picture (can be called after profile updates)
function refreshProfilePicture() {
    initializeProfilePicture();
}

// Make it available globally
window.refreshProfilePicture = refreshProfilePicture;

// Crew Search Filtering Logic
function setupCrewSearchFilters() {
    const roleInput = document.getElementById('filterRole');
    const locationInput = document.getElementById('filterLocation');
    const skillsInput = document.getElementById('filterSkills');
    const clearBtn = document.getElementById('clearFiltersBtn');
    const profileGrid = document.querySelector('#findCrewContent .profile-grid');
    const paginationControls = document.getElementById('paginationControls');
    const spinner = document.createElement('div');
    spinner.className = 'crew-loading-spinner';
    spinner.innerHTML = '<div style="display:flex;justify-content:center;padding:2rem;"><i class="fas fa-spinner fa-spin" style="font-size:2rem;color:#FF8A00;"></i></div>';

    let currentPage = 1;
    let totalPages = 1;

    async function fetchAndRenderCrew(page = 1) {
        if (profileGrid) {
            profileGrid.innerHTML = '';
            profileGrid.appendChild(spinner);
        }
        if (paginationControls) paginationControls.innerHTML = '';
        const params = new URLSearchParams();
        
        if (roleInput.value) params.append('role', roleInput.value);
        if (locationInput.value) params.append('location', locationInput.value);
        if (skillsInput.value) params.append('skills', skillsInput.value);
        params.append('page', page);
        params.append('limit', 12);
        
        const res = await fetch(`/api/profile/search?${params.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const data = await res.json();
        renderCrewProfiles(data.users);
        renderPagination(data.page, data.totalPages);
        currentPage = data.page;
        totalPages = data.totalPages;
    }

    function renderCrewProfiles(users) {
        if (!profileGrid) return;
        profileGrid.innerHTML = '';
        if (users.length === 0) {
            profileGrid.innerHTML = '<div class="no-results"><i class="fas fa-search"></i><p>No crew found matching your filters.</p></div>';
            return;
        }
        users.forEach((user, index) => {
            const card = document.createElement('div');
            card.className = 'profile-card film-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            // Get role icon based on user role
            const getRoleIcon = (role) => {
                const roleIcons = {
                    'Director': 'fas fa-video',
                    'Actor': 'fas fa-theater-masks',
                    'Producer': 'fas fa-film',
                    'Cinematographer': 'fas fa-camera',
                    'Editor': 'fas fa-cut',
                    'Sound Designer': 'fas fa-volume-up',
                    'Production Designer': 'fas fa-palette',
                    'Costume Designer': 'fas fa-tshirt',
                    'Makeup Artist': 'fas fa-magic',
                    'Stunt Coordinator': 'fas fa-running',
                    'Screenwriter': 'fas fa-pen-fancy',
                    'Composer': 'fas fa-music'
                };
                return roleIcons[role] || 'fas fa-user';
            };

            // Get experience level based on role and projects
            const getExperienceLevel = (role) => {
                const projectCount = user.projects_count || 0;
                const followerCount = user.followers_count || 0;
                
                // Calculate experience based on projects and followers
                let experience = 'Junior';
                
                if (projectCount >= 10 || followerCount >= 200) {
                    experience = 'Senior';
                } else if (projectCount >= 5 || followerCount >= 100) {
                    experience = 'Mid-Level';
                } else if (projectCount >= 2 || followerCount >= 50) {
                    experience = 'Intermediate';
                }
                
                // Role-specific experience adjustments
                if (role === 'Director' && projectCount >= 3) {
                    experience = 'Senior';
                } else if (role === 'Producer' && projectCount >= 5) {
                    experience = 'Senior';
                } else if (role === 'Actor' && followerCount >= 150) {
                    experience = 'Senior';
                }
                
                return experience;
            };

            // Profile image logic (use backend-provided picture field directly)
            let pictureUrl = user.picture;
            // Fallback to initials if image fails to load
            const initials = user.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            card.innerHTML = `
                <div class="card-background">
                    <div class="film-grain"></div>
                    <div class="light-leak"></div>
                    <svg class="mobile-filmstrip" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none;"><rect x="0" y="8" width="120" height="16" rx="8" fill="#222"/><rect x="8" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="28" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="48" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="68" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="88" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="108" y="12" width="8" height="8" rx="4" fill="#FF8A00"/></svg>
                    <svg class="desktop-filmstrip" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none;"><rect x="0" y="10" width="140" height="16" rx="8" fill="#333"/><rect x="10" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="32" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="54" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="76" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="98" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="120" y="14" width="10" height="8" rx="4" fill="#FF8A00"/></svg>
                    <div class="mobile-spotlight"></div>
                    <div class="desktop-spotlight"></div>
                </div>
                <div class="card-content">
                    <div class="profile-image-container">
                        <div class="profile-image-wrapper">
                            <img src="${pictureUrl}" alt="${user.name}" class="profile-image" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff&size=200'">
                            <div class="image-overlay">
                                <div class="spotlight-effect"></div>
                                <div class="film-reel-border"></div>
                            </div>
                        </div>
                        <div class="online-indicator"></div>
                    </div>
                    
                    <div class="user-info">
                        <h3 class="user-name">${user.name}</h3>
                        <div class="user-role">
                            <i class="${getRoleIcon(user.role)}"></i>
                            <span>${user.role || 'Creative Professional'}</span>
                        </div>
                        <div class="user-location">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${user.location || 'Location not specified'}</span>
                        </div>
                    </div>
                    
                    <div class="user-stats">
                        <div class="stat-item">
                            <i class="fas fa-users"></i>
                            <span>${user.followers_count || 0}</span>
                            <small>Followers</small>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-film"></i>
                            <span>${user.projects_count || 0}</span>
                            <small>Projects</small>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-briefcase"></i>
                            <span>${getExperienceLevel(user.role)}</span>
                            <small>Experience</small>
                        </div>
                    </div>
                    
                    <div class="skills-container">
                        ${(user.skills || []).slice(0, 3).map(skill => 
                            `<span class="skill-tag"><i class="fas fa-tag"></i>${skill}</span>`
                        ).join('')}
                        ${(user.skills || []).length > 3 ? 
                            `<span class="skill-tag more-skills">+${(user.skills || []).length - 3} more</span>` : ''
                        }
                    </div>
                    
                    <div class="card-actions">
                        <button class="follow-btn" data-user-id="${user.id}">
                            <i class="fas fa-plus"></i>
                            <span>Follow</span>
                        </button>
                        <a href="profile.html?user=${user.id}" class="view-profile-btn">
                            <i class="fas fa-eye"></i>
                            <span>View Profile</span>
                        </a>
                    </div>
                </div>
            `;
            // Show appropriate SVG and enable effects based on screen size
            if (window.innerWidth <= 600) {
                const filmstrip = card.querySelector('.mobile-filmstrip');
                if (filmstrip) filmstrip.style.display = '';
                // Touch effect: spotlight sweep
                card.addEventListener('touchstart', function() {
                    card.classList.add('touched');
                    setTimeout(() => card.classList.remove('touched'), 700);
                });
            } else {
                const filmstrip = card.querySelector('.desktop-filmstrip');
                if (filmstrip) filmstrip.style.display = '';
            }
            
            // Attach event listener for follow button
            card.querySelectorAll('.follow-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-user-id');
                    toggleFollow(this, userId);
                });
            });
            
            profileGrid.appendChild(card);
        });
    }

    function renderPagination(page, totalPages) {
        if (!paginationControls) return;
        paginationControls.innerHTML = '';
        if (totalPages <= 1) return;
        
        // Check if we're on mobile
        const isMobile = window.innerWidth <= 600;
        const maxVisiblePages = isMobile ? 3 : 5;
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prevBtn.disabled = page === 1;
        prevBtn.onclick = () => fetchAndRenderCrew(page - 1);
        paginationControls.appendChild(prevBtn);
        
        // Page numbers
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        // Adjust start page if we're near the end
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        // First page button (if not visible and not on mobile)
        if (startPage > 1 && !isMobile) {
            const firstBtn = document.createElement('button');
            firstBtn.textContent = '1';
            firstBtn.onclick = () => fetchAndRenderCrew(1);
            paginationControls.appendChild(firstBtn);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'page-info';
                paginationControls.appendChild(ellipsis);
            }
        }
        
        // Page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            pageBtn.className = i === page ? 'active' : '';
            pageBtn.onclick = () => fetchAndRenderCrew(i);
            paginationControls.appendChild(pageBtn);
        }
        
        // Last page button (if not visible and not on mobile)
        if (endPage < totalPages && !isMobile) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.className = 'page-info';
                paginationControls.appendChild(ellipsis);
            }
            
            const lastBtn = document.createElement('button');
            lastBtn.textContent = totalPages;
            lastBtn.onclick = () => fetchAndRenderCrew(totalPages);
            paginationControls.appendChild(lastBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        nextBtn.disabled = page === totalPages;
        nextBtn.onclick = () => fetchAndRenderCrew(page + 1);
        paginationControls.appendChild(nextBtn);
        
        // Page info (simplified for mobile)
        const pageInfo = document.createElement('span');
        pageInfo.textContent = isMobile ? `${page}/${totalPages}` : `Page ${page} of ${totalPages}`;
        pageInfo.className = 'page-info';
        paginationControls.appendChild(pageInfo);
    }

    // Listen for filter changes
    [roleInput, locationInput, skillsInput].forEach(input => {
        if (input) input.addEventListener('input', () => fetchAndRenderCrew(1));
    });
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            roleInput.value = '';
            locationInput.value = '';
            skillsInput.value = '';
            fetchAndRenderCrew(1);
        });
    }
    
    // Add resize listener to update pagination on screen size change
    window.addEventListener('resize', () => {
        // Debounce the resize event
        clearTimeout(window.resizeTimeout);
        window.resizeTimeout = setTimeout(() => {
            if (paginationControls && paginationControls.children.length > 0) {
                // Re-render pagination with current page when screen size changes
                const currentPageElement = paginationControls.querySelector('.active');
                const currentPage = currentPageElement ? parseInt(currentPageElement.textContent) : 1;
                renderPagination(currentPage, totalPages);
            }
        }, 250);
    });
    
    // Initial load
    fetchAndRenderCrew(1);
}

// Follow/Unfollow functionality
async function toggleFollow(button, userId) {
    try {
        const isFollowing = button.classList.contains('following');
        const endpoint = isFollowing ? 'unfollow' : 'follow';
        
        const response = await fetch(`/api/profile/${userId}/${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            // Update button state
            if (isFollowing) {
                button.classList.remove('following');
                const icon = button.querySelector('i');
                const text = button.querySelector('span');
                icon.className = 'fas fa-user-plus';
                text.textContent = 'Follow Back';
                button.style.background = 'linear-gradient(90deg, #FF8A00 60%, #FF6B35 100%)';
            } else {
                button.classList.add('following');
                const icon = button.querySelector('i');
                const text = button.querySelector('span');
                icon.className = 'fas fa-check';
                text.textContent = 'Following';
                button.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
            }
            
            // Update feature counts
            await updateFeatureCounts();
            
            // Refresh connection counts if we're on the messages page
            if (window.refreshConnectionCounts) {
                await window.refreshConnectionCounts();
            }
            
            // If we're in the My Connections section, reload the appropriate tab
            const myConnectionsContent = document.getElementById('myConnectionsContent');
            if (myConnectionsContent && myConnectionsContent.style.display !== 'none') {
                const followingTab = document.getElementById('followingTab');
                const followersTab = document.getElementById('followersTab');
                
                if (followingTab && followingTab.classList.contains('active')) {
                    await loadFollowing();
                } else if (followersTab && followersTab.classList.contains('active')) {
                    await loadFollowers();
                }
            }
        }
    } catch (error) {
        console.error('Error toggling follow:', error);
    }
}
window.toggleFollow = toggleFollow;

// Check if current user is following this user
async function checkFollowStatus(card, userId) {
    try {
        const response = await fetch(`/api/profile/${userId}/followers`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const currentUser = JSON.parse(localStorage.getItem('user'));
            
            // Check if current user is in the followers list
            const isFollowing = data.followersList.some(follower => follower.id === currentUser.id);
            
            if (isFollowing) {
                const followBtn = card.querySelector('.follow-btn');
                if (followBtn) {
                    followBtn.classList.add('following');
                    const icon = followBtn.querySelector('i');
                    const text = followBtn.querySelector('span');
                    icon.className = 'fas fa-check';
                    text.textContent = 'Following';
                    followBtn.style.background = 'linear-gradient(135deg, #4CAF50, #45a049)';
                }
            }
        }
    } catch (error) {
        console.error('Error checking follow status:', error);
    }
}

// Load My Connections
async function loadMyConnections() {
    try {
        const response = await fetch('/api/profile/my-connections', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const { connections, following_count, followers_count, total_connections } = data;
            
            // Update the feature count for My Connections tab
            const myConnectionsTab = document.getElementById('myConnectionsTab');
            if (myConnectionsTab) {
                const featureCount = myConnectionsTab.querySelector('.feature-count');
                if (featureCount) {
                    featureCount.textContent = total_connections;
                }
            }
            
            // Load following by default
            await loadFollowing();
        }
    } catch (error) {
        console.error('Error loading connections:', error);
    }
}

// Load Following (people user follows)
async function loadFollowing() {
    try {
        const response = await fetch('/api/profile/my-following', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const following = await response.json();
            const followingGrid = document.getElementById('followingGrid');
            
            if (followingGrid) {
                followingGrid.innerHTML = '';
                
                if (following.length === 0) {
                    followingGrid.innerHTML = '<div class="no-results"><i class="fas fa-user-plus"></i><p>You haven\'t followed anyone yet.</p></div>';
                    return;
                }
                
                renderConnectionProfiles(following, followingGrid, 'following');
            }
        }
    } catch (error) {
        console.error('Error loading following:', error);
    }
}

// Load Followers (people following the user)
async function loadFollowers() {
    try {
        const response = await fetch('/api/profile/my-followers', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const followers = await response.json();
            const followersGrid = document.getElementById('followersGrid');
            
            if (followersGrid) {
                followersGrid.innerHTML = '';
                
                if (followers.length === 0) {
                    followersGrid.innerHTML = '<div class="no-results"><i class="fas fa-users"></i><p>You don\'t have any followers yet.</p></div>';
                    return;
                }
                
                renderConnectionProfiles(followers, followersGrid, 'followers');
            }
        }
    } catch (error) {
        console.error('Error loading followers:', error);
    }
}

// Render connection profiles (following or followers)
function renderConnectionProfiles(users, grid, type) {
    users.forEach((user, index) => {
        const card = document.createElement('div');
        card.className = 'profile-card film-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Get role icon based on user role
        const getRoleIcon = (role) => {
            const roleIcons = {
                'Director': 'fas fa-video',
                'Actor': 'fas fa-theater-masks',
                'Producer': 'fas fa-film',
                'Cinematographer': 'fas fa-camera',
                'Editor': 'fas fa-cut',
                'Sound Designer': 'fas fa-volume-up',
                'Production Designer': 'fas fa-palette',
                'Costume Designer': 'fas fa-tshirt',
                'Makeup Artist': 'fas fa-magic',
                'Stunt Coordinator': 'fas fa-running',
                'Screenwriter': 'fas fa-pen-fancy',
                'Composer': 'fas fa-music'
            };
            return roleIcons[role] || 'fas fa-user';
        };

        // Get experience level based on role and projects
        const getExperienceLevel = (role) => {
            const projectCount = user.projects_count || 0;
            const followerCount = user.followers_count || 0;
            
            let experience = 'Junior';
            
            if (projectCount >= 10 || followerCount >= 200) {
                experience = 'Senior';
            } else if (projectCount >= 5 || followerCount >= 100) {
                experience = 'Mid-Level';
            } else if (projectCount >= 2 || followerCount >= 50) {
                experience = 'Intermediate';
            }
            
            if (role === 'Director' && projectCount >= 3) {
                experience = 'Senior';
            } else if (role === 'Producer' && projectCount >= 5) {
                experience = 'Senior';
            } else if (role === 'Actor' && followerCount >= 150) {
                experience = 'Senior';
            }
            
            return experience;
        };

        // Determine button text and action based on type
        let buttonText, buttonIcon, buttonClass, buttonAction;
        if (type === 'following') {
            buttonText = 'Following';
            buttonIcon = 'fas fa-check';
            buttonClass = 'following';
            buttonAction = `toggleFollow(this, ${user.id})`;
        } else {
            // For followers, check if we're following them back
            if (user.is_following_back) {
                buttonText = 'Following';
                buttonIcon = 'fas fa-check';
                buttonClass = 'following';
                buttonAction = `toggleFollow(this, ${user.id})`;
            } else {
                buttonText = 'Follow Back';
                buttonIcon = 'fas fa-user-plus';
                buttonClass = '';
                buttonAction = `toggleFollow(this, ${user.id})`;
            }
        }

        // Profile image logic
        let pictureUrl = user.picture;
        if (pictureUrl) {
            if (pictureUrl.startsWith('/images/')) {
                pictureUrl = `${window.location.origin}${pictureUrl}`;
            } else if (pictureUrl.startsWith('uploads/')) {
                pictureUrl = `${window.location.origin}/${pictureUrl}`;
            }
            // else if (pictureUrl.startsWith('http')) { /* use as is */ }
        } else {
            // fallback to initials
            const initials = user.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
            pictureUrl = `https://ui-avatars.com/api/?name=${initials}&background=667eea&color=fff&size=200`;
        }
        card.innerHTML = `
            <div class="card-background">
                <div class="film-grain"></div>
                <div class="light-leak"></div>
                <svg class="mobile-filmstrip" viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none;"><rect x="0" y="8" width="120" height="16" rx="8" fill="#222"/><rect x="8" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="28" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="48" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="68" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="88" y="12" width="8" height="8" rx="4" fill="#FF8A00"/><rect x="108" y="12" width="8" height="8" rx="4" fill="#FF8A00"/></svg>
                <svg class="desktop-filmstrip" viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:none;"><rect x="0" y="10" width="140" height="16" rx="8" fill="#333"/><rect x="10" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="32" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="54" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="76" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="98" y="14" width="10" height="8" rx="4" fill="#FF8A00"/><rect x="120" y="14" width="10" height="8" rx="4" fill="#FF8A00"/></svg>
                <div class="mobile-spotlight"></div>
                <div class="desktop-spotlight"></div>
            </div>
            <div class="card-content">
                <div class="profile-image-container">
                    <div class="profile-image-wrapper">
                        <img src="${pictureUrl}" alt="${user.name}" class="profile-image" onerror="this.onerror=null;this.src='https://ui-avatars.com/api/?name=${user.name.split(' ').map(word=>word[0]).join('').toUpperCase().slice(0,2)}&background=667eea&color=fff&size=200'">
                        <div class="image-overlay">
                            <div class="spotlight-effect"></div>
                            <div class="film-reel-border"></div>
                        </div>
                    </div>
                    <div class="online-indicator"></div>
                </div>
                
                <div class="user-info">
                    <h3 class="user-name">${user.name}</h3>
                    <div class="user-role">
                        <i class="${getRoleIcon(user.role)}"></i>
                        <span>${user.role || 'Creative Professional'}</span>
                    </div>
                    <div class="user-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${user.location || 'Location not specified'}</span>
                    </div>
                </div>
                
                <div class="user-stats">
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <span>${user.followers_count || 0}</span>
                        <small>Followers</small>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-film"></i>
                        <span>${user.projects_count || 0}</span>
                        <small>Projects</small>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-briefcase"></i>
                        <span>${getExperienceLevel(user.role)}</span>
                        <small>Experience</small>
                    </div>
                </div>
                
                <div class="skills-container">
                    ${(user.skills || []).slice(0, 3).map(skill => 
                        `<span class="skill-tag"><i class="fas fa-tag"></i>${skill}</span>`
                    ).join('')}
                    ${(user.skills || []).length > 3 ? 
                        `<span class="skill-tag more-skills">+${(user.skills || []).length - 3} more</span>` : ''
                    }
                </div>
                
                <div class="card-actions">
                    <button class="follow-btn ${buttonClass}" data-user-id="${user.id}">
                        <i class="${buttonIcon}"></i>
                        <span>${buttonText}</span>
                    </button>
                    <a href="profile.html?user=${user.id}" class="view-profile-btn">
                        <i class="fas fa-eye"></i>
                        <span>View Profile</span>
                    </a>
                </div>
            </div>
        `;
        
        // Show appropriate SVG and enable effects based on screen size
        if (window.innerWidth <= 600) {
            const filmstrip = card.querySelector('.mobile-filmstrip');
            if (filmstrip) filmstrip.style.display = '';
            // Touch effect: spotlight sweep
            card.addEventListener('touchstart', function() {
                card.classList.add('touched');
                setTimeout(() => card.classList.remove('touched'), 700);
            });
        } else {
            const filmstrip = card.querySelector('.desktop-filmstrip');
            if (filmstrip) filmstrip.style.display = '';
        }
        
        // Attach event listener for follow button
        card.querySelectorAll('.follow-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-user-id');
                toggleFollow(this, userId);
            });
        });
        
        grid.appendChild(card);
    });
}

// On DOMContentLoaded, setup crew search filters if on crew-search.html
if (window.location.pathname.includes('crew-search.html')) {
    document.addEventListener('DOMContentLoaded', setupCrewSearchFilters);
}

// Setup connection tabs functionality
function setupConnectionTabs() {
    const followingTab = document.getElementById('followingTab');
    const followersTab = document.getElementById('followersTab');
    const followingContent = document.getElementById('followingContent');
    const followersContent = document.getElementById('followersContent');
    
    if (followingTab && followersTab) {
        followingTab.addEventListener('click', async () => {
            // Update tab states
            followingTab.classList.add('active');
            followersTab.classList.remove('active');
            followingContent.classList.add('active');
            followersContent.classList.remove('active');
            
            // Load following data
            await loadFollowing();
        });
        
        followersTab.addEventListener('click', async () => {
            // Update tab states
            followersTab.classList.add('active');
            followingTab.classList.remove('active');
            followersContent.classList.add('active');
            followingContent.classList.remove('active');
            
            // Load followers data
            await loadFollowers();
        });
    }
    
    // Setup search functionality for connections
    const followingSearchInput = document.getElementById('followingSearchInput');
    const followersSearchInput = document.getElementById('followersSearchInput');
    
    if (followingSearchInput) {
        followingSearchInput.addEventListener('input', debounce(async (e) => {
            const searchTerm = e.target.value.toLowerCase();
            await filterConnections('following', searchTerm);
        }, 300));
    }
    
    if (followersSearchInput) {
        followersSearchInput.addEventListener('input', debounce(async (e) => {
            const searchTerm = e.target.value.toLowerCase();
            await filterConnections('followers', searchTerm);
        }, 300));
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter connections based on search term
async function filterConnections(type, searchTerm) {
    try {
        const endpoint = type === 'following' ? '/api/profile/my-following' : '/api/profile/my-followers';
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.ok) {
            const users = await response.json();
            const filteredUsers = users.filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                (user.role && user.role.toLowerCase().includes(searchTerm)) ||
                (user.location && user.location.toLowerCase().includes(searchTerm)) ||
                (user.skills && user.skills.some(skill => skill.toLowerCase().includes(searchTerm)))
            );
            
            const gridId = type === 'following' ? 'followingGrid' : 'followersGrid';
            const grid = document.getElementById(gridId);
            
            if (grid) {
                grid.innerHTML = '';
                
                if (filteredUsers.length === 0) {
                    const noResultsText = searchTerm ? 
                        `No ${type} found matching "${searchTerm}"` : 
                        `You don't have any ${type} yet.`;
                    grid.innerHTML = `<div class="no-results"><i class="fas fa-${type === 'following' ? 'user-plus' : 'users'}"></i><p>${noResultsText}</p></div>`;
                    return;
                }
                
                renderConnectionProfiles(filteredUsers, grid, type);
            }
        }
    } catch (error) {
        console.error(`Error filtering ${type}:`, error);
    }
}

// Update feature counts
async function updateFeatureCounts() {
    try {
        // Get total users count for Find Crew tab (excluding current user and followed users)
        const searchResponse = await fetch('/api/profile/search?limit=1', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            const findCrewTab = document.getElementById('findCrewTab');
            if (findCrewTab) {
                const featureCount = findCrewTab.querySelector('.feature-count');
                if (featureCount) {
                    featureCount.textContent = searchData.total || 0;
                }
            }
        }
        
        // Get connections count for My Connections tab
        const connectionsResponse = await fetch('/api/profile/my-connections', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (connectionsResponse.ok) {
            const connectionsData = await connectionsResponse.json();
            const myConnectionsTab = document.getElementById('myConnectionsTab');
            if (myConnectionsTab) {
                const featureCount = myConnectionsTab.querySelector('.feature-count');
                if (featureCount) {
                    featureCount.textContent = connectionsData.total_connections || 0;
                }
            }
        }
    } catch (error) {
        console.error('Error updating feature counts:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Setup connection tabs if on crew-search page
    if (window.location.pathname.includes('crew-search.html')) {
        setupConnectionTabs();
        updateFeatureCounts();
    }
    
    // Mobile pagination for crew search page
    const gridWrapper = document.getElementById('profileGridWrapper');
    const grid = gridWrapper ? gridWrapper.querySelector('.profile-grid') : null;
    const controls = document.getElementById('paginationControls');
    if (grid && controls) {
        const cards = Array.from(grid.children);
        let currentPage = 1;
        const perPage = window.innerWidth <= 600 ? 4 : cards.length;
        function renderPage(page) {
            const start = (page - 1) * perPage;
            const end = start + perPage;
            cards.forEach((card, i) => {
                card.style.display = (i >= start && i < end) ? '' : 'none';
            });
            renderControls(page);
        }
        function renderControls(page) {
            const totalPages = Math.ceil(cards.length / perPage);
            controls.innerHTML = '';
            if (totalPages <= 1) return;
            for (let i = 1; i <= totalPages; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.className = i === page ? 'active' : '';
                btn.onclick = () => renderPage(i);
                controls.appendChild(btn);
            }
        }
        function handleResize() {
            const newPerPage = window.innerWidth <= 600 ? 4 : cards.length;
            if (newPerPage !== perPage) {
                perPage = newPerPage;
                renderPage(1);
            }
        }
        window.addEventListener('resize', handleResize);
        renderPage(1);
    }
    
    // Feature tab switching
    const findCrewTab = document.getElementById('findCrewTab');
    const myConnectionsTab = document.getElementById('myConnectionsTab');
    const findCrewContent = document.getElementById('findCrewContent');
    const myConnectionsContent = document.getElementById('myConnectionsContent');
    
    if (findCrewTab && myConnectionsTab) {
        findCrewTab.addEventListener('click', () => {
            findCrewTab.classList.add('active');
            myConnectionsTab.classList.remove('active');
            findCrewContent.style.display = 'block';
            myConnectionsContent.style.display = 'none';
        });
        
        myConnectionsTab.addEventListener('click', async () => {
            myConnectionsTab.classList.add('active');
            findCrewTab.classList.remove('active');
            findCrewContent.style.display = 'none';
            myConnectionsContent.style.display = 'block';
            
            // Load connections when tab is clicked
            await loadMyConnections();
        });
    }
    
    // Activate My Connections tab if URL hash is #my-connections
    if (window.location.hash === '#my-connections') {
        if (myConnectionsTab && findCrewTab) {
            myConnectionsTab.click();
        }
    }

    // Live search for Find Crew
    const findCrewSearchInput = document.getElementById('findCrewSearchInput');
    if (findCrewSearchInput && grid) {
        findCrewSearchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            Array.from(grid.children).forEach(card => {
                const name = card.querySelector('h3')?.textContent?.toLowerCase() || '';
                const role = card.querySelector('.role')?.textContent?.toLowerCase() || '';
                const skills = Array.from(card.querySelectorAll('.skill-tag')).map(s => s.textContent.toLowerCase()).join(' ');
                if (name.includes(query) || role.includes(query) || skills.includes(query)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
            // Optionally update pagination here if needed
        });
    }

    // Live search for My Connections (placeholder, add real logic when connections are implemented)
    const myConnectionsSearchInput = document.getElementById('myConnectionsSearchInput');
    const myConnectionsGrid = document.querySelector('#myConnectionsContent .profile-grid');
    if (myConnectionsSearchInput && myConnectionsGrid) {
        myConnectionsSearchInput.addEventListener('input', function() {
            const query = this.value.trim().toLowerCase();
            Array.from(myConnectionsGrid.children).forEach(card => {
                const name = card.querySelector('h3')?.textContent?.toLowerCase() || '';
                if (name.includes(query)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Dashboard stat card startup animation
    document.querySelectorAll('.stat-card').forEach((card, i) => {
        card.style.animation = 'none';
        // Force reflow
        void card.offsetWidth;
        card.style.animation = '';
        card.classList.remove('stat-card-animated');
        setTimeout(() => {
            card.classList.add('stat-card-animated');
        }, 80 * i);
    });

    // Profile Dropdown Toggle Logic
    const userProfile = document.querySelector('.user-profile');
    const profileDropdown = document.querySelector('.profile-dropdown');
    
    if (userProfile && profileDropdown) {
        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking anywhere else
        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }
}); 