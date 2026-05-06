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

function scrollToEventFromUrl() {
    const eventId = getQueryParam('eventId');
    if (!eventId) return;
    const existing = document.getElementById(`event-card-${eventId}`);
    if (!existing) {
        fetch(`${API_BASE_URL}/api/events/${eventId}`)
            .then(res => res.ok ? res.json() : null)
            .then(event => {
                if (event && !document.getElementById(`event-card-${eventId}`)) {
                    displayEvents([event], true);
                    performEventScroll(eventId);
                }
            }).catch(err => console.error(err));
    } else { performEventScroll(eventId); }
}

function performEventScroll(eventId) {
    let attempts = 0;
    const interval = setInterval(() => {
        const eventCard = document.getElementById(`event-card-${eventId}`);
        if (eventCard) {
            clearInterval(interval);
            setTimeout(() => {
                eventCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                eventCard.style.boxShadow = "0 0 30px rgba(255, 140, 0, 0.6)";
                eventCard.style.border = "2px solid var(--primary-orange)";
                setTimeout(() => { eventCard.style.boxShadow = ""; eventCard.style.border = ""; }, 4000);
            }, 200);
        }
        attempts++;
        if (attempts > 30) clearInterval(interval);
    }, 100);
}

async function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('editId');
    if (editId) { editModeId = editId; loadEventForEdit(editId); }
}

async function loadEventForEdit(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/events/${id}`);
        if (res.ok) {
            const event = await res.json();
            openCreateForm(event.eventType, true);
            document.getElementById('eventTitle').value = event.title || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventDate').value = formatDateForInput(event.date);
            document.getElementById('eventLocation').value = event.location || '';
            const isManagedCheckbox = document.getElementById('isManaged');
            if (isManagedCheckbox) {
                isManagedCheckbox.checked = event.isManaged === true;
                toggleManagedFields();
            }
        }
    } catch (err) { console.error(err); }
}

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

function filterEvents(type) {
    currentFilter = type;
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === type || (type === 'all' && btn.textContent === 'All Events')) btn.classList.add('active');
    });
    searchEvents();
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
    if (events.length === 0 && !prepend) {
        container.innerHTML = `<div class="no-events" style="grid-column: 1/-1; text-align: center; padding: 100px 0;"><p>No opportunities found.</p></div>`;
        return;
    }

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
                <div style="position: relative; width: 100%; overflow: hidden;">
                    <img src="${displayImage}" style="width: 100%; height: 500px; object-fit: cover;">
                </div>

                <div class="card-content" style="padding: ${useFeedLayout ? '0' : '15px'};">
                    ${useFeedLayout ? '' : `
                        <h3 style="font-size: 18px; margin-bottom: 8px;">${event.title}</h3>
                        <div class="meta-group" style="margin-bottom: 10px; display: flex; gap: 15px; font-size: 13px; color: #64748b;">
                            <span><i class="far fa-calendar-alt"></i> ${formatEventDate(event.date)}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${event.location || 'Online'}</span>
                        </div>
                    `}
                    
                    <div class="card-footer" style="padding: 15px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                        <div id="applicant-count-${event.id}" style="font-size: 11px; font-weight: 600; color: #64748b; white-space: nowrap; min-width: 70px;">
                            <i class="fas fa-users" style="color: #94a3b8; margin-right: 4px;"></i> ${event.applicants || 0} applied
                        </div>

                        ${(() => {
                            const sLink = (event.externalLink || '').replace(/'/g, "\\'");
                            const isExt = event.isManaged && event.externalLink;
                            const regAct = isExt ? `event.stopPropagation(); handleExternalRedirect(${event.id}, '${sLink}')` : `applyToEvent(${event.id})`;
                            const brandOrange = '#FF8C00';
                            const successGreen = '#10b981';
                            const btnColor = hasApplied ? successGreen : brandOrange;
                            let btnText = isManaged ? (hasApplied ? 'Registered' : 'WhatsApp Me') : (hasApplied ? 'Applied' : 'Apply Now');
                            
                            return `<button class="apply-btn" style="flex: 1; max-width: 180px; padding: 10px 15px; font-size: 13px; border-radius: 10px; border: none; font-weight: 700; background: ${btnColor}; color: white; transition: all 0.3s ease; box-shadow: 0 4px 12px ${btnColor}33;" onclick="${regAct}">${btnText}</button>`;
                        })()}

                        <div onclick="event.stopPropagation(); shareEvent(${event.id}, '${sTitle}')" style="cursor: pointer; color: #6366f1; display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; min-width: 60px; justify-content: flex-end;">
                            <i class="fas fa-share-alt"></i> Share
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (prepend) container.insertAdjacentHTML('afterbegin', eventsHtml);
    else container.innerHTML = eventsHtml;
}

function truncateText(text, length) { return (text && text.length > length) ? text.substring(0, length) + '...' : text; }

function showCreateEvent() { document.getElementById('createEventModal').style.display = 'flex'; }
function closeCreateEvent() { document.getElementById('createEventModal').style.display = 'none'; }

function openCreateForm(type, isEdit = false) {
    currentType = type;
    document.getElementById('formModal').style.display = 'flex';
}

function toggleManagedFields() {
    const isManaged = document.getElementById('isManaged') ? document.getElementById('isManaged').checked : false;
    const adminNoteGroup = document.getElementById('adminNoteGroup');
    if (adminNoteGroup) adminNoteGroup.style.display = isManaged ? 'block' : 'none';
}

async function handleExternalRedirect(eventId, url) {
    if (!currentUserId) { showMessage('Please log in', 'warning'); return; }
    try {
        const appData = { applicantName: currentUser?.name || 'Interested User', additionalNote: 'WhatsApp Click' };
        await fetch(`${API_BASE_URL}/api/events/${eventId}/apply?userId=${currentUserId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(appData)
        });
        userApplications.push({ eventId: parseInt(eventId) });
        searchEvents(); 
    } catch (e) { console.error(e); }
    window.open(url, '_blank');
}

async function applyToEvent(eventId) {
    if (!currentUserId) { showMessage('Please log in to apply', 'error'); return; }
    openAppModal(eventId);
}

async function openAppModal(eventId) {
    pendingEventId = eventId;
    window._appState = { photos: [null, null, null], resumeData: null };
    document.getElementById('applicationModal').style.display = 'flex';
}

function closeAppModal() { document.getElementById('applicationModal').style.display = 'none'; }

async function submitEventApplication() {
    const btn = document.querySelector('button[onclick="submitEventApplication()"]');
    btn.disabled = true;
    const appData = { applicantName: document.getElementById('appFullName').value, applicantEmail: document.getElementById('appEmail').value };
    try {
        const res = await fetch(`${API_BASE_URL}/api/events/${pendingEventId}/apply?userId=${currentUserId}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(appData)
        });
        if (res.ok) {
            userApplications.push({ eventId: parseInt(pendingEventId) });
            closeAppModal();
            searchEvents();
        }
    } catch (e) { console.error(e); }
    btn.disabled = false;
}

async function shareEvent(id, title) {
    const shareUrl = `${window.location.origin}/share/event/${id}`;
    if (navigator.share) {
        try { await navigator.share({ title: title, url: shareUrl }); } catch (err) {}
    } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied! 📋');
    }
}

function getEventDefaultImage(type) {
    const imgs = { 'Audition': 'images/defaults/audition.png', 'Workshop': 'images/defaults/workshop.png', 'Course': 'images/defaults/course.png', 'Contest': 'images/defaults/contest.png', 'Film Event': 'images/cinema.png' };
    return imgs[type] || imgs['Audition'];
}

function formatEventDate(dateStr) {
    if (!dateStr) return 'TBA';
    try { return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); } catch (e) { return dateStr; }
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
    filterEvents(filterType);
}
