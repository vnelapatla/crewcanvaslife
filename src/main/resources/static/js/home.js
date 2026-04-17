document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const userName = localStorage.getItem('userName');
    const userPicture = localStorage.getItem('userPicture');

    if (!isAuthenticated) {
        window.location.href = 'index.html';
        return;
    }

    // Update user name in welcome message
    const welcomeUserName = document.getElementById('userName');
    if (welcomeUserName) {
        welcomeUserName.textContent = userName;
    }

    // Update user name in top navigation
    const topNavUserName = document.querySelector('.user-name');
    if (topNavUserName) {
        topNavUserName.textContent = userName;
    }

    // Update profile picture if available
    const profilePicture = document.querySelector('.user-profile img');
    if (profilePicture && userPicture) {
        profilePicture.src = userPicture;
    }

    // Handle logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Clear all stored data
            localStorage.clear();
            // Redirect to login page
            window.location.href = 'index.html';
        });
    }



    // Handle navigation clicks
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const href = item.getAttribute('href');
            window.location.href = href;
        });
    });

    // Handle search functionality
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', (e) => {
        // Here you would implement search functionality
        console.log('Searching for:', e.target.value);
    });

    // Handle notifications
    const notifications = document.querySelector('.notifications');
    notifications.addEventListener('click', () => {
        // Here you would implement notifications panel
        alert('Notifications panel would open here');
    });

    // Add hover effects to stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.1)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        });
    });

    // Add hover effects to activity items
    const activityItems = document.querySelectorAll('.activity-item');
    activityItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = '#FAFAFA';
        });

        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
    });

    // Make CrewCanvas logo clickable to go to home page
    const logo = document.querySelector('.sidebar .logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.location.href = 'feed.html';
        });
    }

    // Scroll Indicator
    const scrollIndicator = document.querySelector('.scroll-indicator');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            scrollIndicator.classList.add('hidden');
        } else {
            scrollIndicator.classList.remove('hidden');
        }
    });
}); 