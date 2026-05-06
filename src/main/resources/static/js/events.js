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
                        <div style="font-size: 11px; font-weight: 600; color: #64748b; min-width: 70px;">
                            <i class="fas fa-users"></i> ${event.applicants || 0} applied
                        </div>
                        ${(() => {
                            const sLink = (event.externalLink || '').replace(/'/g, "\\'");
                            const regAct = (isManaged && event.externalLink) ? `event.stopPropagation(); handleExternalRedirect(${event.id}, '${sLink}')` : `applyToEvent(${event.id})`;
                            const btnColor = hasApplied ? '#10b981' : '#FF8C00';
                            let btnText = isManaged ? (hasApplied ? 'Registered' : 'WhatsApp Me') : (hasApplied ? 'Applied' : 'Apply Now');
                            return `<button class="apply-btn" style="flex: 1; max-width: 180px; padding: 10px 15px; font-size: 13px; border-radius: 10px; border: none; font-weight: 700; background: ${btnColor}; color: white;" onclick="${regAct}">${btnText}</button>`;
                        })()}
                        <div onclick="event.stopPropagation(); shareEvent(${event.id}, '${sTitle}')" style="cursor: pointer; color: #6366f1; font-size: 11px; font-weight: 600; min-width: 60px; text-align: right;">
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
    }
    document.getElementById('formModal').style.display = 'flex';
    updateFormFields(type);
    
    // ADMIN CHECK
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
    const fields = ['eventDate', 'eventLocation', 'eventOrgName', 'eventOrgEmail', 'eventDescription'];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const group = el.closest('.form-group');
            if (group) group.style.display = isManaged ? 'none' : 'block';
        }
    });
    const regMethodGroup = document.getElementById('registrationMethodGroup');
    const adminNoteGroup = document.getElementById('adminNoteGroup');
    if (regMethodGroup) regMethodGroup.style.display = isManaged ? 'block' : 'none';
    if (adminNoteGroup) adminNoteGroup.style.display = isManaged ? 'block' : 'none';
    if (isManaged) toggleRegistrationLink();
}

function toggleRegistrationLink() {
    const method = document.getElementById('registrationMethod').value;
    const linkGroup = document.getElementById('externalLinkGroup');
    if (linkGroup) linkGroup.style.display = (method === 'external') ? 'block' : 'none';
}

async function submitEvent() {
    const isManaged = document.getElementById('isManaged').checked;
    const eventData = {
        userId: parseInt(currentUserId),
        title: document.getElementById('eventTitle').value,
        eventType: currentType || 'Audition',
        description: document.getElementById('eventDescription').value,
        date: document.getElementById('eventDate').value,
        location: document.getElementById('eventLocation').value,
        isManaged: isManaged,
        adminNote: document.getElementById('eventAdminNote') ? document.getElementById('eventAdminNote').value : '',
        externalLink: (isManaged && document.getElementById('registrationMethod').value === 'external') ? document.getElementById('externalLink').value : null,
        imageUrl: document.getElementById('eventImageUrl') ? document.getElementById('eventImageUrl').value : ''
    };
    const url = editModeId ? `${API_BASE_URL}/api/events/${editModeId}` : `${API_BASE_URL}/api/events`;
    const method = editModeId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eventData) });
    if (res.ok) { showMessage('Event Saved!', 'success'); document.getElementById('formModal').style.display = 'none'; loadEvents(); }
}

async function handleExternalRedirect(eventId, url) {
    if (!currentUserId) return;
    await fetch(`${API_BASE_URL}/api/events/${eventId}/apply?userId=${currentUserId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicantName: currentUser.name, additionalNote: 'WhatsApp Redirect' })
    });
    userApplications.push({ eventId: parseInt(eventId) });
    searchEvents();
    window.open(url, '_blank');
}

async function applyToEvent(eventId) { if (!currentUserId) return; openAppModal(eventId); }

async function openAppModal(eventId) {
    pendingEventId = eventId;
    document.getElementById('applicationModal').style.display = 'flex';
}

function closeAppModal() { document.getElementById('applicationModal').style.display = 'none'; }

async function shareEvent(id, title) {
    const shareUrl = `${window.location.origin}/share/event/${id}`;
    if (navigator.share) await navigator.share({ title: title, url: shareUrl });
    else { await navigator.clipboard.writeText(shareUrl); alert('Copied Link! 📋'); }
}

function getEventDefaultImage(type) {
    const imgs = { 'Audition': 'images/defaults/audition.png', 'Workshop': 'images/defaults/workshop.png', 'Course': 'images/defaults/course.png', 'Contest': 'images/defaults/contest.png', 'Film Event': 'images/cinema.png' };
    return imgs[type] || imgs['Audition'];
}

function formatEventDate(dateStr) {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function filterEvents(type) {
    currentFilter = type;
    searchEvents();
}
