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

        try {
            // Load current user profile
            const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
            if (response.ok) {
                this.user = await response.json();
                this.updateGlobalHeader();
                this.loadConnections();
            }
        } catch (error) {
            console.error('ProfileHandler Initialization failed:', error);
        }
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
        const buttons = document.querySelectorAll('.follow-btn-dynamic');
        buttons.forEach(btn => {
            const targetId = parseInt(btn.getAttribute('data-user-id'));
            if (this.isFollowing(targetId)) {
                btn.classList.add('following');
                btn.innerText = 'Following';
            } else {
                btn.classList.remove('following');
                btn.innerText = 'Follow';
            }
        });
    },

    /**
     * Toggle Follow/Unfollow with real-time UI updates
     */
    async toggleFollow(userId, buttonElement) {
        const followerId = localStorage.getItem('userId');
        if (!followerId) {
            showMessage('Please login to follow users', 'error');
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
                    showMessage('Unfollowed user', 'info');
                } else {
                    this.followingIds.push(parseInt(userId));
                    showMessage('Following user', 'success');
                }
                this.syncFollowButtons();
            } else {
                const err = await response.text();
                showMessage(err || 'Connection update failed', 'error');
            }
        } catch (error) {
            console.error('Follow toggle error:', error);
            showMessage('Connection error', 'error');
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
                         ${renderAvatar(user, 'p-card-avatar')}
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
     * Update global header elements like initials
     */
    updateGlobalHeader() {
        if (!this.user) return;
        const name = this.user.name || 'User';
        const initials = getAvatarFallback(name);

        const initialsElements = document.querySelectorAll('.user-initials');
        initialsElements.forEach(el => el.innerText = initials);

        // Also update any avatar images in the header
        const avatarContainers = document.querySelectorAll('.header-avatar-container');
        avatarContainers.forEach(container => {
            container.innerHTML = renderAvatar(this.user, 'nav-avatar');
        });

        const nameElements = document.querySelectorAll('#currentUserName, .user-name');
        nameElements.forEach(el => el.innerText = name);
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
    if (!e.target.closest('.user-profile-box')) {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) dropdown.classList.remove('active');
    }
});

// Auto-init on script load
ProfileHandler.init();
