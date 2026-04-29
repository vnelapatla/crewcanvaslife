// Events and Auditions functionality
let currentUserId = null;
let currentUser = null;
let pendingEventId = null;
let allEvents = [];
let userApplications = [];
let currentFilter = 'all';
let currentType = ''; // Track currently selected type for creation

let editModeId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const isGuest = !checkAuth(false);
    currentUserId = getCurrentUserId();
    
    // Guest handling: hide FAB
    if (isGuest) {
        const fab = document.querySelector('.fab');
        if (fab) fab.style.display = 'none';
    }

    // Load user first to ensure isAdmin status is known before rendering events
    if (!isGuest) await loadCurrentUser();
    await loadEvents();
    checkEditMode();

    // If a specific event is shared, focus on it
    const eventId = getQueryParam('eventId');
    if (eventId) {
        // Hide the feature tabs and search
        const horizontalCards = document.querySelector('.horizontal-cards');
        if (horizontalCards) horizontalCards.style.display = 'none';
        
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) searchContainer.style.display = 'none';
        
        // Add a "View All Events" button
        const contentBody = document.querySelector('.content-body');
        if (contentBody) {
            const backBtn = document.createElement('div');
            backBtn.style.marginBottom = '20px';
            backBtn.innerHTML = `
                <button onclick="window.location.href='event.html'" class="apply-btn" style="background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; width: auto; display: inline-flex; align-items: center; gap: 8px;">
                    <i class="fas fa-arrow-left"></i> View All Industry Events
                </button>
            `;
            contentBody.prepend(backBtn);
        }
    }

    // Auto-scroll to event if eventId is in URL
    scrollToEventFromUrl();
});

function scrollToEventFromUrl() {
    const eventId = getQueryParam('eventId');
    if (!eventId) return;

    // Check if event is already in DOM
    const existing = document.getElementById(`event-card-${eventId}`);
    if (!existing) {
        // Fetch specific event and prepend
        fetch(`${API_BASE_URL}/api/events/${eventId}`)
            .then(res => res.ok ? res.json() : null)
            .then(event => {
                if (event) {
                    if (!document.getElementById(`event-card-${eventId}`)) {
                        displayEvents([event], true); // Prepend
                    }
                    performEventScroll(eventId);
                }
            })
            .catch(err => console.error("Error fetching shared event:", err));
    } else {
        performEventScroll(eventId);
    }
}

function performEventScroll(eventId) {
    // Retry finding the event for up to 3 seconds
    let attempts = 0;
    const interval = setInterval(() => {
        const eventCard = document.getElementById(`event-card-${eventId}`) || 
                          document.querySelector(`.event-card[data-id="${eventId}"]`) ||
                          document.querySelector(`.card[data-id="${eventId}"]`);
        if (eventCard) {
            clearInterval(interval);
            setTimeout(() => {
                eventCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                eventCard.style.boxShadow = "0 0 30px rgba(255, 140, 0, 0.6)";
                eventCard.style.border = "2px solid var(--primary-orange)";
                setTimeout(() => {
                    eventCard.style.boxShadow = "";
                    eventCard.style.border = "";
                }, 4000);
            }, 200);
        }
        
        attempts++;
        if (attempts > 30) {
            clearInterval(interval);
            console.log("Event scroll failed after 3s:", eventId);
        }
    }, 100);
}

async function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('editId');
    if (editId) {
        editModeId = editId;
        loadEventForEdit(editId);
    }
}

async function loadEventForEdit(id) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/events/${id}`);
        if (res.ok) {
            const event = await res.json();
            openCreateForm(event.eventType, true);
            
            // Populate fields
            document.getElementById('eventTitle').value = event.title || '';
            document.getElementById('eventDescription').value = event.description || '';
            document.getElementById('eventDate').value = formatDateForInput(event.date);
            document.getElementById('eventEndDate').value = formatDateForInput(event.endDate);
            document.getElementById('eventTimeDuration').value = event.timeDuration || event.time || '';
            document.getElementById('eventLocation').value = event.location || '';
            document.getElementById('eventOrgName').value = event.orgName || '';
            if (document.getElementById('eventOrgPhone')) document.getElementById('eventOrgPhone').value = event.orgPhone ? event.orgPhone.split(' ').pop() : '';
            document.getElementById('eventOrgEmail').value = event.orgEmail || '';
            if (document.getElementById('eventCapacity')) document.getElementById('eventCapacity').value = event.capacity || '';
            if (document.getElementById('eventPrice')) document.getElementById('eventPrice').value = event.price || '';
            if (document.getElementById('eventSkills')) document.getElementById('eventSkills').value = event.requirements || event.skills || '';
            if (document.getElementById('eventImageUrl')) document.getElementById('eventImageUrl').value = event.imageUrl || '';
            
            // Change UI for edit mode
            document.getElementById('formTitle').innerText = '✏️ Update Opportunity';
            document.querySelector('#formModal button[onclick="submitEvent()"]').innerText = 'Save Changes';
        }
    } catch (err) {
        console.error('Error loading event for edit:', err);
    }
}

// Load current user info for top bar
async function loadCurrentUser() {
    try {
        if (!currentUserId) return;
        const response = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
        if (response.ok) {
            currentUser = await response.json();
            
            // Handle multiple potential ID names for flexibility across pages
            const nameEle = document.getElementById('currentUserName') || document.getElementById('userNameHeader');
            if (nameEle) {
                nameEle.textContent = currentUser.name;
            }
            
            const picEle = document.getElementById('currentUserPic') || document.getElementById('userAvatarSmall');
            if (picEle && currentUser.profilePicture) {
                picEle.src = currentUser.profilePicture;
                picEle.style.display = 'block'; // Ensure it's visible if it was hidden
            }
            return currentUser;
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
    return null;
}

// Load all events
async function loadEvents() {
    try {
        // Fetch applications first to check status
        const appsResponse = await fetch(`${API_BASE_URL}/api/events/applications/user/${currentUserId}`);
        if (appsResponse.ok) {
            userApplications = await appsResponse.json();
        }

        const response = await fetch(`${API_BASE_URL}/api/events`);
        if (response.ok) {
            allEvents = await response.json();
            console.log("Loaded Events Count:", allEvents.length);
            updateCounts(); // Update counts first
            searchEvents(); // Then filter and display
        }
    } catch (error) {
        console.error('Error loading events:', error);
        showMessage('We couldn’t load the latest opportunities. Please refresh the page.', 'error');
    }
}

// Update the counts on the feature cards
function updateCounts() {
    const counts = {
        'Workshop': 0,
        'Course': 0,
        'Contest': 0,
        'Audition': 0,
        'Film Event': 0
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
    if (document.getElementById('filmEventCount')) document.getElementById('filmEventCount').innerText = counts['Film Event'];
    if (document.getElementById('totalEventCount')) document.getElementById('totalEventCount').innerText = allEvents.length;
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

    searchEvents(); // Re-apply search filter when tab changes
}

// Search events by name/description
function searchEvents() {
    const searchInput = document.getElementById('eventSearchInput');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    console.log(`Filtering events. Filter: ${currentFilter}, Query: ${query}`);
    
    let filtered = allEvents;

    // 1. Apply Type Filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(event => 
            event.eventType && event.eventType.toLowerCase() === currentFilter.toLowerCase()
        );
    }

    // 2. Apply Search Query
    if (query) {
        filtered = filtered.filter(event => 
            (event.title && event.title.toLowerCase().includes(query)) ||
            (event.description && event.description.toLowerCase().includes(query)) ||
            (event.location && event.location.toLowerCase().includes(query)) ||
            (event.orgName && event.orgName.toLowerCase().includes(query))
        );
    }

    console.log(`Displaying ${filtered.length} events`);
    displayEvents(filtered);
}

// Display events in grid
function displayEvents(events, prepend = false) {
    const container = document.getElementById('eventsGrid');
    if (!container) return;

    if (events.length === 0 && !prepend) {
        container.innerHTML = `
            <div class="no-events" style="grid-column: 1/-1; text-align: center; padding: 100px 0;">
                <div style="font-size: 60px; margin-bottom: 20px;">🎬</div>
                <p style="color: #64748b; font-weight: 600;">No ${currentFilter === 'all' ? '' : currentFilter.toLowerCase()} events found.</p>
            </div>
        `;
        return;
    }

    const eventsHtml = events.map((event, index) => {
        const typeClass = `tag-${(event.eventType || 'audition').toLowerCase()}`;
        const animationDelay = (index % 10) * 0.1;
        
        return `
            <div class="cinematic-card" id="event-card-${event.id}" style="animation-delay: ${animationDelay}s">
                <div class="card-image-box">
                    <div class="type-tag ${typeClass}">${event.eventType || 'Audition'}</div>
                    <img src="${event.imageUrl || getEventDefaultImage(event.eventType)}" alt="${event.title}">
                </div>
                <div class="card-content">
                    <h3>${event.title}</h3>
                    
                    <div class="meta-group">
                        <div class="meta-item">
                            <i class="far fa-calendar-alt"></i>
                            <span>${formatDate(event.date || event.startDate)}${event.endDate ? ` to ${formatDate(event.endDate)}` : ''}</span>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${event.location}</span>
                        </div>
                        ${(event.timeDuration || event.time) ? `
                            <div class="meta-item">
                                <i class="far fa-clock"></i>
                                <span>${event.timeDuration || event.time}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="details-section" style="margin-bottom: 15px; font-size: 11px; color: #475569; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9;">
                        ${event.orgName ? `<div><b style="color: #1e293b;">Org:</b> ${event.orgName}</div>` : ''}
                        ${event.orgEmail ? `<div><b style="color: #1e293b;">Email:</b> ${event.orgEmail}</div>` : ''}
                        ${(event.price !== undefined && event.price !== null) ? `<div><b style="color: #1e293b;">Price:</b> ${event.price === 0 ? 'Free' : `₹${event.price}`}</div>` : ''}
                        ${(event.capacity !== undefined && event.capacity !== null && event.capacity > 0) ? `<div><b style="color: #1e293b;">Seats:</b> ${event.capacity}</div>` : ''}
                        ${event.requirements || event.skills ? `<div style="grid-column: span 2;"><b style="color: #1e293b;">Skills:</b> ${event.requirements || event.skills}</div>` : ''}
                    </div>
                    
                    <p class="card-desc" style="-webkit-line-clamp: 2; font-size: 13px; margin-bottom: 15px;">
                        ${event.description || 'No description provided.'}
                    </p>
                    
                    <div class="card-footer">
                        <div class="applicants-text">
                            <span id="applicant-count-${event.id}">${event.applicants || 0}</span> Registered
                        </div>
                        <div id="apply-container-${event.id}">
                            ${(event.userId == currentUserId || (currentUser && currentUser.isAdmin)) ? `
                                <div style="display: flex; gap: 8px;">
                                    <button class="apply-btn" onclick="window.location.href='event-dashboard.html?id=${event.id}'">Manage</button>
                                    ${(currentUser && currentUser.isAdmin) ? `
                                        <button class="apply-btn" style="background: #ef4444;" onclick="adminDeleteEvent(${event.id}, event)">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    ` : ''}
                                </div>
                            ` : (() => {
                                const userApp = userApplications.find(app => app.eventId === event.id);
                                if (!userApp) {
                                    return `<button class="apply-btn" onclick="applyToEvent(${event.id})">Register</button>`;
                                }
                                
                                const isFilmEvent = event.eventType && event.eventType.trim().toLowerCase() === 'film event';
                                
                                if (isFilmEvent && userApp.passToken) {
                                    return `<button class="apply-btn" style="background: var(--primary-orange, #ff8c00); box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);" onclick="window.location.href='pass.html?token=${userApp.passToken}'"><i class="fas fa-ticket-alt"></i> View Pass</button>`;
                                }
                                
                                if (userApp.status === 'SHORTLISTED' && userApp.passToken) {
                                    return `<button class="apply-btn" style="background: var(--primary-orange, #ff8c00); box-shadow: 0 4px 12px rgba(255, 140, 0, 0.3);" onclick="window.location.href='pass.html?token=${userApp.passToken}'"><i class="fas fa-ticket-alt"></i> View Pass</button>`;
                                }
                                
                                let statusColor = '#27ae60';
                                let statusLabel = 'Registered';
                                
                                if (userApp.status === 'SHORTLISTED') {
                                    statusColor = '#ff8c00';
                                    statusLabel = 'Shortlisted';
                                } else if (userApp.status === 'REJECTED') {
                                    statusColor = '#ef4444';
                                    statusLabel = 'Rejected';
                                }
                                
                                return `<button class="apply-btn" disabled style="background: ${statusColor}; cursor: default; opacity: 1;">${statusLabel}</button>`;
                            })()}
                        </div>
                        <button class="apply-btn" style="background: transparent; border: 1px solid #e2e8f0; color: #64748b; width: 40px; min-width: 40px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 10px;" onclick="shareContent('event', ${event.id}, '${event.title.replace(/'/g, "\\'")}')" title="Share Event">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (prepend) {
        container.insertAdjacentHTML('afterbegin', eventsHtml);
    } else {
        container.innerHTML = eventsHtml;
    }
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

function openCreateForm(type, isEdit = false) {
    currentType = type;
    if (!isEdit) {
        editModeId = null;
        document.getElementById('formTitle').innerText = '✨ Launch Opportunity';
        document.querySelector('#formModal button[onclick="submitEvent()"]').innerText = 'Post Opportunity';
    }
    const choiceModal = document.getElementById('choiceModal');
    if (choiceModal) choiceModal.style.display = 'none';
    
    const formModal = document.getElementById('formModal');
    if (formModal) formModal.style.display = 'flex';

    // Pre-fill title based on type (as seen in screenshots)
    const titleInput = document.getElementById('eventTitle');
    if (titleInput) {
        titleInput.placeholder = `e.g. ${type} - New Session`;
        if (!isEdit) titleInput.value = ''; 
    }
}


function closeFormModal() {
    const formModal = document.getElementById('formModal');
    if (formModal) formModal.style.display = 'none';
}

// Create/Update event
async function submitEvent() {
    console.log('--- Starting Event Submit/Update Process ---');
    const titleEle = document.getElementById('eventTitle');
    const descEle = document.getElementById('eventDescription');
    const dateEle = document.getElementById('eventDate');
    const endDateEle = document.getElementById('eventEndDate');
    const timeDurationEle = document.getElementById('eventTimeDuration');
    const locEle = document.getElementById('eventLocation');
    const typeEle = document.getElementById('eventType');
    
    if (!titleEle || !dateEle || !locEle) {
        console.error('Essential elements missing for event submission');
        return;
    }

    const title = titleEle.value.trim();
    const date = dateEle.value;
    const location = locEle.value.trim();
    const eventType = typeEle ? typeEle.value : (currentType || 'Audition');

    if (!title || !date || !location) {
        showMessage('Please fill in Title, Date, and Location', 'error');
        return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
        showMessage('Session expired. Please log in again.', 'error');
        return;
    }

    const eventData = {
        userId: parseInt(userId),
        title: title,
        eventType: eventType,
        description: descEle ? descEle.value.trim() : '',
        date: date,
        endDate: endDateEle ? endDateEle.value : null,
        timeDuration: timeDurationEle ? timeDurationEle.value.trim() : '',
        location: location,
        capacity: document.getElementById('eventCapacity') ? parseInt(document.getElementById('eventCapacity').value) || 0 : 0,
        price: document.getElementById('eventPrice') ? parseFloat(document.getElementById('eventPrice').value) || 0.0 : 0.0,
        orgName: document.getElementById('eventOrgName') ? document.getElementById('eventOrgName').value.trim() : '',
        orgEmail: document.getElementById('eventOrgEmail') ? document.getElementById('eventOrgEmail').value.trim() : '',
        orgPhone: document.getElementById('eventOrgPhone') ? document.getElementById('eventOrgPhone').value.trim() : '',
        imageUrl: document.getElementById('eventImageUrl') ? document.getElementById('eventImageUrl').value : ''
    };

    const url = editModeId ? `${API_BASE_URL}/api/events/${editModeId}` : `${API_BASE_URL}/api/events`;
    const method = editModeId ? 'PUT' : 'POST';

    console.log(`Sending ${method} request to ${url} with payload:`, eventData);

    const btn = document.querySelector('.btn-submit-event') || document.querySelector('button[onclick="submitEvent()"]');
    const originalText = btn ? (btn.innerText || btn.textContent) : 'Submit';
    
    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Saving...';
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData)
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const result = await response.json();
            console.log('Event operation successful:', result);
            showMessage(editModeId ? 'Event updated successfully!' : 'Event created successfully!', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            showMessage('Save failed: ' + errorText, 'error');
            alert('SERVER ERROR: ' + errorText);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        showMessage('Connection error. Please check your internet.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

// Apply to event (continued)
// Apply to event
async function applyToEvent(eventId) {
    if (!checkAuth(true)) return; // Force login
    // Check if user has required details
    if (!currentUser || !currentUser.name || !currentUser.phone || !currentUser.location) {
        pendingEventId = eventId;
        
        // Pre-fill what we have
        if (document.getElementById('completeName')) document.getElementById('completeName').value = currentUser?.name || '';
        if (document.getElementById('completePhone')) document.getElementById('completePhone').value = currentUser?.phone || '';
        if (document.getElementById('completeLocation')) document.getElementById('completeLocation').value = currentUser?.location || '';
        
        document.getElementById('profileCompletionModal').style.display = 'flex';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/apply?userId=${currentUserId}`, {
            method: 'POST'
        });

        if (response.ok) {
            const updatedEvent = await response.json();
            showMessage('Registration successful! Generating your pass...', 'success');
            
            // Reload after a short delay so the user sees the 'View Pass' button immediately
            // Especially critical for Film Events where tokens are generated server-side
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showMessage('Registration failed. Please try again later.', 'error');
        }
    } catch (error) {
        console.error('Error applying to event:', error);
        showMessage('Network error. Unable to register at this time.', 'error');
    }
}

// Profile Completion Functions
function closeProfileModal() {
    document.getElementById('profileCompletionModal').style.display = 'none';
    pendingEventId = null;
}

async function submitProfileAndRegister() {
    const name = document.getElementById('completeName').value.trim();
    const phone = document.getElementById('completePhone').value.trim();
    const location = document.getElementById('completeLocation').value.trim();

    if (!name || !phone || !location) {
        showMessage('Please fill in all details', 'error');
        return;
    }

    try {
        // Update user profile first
        const updateData = { ...currentUser, id: currentUserId, name, phone, location };
        const response = await fetch(`${API_BASE_URL}/api/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (response.ok) {
            currentUser = updateData; // Update local state
            
            // Update UI elements in header
            const nameEle = document.getElementById('currentUserName') || document.getElementById('userNameHeader');
            if (nameEle) nameEle.textContent = name;

            const eventId = pendingEventId;
            closeProfileModal();
            
            // Now proceed with registration
            if (eventId) {
                await applyToEvent(eventId);
            }
        } else {
            showMessage('We couldn’t update your profile details. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Oops! Something went wrong while saving. Please try again.', 'error');
    }
}

function switchEventTab(type, element) {
    document.querySelectorAll('.event-feature-card').forEach(c => c.classList.remove('active'));
    element.classList.add('active');
    
    // Clear search when switching tabs? 
    // Usually it's better to keep search but reset tab to 'all' if they want everything.
    // If they click 'All Events', show everything.
    
    // Map tab type to internal filter type
    let filterType = 'all';
    if (type === 'auditions') filterType = 'Audition';
    else if (type === 'workshops') filterType = 'Workshop';
    else if (type === 'courses') filterType = 'Course';
    else if (type === 'contests') filterType = 'Contest';
    else if (type === 'filmevents') filterType = 'Film Event';
    else if (type === 'all') filterType = 'all';
    
    filterEvents(filterType);
}

// Admin Deletion Function
async function adminDeleteEvent(eventId, event) {
    if (event) event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('The event has been permanently removed.', 'success');
            loadEvents(); // Reload grid
        } else {
            showMessage('We couldn’t delete the event right now. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error deleting event:', error);
        showMessage('Oops! Something went wrong while deleting. Please check your connection.', 'error');
    }
}
