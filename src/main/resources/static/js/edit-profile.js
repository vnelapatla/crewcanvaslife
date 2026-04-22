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

async function loadProfileData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
        if (response.ok) {
            const user = await response.json();
            originalUserData = user;

            document.getElementById('editName').value = user.name || '';
            document.getElementById('editEmail').value = user.email || '';
            document.getElementById('editPhone').value = user.phone || '';
            document.getElementById('editLocation').value = user.location || '';
            document.getElementById('editRole').value = user.role || 'Director';
            document.getElementById('editExperience').value = user.experience || 'Professional';
            document.getElementById('editBio').value = user.bio || '';

            // Restored Craft Fields
            document.getElementById('dirGenres').value = user.genres || '';
            document.getElementById('dirProjects').value = user.projectsDirected || '';
            document.getElementById('dirVision').value = user.visionStatement || '';
            document.getElementById('editSoftware').value = user.editingSoftware || '';
            document.getElementById('editVideos').value = user.portfolioVideos || '';

            // Socials
            document.getElementById('editInstagram').value = user.instagram || '';
            document.getElementById('editYoutube').value = user.youtube || '';
            document.getElementById('editTiktok').value = user.tiktok || '';
            document.getElementById('editTwitter').value = user.twitter || '';

            if (user.skills) {
                skillsList = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
                renderSkills();
            }

            if (user.profilePicture) {
                document.getElementById('currentAvatar').src = user.profilePicture;
            }

            handleRoleChange();
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function handleRoleChange() {
    const role = document.getElementById('editRole').value.toLowerCase();
    document.querySelectorAll('.craft-module').forEach(m => m.style.display = 'none');
    
    if (role.includes('director')) document.getElementById('moduleDirector').style.display = 'block';
    else if (role.includes('editor')) document.getElementById('moduleEditor').style.display = 'block';
}

function setupImageHandlers() {
    document.getElementById('profilePicInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                selectedProfilePic = await uploadImage(file);
                document.getElementById('currentAvatar').src = selectedProfilePic;
            } catch (err) {
                console.error(err);
            }
        }
    });
}

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
    container.innerHTML = skillsList.map((s, i) => `<span class="skill-tag">${s} <i class="fa-solid fa-times" onclick="removeSkill(${i})" style="cursor:pointer; margin-left:5px;"></i></span>`).join('');
}

async function saveProfile() {
    const saveBtn = document.querySelector('.btn-save');
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const updatedUser = {
            id: currentUserId,
            name: document.getElementById('editName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            location: document.getElementById('editLocation').value.trim(),
            role: document.getElementById('editRole').value,
            experience: document.getElementById('editExperience').value,
            bio: document.getElementById('editBio').value.trim(),
            skills: skillsList.join(','),
            // RESTORED FIELDS
            genres: document.getElementById('dirGenres').value.trim(),
            projectsDirected: document.getElementById('dirProjects').value.trim(),
            visionStatement: document.getElementById('dirVision').value.trim(),
            editingSoftware: document.getElementById('editSoftware').value.trim(),
            portfolioVideos: document.getElementById('editVideos').value.trim(),
            instagram: document.getElementById('editInstagram').value.trim(),
            youtube: document.getElementById('editYoutube').value.trim(),
            tiktok: document.getElementById('editTiktok').value.trim(),
            twitter: document.getElementById('editTwitter').value.trim()
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
        console.error('Error:', error);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Professional Profile';
    }
}
