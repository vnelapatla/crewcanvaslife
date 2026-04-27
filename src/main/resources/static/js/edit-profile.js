// Edit Profile functionality
let currentUserId = null;
let selectedProfilePic = null;
let skillsList = [];
let originalUserData = {};
let editingProjectId = null;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    loadProfileData();
    setupImageHandlers();
    loadUserProjects(); // Added
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
            
            // User Category & Verification
            document.getElementById('editUserType').value = user.userType || 'Explorer';
            if (user.isVerifiedProfessional) {
                document.getElementById('verifiedStatusContainer').style.display = 'block';
                document.getElementById('categoryGroup').style.display = 'block';
                document.getElementById('categoryLockMessage').style.display = 'none';
            } else {
                document.getElementById('categoryGroup').style.display = 'none';
                document.getElementById('categoryLockMessage').style.display = 'block';
            }

            // Role-specific fields
            // Director
            document.getElementById('dirGenres').value = user.genres || '';
            document.getElementById('dirProjects').value = user.projectsDirected || '';
            document.getElementById('dirBudget').value = user.budgetHandled || '';
            document.getElementById('dirTeamSize').value = user.teamSize || '';
            document.getElementById('dirShowreel').value = user.showreel || '';
            document.getElementById('dirVision').value = user.visionStatement || '';

            // Actor
            document.getElementById('actHeight').value = user.height || '';
            document.getElementById('actWeight').value = user.weight || '';
            document.getElementById('actAgeRange').value = user.ageRange || '';
            document.getElementById('actGender').value = user.gender || '';
            document.getElementById('actBodyType').value = user.bodyType || '';
            document.getElementById('actLanguages').value = user.languages || '';
            
            // DOP
            document.getElementById('dopCamera').value = user.cameraExpertise || '';
            document.getElementById('dopShowreel').value = user.showreel || '';

            // Editor
            document.getElementById('editSoftware').value = user.editingSoftware || '';
            document.getElementById('editStyle').value = user.editingStyle || '';
            document.getElementById('editVideos').value = user.portfolioVideos || '';
            document.getElementById('editTurnaround').value = user.turnaroundTime || '';
            document.getElementById('editExpDetails').value = user.experienceDetails || '';

            // Music
            document.getElementById('musGenres').value = user.genres || ''; // Reuse genres if applicable
            document.getElementById('musDaws').value = user.daws || '';
            document.getElementById('musInstruments').value = user.instruments || '';
            document.getElementById('musTracks').value = user.sampleTracks || '';
            document.getElementById('musExperience').value = user.musicExperience || '';

            // General Details
            document.getElementById('genInterests').value = user.interests || '';
            document.getElementById('genOccupation').value = user.occupation || '';
            document.getElementById('genGoals').value = user.goals || '';
            document.getElementById('genLearning').value = user.learningResources || '';

            // Socials
            document.getElementById('editInstagram').value = user.instagram || '';
            document.getElementById('editYoutube').value = user.youtube || '';
            document.getElementById('editTiktok').value = user.tiktok || '';
            document.getElementById('editTwitter').value = user.twitter || '';
            
            // Private Info
            if (user.availabilityFrom) document.getElementById('editAvailFrom').value = user.availabilityFrom;
            if (user.availabilityTo) document.getElementById('editAvailTo').value = user.availabilityTo;
            document.getElementById('editBudgetMovie').value = user.expectedMovieRemuneration || user.budgetMovie || '';
            document.getElementById('editBudgetWeb').value = user.expectedWebseriesRemuneration || user.budgetWebseries || '';

            if (user.skills) {
                skillsList = user.skills.split(',').map(s => s.trim()).filter(s => s !== '');
                renderSkills();
            }

            if (user.profilePicture) {
                document.getElementById('currentAvatar').src = user.profilePicture;
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
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function handleRoleChange() {
    const role = document.getElementById('editRole').value.toLowerCase();
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
            userType: document.getElementById('editUserType').value,
            skills: skillsList.join(','),
            
            // Director Fields
            genres: document.getElementById('dirGenres').value.trim(),
            projectsDirected: document.getElementById('dirProjects').value.trim(),
            budgetHandled: document.getElementById('dirBudget').value.trim(),
            teamSize: document.getElementById('dirTeamSize').value.trim(),
            showreel: document.getElementById('dirShowreel').value.trim(),
            visionStatement: document.getElementById('dirVision').value.trim(),

            // Actor Fields
            height: document.getElementById('actHeight').value.trim(),
            weight: document.getElementById('actWeight').value.trim(),
            ageRange: document.getElementById('actAgeRange').value.trim(),
            gender: document.getElementById('actGender').value.trim(),
            bodyType: document.getElementById('actBodyType').value.trim(),
            languages: document.getElementById('actLanguages').value.trim(),

            // DOP Fields
            cameraExpertise: document.getElementById('dopCamera').value.trim(),
            // showreel is handled by either director or DOP field in UI, but we should make sure it's consistent.
            // Wait, I used 'dopShowreel' and 'dirShowreel'. I'll handle them both.
            // Let's use a logic to pick the one from the active module.
            showreel: (document.getElementById('editRole').value.toLowerCase().includes('director')) 
                ? document.getElementById('dirShowreel').value.trim()
                : (document.getElementById('editRole').value.toLowerCase().includes('dop') 
                    ? document.getElementById('dopShowreel').value.trim() 
                    : originalUserData.showreel || ''),

            // Editor Fields
            editingSoftware: document.getElementById('editSoftware').value.trim(),
            editingStyle: document.getElementById('editStyle').value.trim(),
            portfolioVideos: document.getElementById('editVideos').value.trim(),
            turnaroundTime: document.getElementById('editTurnaround').value.trim(),
            experienceDetails: document.getElementById('editExpDetails').value.trim(),

            // Music Fields
            // Note: genres is reused from above if needed
            daws: document.getElementById('musDaws').value.trim(),
            instruments: document.getElementById('musInstruments').value.trim(),
            sampleTracks: document.getElementById('musTracks').value.trim(),
            musicExperience: document.getElementById('musExperience').value.trim(),

            // General Details
            interests: document.getElementById('genInterests').value.trim(),
            occupation: document.getElementById('genOccupation').value.trim(),
            goals: document.getElementById('genGoals').value.trim(),
            learningResources: document.getElementById('genLearning').value.trim(),

            instagram: document.getElementById('editInstagram').value.trim(),
            youtube: document.getElementById('editYoutube').value.trim(),
            tiktok: document.getElementById('editTiktok').value.trim(),
            twitter: document.getElementById('editTwitter').value.trim(),
            
            // Private Info
            availabilityFrom: document.getElementById('editAvailFrom').value || null,
            availabilityTo: document.getElementById('editAvailTo').value || null,
            expectedMovieRemuneration: document.getElementById('editBudgetMovie').value.trim(),
            expectedWebseriesRemuneration: document.getElementById('editBudgetWeb').value.trim()
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
    `).join('');
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
            document.getElementById('submitProjectBtn').textContent = 'UPDATE PROJECT';
            document.getElementById('cancelEditBtn').style.display = 'block';
            
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
    preview.src = '';
    preview.removeAttribute('data-poster-url');
    uploadBtn.classList.remove('has-image');
    
    document.getElementById('formTitle').textContent = '+ Add New Movie Project';
    document.getElementById('submitProjectBtn').textContent = 'ADD PROJECT';
    document.getElementById('cancelEditBtn').style.display = 'none';
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
        }
    } catch (err) {
        console.error('Error deleting project:', err);
    }
}
