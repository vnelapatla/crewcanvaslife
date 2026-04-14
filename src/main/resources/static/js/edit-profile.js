// Edit Profile functionality
let currentUserId = null;
let selectedProfilePic = null;
let selectedProjectImage = null;
let skillsList = [];
let originalUserData = {};

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    loadProfileData();
    loadUserProjects();
    setupImageHandlers();
});

// --- Movie Projects Logic (Step-by-Step Wizard) ---
let currentWizardStep = 1;

function startNewProjectWizard() {
    currentWizardStep = 1;
    document.getElementById('projectWizard').style.display = 'block';
    goToStep(1);
    
    // Clear previous inputs
    document.getElementById('projTitle').value = '';
    document.getElementById('projRole').value = '';
    document.getElementById('projYear').value = '';
    document.getElementById('projDesc').value = '';
    document.getElementById('projImageStatus').innerText = 'Click to upload poster';
    document.getElementById('projImagePreviewContainer').style.display = 'none';
    selectedProjectImage = null;
}

function closeProjectWizard() {
    document.getElementById('projectWizard').style.display = 'none';
}

function goToStep(step) {
    // Validation
    if (step === 2 && currentWizardStep === 1) {
        const title = document.getElementById('projTitle').value.trim();
        const role = document.getElementById('projRole').value.trim();
        if (!title || !role) {
            if (typeof showMessage === 'function') showMessage('Title and Role are required', 'error');
            return;
        }
    }

    // Update UI
    document.getElementById(`wizardStep${currentWizardStep}`).style.display = 'none';
    document.getElementById(`wizardStep${step}`).style.display = 'block';
    
    // Update indicators
    document.getElementById(`step${currentWizardStep}-indicator`).classList.remove('active');
    document.getElementById(`step${step}-indicator`).classList.add('active');
    
    currentWizardStep = step;
}

async function loadUserProjects() {
    if (!currentUserId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/user/${currentUserId}`);
        if (response.ok) {
            const projects = await response.json();
            renderProjects(projects);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
    }
}

function renderProjects(projects) {
    const container = document.getElementById('projectsListContainer');
    if (!projects || projects.length === 0) {
        container.innerHTML = '<p class="empty-notif" style="color: #666; font-style: italic;">No projects added yet.</p>';
        return;
    }

    container.innerHTML = projects.map(proj => `
        <div class="project-edit-item">
            <div class="item-thumb">
                <img src="${proj.imageUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1000'}" alt="Movie">
            </div>
            <div class="item-info">
                <h4>${proj.title}</h4>
                <p>${proj.role} ${proj.year ? `(${proj.year})` : ''}</p>
            </div>
            <button class="item-delete-btn" onclick="deleteProject(${proj.id})">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');
}

async function saveNewProject() {
    const title = document.getElementById('projTitle').value.trim();
    const role = document.getElementById('projRole').value.trim();
    const yearValue = document.getElementById('projYear').value;
    const description = document.getElementById('projDesc').value.trim();

    if (!title || !role) {
        if (typeof showMessage === 'function') showMessage('Movie Title and Your Role are required', 'error');
        return;
    }

    // Ensure we have a valid numeric ID for the backend
    const userIdLong = currentUserId ? parseInt(currentUserId) : null;
    if (!userIdLong) {
        if (typeof showMessage === 'function') showMessage('Session error: User ID missing. Please re-login.', 'error');
        return;
    }

    const projectData = {
        userId: userIdLong,
        title,
        role,
        year: yearValue ? parseInt(yearValue) : null,
        description,
        imageUrl: selectedProjectImage
    };

    console.log('Attempting to save project:', projectData);

    const finishBtn = document.querySelector('#wizardStep3 .btn-save-small');
    const originalBtnText = finishBtn.innerHTML;
    
    try {
        finishBtn.disabled = true;
        finishBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving...';

        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Project saved successfully:', result);
            if (typeof showMessage === 'function') showMessage('Project added to portfolio!', 'success');
            closeProjectWizard();
            loadUserProjects(); // Refresh list
        } else {
            const errorText = await response.text();
            console.error('Server error saving project:', errorText);
            if (typeof showMessage === 'function') showMessage('Server error: ' + (errorText || 'Unknown error'), 'error');
            finishBtn.disabled = false;
            finishBtn.innerHTML = originalBtnText;
        }
    } catch (error) {
        console.error('Network/Critical error adding project:', error);
        if (typeof showMessage === 'function') showMessage('Connection error. Is the server running?', 'error');
        finishBtn.disabled = false;
        finishBtn.innerHTML = originalBtnText;
    }
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to remove this project from your portfolio?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            if (typeof showMessage === 'function') showMessage('Project removed', 'info');
            loadUserProjects(); // Refresh list
        }
    } catch (error) {
        console.error('Error deleting project:', error);
    }
}

// --- Image Handlers ---
function setupImageHandlers() {
    // Current profile pic handler
    const profInput = document.getElementById('profilePicInput');
    if (profInput) {
        profInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    selectedProfilePic = await uploadImage(file);
                    document.getElementById('profilePicPreview').innerHTML = `<img src="${selectedProfilePic}" alt="Profile">`;
                    if (typeof showMessage === 'function') showMessage('Profile picture uploaded', 'success');
                } catch (error) {
                    if (typeof showMessage === 'function') showMessage(error.message, 'error');
                }
            }
        });
    }

    // Project image handler
    const projInput = document.getElementById('projImageInput');
    if (projInput) {
        projInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const status = document.getElementById('projImageStatus');
            const uploadIcon = document.getElementById('projUploadIcon');
            const previewContainer = document.getElementById('projImagePreviewContainer');
            const previewImg = document.getElementById('projImagePreview');

            try {
                status.innerText = 'Uploading...';
                
                // Show a loading state if needed
                if (uploadIcon) uploadIcon.classList.add('fa-spin');

                selectedProjectImage = await uploadImage(file);
                
                status.innerText = 'Poster Uploaded! ✔️';
                if (uploadIcon) {
                    uploadIcon.classList.remove('fa-spin');
                    uploadIcon.style.display = 'none';
                }
                
                if (previewImg && previewContainer) {
                    previewImg.src = selectedProjectImage;
                    previewContainer.style.display = 'block';
                }
                
                if (typeof showMessage === 'function') showMessage('Movie poster uploaded successfully!', 'success');
            } catch (error) {
                console.error('Project image upload failed:', error);
                status.innerText = 'Upload failed. Try again.';
                if (uploadIcon) {
                    uploadIcon.classList.remove('fa-spin');
                    uploadIcon.style.display = 'block';
                }
                if (typeof showMessage === 'function') showMessage(error.message || 'Upload failed', 'error');
            } finally {
                // Clear the input value so the same file can be selected again if needed
                projInput.value = '';
            }
        });
    }
}

// --- Basic Profile Data Logic ---
async function loadProfileData() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
        if (response.ok) {
            const user = await response.json();
            originalUserData = user;

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
        ...originalUserData,
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        if (response.ok) {
            if (typeof showMessage === 'function') showMessage('Profile updated successfully!', 'success');
            localStorage.setItem('userName', name);
            if (selectedProfilePic) localStorage.setItem('userAvatar', selectedProfilePic);
            setTimeout(() => { window.location.href = 'profile.html'; }, 1000);
        }
    } catch (error) {
        console.error('Error updating profile:', error);
    }
}

// Enter key support for skills
document.getElementById('skillInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSkill();
});
