// Settings Functionality for CrewCanvas
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadSettings();
});

async function loadSettings() {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
        if (res.ok) {
            const user = await res.json();
            
            // Set Privacy
            document.getElementById('profileVisibility').value = user.profileVisibility || 'Everyone';
            document.getElementById('messagePermissions').value = user.messagePermissions || 'Everyone';
            
            // Set Notifications
            document.getElementById('emailNotifications').checked = user.emailNotifications !== false;
            document.getElementById('followerNotifications').checked = user.followerNotifications !== false;
            document.getElementById('eventReminders').checked = user.eventReminders !== false;
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

async function updatePassword() {
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmPassword').value;
    const userId = getCurrentUserId();

    if (!newPass || newPass !== confirmPass) {
        showMessage("Passwords do not match!", "error");
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userId}/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: newPass })
        });

        if (res.ok) {
            showMessage("Password updated successfully!", "success");
            // Clear fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            const errorMsg = await res.text();
            showMessage(`Failed to update password: ${errorMsg || res.statusText}`, "error");
        }
    } catch (error) {
        console.error('Error updating password:', error);
        showMessage("An error occurred", "error");
    }
}

async function updatePrivacy() {
    const userId = getCurrentUserId();
    const privacyData = {
        id: userId,
        profileVisibility: document.getElementById('profileVisibility').value,
        messagePermissions: document.getElementById('messagePermissions').value
    };

    saveSettings(privacyData);
}

async function updateNotifications() {
    const userId = getCurrentUserId();
    const notificationData = {
        id: userId,
        emailNotifications: document.getElementById('emailNotifications').checked,
        followerNotifications: document.getElementById('followerNotifications').checked,
        eventReminders: document.getElementById('eventReminders').checked
    };

    saveSettings(notificationData);
}

async function saveSettings(data) {
    try {
        const userId = parseInt(data.id);
        if (isNaN(userId)) {
            showMessage("Invalid User ID", "error");
            return;
        }

        // Fetch current user first to avoid overwriting other fields with null
        const currentRes = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
        const currentUser = await currentRes.json();
        
        const updatedUser = { ...currentUser, ...data, id: userId };
        console.log('Saving settings:', updatedUser);

        const res = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        if (res.ok) {
            showMessage("Settings saved successfully", "success");
        } else {
            const err = await res.text();
            showMessage(`Save failed: ${res.status} ${err}`, "error");
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage("Connection error", "error");
    }
}

async function deleteAccount() {
    if (!confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
        return;
    }

    const userId = getCurrentUserId();
    try {
        const res = await fetch(`${API_BASE_URL}/api/profile/${userId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            showMessage("Account deleted successfully", "success");
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'login.html';
            }, 2000);
        } else {
            const errorMsg = await res.text();
            showMessage(`Failed to delete account: ${errorMsg || res.statusText}`, "error");
        }
    } catch (error) {
        console.error('Error deleting account:', error);
    }
}
