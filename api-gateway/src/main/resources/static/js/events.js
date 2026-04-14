// Events and Auditions functionality
let currentUserId = null;
let allEvents = [];
let currentFilter = 'all';
let currentType = ''; // Track currently selected type for creation

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    loadEvents();
    loadCurrentUser();
});

// Load current user info for top bar
async function loadCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
        if (response.ok) {
            const user = await response.json();
            document.getElementById('currentUserName').textContent = user.name;
            if (user.profilePicture) {
                document.getElementById('currentUserPic').src = user.profilePicture;
            }
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Load all events
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/events`);
        if (response.ok) {
            allEvents = await response.json();
            displayEvents(allEvents);
            updateCounts();
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showMessage('Error loading events', 'error');
    }
}

// Update the counts on the feature cards
function updateCounts() {
    const counts = {
        'Workshop': 0,
        'Course': 0,
        'Contest': 0,
        'Audition': 0
    };

    allEvents.forEach(event => {
        if (counts[event.eventType] !== undefined) {
            counts[event.eventType]++;
        }
    });

    if (document.getElementById('workshopCount')) document.getElementById('workshopCount').innerText = counts['Workshop'];
    if (document.getElementById('courseCount')) document.getElementById('courseCount').innerText = counts['Course'];
    if (document.getElementById('contestCount')) document.getElementById('contestCount').innerText = counts['Contest'];
    if (document.getElementById('auditionCount')) document.getElementById('auditionCount').innerText = counts['Audition'];
}

// Filter events by type
function filterEvents(type) {
    currentFilter = type;

    // Update tab styles
    document.querySelectorAll('.event-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === type || (type === 'all' && btn.textContent === 'All Events')) {
            btn.classList.add('active');
        }
    });

    if (type === 'all') {
        displayEvents(allEvents);
    } else {
        const filtered = allEvents.filter(event => event.eventType === type);
        displayEvents(filtered);
    }
}

// Display events in grid
function displayEvents(events) {
    const container = document.getElementById('eventsGrid');

    if (events.length === 0) {
        container.innerHTML = `
            <div class="no-events" style="grid-column: 1/-1; text-align: center; padding: 100px 0;">
                <div style="font-size: 60px; margin-bottom: 20px;">🎬</div>
                <p style="color: #64748b; font-weight: 600;">No ${currentFilter === 'all' ? '' : currentFilter.toLowerCase()} events found.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => {
        const typeClass = `tag-${(event.eventType || 'audition').toLowerCase()}`;
        const placeholderImg = `https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80`;
        
        return `
            <div class="cinematic-card">
                <div class="card-image-box">
                    <div class="type-tag ${typeClass}">${event.eventType || 'Audition'}</div>
                    <img src="${event.imageUrl || placeholderImg}" alt="${event.title}">
                </div>
                <div class="card-content">
                    <h3>${event.title}</h3>
                    
                    <div class="meta-group">
                        <div class="meta-item">
                            <i class="far fa-calendar-alt"></i>
                            <span>${formatDate(event.date || event.startDate)}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location}</span>
                        </div>
                        ${event.timeDuration ? `
                            <div class="meta-item">
                                <i class="far fa-clock"></i>
                                <span>${event.timeDuration}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <p class="card-desc">
                        ${event.description || 'No description provided.'}
                    </p>
                    
                    <div class="card-footer">
                        <div class="applicants-text">
                            <span>${event.applicants || 0}</span> Applied
                        </div>
                        ${event.userId == currentUserId ? `
                            <button class="apply-btn" onclick="window.location.href='event-dashboard.html'">Manage</button>
                        ` : `
                            <button class="apply-btn" onclick="applyToEvent(${event.id})">Apply Now</button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function truncateText(text, length) {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
}

// Show/Close Create Event Modal
function showCreateEvent() {
    const modal = document.getElementById('createEventModal');
    modal.style.display = 'flex';
}

function closeCreateEvent() {
    const modal = document.getElementById('createEventModal');
    if (modal) modal.style.display = 'none';
    const formModal = document.getElementById('formModal');
    if (formModal) formModal.style.display = 'none';
}

function openCreateForm(type) {
    currentType = type;
    const choiceModal = document.getElementById('choiceModal');
    if (choiceModal) choiceModal.style.display = 'none';
    
    const formTitle = document.getElementById('formTitle');
    if (formTitle) formTitle.innerText = 'Create ' + type;
    
    const formModal = document.getElementById('formModal');
    if (formModal) formModal.style.display = 'flex';

    // Pre-fill title based on type (as seen in screenshots)
    const titleInput = document.getElementById('eventTitle');
    if (titleInput) {
        titleInput.value = type + ' - ';
    }
}


function closeFormModal() {
    const formModal = document.getElementById('formModal');
    if (formModal) formModal.style.display = 'none';
}

// Create new event
async function submitEvent() {
    const titleEle = document.getElementById('eventTitle');
    const descEle = document.getElementById('eventDescription');
    const dateEle = document.getElementById('eventDate');
    const endDateEle = document.getElementById('eventEndDate');
    const timeDurationEle = document.getElementById('eventTimeDuration');
    const locEle = document.getElementById('eventLocation');
    const orgNameEle = document.getElementById('eventOrgName');
    const orgPhoneEle = document.getElementById('eventOrgPhone');
    const orgEmailEle = document.getElementById('eventOrgEmail');
    const countryCodeEle = document.getElementById('countryCode');

    const title = titleEle ? titleEle.value.trim() : '';
    const description = descEle ? descEle.value.trim() : '';
    const date = dateEle ? dateEle.value : '';
    const endDate = endDateEle ? endDateEle.value : '';
    const timeDuration = timeDurationEle ? timeDurationEle.value.trim() : '';
    const location = locEle ? locEle.value.trim() : '';
    const orgName = orgNameEle ? orgNameEle.value.trim() : '';
    const countryCode = countryCodeEle ? countryCodeEle.value : '';
    const orgPhone = orgPhoneEle ? countryCode + ' ' + orgPhoneEle.value.trim() : '';
    const orgEmail = orgEmailEle ? orgEmailEle.value.trim() : '';

    if (!title || !date || !location) {
        showMessage('Please fill in title, date, and location', 'error');
        return;
    }

    const eventData = {
        userId: currentUserId,
        title,
        eventType: currentType || 'Audition',
        description,
        date,
        endDate,
        timeDuration,
        location,
        orgName,
        orgPhone,
        orgEmail,
        applicants: 0,
        // Optional fields that might not be in the current form
        capacity: document.getElementById('eventCapacity') ? parseInt(document.getElementById('eventCapacity').value) || 0 : 0,
        price: document.getElementById('eventPrice') ? parseFloat(document.getElementById('eventPrice').value) || 0.0 : 0.0,
        requirements: document.getElementById('eventSkills') ? document.getElementById('eventSkills').value.trim() : ''
    };


    try {
        const response = await fetch(`${API_BASE_URL}/api/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            showMessage('Event created successfully!', 'success');
            closeFormModal();
            loadEvents(); // Reload grid

            // Clear form
            if (titleEle) titleEle.value = '';
            if (descEle) descEle.value = '';
            if (dateEle) dateEle.value = '';
            if (endDateEle) endDateEle.value = '';
            if (timeDurationEle) timeDurationEle.value = '';
            if (locEle) locEle.value = '';
            if (orgNameEle) orgNameEle.value = '';
            if (orgPhoneEle) orgPhoneEle.value = '';
            if (orgEmailEle) orgEmailEle.value = '';

        } else {
            const error = await response.text();
            showMessage('Error: ' + error, 'error');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showMessage('Error creating event', 'error');
    }
}

// Apply to event (continued)
async function applyToEvent(eventId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/apply`, {
            method: 'POST'
        });

        if (response.ok) {
            showMessage('Application sent successfully!', 'success');
            loadEvents(); // Refresh to update applicant count
        } else {
            const error = await response.text();
            showMessage(error, 'error');
        }
    } catch (error) {
        console.error('Error applying to event:', error);
        showMessage('Error applying to event', 'error');
    }
}

function switchEventTab(type, element) {
    document.querySelectorAll('.event-feature-card').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    
    // Map tab type to internal filter type
    let filterType = 'all';
    if (type === 'auditions') filterType = 'Audition';
    else if (type === 'workshops') filterType = 'Workshop';
    else if (type === 'courses') filterType = 'Course';
    else if (type === 'contests') filterType = 'Contest';
    
    filterEvents(filterType);
}
