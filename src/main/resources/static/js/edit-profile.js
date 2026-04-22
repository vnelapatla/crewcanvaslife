// Edit Profile functionality
let currentUserId = null;
let selectedProfilePic = null;
let skillsList = [];
let originalUserData = {};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    loadProfileData();
    setupImageHandlers();
});

// --- Basic Profile Data Logic ---
async function loadProfileData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
        if (response.ok) {
            const user = await response.json();
            originalUserData = user;

            document.getElementById('editName').value = user.name || '';
            document.getElementById('editEmail').value = user.email || '';
            document.getElementById('editLocation').value = user.location || '';
            document.getElementById('editRole').value = user.role || 'Film Professional';
            document.getElementById('editExperience').value = user.experience || 'Professional';
            document.getElementById('editBio').value = user.bio || '';

            if (user.skills) {
                skillsList = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
                renderSkills();
            }

            if (user.profilePicture) {
                document.getElementById('currentAvatar').src = user.profilePicture;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// --- Image Handlers ---
function setupImageHandlers() {
    const profInput = document.getElementById('profilePicInput');
    if (profInput) {
        profInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    selectedProfilePic = await uploadImage(file);
                    document.getElementById('profilePicPreview').innerHTML = `<img src="${selectedProfilePic}" alt="Profile">`;
                } catch (error) {
                    console.error('Upload failed:', error);
                }
            }
        });
    }
}

// --- Skills Management ---
function addSkill() {
    const input = document.getElementById('skillInput');
    if (!input) return;
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
    if (!container) return;
    container.innerHTML = skillsList.map((skill, index) => `
        <div class="skill-tag">
            ${skill}
            <span class="remove" onclick="removeSkill(${index})">&times;</span>
        </div>
    `).join('');
}

// --- Save Action ---
async function saveProfile() {
    const saveBtn = document.querySelector('.btn-save');
    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        const updatedUser = {
            id: currentUserId,
            name: document.getElementById('editName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            location: document.getElementById('editLocation').value.trim(),
            role: document.getElementById('editRole').value,
            experience: document.getElementById('editExperience').value,
            bio: document.getElementById('editBio').value.trim(),
            skills: skillsList.join(',')
        };

        if (selectedProfilePic) updatedUser.profilePicture = selectedProfilePic;

        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        if (response.ok) {
            window.location.href = 'profile.html';
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    }
}
