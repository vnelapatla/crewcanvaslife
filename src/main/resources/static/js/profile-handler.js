/**
 * Profile Handler for CrewCanvas
 * Handles connections, followers, and dynamic profile interactions
 */
const ProfileHandler = {
    followingIds: [],
    followerIds: [],
    isInitialized: false,
    initPromise: null,
    
    async init() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            // Update header immediately from cache
            this.updateHeader();
            
            // Then load dynamic data
            await Promise.all([
                this.loadFollowings(),
                this.loadFollowers()
            ]);
            
            this.isInitialized = true;
            this.syncFollowButtons();
        })();
        
        return this.initPromise;
    },

    async loadFollowers() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/followers?t=${Date.now()}`);
            if (response.ok) {
                const followers = await response.json();
                this.followerIds = followers.map(u => parseInt(getUserId(u)));
            }
        } catch (error) {
            console.error('Error loading followers:', error);
        }
    },

    async loadFollowings() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/following?t=${Date.now()}`);
            if (response.ok) {
                const followings = await response.json();
                this.followingIds = followings.map(u => parseInt(getUserId(u)));
            }
        } catch (error) {
            console.error('Error loading followings:', error);
        }
    },

    isFollowing(userId) {
        return this.followingIds.includes(parseInt(userId));
    },

    isFollower(userId) {
        return this.followerIds.includes(parseInt(userId));
    },

    isMutual(userId) {
        const id = parseInt(userId);
        return this.followingIds.includes(id) && this.followerIds.includes(id);
    },

    syncFollowButtons() {
        document.querySelectorAll('.follow-btn, .btn-follow').forEach(btn => {
            const userId = btn.getAttribute('data-user-id');
            if (!userId) return;
            
            const following = this.isFollowing(userId);
            if (following) {
                btn.innerHTML = '<i class="fa-solid fa-check"></i> Following';
                btn.classList.add('following');
            } else {
                btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Follow';
                btn.classList.remove('following');
            }
        });
    },

    async toggleFollow(userId, btnElement) {
        const currentUserId = localStorage.getItem('userId');
        if (!currentUserId) {
            window.location.href = 'index.html';
            return;
        }

        const isFollowing = this.isFollowing(userId);
        const method = isFollowing ? 'DELETE' : 'POST';
        const endpoint = isFollowing ? 
            `${API_BASE_URL}/api/profile/${userId}/unfollow?followerId=${currentUserId}` :
            `${API_BASE_URL}/api/profile/${userId}/follow?followerId=${currentUserId}`;

        try {
            const response = await fetch(endpoint, { method });
            if (response.ok) {
                if (isFollowing) {
                    this.followingIds = this.followingIds.filter(id => id !== parseInt(userId));
                    if (typeof showMessage === 'function') showMessage('Unfollowed', 'success');
                } else {
                    this.followingIds.push(parseInt(userId));
                    if (typeof showMessage === 'function') showMessage('You are now following!', 'success');
                }
                this.syncFollowButtons();
                
                // If on crew-search page, we might need to refresh UI
                if (typeof switchSearchTab === 'function' && typeof currentSearchTab !== 'undefined') {
                    if (currentSearchTab === 'find' && !isFollowing) {
                        // In find tab, follow means user should disappear
                        const btn = document.getElementById(`follow-btn-${userId}`);
                        const card = btn ? btn.closest('.crew-card') : null;
                        if (card) {
                            card.style.opacity = '0';
                            setTimeout(() => card.remove(), 300);
                        }
                    }
                }
                if (typeof refreshProfileData === 'function') {
                    refreshProfileData();
                } else if (typeof loadProfile === 'function') {
                    loadProfile();
                }
            } else {
                if (typeof showMessage === 'function') showMessage('We couldn’t update your connection. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Follow toggle error:', error);
            if (typeof showMessage === 'function') showMessage('Network error. Please check your connection.', 'error');
        }
    },

    updateHeader() {
        const isAdmin = getCurrentUserIsAdmin();
        const adminBadge = isAdmin ? '<span style="background:var(--primary-orange); color:#fff; font-size:9px; padding:2px 6px; border-radius:10px; margin-left:5px; font-weight:800; vertical-align:middle; text-transform:uppercase;">ADMIN</span>' : '';
        
        const nameHeader = document.getElementById('userNameHeader');
        if (nameHeader) {
            const name = localStorage.getItem('userName') || 'User';
            nameHeader.innerHTML = name + adminBadge;
        }
    },

    toggleProfileDropdown() {
        const dropdown = document.getElementById('profileDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }
};

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
    ProfileHandler.init();
    
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('profileDropdown');
        const trigger = document.querySelector('.user-profile-box');
        if (dropdown && !trigger.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
});
