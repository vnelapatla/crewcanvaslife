/**
 * Profile Handler - The Core Engine for CrewCanvas
 * Manages global user state, follows, and dynamic UI updates across multiple pages.
 */

const ProfileHandler = {
    user: null,
    followingIds: [],

    /**
     * Initialize the core engine
     */
    async init() {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            console.warn('No user session found for ProfileHandler');
            return;
        }

        // --- OPTIMIZATION: Immediate UI update from cache ---
        const cachedName = localStorage.getItem('userName');
        if (cachedName) {
            this.user = { name: cachedName, profilePicture: localStorage.getItem('userAvatar') };
            this.updateGlobalHeader();
        }

        try {
            // Load current user profile from server for latest data
            const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
            if (response.ok) {
                this.user = await response.json();
                
                // Sync to localStorage
                localStorage.setItem('userName', this.user.name);
                if (this.user.profilePicture) {
                    localStorage.setItem('userAvatar', this.user.profilePicture);
                }
                
                this.updateGlobalHeader();
                this.loadConnections();
            }
        } catch (error) {
            console.error('ProfileHandler Initialization failed:', error);
        }
    },

    /**
     * Force refresh the user data
     */
    async refresh() {
        await this.init();
    },

    /**
     * Load current user's connections (following list)
     */
    async loadConnections() {
        if (!this.user) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/${this.user.id}/following`);
            if (response.ok) {
                const following = await response.json();
                this.followingIds = following.map(u => u.id);
                this.syncFollowButtons();
            }
        } catch (error) {
            console.error('Error loading connections:', error);
        }
    },

    /**
     * Sync all follow buttons on the current page with correct state
     */
    syncFollowButtons() {
        const buttons = document.querySelectorAll('.follow-btn-dynamic, .action-button');
        buttons.forEach(btn => {
            const userIdAttr = btn.getAttribute('data-user-id');
            if (!userIdAttr) return;
            
            const targetId = parseInt(userIdAttr);
            const isFollowing = this.isFollowing(targetId);
            
            if (btn.classList.contains('follow-btn-dynamic')) {
                if (isFollowing) {
                    btn.classList.add('following');
                    btn.innerText = 'Following';
                } else {
                    btn.classList.remove('following');
                    btn.innerText = 'Follow';
                }
            } else if (btn.id === 'actionButton') {
                // Support for profile.js style buttons
                btn.textContent = isFollowing ? 'Unfollow' : 'Follow';
            }
        });
    },

    /**
     * Check if current user is following target user
     */
    isFollowing(targetId) {
        return this.followingIds.includes(parseInt(targetId));
    },

    /**
     * Toggle Follow/Unfollow with real-time UI updates
     */
    async toggleFollow(userId, buttonElement) {
        const followerId = localStorage.getItem('userId');
        if (!followerId) {
            if (typeof showMessage === 'function') showMessage('Please login to follow users', 'error');
            return;
        }

        const isCurrentlyFollowing = this.isFollowing(userId);
        const url = `${API_BASE_URL}/api/profile/${userId}/${isCurrentlyFollowing ? 'unfollow' : 'follow'}?followerId=${followerId}`;
        const method = isCurrentlyFollowing ? 'DELETE' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                if (isCurrentlyFollowing) {
                    this.followingIds = this.followingIds.filter(id => id !== parseInt(userId));
                    if (typeof showMessage === 'function') showMessage('Unfollowed user', 'info');
                } else {
                    this.followingIds.push(parseInt(userId));
                    if (typeof showMessage === 'function') showMessage('Following user', 'success');
                }
                this.syncFollowButtons();
                
                // If we are on profile.html and looking at this user, we might want to reload stats
                if (typeof loadProfile === 'function') {
                    loadProfile();
                }
            } else {
                const err = await response.text();
                if (typeof showMessage === 'function') showMessage(err || 'Connection update failed', 'error');
            }
        } catch (error) {
            console.error('Follow toggle error:', error);
            if (typeof showMessage === 'function') showMessage('Connection error', 'error');
        }
    },

    /**
     * Dynamic content loader for templates
     */
    renderProfileCard(user) {
        if (!user) return '';
        const isFollowed = this.isFollowing(user.id);
        const isOwn = user.id == localStorage.getItem('userId');

        return `
            <div class="profile-card">
                <div class="p-card-header" style="background: url('${user.coverImage || 'images/default-cover.jpg'}') center/cover"></div>
                <div class="p-card-body">
                    <div onclick="window.location.href='profile.html?userId=${user.id}'" style="cursor:pointer">
                         ${typeof renderAvatar === 'function' ? renderAvatar(user, 'p-card-avatar') : ''}
                    </div>
                    <h3 onclick="window.location.href='profile.html?userId=${user.id}'">${user.name || 'User'}</h3>
                    <p class="role-badge">${user.role || 'Professional'}</p>
                    <div class="p-card-stats">
                        <div><span>${user.followers || 0}</span><br>Followers</div>
                        <div><span>${user.following || 0}</span><br>Following</div>
                    </div>
                    ${!isOwn ? `
                        <button class="follow-btn-dynamic orange-btn ${isFollowed ? 'following' : ''}" 
                                data-user-id="${user.id}" 
                                onclick="ProfileHandler.toggleFollow(${user.id}, this)">
                            ${isFollowed ? 'Following' : 'Follow'}
                        </button>
                    ` : '<button class="orange-btn secondary" onclick="window.location.href=\'edit-profile.html\'">Edit Profile</button>'}
                </div>
            </div>
        `;
    },

    /**
     * Update global header elements like initials and names
     */
    updateGlobalHeader() {
        if (!this.user) return;
        const name = this.user.name || 'User';
        const initials = typeof getAvatarFallback === 'function' ? getAvatarFallback(name) : name[0];

        // 1. Update Initials
        const initialsElements = document.querySelectorAll('.user-initials, #userInitialsSmall, .mini-avatar');
        initialsElements.forEach(el => el.innerText = initials);

        // 2. Update Names
        const nameElements = document.querySelectorAll('#currentUserName, .user-name, #userNameHeader, .profile-btn span');
        nameElements.forEach(el => {
            if (el.id === 'userNameHeader') {
                el.innerText = name.toLowerCase();
            } else if (el.tagName === 'SPAN' && el.parentElement.classList.contains('profile-btn')) {
                el.innerText = name.split(' ')[0]; // Just first name for the menu
            } else {
                el.innerText = name;
            }
        });

        // 3. Update Avatars & Containers
        const containers = document.querySelectorAll('.header-avatar-container, #userAvatarSmall, .profile-btn, .user-profile-box');
        containers.forEach(container => {
            if (container.classList.contains('user-profile-box')) {
                // Keep the structure but update text/image
                const nameEl = container.querySelector('#userNameHeader, .user-name-label');
                if (nameEl) nameEl.innerText = name;
                
                const initialsEl = container.querySelector('#userInitialsSmall, .user-initials');
                if (initialsEl) initialsEl.innerText = initials;

                const imgEl = container.querySelector('img');
                if (imgEl && this.user.profilePicture) {
                    imgEl.src = this.user.profilePicture;
                    imgEl.style.display = 'block';
                    if (initialsEl) initialsEl.style.display = 'none';
                }
            } else if (container.classList.contains('profile-btn')) {
                const icon = container.querySelector('i');
                if (icon && this.user.profilePicture) {
                    icon.outerHTML = `<img src="${this.user.profilePicture}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`;
                }
            } else if (typeof renderAvatar === 'function') {
                container.innerHTML = renderAvatar(this.user, 'nav-avatar');
            }
        });

        // 4. Update specific images if they exist
        const avatarImg = document.getElementById('userAvatarImg');
        if (avatarImg && this.user.profilePicture) {
            avatarImg.src = this.user.profilePicture;
            avatarImg.style.display = 'block';
            const fallback = document.getElementById('userInitialsSmall');
            if (fallback) fallback.style.display = 'none';
        }
    },

    /**
     * Toggle the profile dropdown menu visibility
     */
    toggleProfileDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }
};

// Global click handler to close dropdowns
window.addEventListener('click', (e) => {
    // Check if click was outside the user profile box/dropdown button
    if (!e.target.closest('.user-profile-box')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});

// Auto-init on script load
document.addEventListener('DOMContentLoaded', () => {
    ProfileHandler.init();
});
