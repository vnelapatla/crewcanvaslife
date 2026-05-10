// Events and Auditions functionality
let currentUserId = null;
let currentUser = null;
let pendingEventId = null;
let allEvents = [];
let userApplications = [];
let hasScrolledToEvent = false;
let currentFilter = 'all';
let currentType = ''; 
let editModeId = null;

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    // Load everything in background (non-blocking for faster mobile init)
    Promise.all([
        loadCurrentUser(),
        loadEvents()
    ]);
    scrollToEventFromUrl();
    checkEditMode();
    const isManagedCheckbox = document.getElementById('isManaged');
    if (isManagedCheckbox) isManagedCheckbox.addEventListener('change', toggleManagedFields);
});

function scrollToEventFromUrl() {
    const eventId = getQueryParam('eventId');
    if (!eventId) return;

    // Wait for events to load if they haven't yet
    const checkInterval = setInterval(() => {
        const element = document.getElementById(`event-card-${eventId}`);
        if (element) {
            clearInterval(checkInterval);
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.style.boxShadow = '0 0 30px rgba(255, 140, 0, 0.4)';
            setTimeout(() => { element.style.boxShadow = ''; }, 3000);
        }
    }, 500);
    
    // Stop checking after 10 seconds to avoid infinite loop
    setTimeout(() => clearInterval(checkInterval), 10000);
}

function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');
    const edit = urlParams.get('edit') === 'true';
    
    if (edit && eventId) {
        // Logic to open edit form (if needed)
        console.log("Edit mode for event:", eventId);
    }
}

async function loadCurrentUser() {
    try {
        if (!currentUserId) return;
        const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}/summary`);
        if (response.ok) {
            currentUser = await response.json();
            const nameEle = document.getElementById('currentUserName') || document.getElementById('userNameHeader');
            if (nameEle) nameEle.textContent = currentUser.name;
            return currentUser;
        }
    } catch (error) { console.error(error); }
    return null;
}

async function loadEvents() {
    const container = document.getElementById('eventsGrid');
    
    // --- OPTIMIZATION: Try to load from Pre-fetch Cache first ---
    const cached = localStorage.getItem('cache_events_top10');
    if (cached && container) {
        try {
            const cachedEvents = JSON.parse(cached);
            if (cachedEvents && cachedEvents.length > 0) {
                console.log("✨ Instant Events: Using pre-fetch cache");
                allEvents = cachedEvents;
                updateCounts();
                searchEvents();
            }
        } catch (e) { localStorage.removeItem('cache_events_top10'); }
    }

    if (container && (!allEvents || allEvents.length === 0)) {
        container.innerHTML = `
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
        `;
    }

    try {
        // Parallel fetch for applications and events
        const fetchPromises = [
            fetch(`${API_BASE_URL}/api/events?page=0&size=50`)
        ];
        
        // Only fetch applications if user is logged in
        if (currentUserId) {
            fetchPromises.push(fetch(`${API_BASE_URL}/api/events/applications/user/${currentUserId}`));
        }

        const responses = await Promise.all(fetchPromises);
        const eventsRes = responses[0];
        const appsRes = currentUserId ? responses[1] : null;

        if (appsRes && appsRes.ok) {
            userApplications = await appsRes.json();
        }
        
        if (eventsRes.ok) { 
            const data = await eventsRes.json();
            // Handle both Array (old) and Page Object (new)
            allEvents = data.content ? data.content : data; 
            updateCounts(); 
            searchEvents(); 
        }
    } catch (error) { 
        console.error(error); 
        if (container) container.innerHTML = '<p style="text-align:center; padding:50px;">Failed to load events. Please refresh.</p>';
    }
}

function updateCounts() {
    const counts = { 'Workshop': 0, 'Course': 0, 'Contest': 0, 'Audition': 0, 'Film Event': 0 };
    allEvents.forEach(event => { if (counts[event.eventType] !== undefined) counts[event.eventType]++; });
    if (document.getElementById('workshopCount')) document.getElementById('workshopCount').innerText = counts['Workshop'];
    if (document.getElementById('courseCount')) document.getElementById('courseCount').innerText = counts['Course'];
    if (document.getElementById('contestCount')) document.getElementById('contestCount').innerText = counts['Contest'];
    if (document.getElementById('auditionCount')) document.getElementById('auditionCount').innerText = counts['Audition'];
    if (document.getElementById('filmEventCount')) document.getElementById('filmEventCount').innerText = counts['Film Event'];
    if (document.getElementById('totalEventCount')) document.getElementById('totalEventCount').innerText = allEvents.length;
}

function searchEvents() {
    const searchInput = document.getElementById('eventSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let filtered = allEvents;
    if (currentFilter !== 'all') filtered = filtered.filter(event => event.eventType && event.eventType.toLowerCase() === currentFilter.toLowerCase());
    if (query) filtered = filtered.filter(event => (event.title && event.title.toLowerCase().includes(query)) || (event.location && event.location.toLowerCase().includes(query)));
    displayEvents(filtered);
}

function displayEvents(events, prepend = false) {
    const container = document.getElementById('eventsGrid');
    if (!container) return;
    const eventsHtml = events.map((event, index) => {
        const eventType = event.eventType || 'Audition';
        const isManaged = event.isManaged === true;
        const isOwnerOrAdmin = (event.userId == currentUserId || (currentUser && currentUser.isAdmin));
        const displayImage = event.imageUrl || getEventDefaultImage(eventType);
        const hasApplied = userApplications.some(app => app.eventId == event.id);
        const sTitle = (event.title || 'Untitled').replace(/'/g, "\\'");
        const tagClass = 'tag-' + eventType.toLowerCase().replace(' ', '-');

        return `
            <div class="cinematic-card" id="event-card-${event.id}" style="width: 100% !important; margin-bottom: 30px;">
                <div class="type-tag ${tagClass}">${eventType}</div>
                ${isManaged ? `<div class="type-tag" style="left: auto; right: 20px; background: #FF8C00; color: white;"><i class="fas fa-certificate"></i> Official</div>` : ''}
                <img src="${displayImage}" style="width: 100%; height: 500px; object-fit: contain; background: #000;">
                <div class="card-content" style="padding: 15px;">
                    <h3 style="font-size: 18px; margin-bottom: 8px;">${event.title}</h3>
                    ${event.adminNote ? `<p style="font-size: 12px; color: #6366f1; font-weight: 600; margin-bottom: 10px; background: rgba(99, 102, 241, 0.05); padding: 8px; border-radius: 8px;"><i class="fas fa-info-circle"></i> Note: ${event.adminNote}</p>` : ''}
                    <div class="card-footer" style="padding: 15px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <div style="font-size: 11px; font-weight: 600; color: #64748b;">
                            <i class="fas fa-users"></i> ${event.applicants || 0} applied
                        </div>
                        ${(() => {
                            const sLink = (event.externalLink || '').replace(/'/g, "\\'");
                            const regAct = (isManaged && event.externalLink) ? `event.stopPropagation(); handleExternalRedirect(${event.id}, '${sLink}')` : `applyToEvent(${event.id})`;
                            const brandOrange = '#FF8C00';
                            const successGreen = '#10b981';
                            const btnColor = hasApplied ? successGreen : brandOrange;
                            let btnText = isManaged ? (hasApplied ? 'Registered' : 'WhatsApp Me') : (hasApplied ? 'Applied' : 'Apply Now');
                            return `<button class="apply-btn" style="flex: 1; max-width: 180px; padding: 10px 15px; font-size: 13px; border-radius: 10px; border: none; font-weight: 700; background: ${btnColor}; color: white;" onclick="${regAct}">${btnText}</button>`;
                        })()}
                        <div onclick="event.stopPropagation(); shareEvent(${event.id}, '${sTitle}')" style="cursor: pointer; color: #6366f1; font-size: 11px; font-weight: 600; text-align: right;">
                            <i class="fas fa-share-alt"></i> Share
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    container.innerHTML = eventsHtml;
}

function openCreateForm(type, isEdit = false) {
    currentType = type;
    if (!isEdit) {
        editModeId = null;
        document.getElementById('formTitle').innerText = '✨ Launch Opportunity';
        clearEventImage();
    }
    document.getElementById('formModal').style.display = 'flex';
    updateFormFields(type);
    const managedGroup = document.getElementById('managedGroup');
    if (managedGroup) {
        const isAdmin = (currentUser && currentUser.isAdmin) || localStorage.getItem('userEmail') === 'crewcanvas2@gmail.com';
        managedGroup.style.display = isAdmin ? 'block' : 'none';
    }
}

function updateFormFields(type) {
    const labels = {
        'Audition': { title: 'Audition Title', date: 'Audition Date', price: 'Payout (₹)', desc: 'Description' },
        'Workshop': { title: 'Workshop Title', date: 'Start Date', price: 'Fee (₹)', desc: 'Agenda' },
        'Course': { title: 'Course Title', date: 'Batch Start', price: 'Course Fee (₹)', desc: 'Curriculum' },
        'Contest': { title: 'Contest Name', date: 'Deadline', price: 'Entry Fee (₹)', desc: 'Rules' },
        'Film Event': { title: 'Event Title', date: 'Event Date', price: 'Ticket (₹)', desc: 'Highlights' }
    };
    const c = labels[type] || labels['Audition'];
    if (document.getElementById('labelTitle')) document.getElementById('labelTitle').innerText = c.title;
    if (document.getElementById('labelDate')) document.getElementById('labelDate').innerText = c.date;
    if (document.getElementById('labelPrice')) document.getElementById('labelPrice').innerText = c.price;
    if (document.getElementById('labelDesc')) document.getElementById('labelDesc').innerText = c.desc;
}

function toggleManagedFields() {
    const isManaged = document.getElementById('isManaged').checked;
    const fieldsToToggle = ['eventDate', 'eventEndDate', 'eventLocation', 'eventOrgName', 'eventOrgEmail', 'eventDescription', 'auditionFields', 'contestFields', 'skillsGroup', 'capacityGroup', 'priceGroup'];
    fieldsToToggle.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const group = el.closest('.form-group') || el;
            group.style.display = isManaged ? 'none' : 'block';
        }
    });
    const regMethodGroup = document.getElementById('registrationMethodGroup');
    const adminNoteGroup = document.getElementById('adminNoteGroup');
    if (regMethodGroup) regMethodGroup.style.display = isManaged ? 'block' : 'none';
    if (adminNoteGroup) adminNoteGroup.style.display = isManaged ? 'block' : 'none';
    if (isManaged) toggleRegistrationLink();
}

function toggleRegistrationLink() {
    const methodSelect = document.getElementById('registrationMethod');
    const linkGroup = document.getElementById('externalLinkGroup');
    if (methodSelect && linkGroup) linkGroup.style.display = (methodSelect.value === 'external') ? 'block' : 'none';
}

function closeFormModal() { document.getElementById('formModal').style.display = 'none'; }
function closeAppModal() { document.getElementById('applicationModal').style.display = 'none'; }
function closeCreateEvent() { document.getElementById('createEventModal').style.display = 'none'; }

async function handleEventImageUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewImg = document.getElementById('previewImg');
            const placeholder = document.getElementById('previewPlaceholder');
            const clearBtn = document.getElementById('clearImageBtn');
            const urlInput = document.getElementById('eventImageUrl');
            if (previewImg) { previewImg.src = e.target.result; previewImg.style.display = 'block'; }
            if (placeholder) placeholder.style.display = 'none';
            if (clearBtn) clearBtn.style.display = 'block';
            if (urlInput) urlInput.value = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function clearEventImage() {
    const previewImg = document.getElementById('previewImg');
    const placeholder = document.getElementById('previewPlaceholder');
    const clearBtn = document.getElementById('clearImageBtn');
    const urlInput = document.getElementById('eventImageUrl');
    const fileInput = document.getElementById('eventImage');
    if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'block';
    if (clearBtn) clearBtn.style.display = 'none';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
}

async function submitEvent() {
    const isManaged = document.getElementById('isManaged').checked;
    const eventData = {
        userId: parseInt(currentUserId),
        title: document.getElementById('eventTitle').value,
        eventType: currentType || 'Audition',
        description: isManaged ? '' : document.getElementById('eventDescription').value,
        date: isManaged ? null : document.getElementById('eventDate').value,
        location: isManaged ? '' : document.getElementById('eventLocation').value,
        isManaged: isManaged,
        adminNote: document.getElementById('eventAdminNote') ? document.getElementById('eventAdminNote').value : '',
        externalLink: (isManaged && document.getElementById('registrationMethod').value === 'external') ? document.getElementById('externalLink').value : null,
        imageUrl: document.getElementById('eventImageUrl') ? document.getElementById('eventImageUrl').value : ''
    };
    const res = await fetch(editModeId ? `${API_BASE_URL}/api/events/${editModeId}` : `${API_BASE_URL}/api/events`, { 
        method: editModeId ? 'PUT' : 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(eventData) 
    });

    if (res.ok) {
        showMessage('Opportunity launched successfully!', 'success');
        closeFormModal();
        loadEvents();
    } else {
        showMessage('Failed to save event.', 'error');
    }
}

async function handleExternalRedirect(eventId, url) {
    if (!currentUserId || !currentUser) {
        showMessage('Please login to apply.', 'error');
        return;
    }

    // 0. Professional Readiness Checklist
    const score = calculateProfileScore(currentUser);
    
    let photoCount = 0;
    if (currentUser.recentPictures) {
        try {
            const pics = JSON.parse(currentUser.recentPictures);
            photoCount = Array.isArray(pics) ? pics.length : 0;
        } catch (e) {
            photoCount = currentUser.recentPictures.split(',').filter(p => p.trim()).length;
        }
    }
    
    const hasVideo = (currentUser.showreel && currentUser.showreel.trim() !== '') || (currentUser.portfolioVideos && currentUser.portfolioVideos.trim() !== '');
    
    let checklistMsg = "🚀 Professional Tip: To get noticed by recruiters, ensure you have:\n";
    checklistMsg += "✅ At least 3 Recent Photos\n";
    checklistMsg += "✅ 1 Self Intro Video\n";
    checklistMsg += `✅ Profile at least 70% Complete (Yours: ${score}%)`;
    
    if (score < 70 || photoCount < 3 || !hasVideo) {
        showMessage(checklistMsg, 'warning');
    }
    
    // 1. Find event title for context
    const event = allEvents.find(e => e.id == eventId);
    const eventTitle = event ? event.title : 'Opportunity';

    // 2. Build the Plain & Simple "Casting Deck" Message
    let message = `APPLICATION: ${eventTitle.toUpperCase()}\n\n`;
    message += `NAME: ${currentUser.name}\n`;
    
    // Only add AGE if it exists and isn't a placeholder
    if (currentUser.ageRange && currentUser.ageRange.trim() !== "" && currentUser.ageRange.toLowerCase() !== 'not specified') {
        message += `AGE: ${currentUser.ageRange}\n`;
    }
    
    message += `LOCATION: ${currentUser.location || 'Not Specified'}\n\n`;
    
    const profileUrl = `${window.location.origin}/share/deck/${currentUser.id}`;
    message += `FULL CASTING DECK: ${profileUrl}`;

    const encodedMessage = encodeURIComponent(message);
    
    // 3. Prepare the final Redirect URL
    let finalUrl = url;
    
    // If it's a phone number, convert to wa.me
    if (/^\d+$/.test(url.replace(/[^\d+]/g, ''))) {
        const cleanPhone = url.replace(/[^\d]/g, '');
        finalUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    } 
    // If it's already a wa.me link but has no text, append it
    else if (url.includes('wa.me') && !url.includes('text=')) {
        finalUrl += (url.includes('?') ? '&' : '?') + 'text=' + encodedMessage;
    }

    // Record the redirect in backend
    await fetch(`${API_BASE_URL}/api/events/${eventId}/apply?userId=${currentUserId}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
            applicantName: currentUser.name, 
            additionalNote: 'WhatsApp Redirect: Full Portfolio Data Sent' 
        })
    });
    
    userApplications.push({ eventId: parseInt(eventId) });
    searchEvents(); // Refresh UI to show 'Registered'
    
    window.open(finalUrl, '_blank');
}

async function submitEventApplication() {
    if (!pendingEventId || !currentUserId) return;

    const btn = document.querySelector('button[onclick="submitEventApplication()"]');
    const originalText = btn ? btn.innerText : 'Submit Application';

    // Professional Readiness Check before internal submission
    const score = calculateProfileScore(currentUser);
    let photoCount = 0;
    if (currentUser.recentPictures) {
        try {
            const pics = JSON.parse(currentUser.recentPictures);
            photoCount = Array.isArray(pics) ? pics.length : 0;
        } catch (e) {
            photoCount = currentUser.recentPictures.split(',').filter(p => p.trim()).length;
        }
    }
    const hasVideo = (currentUser.showreel && currentUser.showreel.trim() !== '') || (currentUser.portfolioVideos && currentUser.portfolioVideos.trim() !== '');

    if (score < 70 || photoCount < 3 || !hasVideo) {
        const confirmApp = confirm(`🚀 Professional Tip: Your profile is currently ${score}% complete with ${photoCount} photos.\n\nRecruiters prioritize profiles with 70%+ completion, 3 photos, and an intro video.\n\nDo you want to proceed with application anyway?`);
        if (!confirmApp) {
            window.location.href = 'edit-profile.html';
            return;
        }
    }

    const applicationData = {
        fullName: document.getElementById('appFullName').value,
        email: document.getElementById('appEmail').value,
        phone: document.getElementById('appWhatsApp').value,
        role: document.getElementById('appRole').value,
        additionalNote: document.getElementById('appNote').value
    };

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Submitting...';
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/events/${pendingEventId}/apply?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(applicationData)
        });

        if (res.ok) {
            showMessage('Application submitted successfully!', 'success');
            userApplications.push({ eventId: parseInt(pendingEventId) });
            closeAppModal();
            searchEvents();
        } else {
            const err = await res.text();
            showMessage('Failed to submit application: ' + err, 'error');
        }
    } catch (error) {
        console.error(error);
        showMessage('Connection error.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

async function applyToEvent(eventId) { if (!currentUserId) return; openAppModal(eventId); }
async function openAppModal(eventId) { pendingEventId = eventId; document.getElementById('applicationModal').style.display = 'flex'; }

async function shareEvent(id, title) {
    const shareUrl = `${window.location.origin}/share/event/${id}`;
    if (navigator.share) await navigator.share({ title, url: shareUrl });
    else { await navigator.clipboard.writeText(shareUrl); alert('Link Copied! 📋'); }
}

function getEventDefaultImage(type) {
    const imgs = { 'Audition': 'images/defaults/audition.png', 'Workshop': 'images/defaults/workshop.png', 'Course': 'images/defaults/course.png', 'Contest': 'images/defaults/contest.png', 'Film Event': 'images/cinema.png' };
    return imgs[type] || imgs['Audition'];
}

function formatEventDate(dateStr) {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function switchEventTab(type, element) {
    document.querySelectorAll('.event-feature-card').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    let filterType = 'all';
    if (type === 'auditions') filterType = 'Audition';
    else if (type === 'workshops') filterType = 'Workshop';
    else if (type === 'courses') filterType = 'Course';
    else if (type === 'contests') filterType = 'Contest';
    else if (type === 'filmevents') filterType = 'Film Event';
    currentFilter = filterType;
    searchEvents();
}
