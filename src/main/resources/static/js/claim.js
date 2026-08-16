// One-Click Profile Claim JS Handler
let currentToken = null;

document.addEventListener("DOMContentLoaded", function() {
    const urlParams = new URLSearchParams(window.location.search);
    currentToken = urlParams.get('token');

    // Also support path variable /claim/<token>
    if (!currentToken) {
        const pathParts = window.location.pathname.split('/');
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== 'claim.html') {
            currentToken = lastPart;
        }
    }

    if (!currentToken) {
        showError("Invalid claim link. No token specified.");
        return;
    }

    validateToken(currentToken);
});

async function validateToken(token) {
    try {
        const response = await fetch(`/api/claim/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('claimState').style.display = 'block';

            if (data.actorName) document.getElementById('actorName').innerText = data.actorName;
            if (data.role) document.getElementById('actorCraft').innerText = data.role.toUpperCase();

            if (data.profilePicture) {
                const img = document.getElementById('avatarImage');
                const icon = document.getElementById('defaultAvatarIcon');
                img.src = data.profilePicture;
                img.style.display = 'block';
                if (icon) icon.style.display = 'none';
            }
        } else {
            showError(data.error || "This claim link has expired or is invalid.");
        }
    } catch (err) {
        showError("Unable to verify claim link. Please check your internet connection.");
    }
}

async function executeClaim() {
    if (!currentToken) return;

    const claimBtn = document.getElementById('claimBtn');
    claimBtn.disabled = true;
    claimBtn.innerHTML = `<div class="spinner"></div> Claiming Profile...`;

    try {
        const response = await fetch(`/api/claim/${currentToken}/complete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        const data = await response.json();

        if (response.ok && data.token) {
            // Save JWT authentication session locally
            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                localStorage.setItem('userEmail', data.user.email);
                localStorage.setItem('userId', data.user.id);
            }

            claimBtn.style.background = '#10b981';
            claimBtn.innerHTML = `<i class="fas fa-check-circle"></i> Profile Claimed! Redirecting...`;

            setTimeout(() => {
                window.location.href = data.profileUrl || 'edit-profile.html';
            }, 1000);
        } else {
            claimBtn.disabled = false;
            claimBtn.innerHTML = `<i class="fas fa-magic"></i> CLAIM MY PROFILE`;
            showError(data.error || "Failed to claim profile. Please try again.");
        }
    } catch (err) {
        claimBtn.disabled = false;
        claimBtn.innerHTML = `<i class="fas fa-magic"></i> CLAIM MY PROFILE`;
        showError("Server error occurred while claiming profile. Please try again later.");
    }
}

function showError(msg) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('claimState').style.display = 'none';
    const errBox = document.getElementById('errorState');
    document.getElementById('errorMessage').innerText = msg;
    errBox.style.display = 'block';
}
