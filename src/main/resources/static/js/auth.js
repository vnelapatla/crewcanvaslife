// Debug logging function
function debugLog(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
}

// Auth utility for token verification and state management
const Auth = {
    // Constants
    TOKEN_KEY: 'token',
    USER_KEY: 'user',
    HOME_URL: '/home.html',
    LOGIN_URL: '/login.html',

    // Verify token validity
    verifyToken(token) {
        if (!token) return false;
        
        try {
            // Check token format
            const parts = token.split('.');
            if (parts.length !== 3) return false;

            // Decode and verify payload
            const payload = JSON.parse(atob(parts[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            // Check expiration
            if (!payload.exp || payload.exp < currentTime) {
                console.log('Token expired:', new Date(payload.exp * 1000));
                return false;
            }

            // Check if token has required fields
            if (!payload.user || !payload.user.id) {
                console.log('Token missing required fields');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    },

    // Get current auth state
    getAuthState() {
        const token = localStorage.getItem(this.TOKEN_KEY);
        const userStr = localStorage.getItem(this.USER_KEY);
        
        const isAuthenticated = this.verifyToken(token);
        let user = null;

        if (isAuthenticated && userStr) {
            try {
                user = JSON.parse(userStr);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }

        return { isAuthenticated, user, token };
    },

    // Set auth data
    setAuth(token, user) {
        if (!this.verifyToken(token)) {
            console.error('Invalid token provided to setAuth');
            return false;
        }

        try {
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            return true;
        } catch (error) {
            console.error('Error setting auth data:', error);
            return false;
        }
    },

    // Clear auth data
    clearAuth() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    },

    // Check if current page is login
    isLoginPage() {
        return window.location.pathname.endsWith('index.html') || 
               window.location.pathname.endsWith('login.html') ||
               window.location.pathname === '/';
    },

    // Check if current page is home
    isHomePage() {
        return window.location.pathname.endsWith('home.html');
    },

    // Handle auth state and redirects
    handleAuthState() {
        const { isAuthenticated } = this.getAuthState();
        
        // If on login page and authenticated, redirect to home
        if (this.isLoginPage() && isAuthenticated) {
            console.log('Already authenticated, redirecting to home');
            window.location.replace(this.HOME_URL);
            return;
        }

        // If on home page and not authenticated, redirect to login
        if (this.isHomePage() && !isAuthenticated) {
            console.log('Not authenticated, redirecting to login');
            window.location.replace(this.LOGIN_URL);
            return;
        }
    },

    // Initialize auth checks
    init() {
        // Check auth state on page load
        this.handleAuthState();

        // Listen for storage events (for multi-tab support)
        window.addEventListener('storage', (e) => {
            if (e.key === this.TOKEN_KEY || e.key === this.USER_KEY) {
                this.handleAuthState();
            }
        });
    }
};

// Export the Auth utility
window.Auth = Auth;

// Handle login
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    try {
        setLoading(true);
        const apiBaseUrl = window.location.origin;
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Login failed. Please try again.', 'error');
    } finally {
        setLoading(false);
    }
}

// Handle signup
async function handleSignup() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || !email || !password || !confirmPassword) {
        showMessage('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }

    try {
        setLoading(true);
        const apiBaseUrl = window.location.origin;
        const response = await fetch(`${apiBaseUrl}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Signup successful!', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        } else {
            showMessage(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        // Try to extract backend error message if available
        if (error instanceof Response) {
            error.json().then(errData => {
                showMessage(errData.message || 'Signup failed. Please try again.', 'error');
            }).catch(() => {
                showMessage('Signup failed. Please try again.', 'error');
            });
        } else if (error && error.message) {
            showMessage(error.message, 'error');
        } else {
            showMessage('Signup failed. Please try again.', 'error');
        }
        console.error('Signup error:', error);
    } finally {
        setLoading(false);
    }
}

// Handle social login
function handleSocialLogin(provider) {
    const apiBaseUrl = window.location.origin;
    window.location.href = `${apiBaseUrl}/auth/${provider}`;
}

// Add auth check on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== Login Page Auth Check ===');
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    console.log('Stored auth data:', {
        hasToken: !!token,
        hasUserData: !!userData
    });

    // If we have valid auth data, redirect to home
    if (token && userData) {
        try {
            // Verify token format
            const tokenParts = token.split('.');
            if (tokenParts.length !== 3) {
                throw new Error('Invalid token format');
            }

            // Parse user data
            const user = JSON.parse(userData);
            console.log('User already authenticated:', user);

            // Only redirect if we're on the login page
            if (window.location.pathname.includes('login.html')) {
                console.log('Redirecting to home...');
                window.location.replace('/home.html');
            }
        } catch (error) {
            console.error('Auth validation error:', error);
            // Clear invalid data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    // Add Google sign-in button handler
    const googleSignInBtn = document.querySelector('.social-btn.google');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Google sign-in button clicked');
            const apiBaseUrl = window.location.origin;
            window.location.href = `${apiBaseUrl}/auth/google`;
            });
    }
    });

// Handle auth callback
function handleAuthCallback() {
    console.log('=== Auth Callback Handler ===');
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const user = urlParams.get('user');
    const error = urlParams.get('error');

    console.log('URL Parameters:', {
        hasToken: !!token,
        hasUser: !!user,
        hasError: !!error
    });

    if (error) {
        console.error('Auth Error:', error);
        alert(error);
        window.location.href = '/login.html';
        return;
    }

    if (token && user) {
        try {
            console.log('Processing auth data...');
            const userData = JSON.parse(decodeURIComponent(user));
            console.log('User data:', userData);

            // Store auth data
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('Auth data stored in localStorage');

            // Force redirect to home
            console.log('Redirecting to home.html...');
            window.location.replace('/home.html');
        } catch (error) {
            console.error('Error processing auth data:', error);
            alert('Authentication failed. Please try again.');
            window.location.href = '/login.html';
        }
    }
}

// Check if we're on the callback page
if (window.location.pathname.includes('/auth/callback')) {
    console.log('On callback page, handling auth...');
    handleAuthCallback();
}

// Initialize social login buttons
document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('click', () => {
        const provider = btn.classList.contains('google') ? 'google' :
                        btn.classList.contains('facebook') ? 'facebook' :
                        btn.classList.contains('github') ? 'github' : null;
        
        if (provider) {
            handleSocialLogin(provider);
        }
    });
});

// Handle tab switching
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
        
        button.classList.add('active');
        document.getElementById(`${button.dataset.tab}Form`).classList.add('active');
    });
});

// Handle password visibility toggle
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const input = button.previousElementSibling;
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        button.classList.toggle('fa-eye');
        button.classList.toggle('fa-eye-slash');
        });
    });

    // Password strength indicator
    const passwordInput = document.getElementById('signupPassword');
    const strengthBar = document.querySelector('.strength-bar');

    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        let strength = 0;
        
        if (password.length >= 8) strength += 25;
        if (password.match(/[a-z]/)) strength += 25;
        if (password.match(/[A-Z]/)) strength += 25;
        if (password.match(/[0-9]/)) strength += 25;
        
        strengthBar.style.width = `${strength}%`;
        
        if (strength <= 25) {
            strengthBar.style.backgroundColor = '#FF2D55';
        } else if (strength <= 50) {
            strengthBar.style.backgroundColor = '#FF8A00';
        } else if (strength <= 75) {
            strengthBar.style.backgroundColor = '#FFD700';
        } else {
            strengthBar.style.backgroundColor = '#4CAF50';
        }
}); 