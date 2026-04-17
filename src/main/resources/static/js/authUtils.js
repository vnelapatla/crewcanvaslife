// Auth utility for login/signup only
const AuthUtils = {
    // Constants
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    HOME_URL: 'home.html',
    // API base URL for the backend server - Use port 80 for production, 8080 for development
    API_BASE_URL: window.location.origin,

    // Set auth data
    setAuth(token, user) {
        try {
            console.log('Setting auth data:', {
                token: token ? 'present' : 'missing',
                user: user
            });

            // Ensure user object has all required fields
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture
            };

            console.log('Storing user data:', userData);

            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(userData));

            // Verify the data was stored correctly
            const storedUser = localStorage.getItem(this.USER_KEY);
            console.log('Stored user data:', storedUser ? JSON.parse(storedUser) : 'not found');

            return true;
        } catch (error) {
            console.error('Error setting auth data:', error);
            return false;
        }
    },

    // Handle Google login
    handleGoogleLogin() {
        window.location.href = `${this.API_BASE_URL}/auth/google`;
    },

    // Handle regular login
    async handleLogin(email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            if (!data.token) {
                throw new Error(data.message || 'Login failed');
            }

            // Fetch complete user profile
            const profileResponse = await fetch(`${this.API_BASE_URL}/api/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${data.token}`
                }
            });

            if (!profileResponse.ok) {
                throw new Error('Failed to fetch user profile');
            }

            const profileData = await profileResponse.json();
            
            if (this.setAuth(data.token, profileData)) {
                // Check if there's a redirect URL stored
                const redirectUrl = localStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.replace(redirectUrl);
                } else {
                    window.location.replace(this.HOME_URL);
                }
            } else {
                throw new Error('Failed to set auth data');
            }
        } catch (error) {
            throw error;
        }
    },

    // Handle signup
    async handleSignup(name, email, password) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();
            if (!data.token) {
                throw new Error(data.message || 'Signup failed');
            }

            if (this.setAuth(data.token, data.user)) {
                // Check if there's a redirect URL stored
                const redirectUrl = localStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    localStorage.removeItem('redirectAfterLogin');
                    window.location.replace(redirectUrl);
                } else {
                    window.location.replace(this.HOME_URL);
                }
            } else {
                throw new Error('Failed to set auth data');
            }
        } catch (error) {
            // Show backend error message if available
            if (error && error.message) {
                // Use showMessage if available, otherwise fallback to console
                if (typeof showMessage === 'function') {
                    showMessage(error.message, 'error');
                } else {
                    console.error('Signup error:', error.message);
                }
            } else {
                if (typeof showMessage === 'function') {
                    showMessage('Signup failed. Please try again.', 'error');
                } else {
                    console.error('Signup failed. Please try again.');
                }
            }
            throw error;
        }
    }
};

// Export the auth utility
window.AuthUtils = AuthUtils; 