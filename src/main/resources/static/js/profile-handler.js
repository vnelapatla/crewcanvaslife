/**
 * Profile Handler for CrewCanvas
 * Handles connections (Follow/Unfollow) and dynamic profile interactions
 */
const ProfileHandler = {
    followingSet: new Set(),
    followerSet: new Set(),
    isInitialized: false,
    initPromise: null,
    
    async init() {
        if (this.initPromise) return this.initPromise;
        
        this.initPromise = (async () => {
            const currentUserId = getCurrentUserId();
            if (!currentUserId) return;

            try {
                // Fetch following/followers in parallel
                const [followingRes, followersRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/profile/${currentUserId}/following?t=${Date.now()}`),
                    fetch(`${API_BASE_URL}/api/profile/${currentUserId}/followers?t=${Date.now()}`)
                ]);

                if (followingRes.ok) {
                    const following = await followingRes.json();
                    following.forEach(u => this.followingSet.add(parseInt(u.id || u.userId)));
                }

                if (followersRes.ok) {
                    const followers = await followersRes.json();
                    followers.forEach(u => this.followerSet.add(parseInt(u.id || u.userId)));
                }

                console.log(`ProfileHandler: Loaded ${this.followingSet.size} following, ${this.followerSet.size} followers`);
                this.updateHeader();
                this.isInitialized = true;
            } catch (e) {
                console.error("ProfileHandler Init Error:", e);
            }
        })();
        
        return this.initPromise;
    },

    isFollowing(userId) {
        return this.followingSet.has(parseInt(userId));
    },

    isFollower(userId) {
        return this.followerSet.has(parseInt(userId));
    },

    async toggleFollow(targetId, btnElement) {
        const currentUserId = getCurrentUserId();
        if (!currentUserId) {
            window.location.href = 'index.html';
            return;
        }

        const isFollowing = this.isFollowing(targetId);
        const url = `${API_BASE_URL}/api/profile/${targetId}/${isFollowing ? 'unfollow' : 'follow'}?followerId=${currentUserId}`;
        const method = isFollowing ? 'DELETE' : 'POST';

        try {
            if (btnElement) {
                btnElement.disabled = true;
                btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }

            const res = await fetch(url, { method });
            if (res.ok) {
                if (isFollowing) {
                    this.followingSet.delete(parseInt(targetId));
                } else {
                    this.followingSet.add(parseInt(targetId));
                }
                
                // Trigger UI updates
                this.broadcastUpdate(targetId, !isFollowing);
                if (typeof refreshProfileData === 'function') refreshProfileData();
            } else {
                const msg = await res.text();
                if (typeof showMessage === 'function') showMessage(msg, 'error');
            }
        } catch (e) {
            console.error("Follow Toggle Error:", e);
        } finally {
            if (btnElement) btnElement.disabled = false;
        }
    },

    broadcastUpdate(targetId, newState) {
        // Update any follow buttons on the page for this user
        const buttons = document.querySelectorAll(`[data-user-id="${targetId}"]`);
        buttons.forEach(btn => {
            if (btn.classList.contains('btn-follow') || btn.classList.contains('btn-following') || btn.classList.contains('action-btn')) {
                const isActionBtn = btn.classList.contains('action-btn');
                if (isActionBtn) {
                    btn.className = `action-btn btn-primary btn-follow ${newState ? 'following' : ''}`;
                    btn.innerHTML = `<i class="fa-solid ${newState ? 'fa-check' : 'fa-user-plus'}"></i> ${newState ? 'Following' : 'Follow'}`;
                } else {
                    btn.className = newState ? 'btn-following' : 'btn-follow';
                    btn.innerHTML = newState ? '<i class="fas fa-user-minus"></i> Unfollow' : '<i class="fas fa-user-plus"></i> Follow';
                }
            }
        });

        // Update follower count labels if they exist
        const countLabel = document.getElementById(`followers-count-${targetId}`);
        if (countLabel) {
            let val = parseInt(countLabel.innerText) || 0;
            countLabel.innerText = newState ? val + 1 : Math.max(0, val - 1);
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
        if (dropdown && trigger && !trigger.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
});
