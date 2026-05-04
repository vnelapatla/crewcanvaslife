let currentEvent = null;
let allApplicants = [];

document.addEventListener('DOMContentLoaded', async () => {
    // API_BASE_URL is usually defined in utils.js or injected
    if (typeof API_BASE_URL === 'undefined') {
        window.API_BASE_URL = ''; // Default to same origin
    }

    const urlParams = new URLSearchParams(window.location.search);
    const shareKey = urlParams.get('key');

    if (!shareKey) {
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; text-align: center; padding: 20px;">
                <h1 style="font-family: 'Outfit'; font-size: 48px; color: #ff8c00; margin-bottom: 20px;">Link Expired</h1>
                <p style="font-size: 18px; color: #94a3b8; max-width: 500px;">This casting deck link is invalid or the audition has been closed. Please contact the administrator for a new link.</p>
                <a href="index.html" style="margin-top: 30px; color: #ff8c00; text-decoration: none; font-weight: 700; border: 1px solid #ff8c00; padding: 12px 24px; border-radius: 12px;">Back to CrewCanvas</a>
            </div>
        `;
        return;
    }

    await loadAuditionData(shareKey);
});

async function loadAuditionData(key) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/public/audition/${key}`);
        if (!response.ok) {
            throw new Error('Failed to load audition data');
        }

        const data = await response.json();
        currentEvent = data.event;
        allApplicants = data.applicants;

        renderEventHeader();
        renderTalentGrid();
    } catch (error) {
        console.error('Error:', error);
        document.body.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white; text-align: center; padding: 20px;">
                <h1 style="font-family: 'Outfit'; font-size: 48px; color: #ef4444; margin-bottom: 20px;">Error</h1>
                <p style="font-size: 18px; color: #94a3b8;">Failed to load the casting deck. Please check your connection and try again.</p>
                <button onclick="window.location.reload()" style="margin-top: 30px; background: #ff8c00; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer;">Try Again</button>
            </div>
        `;
    }
}

function renderEventHeader() {
    const banner = document.getElementById('eventBanner');
    const date = new Date(currentEvent.date);
    const dateStr = !isNaN(date) ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Flexible Date';
    
    banner.innerHTML = `
        <img src="${currentEvent.imageUrl || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop'}" alt="${currentEvent.title}">
        <div class="banner-overlay">
            <h1 style="color: white; margin: 0; line-height: 1.2;">${currentEvent.title}</h1>
            <div class="event-meta">
                <span><i class="fas fa-map-marker-alt" style="color: var(--primary-orange);"></i> ${currentEvent.location}</span>
                <span><i class="fas fa-calendar-alt" style="color: var(--primary-orange);"></i> ${dateStr}</span>
                <span><i class="fas fa-users" style="color: var(--primary-orange);"></i> ${allApplicants.length} Candidates</span>
            </div>
        </div>
    `;
}

function renderTalentGrid() {
    const grid = document.getElementById('deckGrid');
    const countEl = document.getElementById('candidateCount');
    
    if (countEl) countEl.innerText = `${allApplicants.length} Professional Profiles`;

    if (allApplicants.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 100px 20px; background: var(--card-bg); border-radius: 40px; border: 1px dashed rgba(255,255,255,0.1);">
                <i class="fas fa-user-clock" style="font-size: 64px; color: #334155; margin-bottom: 25px; display: block;"></i>
                <h2 style="color: #94a3b8; font-family: 'Outfit'; font-size: 28px;">No Candidates Yet</h2>
                <p style="color: #64748b; font-size: 18px;">Applications for this audition are currently being processed.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = allApplicants.map((app, index) => {
        const mainPhoto = app.photo1 || 'https://images.unsplash.com/photo-1512361436605-a48423d7692c?q=80&w=2070&auto=format&fit=crop';
        return `
            <div class="talent-card" onclick="openModal(${index})">
                <div class="talent-image">
                    <img src="${mainPhoto}" alt="${app.applicantName}">
                </div>
                <div class="talent-info">
                    <p style="font-size: 20px; font-weight: 900; margin-bottom: 0;">${app.role || 'Professional'}</p>
                    <div class="view-btn">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function openModal(index) {
    const app = allApplicants[index];
    const modal = document.getElementById('talentModal');
    
    document.getElementById('modalName').innerText = app.applicantName || 'Anonymous Talent';
    document.getElementById('modalRole').innerText = app.role || 'Professional';
    document.getElementById('modalPhone').innerText = app.mobileNumber || 'Not available';
    document.getElementById('modalAge').innerText = app.age || 'Not specified';
    document.getElementById('modalHeight').innerText = app.height || 'Not specified';
    document.getElementById('modalLocation').innerText = app.location || 'Not specified';
    document.getElementById('modalExp').innerText = (app.experience && app.experience.length > 5) ? app.experience : 'Detailed professional history not provided.';
    document.getElementById('modalBio').innerText = (app.additionalNote && app.additionalNote.length > 5) ? app.additionalNote : 'No narrative provided for this candidate.';
    
    // Main Hero Image
    const mainImg = document.getElementById('modalMainImg');
    mainImg.src = app.photo1 || 'https://images.unsplash.com/photo-1512361436605-a48423d7692c?q=80&w=2070&auto=format&fit=crop';
    
    // Large Gallery
    const galleryContainer = document.getElementById('modalGalleryLarge');
    const photos = [app.photo2, app.photo3].filter(p => p && p.trim() !== '');
    
    if (photos.length > 0) {
        galleryContainer.style.display = 'grid';
        galleryContainer.innerHTML = photos.map(p => `
            <div class="gallery-item-large">
                <img src="${p}" alt="">
            </div>
        `).join('');
    } else {
        galleryContainer.style.display = 'none';
    }

    // Video Action
    const videoBtn = document.getElementById('modalVideoBtn');
    const portLink = app.portfolioLink || app.videoUrl;
    if (portLink && portLink.length > 10) {
        videoBtn.style.display = 'flex';
        videoBtn.onclick = (e) => {
            e.preventDefault();
            if (typeof openBase64InNewTab === 'function') {
                openBase64InNewTab(portLink, 'video/mp4', 'performance_video');
            } else {
                window.open(portLink, '_blank');
            }
        };
    } else {
        videoBtn.style.display = 'none';
    }

    // Resume Action
    const resumeBtn = document.getElementById('modalResumeBtn');
    if (app.resumeUrl && app.resumeUrl.length > 20) {
        resumeBtn.style.display = 'flex';
        resumeBtn.onclick = (e) => {
            e.preventDefault();
            if (typeof openBase64InNewTab === 'function') {
                openBase64InNewTab(app.resumeUrl, 'application/pdf', app.resumeFileName);
            } else {
                window.open(app.resumeUrl, '_blank');
            }
        };
    } else {
        resumeBtn.style.display = 'none';
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('talentModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Global modal close on click outside (only if clicking container, but here close button is better)
window.onclick = function(event) {
    const modal = document.getElementById('talentModal');
    if (event.target == modal) {
        closeModal();
    }
}

// Global modal close on click outside
window.onclick = function(event) {
    const modal = document.getElementById('talentModal');
    if (event.target == modal) {
        closeModal();
    }
}
