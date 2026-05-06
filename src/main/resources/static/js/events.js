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
    await loadCurrentUser();
    await loadEvents();
    checkEditMode();
    scrollToEventFromUrl();
    const isManagedCheckbox = document.getElementById('isManaged');
    if (isManagedCheckbox) isManagedCheckbox.addEventListener('change', toggleManagedFields);
});

async function loadCurrentUser() {
    try {
        if (!currentUserId) return;
        const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
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
    try {
        const appsResponse = await fetch(`${API_BASE_URL}/api/events/applications/user/${currentUserId}`);
        if (appsResponse.ok) userApplications = await appsResponse.json();
        const response = await fetch(`${API_BASE_URL}/api/events`);
        if (response.ok) { allEvents = await response.json(); updateCounts(); searchEvents(); }
    } catch (error) { console.error(error); }
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
        const useFeedLayout = isManaged && !isOwnerOrAdmin;
        const displayImage = event.imageUrl || getEventDefaultImage(eventType);
        const hasApplied = userApplications.some(app => app.eventId == event.id);
        const sTitle = (event.title || 'Untitled').replace(/'/g, "\\'");

        return `
            <div class="cinematic-card" id="event-card-${event.id}" style="width: 100% !important; margin-bottom: 30px;">
                <img src="${displayImage}" style="width: 100%; height: 500px; object-fit: cover;">
                <div class="card-content" style="padding: ${useFeedLayout ? '0' : '15px'};">
                    ${useFeedLayout ? '' : `<h3 style="font-size: 18px; margin-bottom: 8px;">${event.title}</h3>`}
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

    // 0. Profile Strength Validation (Minimum 80% required)
    const score = calculateProfileScore(currentUser);
    if (score < 80) {
        showMessage(`⚠️ Profile Incomplete (${score}%). Please complete at least 80% to apply to recruiters. (Ensure Name, Email, Phone, Bio, Resume, Video, and 5+ Recent Images are added).`, 'warning');
        setTimeout(() => window.location.href = 'edit-profile.html', 3000);
        return;
    }
    
    // 1. Find event title for context
    const event = allEvents.find(e => e.id == eventId);
    const eventTitle = event ? event.title : 'Opportunity';

    const iconRocket = '\uD83D\uDE80';
    const iconProfile = '\uD83D\uDC64';
    const iconCheck = '\u2705';
    const iconLink = '\uD83D\uDD17';
    const iconSparkle = '\u2728';
    const iconDeck = '\uD83D\uDCD1';
    const bullet = '\u25AB\uFE0F';

    // 2. Build the Premium "Casting Deck" Message
    let message = `${iconRocket} *APPLICATION: ${eventTitle.toUpperCase()}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    message += `${iconCheck} *CORE ELIGIBILITY*\n`;
    message += `${bullet} *Age:* ${currentUser.ageRange || 'Not Specified'}\n`;
    message += `${bullet} *Languages:* ${currentUser.languages || 'Not Specified'}\n`;
    message += `${bullet} *Location:* ${currentUser.location || 'Not Specified'}\n`;
    message += `${bullet} *Experience:* ${currentUser.experience || 'Fresher'}\n\n`;

    message += `${iconProfile} *CANDIDATE INFO*\n`;
    message += `${bullet} *Name:* ${currentUser.name}\n`;
    message += `${bullet} *Height:* ${currentUser.height || 'N/A'}\n`;
    if (currentUser.phone) message += `${bullet} *Phone:* ${currentUser.phone}\n\n`;

    message += `${iconDeck} *FULL CASTING DECK (Profile & Resume)*\n`;
    const profileUrl = `${window.location.origin}/share/deck/${currentUser.id}`;
    message += `${iconLink} ${profileUrl}\n\n`;
    
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `${iconSparkle} _Sent via CrewCanvas Talent Network_`;

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
