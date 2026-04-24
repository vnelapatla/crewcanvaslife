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
    } else if (role.includes('editor')) {
        document.getElementById('moduleEditor').style.display = 'block';
    } else if (role.includes('music')) {
        document.getElementById('moduleMusic').style.display = 'block';
    } else if (role.includes('aspirant') || role.includes('content creator') || role.includes('explorer')) {
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
                const url = await uploadImage(file);
                if (url) {
                    document.getElementById('projPosterPreview').src = url;
                    document.getElementById('projPosterPreview').setAttribute('data-poster-url', url);
                    console.log("Poster uploaded successfully");
                }
            } catch (err) {
                console.error("Poster upload failed:", err);
                alert("Failed to upload poster image.");
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
        container.innerHTML = '<p style="color:#888; font-size:13px; padding:10px;">No projects added to portfolio yet.</p>';
        return;
    }

    container.innerHTML = projects.map(p => `
        <div class="project-item-card">
            <img src="${p.imageUrl || 'https://via.placeholder.com/80x110'}" alt="Poster">
            <div class="project-info">
                <h4>${p.title} (${p.year}) ${p.verified ? '<i class="fa-solid fa-circle-check" style="color:var(--primary-orange); margin-left:5px;" title="Verified Project"></i>' : ''}</h4>
                <p><strong>Role:</strong> ${p.role}</p>
                <p style="margin-top:5px; font-size:12px;">${p.description || 'No description'}</p>
                ${p.videoUrl ? `<a href="${p.videoUrl}" target="_blank" style="font-size:12px; color:var(--primary-orange); text-decoration:none;">Project Link <i class="fa-solid fa-external-link"></i></a>` : ''}
            </div>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <button class="btn-delete-project" onclick="deleteProject(${p.id})" style="color:#ff4d4d; border:none; background:none; cursor:pointer;">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
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
        alert('Please fill in Movie Name, Year and your Role.');
        return;
    }

    const userIdNum = parseInt(currentUserId);
    if (!currentUserId || isNaN(userIdNum)) {
        alert('User session not found or invalid. Please log in again.');
        return;
    }

    const newProject = {
        userId: userIdNum,
        title: title,
        year: parseInt(year),
        role: role,
        videoUrl: link,
        description: about,
        imageUrl: imageUrl
    };

    const addBtn = e ? e.target : document.querySelector('button[onclick*="addNewProject"]');
    const originalText = addBtn ? addBtn.textContent : 'ADD PROJECT';

    try {
        if (addBtn) {
            addBtn.disabled = true;
            addBtn.textContent = 'Adding...';
        }

        console.log("Attempting to save project:", newProject);

        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newProject)
        });

        if (response.ok) {
            const result = await response.json();
            console.log("Project saved successfully:", result);
            
            // Reset form
            document.getElementById('projTitle').value = '';
            document.getElementById('projYear').value = '';
            document.getElementById('projRole').value = '';
            document.getElementById('projLink').value = '';
            document.getElementById('projAbout').value = '';
            document.getElementById('projPosterPreview').src = 'https://via.placeholder.com/80x110';
            document.getElementById('projPosterPreview').removeAttribute('data-poster-url');
            
            // Reload list
            loadUserProjects();
            alert('Project added successfully!');
        } else {
            const errorText = await response.text();
            console.error("Server returned error:", errorText);
            alert(`Failed to add project: ${errorText}`);
        }
    } catch (err) {
        console.error('Network or system error adding project:', err);
        alert('An error occurred while saving the project. Please check your connection or server status.');
    } finally {
        if (addBtn) {
            addBtn.disabled = false;
            addBtn.textContent = originalText;
        }
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
