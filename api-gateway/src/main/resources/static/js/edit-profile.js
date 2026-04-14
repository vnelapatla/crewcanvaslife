// Edit Profile functionality
let currentUserId = null;
let selectedProfilePic = null;
let skillsList = [];

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    loadProfileData();
    setupImageHandlers();
});

// Load existing profile data into form
async function loadProfileData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
        if (response.ok) {
            const user = await response.json();

            // Basic Info
            document.getElementById('editName').value = user.name || '';
            document.getElementById('editEmail').value = user.email || '';
            document.getElementById('editPhone').value = user.phone || '';
            document.getElementById('editLocation').value = user.location || '';

            // Professional Info
            document.getElementById('editRole').value = user.role || '';
            document.getElementById('editProjects').value = user.projectsCount || '';
            document.getElementById('editBio').value = user.bio || '';

            // Skills
            if (user.skills) {
                skillsList = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
                renderSkills();
            }

            // Social Links
            document.getElementById('editLinkedin').value = user.linkedinProfile || '';
            document.getElementById('editWebsite').value = user.personalWebsite || '';
            document.getElementById('editInstagram').value = user.instagram || '';

            // Profile Picture
            if (user.profilePicture) {
                document.getElementById('profilePicPreview').innerHTML = `<img src="${user.profilePicture}" alt="Profile">`;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        if (typeof showMessage === 'function') showMessage('Error loading profile data', 'error');
    }
}

function setupImageHandlers() {
    const profInput = document.getElementById('profilePicInput');
    profInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Assuming uploadImage utility exists in utils.js
                selectedProfilePic = await uploadImage(file);
                document.getElementById('profilePicPreview').innerHTML = `<img src="${selectedProfilePic}" alt="Profile">`;
                if (typeof showMessage === 'function') showMessage('Profile picture uploaded', 'success');
            } catch (error) {
                if (typeof showMessage === 'function') showMessage(error.message, 'error');
            }
        }
    });
}

// Skills Tag Logic
function addSkill() {
    const input = document.getElementById('skillInput');
    const skill = input.value.trim();
    if (skill && !skillsList.includes(skill)) {
        skillsList.push(skill);
        renderSkills();
        input.value = '';
    }
}

function removeSkill(index) {
    skillsList.splice(index, 1);
    renderSkills();
}

function renderSkills() {
    const container = document.getElementById('skillsContainer');
    container.innerHTML = skillsList.map((skill, index) => `
        <div class="skill-tag">
            ${skill}
            <span class="remove" onclick="removeSkill(${index})">&times;</span>
        </div>
    `).join('');
}

// Save Profile
async function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const email = document.getElementById('editEmail').value.trim();
    const phone = document.getElementById('editPhone').value.trim();
    const location = document.getElementById('editLocation').value.trim();
    const role = document.getElementById('editRole').value;
    const projectsCount = document.getElementById('editProjects').value;
    const bio = document.getElementById('editBio').value.trim();
    const linkedinProfile = document.getElementById('editLinkedin').value.trim();
    const personalWebsite = document.getElementById('editWebsite').value.trim();
    const instagram = document.getElementById('editInstagram').value.trim();
    const skills = skillsList.join(',');

    if (!name || !email) {
        if (typeof showMessage === 'function') showMessage('Name and Email are required', 'error');
        return;
    }

    const updatedUser = {
        id: currentUserId,
        name,
        email,
        phone,
        location,
        role,
        projectsCount,
        bio,
        skills,
        linkedinProfile,
        personalWebsite,
        instagram
    };

    if (selectedProfilePic) updatedUser.profilePicture = selectedProfilePic;

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser)
        });

        if (response.ok) {
            if (typeof showMessage === 'function') showMessage('Profile updated successfully!', 'success');
            localStorage.setItem('userName', name);
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        } else {
            const error = await response.text();
            if (typeof showMessage === 'function') showMessage('Update failed: ' + error, 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        if (typeof showMessage === 'function') showMessage('Error saving profile changes', 'error');
    }
}

// Add enter key support for skills
document.getElementById('skillInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addSkill();
    }
});
