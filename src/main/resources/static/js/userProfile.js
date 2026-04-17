// Function to fetch and update user profile data
async function updateUserProfile() {
    const token = localStorage.getItem('token');
    if (!token) {
        return; // Just return if no token, don't redirect
    }

    try {
        const response = await fetch('https://api.crewcanvas.in/api/profile', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        console.log('User data received:', userData);

        // Update user name in welcome message if it exists
        const welcomeUserName = document.getElementById('userName');
        if (welcomeUserName) {
            welcomeUserName.textContent = userData.name;
        }

        // Update user name in top navigation
        const topNavUserName = document.querySelector('.user-name');
        if (topNavUserName) {
            topNavUserName.textContent = userData.name;
        }

        // Update profile picture
        const profilePicture = document.querySelector('.user-profile img');
        if (profilePicture) {
            console.log('Updating profile picture in top nav:', userData.picture);
            if (userData.picture && userData.picture !== 'null' && userData.picture !== 'undefined') {
                profilePicture.src = userData.picture;
                
                // Add error handling
                profilePicture.onerror = function() {
                    console.log('Failed to load profile picture in top nav, using fallback');
                    profilePicture.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`;
                };
            } else {
                profilePicture.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=random`;
            }
            profilePicture.alt = userData.name;
        }

        // Store user data in localStorage for quick access
        localStorage.setItem('userName', userData.name);
        if (userData.picture) {
            localStorage.setItem('userPicture', userData.picture);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        // Don't redirect on error, just log it
    }
}

// Function to handle logout
function handleLogout() {
    localStorage.clear();
    window.location.href = 'index.html';
}

// Function to handle profile dropdown
function setupProfileDropdown() {
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        userProfile.addEventListener('click', () => {
            const dropdown = document.querySelector('.profile-dropdown');
            dropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userProfile.contains(e.target)) {
                const dropdown = document.querySelector('.profile-dropdown');
                if (dropdown.classList.contains('show')) {
                    dropdown.classList.remove('show');
                }
            }
        });
    }
}

// Initialize user profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Update user profile if token exists
    if (localStorage.getItem('token')) {
        updateUserProfile();
    }

    // Setup profile dropdown
    setupProfileDropdown();

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
}); 