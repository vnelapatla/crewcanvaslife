/**
 * Notifications Page Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadNotifications();
});

async function loadNotifications() {
    const userId = getCurrentUserId();
    if (!userId) return;

    const list = document.getElementById('notificationsList');
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/notifications/${userId}`);
        if (response.ok) {
            const notifications = await response.json();
            renderNotifications(notifications);
        } else {
            list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load notifications.</p></div>';
        }
    } catch (error) {
        console.error('Error fetching notifications:', error);
        list.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error connecting to server.</p></div>';
    }
}

function renderNotifications(notifications) {
    const list = document.getElementById('notificationsList');
    if (notifications.length === 0) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-bell-slash"></i><p>No notifications yet.</p></div>';
        return;
    }

    list.innerHTML = notifications.map(n => {
        const typeClass = getNotifTypeClass(n.type);
        const avatarHtml = n.actorAvatar ? 
            `<img src="${n.actorAvatar}" alt="${n.actorName}">` : 
            renderAvatarFallback(n.actorName || 'System', '', '42px');

        return `
            <div class="notif-card ${n.read ? '' : 'unread'}" onclick="handleNotifClick(${n.id}, '${n.type}', '${n.targetId}')">
                <div class="notif-avatar-box">
                    ${avatarHtml}
                </div>
                <div class="notif-info">
                    <p><strong>${n.actorName || 'System'}</strong> ${n.content}</p>
                    <div class="notif-meta">
                        <span class="notif-type-tag ${typeClass}">${n.type}</span>
                        <span class="notif-time">${formatDate(n.createdAt)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getNotifTypeClass(type) {
    if (!type) return '';
    switch(type.toUpperCase()) {
        case 'FOLLOW': return 'tag-follow';
        case 'LIKE': return 'tag-like';
        case 'COMMENT': return 'tag-comment';
        case 'MESSAGE': return 'tag-message';
        case 'SHORTLIST':
        case 'REJECT':
        case 'APPLICATION': return 'tag-event';
        default: return '';
    }
}

async function handleNotifClick(id, type, targetId) {
    // Re-use logic from NotificationHandler in utils.js
    if (typeof NotificationHandler !== 'undefined') {
        NotificationHandler.handleNotificationClick(id, type, targetId);
    }
}

async function markAllRead() {
    if (typeof NotificationHandler !== 'undefined') {
        await NotificationHandler.markAllAsRead();
        loadNotifications(); // Refresh list
    }
}

async function clearAllNotifs() {
    if (typeof NotificationHandler !== 'undefined') {
        await NotificationHandler.clearAllNotifications();
    }
}
