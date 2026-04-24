/**
 * Profile Handler for CrewCanvas
 * Handles connections, followers, and dynamic profile interactions
 */
const ProfileHandler = {
    followingIds: [],
    
    async init() {
        // Update header immediately from cache
        this.updateHeader();
        
        // Then load dynamic data
        await this.loadFollowings();
        this.syncFollowButtons();
    },

    async loadFollowings() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/profile/${userId}/following`);
            if (response.ok) {
                const following = await response.json();
                this.followingIds = following.map(u => u.id);
            }
        } catch (error) {
            console.error('Error loading followings:', error);
        }
    },

    isFollowing(userId) {
        return this.followingIds.includes(parseInt(userId));
    },

    syncFollowButtons() {
        document.querySelectorAll('.follow-btn').forEach(btn => {
            const userId = btn.getAttribute('data-user-id');
            if (this.isFollowing(userId)) {
                btn.innerHTML = '<i class="fas fa-check"></i> Following';
                btn.classList.add('following');
            } else {
                btn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
                btn.classList.remove('following');
            }
        });
    },

    async toggleFollow(userId, btnElement) {
        const currentUserId = localStorage.getItem('userId');
        if (!currentUserId) {
            window.location.href = 'login.html';
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
                    if (typeof showMessage === 'function') showMessage('Unfollowed user', 'success');
                } else {
                    this.followingIds.push(parseInt(userId));
                    if (typeof showMessage === 'function') showMessage('Following user', 'success');
                }
                this.syncFollowButtons();
                if (typeof refreshProfileData === 'function') {
                    refreshProfileData();
                } else if (typeof loadProfile === 'function') {
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
