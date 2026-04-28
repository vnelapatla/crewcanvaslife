// Edit Profile functionality
let currentUserId = null;
let selectedProfilePic = null;
let selectedCoverImage = null;
let skillsList = [];
let originalUserData = {};
let editingProjectId = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log("Edit Profile page loaded");
    if (!checkAuth()) {
        alert("Auth failed - redirecting to login");
        window.location.href = 'index.html';
        return;
    }
    
    currentUserId = getCurrentUserId();
    console.log("[EditProfile] Initializing for ID:", currentUserId);
    
    if (!currentUserId || currentUserId === 'null') {
        alert("No valid User ID found in session. Please log in again.");
        window.location.href = 'index.html';
        return;
    }

    try {
        console.log("Fetching profile data for ID:", currentUserId);
        await loadProfileData();
        console.log("Fetching projects...");
        await loadUserProjects();
        console.log("Setting up image handlers...");
        setupImageHandlers();
        console.log("Profile initialization complete");
    } catch (err) {
        console.error("Initialization failed:", err);
    }
});

async function loadProfileData() {
    try {
        const url = `${API_BASE_URL}/api/profile/${currentUserId}`;
        console.log("Fetching from:", url);
        
        const response = await fetch(url);
        if (response.ok) {
            const user = await response.json();
            console.log("Data received:", user);
            originalUserData = user;

            if (!user.name) {
                console.warn("User object received but name is empty");
            }

            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.type === 'date') {
                        val = formatDateForInput(val);
                    }
                    el.value = val || '';
                    console.log(`[EditProfile] Populated #${id} with:`, val);
                } else {
                    console.warn(`[EditProfile] Element #${id} not found in HTML`);
                }
            };

            // Fallback for basic info if missing in API
            const name = user.name || localStorage.getItem('userName');
            const email = user.email || localStorage.getItem('userEmail');
            
            console.log("[EditProfile] Populating basic fields...");
            setVal('editName', name);
            setVal('editEmail', email);
            setVal('editPhone', user.phone);
            setVal('editLocation', user.location);
            setVal('editRole', user.role || 'Director');
            setVal('editExperience', user.experience || 'Fresher');
            setVal('editBio', user.bio);
            
            // User Category & Verification
            setVal('editUserType', user.userType || 'Explorer');
            if (user.isVerifiedProfessional) {
                if (document.getElementById('verifiedStatusContainer')) document.getElementById('verifiedStatusContainer').style.display = 'block';
                if (document.getElementById('categoryGroup')) document.getElementById('categoryGroup').style.display = 'block';
                if (document.getElementById('categoryLockMessage')) document.getElementById('categoryLockMessage').style.display = 'none';
            } else {
                if (document.getElementById('categoryGroup')) document.getElementById('categoryGroup').style.display = 'none';
                if (document.getElementById('categoryLockMessage')) document.getElementById('categoryLockMessage').style.display = 'block';
            }

            // Role-specific fields
            setVal('dirGenres', user.genres);
            setVal('dirProjects', user.projectsDirected);
            setVal('dirBudget', user.budgetHandled);
            setVal('dirTeamSize', user.teamSize);
            setVal('dirShowreel', user.showreel);
            setVal('dirVision', user.visionStatement);

            setVal('actHeight', user.height);
            setVal('actWeight', user.weight);
            setVal('actAgeRange', user.ageRange);
            setVal('actGender', user.gender);
            setVal('actBodyType', user.bodyType);
            setVal('actLanguages', user.languages);
            setVal('actShowreel', user.showreel);
            
            setVal('dopCamera', user.cameraExpertise);
            setVal('dopShowreel', user.showreel);

            setVal('editSoftware', user.editingSoftware);
            setVal('editStyle', user.editingStyle);
            setVal('editVideos', user.portfolioVideos);
            setVal('editTurnaround', user.turnaroundTime);
            setVal('editExpDetails', user.experienceDetails);

            setVal('musGenres', user.genres);
            setVal('musDaws', user.daws);
            setVal('musInstruments', user.instruments);
            setVal('musTracks', user.sampleTracks);
            setVal('musExperience', user.musicExperience);

            setVal('genInterests', user.interests);
            setVal('genOccupation', user.occupation);
            setVal('genGoals', user.goals);
            setVal('genLearning', user.learningResources);

            setVal('editInstagram', user.instagram);
            setVal('editYoutube', user.youtube);
            setVal('editTiktok', user.tiktok);
            setVal('editTwitter', user.twitter);
            
            // Private Info
            if (user.availabilityFrom) setVal('editAvailFrom', user.availabilityFrom);
            if (user.availabilityTo) setVal('editAvailTo', user.availabilityTo);
            
            const movieRem = user.expectedMovieRemuneration || user.budgetMovie || '';
            const webRem = user.expectedWebseriesRemuneration || user.budgetWebseries || '';
            setVal('editBudgetMovie', movieRem);
            setVal('editBudgetWeb', webRem);

            if (user.skills) {
                skillsList = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
                renderSkills();
            }

            if (user.profilePicture) {
                const avatar = document.getElementById('currentAvatar');
                if (avatar) avatar.src = user.profilePicture;
            }

            // Profile Strength Score
            const strengthBox = document.getElementById('editProfileStrength');
            const strengthText = document.getElementById('editStrengthText');
            const strengthBar = document.getElementById('editStrengthBar');
            
            if (strengthBox && strengthText && strengthBar) {
                strengthBox.style.display = 'flex';
                const score = user.profileScore !== undefined ? user.profileScore : calculateProfileScore(user);
                strengthText.textContent = `${score}%`;
                
                setTimeout(() => {
                    strengthBar.style.width = `${score}%`;
                }, 100);
            }

            handleRoleChange();
        } else {
            const errText = await response.text();
            alert("SERVER ERROR: Could not find your profile. (Status " + response.status + "): " + errText);
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        alert("FETCH ERROR: " + error.message);
    }
}

function handleRoleChange() {
    const el = document.getElementById('editRole');
    if (!el) {
        console.warn("[EditProfile] #editRole not found for handleRoleChange");
        return;
    }
    const role = el.value.toLowerCase();
    document.querySelectorAll('.craft-module').forEach(m => m.style.display = 'none');
    
    if (role.includes('director')) {
        document.getElementById('moduleDirector').style.display = 'block';
    } else if (role.includes('actor')) {
        document.getElementById('moduleActor').style.display = 'block';
    } else if (role.includes('dop')) {
        document.getElementById('moduleDOP').style.display = 'block';
    } else if (role.includes('editor')) {
        document.getElementById('moduleEditor').style.display = 'block';
    } else if (role.includes('music')) {
        document.getElementById('moduleMusic').style.display = 'block';
    } else {
        document.getElementById('moduleGeneral').style.display = 'block';
    }
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

    // Cover Image Handler
    const coverInput = document.getElementById('coverImageInput');
    if (coverInput) {
        coverInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    selectedCoverImage = await uploadImage(file);
                    // If there's a preview element for cover, update it here
                    showMessage('Cover image selected.', 'info');
                } catch (err) {
                    console.error('Cover upload failed:', err);
                }
            }
        });
    }

    // Project Poster Handler
    document.getElementById('projPosterInput').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const uploadBtn = document.getElementById('posterUploadBtn');
                uploadBtn.style.opacity = '0.5';
                
                const url = await uploadImage(file);
                if (url) {
                    const preview = document.getElementById('projPosterPreview');
                    preview.src = url;
                    preview.setAttribute('data-poster-url', url);
                    uploadBtn.classList.add('has-image');
                    uploadBtn.style.opacity = '1';
                    console.log("Poster uploaded successfully");
                }
            } catch (err) {
                console.error("Poster upload failed:", err);
                showMessage("We couldn't upload your project poster. Please try a different image.", "error");
                document.getElementById('posterUploadBtn').style.opacity = '1';
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
    if (container) {
        container.innerHTML = skillsList.map((s, i) => `<span class="skill-tag">${s} <i class="fa-solid fa-times" onclick="removeSkill(${i})" style="cursor:pointer; margin-left:5px;"></i></span>`).join('');
    }
}

async function saveProfile() {
    console.log('--- Starting Profile Save Process ---');
    const btn = document.getElementById('saveProfileBtn') || document.querySelector('.btn-save');
    if (!btn) {
        console.error('Save button not found');
        return;
    }

    const originalBtnHtml = btn.innerHTML || btn.textContent;
    
    try {
        // Basic UI Feedback
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const elName = document.getElementById('editName');
        const elEmail = document.getElementById('editEmail');
        
        if (!elName || !elEmail) {
            console.error('Critical elements missing: editName or editEmail');
            showMessage('Page error: Essential fields missing. Please reload.', 'error');
            return;
        }

        const name = elName.value.trim();
        const email = elEmail.value.trim();
        const userIdNum = parseInt(currentUserId);

        console.log('User ID:', userIdNum, 'Name:', name, 'Email:', email);

        if (isNaN(userIdNum)) {
            console.error('Invalid User ID:', currentUserId);
            showMessage('Session expired. Please log in again.', 'error');
            return;
        }

        if (!name || !email) {
            showMessage('Name and Email are required.', 'error');
            return;
        }

        const roleEl = document.getElementById('editRole');
        const role = roleEl ? roleEl.value : 'Explorer';
        console.log('Selected Role:', role);
        
        // Standardized helper for fetching values safely
        const getVal = (id) => {
            const el = document.getElementById(id);
            if (!el) {
                console.warn(`Element #${id} not found, returning empty string`);
                return '';
            }
            return el.value ? el.value.trim() : '';
        };

        const selectedRole = role; 
        const isActor = selectedRole.toLowerCase().includes('actor');
        const isDirector = selectedRole.toLowerCase().includes('director');
        const isMusic = selectedRole.toLowerCase().includes('music') || selectedRole.toLowerCase().includes('singer');
        const isDop = selectedRole.toLowerCase().includes('dop') || selectedRole.toLowerCase().includes('cinematographer');

        // Build the data object with ALL fields supported by the User model
        const updatedUser = {
            id: userIdNum,
            name: name,
            email: email,
            phone: getVal('editPhone'),
            location: getVal('editLocation'),
            bio: getVal('editBio'),
            role: selectedRole,
            userType: getVal('editUserType'),
            skills: getVal('editSkills') || (skillsList && skillsList.length > 0 ? skillsList.join(',') : ''),
            
            // Experience fields
            experience: getVal('editExperience'),
            experienceDetails: getVal('editExpDetails'),
            
            // Role-specific fields (Direct mapping to User model)
            genres: (isDirector || isMusic) ? (isMusic ? getVal('musGenres') : getVal('dirGenres')) : (originalUserData.genres || ''),
            projectsDirected: getVal('dirProjects'),
            budgetHandled: getVal('dirBudget'),
            teamSize: getVal('dirTeamSize'),
            visionStatement: getVal('dirVision'),
            
            height: getVal('actHeight'),
            weight: getVal('actWeight'),
            ageRange: getVal('actAgeRange'),
            gender: getVal('actGender') || getVal('editGender'),
            bodyType: getVal('actBodyType'),
            languages: getVal('actLanguages'),
            
            cameraExpertise: getVal('dopCamera'),
            editingSoftware: getVal('editSoftware'),
            editingStyle: getVal('editStyle'),
            turnaroundTime: getVal('editTurnaround'),
            portfolioVideos: getVal('editVideos') || getVal('editPortfolio'),
            
            daws: getVal('musDaws'),
            instruments: getVal('musInstruments'),
            sampleTracks: getVal('musTracks'),
            musicExperience: getVal('musExperience'),
            
            interests: getVal('genInterests'),
            occupation: getVal('genOccupation'),
            goals: getVal('genGoals'),
            learningResources: getVal('genLearning'),
            
            showreel: isDirector ? getVal('dirShowreel') : (isDop ? getVal('dopShowreel') : (isActor ? getVal('actShowreel') : (originalUserData.showreel || ''))),
            
            instagram: getVal('editInstagram'),
            youtube: getVal('editYoutube'),
            twitter: getVal('editTwitter'),
            tiktok: getVal('editTiktok'),
            
            // Dates
            availabilityFrom: getVal('editAvailFrom') || null,
            availabilityTo: getVal('editAvailTo') || null,
            
            // Private Info
            expectedMovieRemuneration: getVal('editBudgetMovie'),
            expectedWebseriesRemuneration: getVal('editBudgetWeb')
        };

        // Include base64 images if they were selected
        if (selectedProfilePic) {
            updatedUser.profilePicture = selectedProfilePic;
        }
        if (selectedCoverImage) {
            updatedUser.coverImage = selectedCoverImage;
        }

        // Recalculate profile score before saving
        updatedUser.profileScore = typeof calculateProfileScore === 'function' ? calculateProfileScore(updatedUser) : (originalUserData ? (originalUserData.profileScore || 0) : 0);

        console.log('Sending Profile Update Payload:', updatedUser);

        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedUser)
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Profile updated successfully:', result);
            
            // Update local storage
            localStorage.setItem('userName', result.name);
            if (result.profilePicture) localStorage.setItem('userAvatar', result.profilePicture);

            showMessage('Profile saved successfully!', 'success');
            
            // Give user a moment to see the success message
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1000);
        } else {
            let errorMsg = 'Unknown error';
            try {
                errorMsg = await response.text();
            } catch (e) {}
            
            console.error('Server Save Error:', errorMsg);
            showMessage('Save failed: ' + errorMsg, 'error');
            alert('SERVER ERROR: ' + errorMsg);
        }
    } catch (error) {
        console.error('Save Execution Error:', error);
        alert('CRITICAL ERROR: ' + error.message);
        showMessage('An error occurred while saving. Please check the console.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalBtnHtml;
        }
    }
}

// Project Management Functions
async function loadUserProjects() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/user/${currentUserId}`);
        const projects = await response.json();
        renderProjectsList(projects);
    } catch (err) {
        console.error('Error loading projects:', err);
    }
}

function renderProjectsList(projects) {
    const container = document.getElementById('projectsListContainer');
    if (!container) return;
    
    if (!projects || projects.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:30px; background:#f8fafc; border-radius:16px; border:1px solid #e2e8f0; color:#64748b; font-size:13px;"><i class="fa-solid fa-film" style="font-size:24px; margin-bottom:10px; display:block; opacity:0.3;"></i>No projects added to portfolio yet.</div>';
        return;
    }

    container.innerHTML = projects.map((p, index) => {
        const projectNum = (index + 1).toString().padStart(2, '0');
        const defaultImage = `https://placehold.co/200x300/f8fafc/64748b?text=PROJECT+${projectNum}`;
        
        return `
        <div class="project-item-card">
            <img src="${p.imageUrl || defaultImage}" 
                 alt="Poster" 
                 onerror="this.onerror=null; this.src='${defaultImage}';">
            <div class="project-info">
                <h4>${p.title} (${p.year}) ${p.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--primary-orange); margin-left:5px;" title="Verified Project"></i>' : ''}</h4>
                <p><strong>Role:</strong> ${p.role}</p>
                <p style="margin-top:5px; font-size:12px; color:#475569;">${p.description || 'No description'}</p>
                ${p.videoUrl ? `<a href="${p.videoUrl}" target="_blank" style="font-size:12px; color:var(--primary-orange); text-decoration:none; display:inline-block; margin-top:8px; font-weight:700;">VIEW PROJECT <i class="fa-solid fa-external-link" style="font-size:10px;"></i></a>` : ''}
            </div>
            <div class="project-actions">
                <button class="project-action-btn" onclick="editProjectUI(${p.id})" title="Edit Project">
                    <i class="fa-solid fa-edit"></i>
                </button>
                <button class="project-action-btn delete" onclick="deleteProject(${p.id})" title="Delete Project">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `}).join('');
}

async function editProjectUI(projectId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`);
        if (response.ok) {
            const project = await response.json();
            
            editingProjectId = projectId;
            
            // Populate form
            document.getElementById('projTitle').value = project.title;
            document.getElementById('projYear').value = project.year;
            document.getElementById('projRole').value = project.role;
            document.getElementById('projLink').value = project.videoUrl || '';
            document.getElementById('projAbout').value = project.description || '';
            
            const preview = document.getElementById('projPosterPreview');
            const uploadBtn = document.getElementById('posterUploadBtn');
            
            if (project.imageUrl) {
                preview.src = project.imageUrl;
                preview.setAttribute('data-poster-url', project.imageUrl);
                uploadBtn.classList.add('has-image');
            } else {
                preview.src = '';
                preview.removeAttribute('data-poster-url');
                uploadBtn.classList.remove('has-image');
            }
            
            // Update UI
            document.getElementById('formTitle').textContent = '✎ Edit Movie Project';
            const submitBtn = document.getElementById('submitProjectBtn');
            if (submitBtn) submitBtn.textContent = 'UPDATE PROJECT';
            
            const cancelBtn = document.getElementById('cancelEditBtn');
            if (cancelBtn) cancelBtn.style.display = 'block';
            
            // Scroll to form
            document.getElementById('projectForm').scrollIntoView({ behavior: 'smooth' });
        }
    } catch (err) {
        console.error('Error fetching project for edit:', err);
    }
}

function resetProjectForm() {
    editingProjectId = null;
    document.getElementById('projTitle').value = '';
    document.getElementById('projYear').value = '';
    document.getElementById('projRole').value = '';
    document.getElementById('projLink').value = '';
    document.getElementById('projAbout').value = '';
    
    const preview = document.getElementById('projPosterPreview');
    const uploadBtn = document.getElementById('posterUploadBtn');
    if (preview) {
        preview.src = '';
        preview.removeAttribute('data-poster-url');
    }
    if (uploadBtn) uploadBtn.classList.remove('has-image');
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.textContent = '+ Add New Movie Project';
    
    const submitBtn = document.getElementById('submitProjectBtn');
    if (submitBtn) submitBtn.textContent = 'ADD PROJECT';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) cancelBtn.style.display = 'none';
}

async function addNewProject(e) {
    if (e) e.preventDefault();
    
    const title = document.getElementById('projTitle').value.trim();
    const year = document.getElementById('projYear').value;
    const role = document.getElementById('projRole').value.trim();
    const link = document.getElementById('projLink').value.trim();
    const about = document.getElementById('projAbout').value.trim();
    const imageUrl = document.getElementById('projPosterPreview').getAttribute('data-poster-url') || '';

    if (!title || !year || !role) {
        showMessage('Please enter the movie title, year, and your role.', 'error');
        return;
    }

    const userIdNum = parseInt(currentUserId);
    if (!currentUserId || isNaN(userIdNum)) {
        showMessage('Your session has expired. Please log in again.', 'error');
        return;
    }

    const projectData = {
        userId: userIdNum,
        title: title,
        year: parseInt(year),
        role: role,
        videoUrl: link,
        description: about,
        imageUrl: imageUrl
    };

    const addBtn = document.getElementById('submitProjectBtn');
    if (!addBtn) return;
    
    const originalText = addBtn.textContent;

    try {
        addBtn.disabled = true;
        addBtn.textContent = editingProjectId ? 'Updating...' : 'Adding...';

        const url = editingProjectId 
            ? `${API_BASE_URL}/api/projects/${editingProjectId}` 
            : `${API_BASE_URL}/api/projects`;
        const method = editingProjectId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });

        if (response.ok) {
            console.log("Project saved successfully");
            resetProjectForm();
            loadUserProjects();
            showMessage(editingProjectId ? 'Project updated!' : 'New project added to your portfolio!', 'success');
        } else {
            showMessage("We couldn’t save your project right now. Please try again.", "error");
        }
    } catch (err) {
        console.error('Error saving project:', err);
        showMessage("Oops! Something went wrong while saving. Please check your connection.", "error");
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = originalText;
    }
}

async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadUserProjects();
            showMessage('Project deleted.', 'info');
        }
    } catch (err) {
        console.error('Error deleting project:', err);
    }
}
