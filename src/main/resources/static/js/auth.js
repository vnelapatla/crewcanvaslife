const GOOGLE_CLIENT_ID = "804092739623-3khsc57mme7lgb0n7ugj2lg9r43fb1n5.apps.googleusercontent.com";

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
                
                // Force Admin flag for the official account
                const isAdmin = user.isAdmin || user.email.toLowerCase().trim() === 'crewcanvas2@gmail.com';
                localStorage.setItem('isAdmin', isAdmin);

                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                    if (redirectUrl) {
                        sessionStorage.removeItem('redirectAfterLogin');
                        window.location.href = redirectUrl;
                    } else {
                        window.location.href = 'feed.html';
                    }
                }, 1500);
            } else {
                showMessage('We couldn’t find an account with those details. Please check your email and password.', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Unable to connect to the studio. Please check your internet connection.', 'error');
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

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long', 'error');
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
                showMessage('This email seems to be taken already. Try logging in instead.', 'error');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showMessage('Something went wrong on our end. Please try again in a few moments.', 'error');
        }
    });

    // Initialize Google Identity Services
    initializeGoogleIdentity();
});

function initializeGoogleIdentity() {
    if (typeof google !== 'undefined') {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        // Render the Google button if the container exists
        const googleBtnDiv = document.getElementById('googleButtonDiv');
        if (googleBtnDiv) {
            google.accounts.id.renderButton(
                googleBtnDiv,
                { 
                    type: "icon",
                    theme: "outline", 
                    size: "large", 
                    shape: "circle"
                }
            );
        }
        
        // Also show One Tap dialog (standard GIS behavior)
        google.accounts.id.prompt(); 
    } else {
        // If script hasn't loaded yet, try again in a bit
        setTimeout(initializeGoogleIdentity, 500);
    }
}


// Manual Google Login Handler (can be used as fallback or for One Tap)
function handleGoogleLogin() {
    if (typeof google !== 'undefined') {
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed()) {
                console.log("One Tap not displayed:", notification.getNotDisplayedReason());
                // If it's suppressed or not showing, we already have the rendered button as a primary way to log in
            }
        });
    }
}

async function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    
    try {
        console.log("Calling Google Auth API at:", `${API_BASE_URL}/api/auth/google`);
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
            localStorage.setItem('isAdmin', user.isAdmin);

            showMessage('Google Login successful! Redirecting...', 'success');
            setTimeout(() => {
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                if (redirectUrl) {
                    sessionStorage.removeItem('redirectAfterLogin');
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = 'feed.html';
                }
            }, 1500);
        } else {
            showMessage('Google login wasn’t successful. Please try signing in with your email.', 'error');
        }
    } catch (error) {
        console.error('Google Auth error:', error);
        showMessage('Having trouble reaching Google. Please check your connection.', 'error');
    }
}
