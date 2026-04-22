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

    // Add role change listener
    document.getElementById('editRole')?.addEventListener('change', () => {
        handleRoleChange();
        updateLiveScore();
    });

    // Add live score listeners
    setupLiveScoreListeners();
});

function handleRoleChange() {
    const selectedRole = document.getElementById('editRole').value;
    const roleKey = (selectedRole || '').trim().toLowerCase();
    const modules = ['Actor', 'Director', 'Editor', 'DOP', 'MusicDirector', 'Colorist', 'Screenwriter', 'VFX'];
    const craftCard = document.getElementById('craftSpecificCard');
    const craftTitle = document.getElementById('craftSpecificTitle');
    
    // Hide all modules first
    modules.forEach(m => {
        const el = document.getElementById(`module${m}`);
        if (el) el.style.display = 'none';
    });

    if (!roleKey) {
        if (craftCard) craftCard.style.display = 'none';
        return;
    }

    // 1. Handle Actor Module (Special case: inside Professional Details card)
    if (roleKey === 'actor') {
        const actorModule = document.getElementById('moduleActor');
        if (actorModule) actorModule.style.display = 'block';
        if (craftCard) craftCard.style.display = 'none'; 
        return;
    }

    // 2. Handle Other Modules (inside Craft Specific card)
    let moduleSuffix = '';
    if (roleKey.includes('director')) moduleSuffix = 'Director';
    else if (roleKey.includes('editor')) moduleSuffix = 'Editor';
    else if (roleKey === 'dop' || roleKey.includes('cinematographer')) moduleSuffix = 'DOP';
    else if (roleKey.includes('music')) moduleSuffix = 'MusicDirector';
    else if (roleKey.includes('colorist')) moduleSuffix = 'Colorist';
    else if (roleKey.includes('writer')) moduleSuffix = 'Screenwriter';
    else if (roleKey.includes('vfx') || roleKey.includes('animator')) moduleSuffix = 'VFX';
    
    const targetModule = document.getElementById(`module${moduleSuffix}`);
    if (targetModule) {
        if (craftCard) {
            craftCard.style.display = 'block';
            if (craftTitle) craftTitle.innerText = `${selectedRole} Specific Details`;
        }
        targetModule.style.display = 'block';
    } else {
        if (craftCard) craftCard.style.display = 'none';
    }
}

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
    document.getElementById('projGenre').value = '';
    document.getElementById('projVideoUrl').value = '';
    document.getElementById('projDesc').value = '';
    document.getElementById('projImageStatus').innerText = 'Click to upload poster';
    document.getElementById('projImagePreviewContainer').style.display = 'none';
    document.getElementById('projImagePlaceholder').style.display = 'flex';
    document.getElementById('removeProjImageBtn').style.display = 'none';
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
                ${proj.genre ? `<p class="item-genre">${proj.genre}</p>` : ''}
            </div>
            <button class="item-delete-btn" onclick="deleteProject(${proj.id})">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        </div>
    `).join('');

    if (typeof updateLiveScore === 'function') updateLiveScore();
}

async function saveNewProject() {
    const title = document.getElementById('projTitle').value.trim();
    const role = document.getElementById('projRole').value.trim();
    const yearValue = document.getElementById('projYear').value;
    const genre = document.getElementById('projGenre').value.trim();
    const videoUrl = document.getElementById('projVideoUrl').value.trim();
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
        genre,
        videoUrl,
        description,
        imageUrl: selectedProjectImage
    };

    console.log('Attempting to save project:', projectData);

    const finishBtn = document.querySelector('.btn-finish');
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
                    document.getElementById('projImagePlaceholder').style.display = 'none';
                    document.getElementById('removeProjImageBtn').style.display = 'inline-block';
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

function removeProjectImage() {
    selectedProjectImage = null;
    document.getElementById('projImagePreview').src = '';
    document.getElementById('projImagePreviewContainer').style.display = 'none';
    document.getElementById('projImagePlaceholder').style.display = 'flex';
    document.getElementById('projImageStatus').innerText = 'Click to upload poster';
    document.getElementById('removeProjImageBtn').style.display = 'none';
    if (typeof showMessage === 'function') showMessage('Poster removed', 'info');
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
            document.getElementById('editLanguages').value = user.languages || '';
            document.getElementById('editAvailability').value = user.availability || 'Available';
            document.getElementById('editAvailableFrom').value = user.availableFrom || '';
            document.getElementById('editAvailableTo').value = user.availableTo || '';
            document.getElementById('editBudgetQuote').value = user.budgetQuote || '';
            document.getElementById('contactVisible').checked = user.contactVisible || false;

            // Professional Info
            const currentRole = user.role || '';
            const roleSelect = document.getElementById('editRole');
            if (currentRole && roleSelect) {
                // Try exact match first
                roleSelect.value = currentRole;
                // If not set (meaning no exact match), try case-insensitive
                if (roleSelect.value !== currentRole) {
                    for (let i = 0; i < roleSelect.options.length; i++) {
                        if (roleSelect.options[i].value.toLowerCase() === currentRole.toLowerCase()) {
                            roleSelect.value = roleSelect.options[i].value;
                            break;
                        }
                    }
                }
            }
            
            document.getElementById('editExperience').value = user.experience || 'Fresher';
            document.getElementById('editBio').value = user.bio || '';
            document.getElementById('editGender').value = user.gender || '';
            document.getElementById('editAge').value = user.age || '';
            document.getElementById('editSkinTone').value = user.skinTone || '';
            document.getElementById('editHeight').value = user.height || '';
            handleRoleChange(); // Trigger module visibility

            // Craft Specific Data (Case-insensitive check)
            const roleKey = currentRole.trim().toLowerCase();
            
            if (roleKey.includes('director')) {
                document.getElementById('dirGenres').value = user.genres || '';
                document.getElementById('dirProjects').value = user.projectsDirected || '';
                document.getElementById('dirBudget').value = user.budgetHandled || '';
                document.getElementById('dirTeamSize').value = user.teamSizeHandled || '';
                document.getElementById('dirVision').value = user.visionStatement || '';
            } else if (roleKey.includes('editor')) {
                document.getElementById('editSoftware').value = user.editingSoftware || '';
                document.getElementById('editStyle').value = user.editingStyle || '';
                document.getElementById('editVideos').value = user.portfolioVideos || '';
                document.getElementById('editTurnaround').value = user.turnaroundTime || '';
            } else if (roleKey === 'dop' || roleKey.includes('cinematographer')) {
                document.getElementById('dopCamera').value = user.cameraExpertise || '';
                document.getElementById('dopLighting').value = user.lightingStyle || '';
            } else if (roleKey.includes('music')) {
                document.getElementById('musicDaws').value = user.daws || '';
                document.getElementById('musicTracks').value = user.sampleTracks || '';
                document.getElementById('musicInstruments').value = user.instruments || '';
            } else if (roleKey.includes('colorist')) {
                document.getElementById('colorSoftware').value = user.colorSoftware || '';
                document.getElementById('colorPanel').value = user.colorPanel || '';
                document.getElementById('colorMonitor').value = user.colorMonitor || '';
            } else if (roleKey.includes('writer')) {
                document.getElementById('writerGenre').value = user.writerGenre || '';
                document.getElementById('writerSoftware').value = user.writerSoftware || '';
                document.getElementById('writerScripts').value = user.writerScripts || '';
            } else if (roleKey.includes('vfx') || roleKey.includes('animator')) {
                document.getElementById('vfxSoftware').value = user.vfxSoftware || '';
                document.getElementById('vfxSpecialty').value = user.vfxSpecialty || '';
            }

            // Skills
            if (user.skills) {
                skillsList = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
                renderSkills();
            }

            // Social Links
            document.getElementById('editInstagram').value = user.instagram || '';
            document.getElementById('editYoutube').value = user.youtube || '';
            document.getElementById('editFacebook').value = user.facebook || '';
            document.getElementById('editTwitter').value = user.twitter || '';

            // Profile Picture
            if (user.profilePicture) {
                document.getElementById('currentAvatar').src = user.profilePicture;
            }

            // Initial Score update
            updateLiveScore();
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
    const saveBtn = document.querySelector('.btn-save');
    const originalText = saveBtn ? saveBtn.textContent : 'Save Changes';
    
    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';
        }

        const role = document.getElementById('editRole')?.value || '';
        
        // Helper to get value safely
        const getVal = (id) => {
            const el = document.getElementById(id);
            return el ? el.value.trim() : '';
        };

        const getChecked = (id) => {
            const el = document.getElementById(id);
            return el ? el.checked : false;
        };

        // Core Data
        const updatedUser = {
            ...originalUserData,
            id: currentUserId,
            name: getVal('editName'),
            email: getVal('editEmail'),
            phone: getVal('editPhone'),
            location: getVal('editLocation'),
            languages: getVal('editLanguages'),
            availability: document.getElementById('editAvailability')?.value || 'Available',
            availableFrom: getVal('editAvailableFrom'),
            availableTo: getVal('editAvailableTo'),
            budgetQuote: getVal('editBudgetQuote'),
            contactVisible: getChecked('contactVisible'),
            role: role,
            experience: document.getElementById('editExperience')?.value || 'Fresher',
            bio: getVal('editBio'),
            gender: document.getElementById('editGender')?.value || '',
            age: getVal('editAge'),
            skinTone: getVal('editSkinTone'),
            height: getVal('editHeight'),
            skills: skillsList.join(','),
            instagram: getVal('editInstagram'),
            youtube: getVal('editYoutube'),
            facebook: getVal('editFacebook'),
            twitter: getVal('editTwitter')
        };

        if (selectedProfilePic) updatedUser.profilePicture = selectedProfilePic;

        // Remove timestamps to avoid "JSON parse error" on backend LocalDateTime
        delete updatedUser.createdAt;
        delete updatedUser.updatedAt;

        const roleKey = role.toLowerCase();

        // Craft Specific Data Collection
        if (roleKey.includes('director')) {
            updatedUser.genres = getVal('dirGenres');
            updatedUser.projectsDirected = getVal('dirProjects');
            updatedUser.budgetHandled = getVal('dirBudget');
            updatedUser.teamSizeHandled = getVal('dirTeamSize');
            updatedUser.visionStatement = getVal('dirVision');
        } else if (roleKey.includes('editor')) {
            updatedUser.editingSoftware = getVal('editSoftware');
            updatedUser.editingStyle = getVal('editStyle');
            updatedUser.portfolioVideos = getVal('editVideos');
            updatedUser.turnaroundTime = getVal('editTurnaround');
        } else if (roleKey === 'dop' || roleKey.includes('cinematographer')) {
            updatedUser.cameraExpertise = getVal('dopCamera');
            updatedUser.lightingStyle = getVal('dopLighting');
        } else if (roleKey.includes('music')) {
            updatedUser.daws = getVal('musicDaws');
            updatedUser.sampleTracks = getVal('musicTracks');
            updatedUser.instruments = getVal('musicInstruments');
        } else if (roleKey.includes('colorist')) {
            updatedUser.colorSoftware = getVal('colorSoftware');
            updatedUser.colorPanel = getVal('colorPanel');
            updatedUser.colorMonitor = getVal('colorMonitor');
        } else if (roleKey.includes('writer')) {
            updatedUser.writerGenre = getVal('writerGenre');
            updatedUser.writerSoftware = getVal('writerSoftware');
            updatedUser.writerScripts = getVal('writerScripts');
        } else if (roleKey.includes('vfx') || roleKey.includes('animator')) {
            updatedUser.vfxSoftware = getVal('vfxSoftware');
            updatedUser.vfxSpecialty = getVal('vfxSpecialty');
        }

        if (!updatedUser.name || !updatedUser.email) {
            throw new Error('Name and Email are required');
        }

        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        if (response.ok) {
            if (typeof showMessage === 'function') showMessage('Profile updated successfully!', 'success');
            localStorage.setItem('userName', updatedUser.name);
            if (selectedProfilePic) localStorage.setItem('userAvatar', selectedProfilePic);
            setTimeout(() => { window.location.href = 'profile.html'; }, 1000);
        } else {
            const errorData = await response.text();
            throw new Error(errorData || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        if (typeof showMessage === 'function') showMessage(error.message, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }
}

// Enter key support for skills
document.getElementById('skillInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSkill();
});

// --- Live Profile Score Logic ---

function setupLiveScoreListeners() {
    const inputs = [
        'editName', 'editEmail', 'editPhone', 'editLocation', 
        'editBio', 'editInstagram', 'editYoutube', 'editFacebook', 'editTwitter'
    ];

    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', updateLiveScore);
    });

    // Also update when skills are added/removed
    const originalAddSkill = addSkill;
    window.addSkill = function() {
        originalAddSkill();
        updateLiveScore();
    };

    const originalRemoveSkill = removeSkill;
    window.removeSkill = function(index) {
        originalRemoveSkill(index);
        updateLiveScore();
    };
}

function updateLiveScore() {
    let score = 0;
    const weights = {
        name: 10,
        profilePicture: 15,
        bio: 15,
        role: 10,
        location: 10,
        phone: 5,
        skills: 15,
        social: 10,
        projects: 10
    };

    // Check fields
    if (document.getElementById('editName')?.value.trim() !== '') score += weights.name;
    
    const avatar = document.getElementById('currentAvatar')?.src;
    if (avatar && !avatar.includes('placeholder')) score += weights.profilePicture;
    
    if (document.getElementById('editBio')?.value.trim().length > 10) score += weights.bio;
    
    const role = document.getElementById('editRole')?.value;
    if (role && role !== '') score += weights.role;
    
    if (document.getElementById('editLocation')?.value.trim() !== '') score += weights.location;
    if (document.getElementById('editPhone')?.value.trim() !== '') score += weights.phone;
    
    if (skillsList.length > 0) score += weights.skills;

    const socials = ['editInstagram', 'editYoutube', 'editFacebook', 'editTwitter'];
    const hasSocial = socials.some(id => document.getElementById(id)?.value.trim() !== '');
    if (hasSocial) score += weights.social;

    // Project check (from container children)
    const projectsContainer = document.getElementById('projectsListContainer');
    if (projectsContainer && projectsContainer.querySelectorAll('.project-edit-item').length > 0) {
        score += weights.projects;
    }

    // Update UI
    const circle = document.getElementById('scoreProgressCircle');
    const text = document.getElementById('scorePercentageText');
    const status = document.getElementById('scoreStatusText');

    if (text) text.textContent = `${score}%`;
    if (circle) {
        const offset = 100 - score;
        circle.style.strokeDashoffset = offset;
        
        // Color feedback
        if (score < 50) circle.style.stroke = '#ef4444';
        else if (score < 80) circle.style.stroke = '#f59e0b';
        else circle.style.stroke = '#10b981';
    }

    if (status) {
        if (score < 30) status.textContent = 'Weak';
        else if (score < 60) status.textContent = 'Getting There';
        else if (score < 90) status.textContent = 'Strong';
        else status.textContent = 'Master';
    }
}
