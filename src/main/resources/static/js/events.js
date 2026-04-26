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
    checkAuth();
    currentUserId = getCurrentUserId();
    // Load user first to ensure isAdmin status is known before rendering events
    await loadCurrentUser();
    loadEvents();
    checkEditMode();
});

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
            document.getElementById('eventDate').value = event.date || '';
            document.getElementById('eventEndDate').value = event.endDate || '';
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

    container.innerHTML = events.map((event, index) => {
        const typeClass = `tag-${(event.eventType || 'audition').toLowerCase()}`;
        const placeholderImg = `https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80`;
        const animationDelay = (index % 10) * 0.1; // Staggered delay for first 10 items
        
        return `
            <div class="cinematic-card" style="animation-delay: ${animationDelay}s">
                <div class="card-image-box">
                    <div class="type-tag ${typeClass}">${event.eventType || 'Audition'}</div>
                    <img src="${event.imageUrl || placeholderImg}" alt="${event.title}">
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
                            ` : (userApplications.some(app => app.eventId === event.id) ? `
                                <button class="apply-btn" disabled style="background: #27ae60; cursor: default; opacity: 1;">Registered</button>
                            ` : `
                                <button class="apply-btn" onclick="applyToEvent(${event.id})">Register Now</button>
                            `)}
                        </div>
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
    const imageUrlEle = document.getElementById('eventImageUrl');

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
        imageUrl: imageUrlEle ? imageUrlEle.value.trim() : '',
        applicants: 0,
        // Optional fields that might not be in the current form
        capacity: document.getElementById('eventCapacity') ? parseInt(document.getElementById('eventCapacity').value) || 0 : 0,
        price: document.getElementById('eventPrice') ? parseFloat(document.getElementById('eventPrice').value) || 0.0 : 0.0,
        requirements: document.getElementById('eventSkills') ? document.getElementById('eventSkills').value.trim() : ''
    };


    try {
        const method = editModeId ? 'PUT' : 'POST';
        const url = editModeId ? `${API_BASE_URL}/api/events/${editModeId}` : `${API_BASE_URL}/api/events`;
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(eventData)
        });

        if (response.ok) {
            showMessage(editModeId ? 'Event updated successfully!' : 'Event created successfully!', 'success');
            closeFormModal();
            
            if (editModeId) {
                // Redirect back to dashboard after edit
                setTimeout(() => window.location.href = `event-dashboard.html?id=${editModeId}`, 1500);
            } else {
                loadEvents(); // Reload grid
            }

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
            showMessage('We couldn’t post your opportunity right now. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error creating event:', error);
        showMessage('Oops! Something went wrong while saving. Please check your connection.', 'error');
    }
}

// Apply to event (continued)
// Apply to event
async function applyToEvent(eventId) {
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
            showMessage('Registration successful!', 'success');
            
            // Update local state to keep everything in sync
            const index = allEvents.findIndex(e => e.id === eventId);
            if (index !== -1) {
                allEvents[index] = updatedEvent;
            }
            userApplications.push({ eventId: eventId, userId: currentUserId });

            // Update UI surgically without a full reload or re-render
            const countEle = document.getElementById(`applicant-count-${eventId}`);
            if (countEle) {
                countEle.textContent = updatedEvent.applicants || 0;
                countEle.classList.add('pulse-animation'); // Optional visual feedback
            }
            
            const container = document.getElementById(`apply-container-${eventId}`);
            if (container) {
                container.innerHTML = `<button class="apply-btn" disabled style="background: #27ae60; cursor: default; opacity: 1;">Registered</button>`;
            }
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
