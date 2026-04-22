// Auth script for login and signup
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    // Login Submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const user = await response.json();
                localStorage.setItem('userId', user.id);
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userName', user.name);

                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => window.location.href = 'home.html', 1500);
            } else {
                const error = await response.text();
                showMessage(error || 'Login failed. Please check your credentials.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Server connection error. Is the backend running?', 'error');
        }
    });

    // Signup Submission
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!isValidEmail(email)) {
            showMessage('Please enter a valid email address', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match!', 'error');
            return;
        }

        if (password.length < 8) {
            showMessage('Password must be at least 8 characters long', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            if (response.ok) {
                const user = await response.json();
                showMessage('Account created successfully! Please login.', 'success');
                // Switch to login tab
                setTimeout(() => {
                    toggleAuth('login');
                    document.getElementById('loginEmail').value = email;
                }, 2000);
            } else {
                const error = await response.text();
                showMessage(error || 'Registration failed. Email might already be in use.', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showMessage('Server connection error. Is the backend running?', 'error');
        }
    });
});

// Google Login Handler
function handleGoogleLogin() {
    google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // Replace with your actual Client ID
        callback: handleCredentialResponse
    });
    google.accounts.id.prompt(); // also display the One Tap dialog
}

async function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ credential: response.credential })
        });

        if (res.ok) {
            const user = await res.json();
            localStorage.setItem('userId', user.id);
            localStorage.setItem('userEmail', user.email);
            localStorage.setItem('userName', user.name);

            showMessage('Google Login successful! Redirecting...', 'success');
            setTimeout(() => window.location.href = 'home.html', 1500);
        } else {
            const error = await res.text();
            showMessage(error || 'Google login failed.', 'error');
        }
    } catch (error) {
        console.error('Google Auth error:', error);
        showMessage('Server connection error during Google login.', 'error');
    }
}
