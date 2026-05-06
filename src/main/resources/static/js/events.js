// Events and Auditions functionality
let currentUserId = null;
let currentUser = null;
let pendingEventId = null;
let allEvents = [];
let userApplications = [];
let hasScrolledToEvent = false;
let currentFilter = 'all';
let currentType = ''; // Track currently selected type for creation

let editModeId = null;

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    
    // Load user first to ensure isAdmin status is known before rendering events
    await loadCurrentUser();
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

    // Listen for Managed Checkbox changes
    const isManagedCheckbox = document.getElementById('isManaged');
    if (isManagedCheckbox) {
        isManagedCheckbox.addEventListener('change', toggleManagedFields);
    }
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
            if (document.getElementById('eventRoleType')) document.getElementById('eventRoleType').value = event.roleType || 'Lead';
            if (document.getElementById('eventAgeRange')) document.getElementById('eventAgeRange').value = event.ageRange || '';
            if (document.getElementById('eventGender')) document.getElementById('eventGender').value = event.genderPreference || 'Any';
            if (document.getElementById('eventPrizePool')) document.getElementById('eventPrizePool').value = event.prizePool || '';
            
            const isManagedCheckbox = document.getElementById('isManaged');
            if (isManagedCheckbox) {
                isManagedCheckbox.checked = event.isManaged === true;
                if (event.isManaged) {
                    const methodSelect = document.getElementById('registrationMethod');
                    if (methodSelect) {
                        methodSelect.value = event.externalLink ? 'external' : 'internal';
                        const linkInput = document.getElementById('externalLink');
                        if (linkInput) linkInput.value = event.externalLink || '';
                    }
                }
                toggleManagedFields(); // Apply visibility
            }
            
            // Handle Image Preview in Edit Mode
            const previewImg = document.getElementById('previewImg');
            const placeholder = document.getElementById('previewPlaceholder');
            const clearBtn = document.getElementById('clearImageBtn');
            const urlInput = document.getElementById('eventImageUrl');
            
            if (event.imageUrl) {
                if (previewImg) {
                    previewImg.src = event.imageUrl;
                    previewImg.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
                if (clearBtn) clearBtn.style.display = 'block';
                if (urlInput) urlInput.value = event.imageUrl;
            } else {
                if (previewImg) previewImg.style.display = 'none';
                if (placeholder) placeholder.style.display = 'block';
                if (clearBtn) clearBtn.style.display = 'none';
                if (urlInput) urlInput.value = '';
            }
            
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
            
            const picEle = document.getElementById('userAvatarSmall');
            if (picEle && currentUser.profilePicture) {
                picEle.src = currentUser.profilePicture;
                picEle.style.display = 'block';
                
                // Also hide initials if showing picture
                const initialsEle = document.getElementById('userInitialsSmall');
                if (initialsEle) initialsEle.style.display = 'none';
                
                // Update localStorage to keep it in sync
                localStorage.setItem('userAvatar', currentUser.profilePicture);
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
        const eventType = event.eventType || 'Audition';
        const typeClass = `tag-${eventType.toLowerCase().replace(/\s+/g, '-')}`;
        const animationDelay = (index % 10) * 0.1;
        
        const detailsItems = [];
        if (event.orgName && event.orgName.trim()) detailsItems.push(`<div><b style="color: #1e293b;">Org:</b> ${event.orgName}</div>`);
        if (event.orgEmail && event.orgEmail.trim()) detailsItems.push(`<div><b style="color: #1e293b;">Email:</b> ${event.orgEmail}</div>`);
        if (event.price !== undefined && event.price !== null) detailsItems.push(`<div><b style="color: #1e293b;">Price:</b> ${event.price === 0 ? 'Free' : '₹' + event.price}</div>`);
        if (event.capacity !== undefined && event.capacity !== null && event.capacity > 0) detailsItems.push(`<div><b style="color: #1e293b;">Seats:</b> ${event.capacity}</div>`);
        if (event.roleType && event.roleType.trim()) detailsItems.push(`<div><b style="color: #1e293b;">Role:</b> ${event.roleType}</div>`);
        if (event.ageRange && event.ageRange.trim()) detailsItems.push(`<div><b style="color: #1e293b;">Age:</b> ${event.ageRange}</div>`);
        if (event.genderPreference && event.genderPreference !== 'Any') detailsItems.push(`<div><b style="color: #1e293b;">Gender:</b> ${event.genderPreference}</div>`);
        if (event.prizePool && event.prizePool.trim()) detailsItems.push(`<div style="grid-column: span 2;"><b style="color: #1e293b;">Prizes:</b> ${event.prizePool}</div>`);
        if ((event.requirements && event.requirements.trim()) || (event.skills && event.skills.trim())) detailsItems.push(`<div style="grid-column: span 2;"><b style="color: #1e293b;">Skills:</b> ${event.requirements || event.skills}</div>`);

        const detailsHtml = detailsItems.length > 0 ? `
        <div class="details-section" style="margin-bottom: 15px; font-size: 11px; color: #475569; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #f8fafc; padding: 12px; border-radius: 10px; border: 1px solid #f1f5f9;">
            ${detailsItems.join('')}
        </div>` : '';

        const isManaged = event.isManaged === true;
        console.log(`DEBUG Event ${event.id}: isManaged=${isManaged}, externalLink=${event.externalLink}`);
        const isOwnerOrAdmin = (event.userId == currentUserId || (currentUser && currentUser.isAdmin));
        // Duplicate declaration removed: const animationDelay = (index % 10) * 0.1;
        // Determine if we use the simplified "Feed" layout
        // User wants managed auditions to look like posters in a feed
        const useFeedLayout = isManaged && !isOwnerOrAdmin;
        
        const getSafeUrl = (url) => {
            if (!url) return '';
            const u = url.trim();
            if (u.startsWith('mailto:')) return u;
            return (u.startsWith('http://') || u.startsWith('https://')) ? u : 'https://' + u;
        };

        const cardOnClick = useFeedLayout ? 
            ((event.isManaged && event.externalLink) ? `handleExternalRedirect(${event.id}, '${event.externalLink.replace(/'/g, "\\'")}')` : `applyToEvent(${event.id})`) : 
            '';
            
        // If using feed layout, we don't want the inner button to trigger a second redirect
        const buttonAction = useFeedLayout ? 'event.stopPropagation();' : '';

        return `
            <div class="cinematic-card" id="event-card-${event.id}" style="animation-delay: ${animationDelay}s; padding: 0; cursor: ${useFeedLayout ? 'pointer' : 'default'}; display: flex; flex-direction: column; background: #fff !important; border-radius: 24px; overflow: hidden; margin-bottom: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); border: 1px solid #f1f5f9; width: 100% !important;" onclick="${cardOnClick}">
                <div style="position: relative; width: 100%; background: none !important;">
                    <img src="${event.imageUrl || getEventDefaultImage(event.eventType)}" 
                         alt="${event.title}" 
                         style="width: 100% !important; min-width: 100% !important; height: auto !important; display: block !important; z-index: 1; background: none !important;">
                    
                    ${event.status === 'CLOSED' ? `
                        <div style="position: absolute; top: 15px; right: 15px; background: #ef4444; color: white; padding: 4px 12px; border-radius: 100px; font-size: 10px; font-weight: 800; z-index: 10; backdrop-filter: blur(8px);">
                            <i class="fas fa-lock"></i> CLOSED
                        </div>
                    ` : ''}
                </div>

                <div class="card-content" style="padding: ${useFeedLayout ? '0' : '12px 15px'}; display: flex; flex-direction: column;">
                    ${useFeedLayout ? '' : `
                        <h3 style="font-size: 17px; margin-bottom: 6px; font-family: 'Outfit', sans-serif; color: #1e293b;">${event.title}</h3>
                        
                        <div class="meta-group" style="margin-bottom: 8px; gap: 8px;">
                            ${(event.date || event.startDate) ? `
                                <div class="meta-item">
                                    <i class="far fa-calendar-alt"></i>
                                    <span>${formatEventDate(event.date || event.startDate)}${(event.endDate && event.endDate !== event.date) ? ` to ${formatEventDate(event.endDate)}` : ''}</span>
                                </div>
                            ` : ''}
                            ${event.location ? `
                                <div class="meta-item">
                                    <i class="fas fa-map-marker-alt"></i>
                                    <span>${event.location}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        ${event.description ? `
                            <p class="card-desc" style="font-size: 12px; margin-bottom: 10px; line-height: 1.4; color: #4b5563;">
                                ${event.description}
                            </p>
                        ` : ''}
                    `}
                    
                    <div class="card-footer" style="padding: 12px 15px; display: flex; justify-content: space-between; align-items: center; background: #fff; border-top: 1px solid #f8fafc;">
                        <div class="applicants-text" style="font-size: 13px; font-weight: 700; color: #64748b;">
                            <i class="fas fa-users" style="color: var(--primary-orange); margin-right: 4px;"></i>
                            <span id="applicant-count-${event.id}">${event.applicants || 0}</span>
                        </div>
                        
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div id="apply-container-${event.id}">
                                ${isOwnerOrAdmin ? `
                                    <div style="display: flex; gap: 6px;">
                                        <button class="apply-btn" style="padding: 7px 14px; font-size: 11px;" onclick="window.location.href='event-dashboard.html?id=${event.id}'">Manage</button>
                                        ${(currentUser && currentUser.isAdmin) ? `
                                            <button class="apply-btn" style="background: #ef4444; padding: 7px 10px; font-size: 11px;" onclick="adminDeleteEvent(${event.id}, event)">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                ` : (() => {
                                    const userApps = userApplications.filter(app => app.eventId === event.id);
                                    const hasApplied = userApps.length > 0;
                                    
                                    if (event.status === 'CLOSED') {
                                        return `<button class="apply-btn" disabled style="background: #94a3b8; cursor: not-allowed; padding: 7px 14px; font-size: 11px;">Closed</button>`;
                                    }

                                    return `
                                    <div style="display: flex; gap: 8px; align-items: center;">
                                        <div id="action-container-${event.id}">
                                            ${(() => {
                                                const sTitle = (event.title || 'Untitled Event').replace(/'/g, "\\'");
                                                const sLink = (event.externalLink || '').replace(/'/g, "\\'");
                                                const isExt = event.isManaged && event.externalLink;
                                                const regAct = isExt ? 
                                                    `event.stopPropagation(); handleExternalRedirect(${event.id}, '${sLink}')` : 
                                                    `applyToEvent(${event.id})`;

                                                if (hasApplied) {
                                                    if (isExt) {
                                                        const isM = event.externalLink.includes('@') || event.externalLink.startsWith('mailto:');
                                                        return `<button class="apply-btn" style="padding: 7px 14px; font-size: 11px; background: #10b981; color: white;" onclick="${buttonAction}${regAct}"><i class="fab ${isM ? 'fa-envelope' : 'fa-whatsapp'}"></i> ${isM ? 'Open Mail' : 'Open WhatsApp'}</button>`;
                                                    } else {
                                                        return `<button class="apply-btn" disabled style="background: #10b981; color: white; cursor: default; padding: 7px 14px; font-size: 11px; opacity: 1;"><i class="fas fa-check-circle"></i> Registered</button>`;
                                                    }
                                                }
                                                return `<button class="apply-btn" style="padding: 7px 14px; font-size: 11px;" onclick="${buttonAction}${regAct}">Register</button>`;
                                            })()}
                                        </div>
                                        <button class="apply-btn" style="background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; width: 32px; height: 32px; padding: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px;" onclick="shareContent('event', ${event.id}, '${(event.title || 'Event').replace(/'/g, "\\")}')">
                                            <i class="fas fa-share-alt" style="font-size: 12px;"></i>
                                        </button>
                                    </div>`;
    })()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (prepend) {
        container.insertAdjacentHTML('afterbegin', eventsHtml);
    }
    
    // Check for auto-scroll if we have an ID in URL
    if (!prepend) {
        checkAutoScroll();
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

    updateFormFields(type);

    // Pre-fill title based on type (as seen in screenshots)
    const titleInput = document.getElementById('eventTitle');
    if (titleInput) {
        titleInput.placeholder = `e.g. ${type} - New Session`;
        if (!isEdit) titleInput.value = ''; 
    }

    if (!isEdit) {
        clearEventImage(); // Reset image for new form
        if (document.getElementById('isManaged')) {
            document.getElementById('isManaged').checked = false;
            toggleManagedFields(); // Reset visibility
        }
    }

    // Admin-only: Managed Audition toggle
    const managedGroup = document.getElementById('managedGroup');
    if (managedGroup) {
        const isAdmin = (currentUser && currentUser.isAdmin) || localStorage.getItem('userEmail') === 'crewcanvas2@gmail.com';
        managedGroup.style.display = isAdmin ? 'block' : 'none';
    }
}

function updateFormFields(type) {
    const labels = {
        'Audition': {
            title: 'Audition Title',
            date: 'Audition Date',
            endDate: 'End Date (Optional)',
            time: 'Time / Slot',
            price: 'Payout / Stipend (₹)',
            skills: 'Required Skills',
            capacity: 'Max Applicants',
            desc: 'Role Description & Requirements'
        },
        'Workshop': {
            title: 'Workshop Title',
            date: 'Start Date',
            endDate: 'End Date',
            time: 'Session Timing',
            price: 'Registration Fee (₹)',
            skills: 'Topics Covered / Prerequisites',
            capacity: 'Max Seats',
            desc: 'Workshop Agenda & Details'
        },
        'Course': {
            title: 'Course Title',
            date: 'Batch Start Date',
            endDate: 'Batch End Date',
            time: 'Class Timing',
            price: 'Course Fee (₹)',
            skills: 'Syllabus / Prerequisites',
            capacity: 'Batch Size',
            desc: 'Course Curriculum & Details'
        },
        'Contest': {
            title: 'Contest Name',
            date: 'Submission Start',
            endDate: 'Deadline',
            time: 'Announcement Time',
            price: 'Entry Fee (₹)',
            skills: 'Eligibility Criteria',
            capacity: 'Max Entries',
            desc: 'Rules, Prizes & Participation'
        },
        'Film Event': {
            title: 'Event Title',
            date: 'Event Date',
            endDate: 'End Date',
            time: 'Show Time',
            price: 'Ticket Price (₹)',
            skills: 'Guest List / Special Instructions',
            capacity: 'Total Seats',
            desc: 'Event Details & Highlights'
        }
    };

    const config = labels[type] || labels['Audition'];
    
    // Update labels
    if (document.getElementById('labelTitle')) document.getElementById('labelTitle').innerText = config.title;
    if (document.getElementById('labelDate')) document.getElementById('labelDate').innerText = config.date;
    if (document.getElementById('labelEndDate')) document.getElementById('labelEndDate').innerText = config.endDate;
    if (document.getElementById('labelTime')) document.getElementById('labelTime').innerText = config.time;
    if (document.getElementById('labelPrice')) document.getElementById('labelPrice').innerText = config.price;
    if (document.getElementById('labelSkills')) document.getElementById('labelSkills').innerText = config.skills;
    if (document.getElementById('labelCapacity')) document.getElementById('labelCapacity').innerText = config.capacity;
    if (document.getElementById('labelDesc')) document.getElementById('labelDesc').innerText = config.desc;

    // Handle visibility
    const endDateGroup = document.getElementById('endDateGroup');
    const skillsGroup = document.getElementById('skillsGroup');
    const capacityGroup = document.getElementById('capacityGroup');
    const priceGroup = document.getElementById('priceGroup');

    if (endDateGroup) endDateGroup.style.display = 'block'; // Default
    if (skillsGroup) skillsGroup.style.display = 'block'; 
    if (capacityGroup) capacityGroup.style.display = 'block';
    if (priceGroup) priceGroup.style.display = 'block';

    // Specific hiding logic
    const auditionFields = document.getElementById('auditionFields');
    const contestFields = document.getElementById('contestFields');
    if (auditionFields) auditionFields.style.display = type === 'Audition' ? 'block' : 'none';
    if (contestFields) contestFields.style.display = type === 'Contest' ? 'block' : 'none';

    if (type === 'Film Event') {
        if (endDateGroup) endDateGroup.style.display = 'none';
    }
    
    // Update placeholders for better UX
    if (document.getElementById('eventPrice')) {
        document.getElementById('eventPrice').placeholder = type === 'Audition' ? 'e.g. 5000 (Payout)' : 'e.g. 500 (Fee)';
    }
}


function toggleManagedFields() {
    const isManaged = document.getElementById('isManaged') ? document.getElementById('isManaged').checked : false;
    
    // List of groups/fields to hide
    const groupsToToggle = [
        'eventDate', 
        'endDateGroup', 
        'eventTimeDuration', 
        'eventLocation',
        'eventOrgName', 
        'eventOrgEmail', 
        'eventOrgPhone', 
        'countryCode',
        'capacityGroup', 
        'priceGroup', 
        'auditionFields', 
        'contestFields',
        'skillsGroup', 
        'eventDescription'
    ];

    groupsToToggle.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        
        // Find the parent form-group or the element itself if it's a group
        let target = el;
        if (el.classList.contains('form-control-premium') || el.id === 'eventDescription') {
            target = el.closest('.form-group');
        }
        
        if (target) {
            target.style.display = isManaged ? 'none' : 'block';
        }
    });

    // Show registration method options for managed auditions
    const regMethodGroup = document.getElementById('registrationMethodGroup');
    if (regMethodGroup) {
        regMethodGroup.style.display = isManaged ? 'block' : 'none';
        if (isManaged) {
            toggleRegistrationLink();
        }
    }

    // Special case for Organizer Phone group which has no single ID
    const phoneGroup = document.getElementById('eventOrgPhone') ? document.getElementById('eventOrgPhone').closest('.form-group') : null;
    if (phoneGroup) phoneGroup.style.display = isManaged ? 'none' : 'block';

    // If NOT managed, re-apply type specific logic (like hiding audition fields for contests)
    if (!isManaged) {
        updateFormFields(currentType);
    }
}

function toggleRegistrationLink() {
    const methodSelect = document.getElementById('registrationMethod');
    const method = methodSelect ? methodSelect.value : 'internal';
    const linkGroup = document.getElementById('externalLinkGroup');
    if (linkGroup) {
        linkGroup.style.display = (method === 'external') ? 'block' : 'none';
    }
}

function closeFormModal() {
    const formModal = document.getElementById('formModal');
    if (formModal) formModal.style.display = 'none';
    clearEventImage(); // Clean up
}

// Image Upload Handlers
async function handleEventImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        try {
            const previewImg = document.getElementById('previewImg');
            const placeholder = document.getElementById('previewPlaceholder');
            const clearBtn = document.getElementById('clearImageBtn');
            const urlInput = document.getElementById('eventImageUrl');
            
            // Show loading state
            if (placeholder) placeholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Processing...</p>';
            
            const base64 = await uploadImage(file);
            
            if (base64) {
                if (previewImg) {
                    previewImg.src = base64;
                    previewImg.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
                if (clearBtn) clearBtn.style.display = 'block';
                if (urlInput) urlInput.value = base64; // We store the base64 in the hidden/small URL input
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            showMessage('Failed to process image. Please try another.', 'error');
        } finally {
            // Restore placeholder text if it's still visible
            const placeholder = document.getElementById('previewPlaceholder');
            if (placeholder && placeholder.style.display !== 'none') {
                placeholder.innerHTML = '<i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 5px;"></i><p style="font-size: 11px; font-weight: 600;">Click to upload banner</p>';
            }
        }
    }
}

function clearEventImage() {
    const previewImg = document.getElementById('previewImg');
    const placeholder = document.getElementById('previewPlaceholder');
    const clearBtn = document.getElementById('clearImageBtn');
    const urlInput = document.getElementById('eventImageUrl');
    const fileInput = document.getElementById('eventImageInput');
    
    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.innerHTML = '<i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 5px;"></i><p style="font-size: 11px; font-weight: 600;">Click to upload banner</p>';
    }
    if (clearBtn) clearBtn.style.display = 'none';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
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

    if (!title) {
        showMessage('Please enter an Event Title', 'error');
        return;
    }

    const isManaged = document.getElementById('isManaged') ? document.getElementById('isManaged').checked : false;

    if (!isManaged && (!date || !location)) {
        showMessage('Please fill in Date and Location', 'error');
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
        imageUrl: document.getElementById('eventImageUrl') ? document.getElementById('eventImageUrl').value : '',
        roleType: document.getElementById('eventRoleType') ? document.getElementById('eventRoleType').value : '',
        ageRange: document.getElementById('eventAgeRange') ? document.getElementById('eventAgeRange').value.trim() : '',
        genderPreference: document.getElementById('eventGender') ? document.getElementById('eventGender').value : '',
        prizePool: document.getElementById('eventPrizePool') ? document.getElementById('eventPrizePool').value.trim() : '',
        isManaged: isManaged,
        externalLink: (isManaged && document.getElementById('registrationMethod') && document.getElementById('registrationMethod').value === 'external') 
            ? (document.getElementById('externalLink') ? document.getElementById('externalLink').value.trim() : null) 
            : null
    };

    const url = editModeId ? `${API_BASE_URL}/api/events/${editModeId}` : `${API_BASE_URL}/api/events`;
    const method = editModeId ? 'PUT' : 'POST';

    console.log(`DEBUG: Sending ${method} to ${url}`);
    console.log(`DEBUG: Payload isManaged: ${eventData.isManaged}, externalLink: ${eventData.externalLink}`);
    console.log(`DEBUG: Full Payload:`, eventData);

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
            
            closeFormModal();
            closeCreateEvent();
            
            // Re-load events to update UI without full page refresh
            loadEvents();
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

// Handle external redirects (WhatsApp/Email) with lead tracking
async function handleExternalRedirect(eventId, url) {
    if (!currentUserId) {
        showMessage('Please log in to contact the organizer', 'warning');
        // Optional: show login modal if available
        return;
    }

    const getSafeUrl = (u) => {
        if (!u) return '';
        let trimmed = u.trim();
        if (trimmed.startsWith('mailto:')) return trimmed;
        
        // Auto-detect email addresses and add mailto:
        if (trimmed.includes('@') && !trimmed.includes('/') && !trimmed.startsWith('http')) {
            return 'mailto:' + trimmed;
        }
        
        return (trimmed.startsWith('http://') || trimmed.startsWith('https://')) ? trimmed : 'https://' + trimmed;
    };

    const safeUrl = getSafeUrl(url);
    console.log("Redirecting to:", safeUrl);

    // Track the lead ONLY if they haven't already applied
    try {
        const hasAlreadyApplied = userApplications.some(app => app.eventId == eventId);
        
        if (!hasAlreadyApplied) {
            const appData = {
                applicantName: currentUser?.fullName || currentUser?.name || 'Interested User',
                applicantEmail: currentUser?.email || '',
                mobileNumber: currentUser?.phone || '',
                location: currentUser?.location || '',
                additionalNote: `Redirected to external link: ${safeUrl}`
            };

            // Fire and forget
            fetch(`${API_BASE_URL}/api/events/${eventId}/apply?userId=${currentUserId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appData)
            }).then(async (res) => {
                if (res.ok) {
                    const updatedEvent = await res.json();
                    // Add to local list so the button changes to "Registered"
                    userApplications.push({ eventId: parseInt(eventId) });
                    
                    const countEl = document.getElementById(`applicant-count-${eventId}`);
                    if (countEl) {
                        countEl.textContent = updatedEvent.applicants;
                    }
                    // This will update the button to "Registered"
                    searchEvents();
                }
            }).catch(err => console.error("Lead tracking failed:", err));
        }
    } catch (e) {
        console.error("Error preparing lead track:", e);
    }

    // Perform the redirect instantly using a more reliable hidden-link method
    console.log("Final safeUrl for redirect:", safeUrl);
    
    // DEBUG ALERT - You can remove this after testing
    // alert("Opening link: " + safeUrl);

    try {
        const link = document.createElement('a');
        link.href = safeUrl;
        if (!safeUrl.startsWith('mailto:')) {
            link.target = '_blank';
        }
        document.body.appendChild(link);
        link.click();
        setTimeout(() => document.body.removeChild(link), 100);
    } catch (err) {
        console.error("Link click simulation failed, falling back...", err);
        if (safeUrl.startsWith('mailto:')) {
            window.location.href = safeUrl;
        } else {
            window.open(safeUrl, '_blank');
        }
    }
}

// Apply to event (continued)
// Apply to event
async function applyToEvent(eventId) {
    if (!currentUserId) {
        showMessage('Please log in to apply', 'error');
        return;
    }
    
    // If owner, go to dashboard
    const event = allEvents.find(e => e.id == eventId);
    if (event && (event.userId == currentUserId || (currentUser && currentUser.isAdmin))) {
        window.location.href = `event-dashboard.html?id=${eventId}`;
        return;
    }
    
    // Always open the application modal now, for a premium dynamic experience
    openAppModal(eventId);
}

async function openAppModal(eventId) {
    if (!eventId) return;
    pendingEventId = eventId;
    
    let event = allEvents.find(e => e.id == eventId);
    
    // If not in global list (common for shared links), fetch it specifically
    if (!event) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`);
            if (res.ok) {
                event = await res.json();
            }
        } catch (e) {
            console.error("Failed to fetch event for modal:", e);
        }
    }
    
    if (!event) {
        showMessage("Opportunity details could not be loaded. Please refresh.", "error");
        return;
    }

    // Reset and isolate application state to prevent field collisions
    window._appState = {
        resumeData: null,
        resumeName: null,
        videoData: null,
        videoName: null,
        posterData: null,
        photos: [null, null, null]
    };

    const type = event.eventType || 'Audition';
    
    // Show specific fields based on type
    const submissionGroup = document.getElementById('appSubmissionGroup');
    const roleGroup = document.getElementById('appRoleGroup');
    const experienceGroup = document.getElementById('appExperienceGroup');
    const noteGroup = document.getElementById('appNoteGroup');
    const labelSubmission = document.getElementById('labelAppSubmission');
    const labelNote = document.getElementById('labelAppNote');
    const auditionFields = document.getElementById('auditionAppSpecificFields');
    const contestFields = document.getElementById('contestAppSpecificFields');

    // Reset visibility
    if (submissionGroup) submissionGroup.style.display = 'none';
    if (roleGroup) roleGroup.style.display = 'none';
    if (experienceGroup) experienceGroup.style.display = 'none';
    if (auditionFields) auditionFields.style.display = 'none';
    if (contestFields) contestFields.style.display = 'none';

    // LAYER 1: Pre-fill from Profile (Baseline)
    if (document.getElementById('appFullName')) document.getElementById('appFullName').value = currentUser?.fullName || currentUser?.name || '';
    if (document.getElementById('appEmail')) document.getElementById('appEmail').value = currentUser?.email || '';
    if (document.getElementById('appWhatsApp')) document.getElementById('appWhatsApp').value = currentUser?.phone || '';
    
    // Default specific fields from profile
    if (document.getElementById('appAge')) document.getElementById('appAge').value = currentUser?.ageRange || '';
    if (document.getElementById('appHeight')) document.getElementById('appHeight').value = currentUser?.height || '';
    if (document.getElementById('appLocation')) document.getElementById('appLocation').value = currentUser?.location || '';
    
    // Clear dynamic fields before potentially auto-filling from last app
    if (document.getElementById('appSubmissionLink')) document.getElementById('appSubmissionLink').value = '';
    if (document.getElementById('appRole')) document.getElementById('appRole').value = '';
    if (document.getElementById('appNote')) document.getElementById('appNote').value = '';
    if (document.getElementById('appShortFilmTitle')) document.getElementById('appShortFilmTitle').value = '';
    if (document.getElementById('appTeamName')) document.getElementById('appTeamName').value = '';

    // Pictures Pre-population from Gallery (Profile Default)
    if (currentUser?.recentPictures) {
        try {
            let pics = [];
            if (currentUser.recentPictures.startsWith('[')) {
                pics = JSON.parse(currentUser.recentPictures);
            } else {
                pics = currentUser.recentPictures.split(',').filter(p => p.trim() !== '');
            }
            pics.slice(0, 3).forEach((pic, i) => {
                if (pic) {
                    setAppPhotoPreview(i + 1, pic);
                    window._appState.photos[i] = pic;
                }
            });
        } catch (e) { console.error("Gallery parse failed:", e); }
    } else {
        for(let i=1; i<=3; i++) clearAppPhotoPreview(i);
    }

    // Resume Pre-population (Profile Default)
    const resumeStatus = document.getElementById('resumeStatus');
    if (currentUser?.resume && resumeStatus) {
        resumeStatus.innerText = 'Resume selected from profile (Click to change)';
        resumeStatus.style.color = '#10b981';
        window._appState.resumeData = currentUser.resume;
        window._appState.resumeName = currentUser.resumeFileName || 'Resume.pdf';
    } else if (resumeStatus) {
        resumeStatus.innerText = 'Click to upload or select from profile';
        resumeStatus.style.color = '#64748b';
        window._appState.resumeData = null;
    }

    // LAYER 2: Fetch and Pre-fill from Latest Application (Preferred Overwrites)
    try {
        const latestResp = await fetch(`${API_BASE_URL}/api/events/user-applications/latest?userId=${currentUserId}`);
        if (latestResp.status === 200) {
            const lastApp = await latestResp.json();
            console.log("Found previous application, refining fields...");
            
            const fieldsToFill = {
                'appAge': lastApp.age,
                'appHeight': lastApp.height,
                'appLocation': lastApp.location,
                'appShortFilmTitle': lastApp.shortFilmTitle,
                'appTeamName': lastApp.teamName,
                'appSubmissionLink': lastApp.portfolioLink,
                'appRole': lastApp.role,
                'appNote': lastApp.additionalNote
            };
            
            for (const [id, value] of Object.entries(fieldsToFill)) {
                const el = document.getElementById(id);
                if (el && value && value.trim() !== '') {
                    el.value = value;
                }
            }
            
            // Overwrite photos if last app had them (usually more relevant for specific roles)
            if (lastApp.photo1) { setAppPhotoPreview(1, lastApp.photo1); window._appState.photos[0] = lastApp.photo1; }
            if (lastApp.photo2) { setAppPhotoPreview(2, lastApp.photo2); window._appState.photos[1] = lastApp.photo2; }
            if (lastApp.photo3) { setAppPhotoPreview(3, lastApp.photo3); window._appState.photos[2] = lastApp.photo3; }
            
            // Overwrite resume if last app had one
            if (lastApp.resumeUrl) {
                window._appState.resumeData = lastApp.resumeUrl;
                window._appState.resumeName = lastApp.resumeFileName || 'Resume.pdf';
                if (resumeStatus) {
                    resumeStatus.innerText = `Selected from previous: ${truncateText(window._appState.resumeName, 20)}`;
                    resumeStatus.style.color = '#10b981';
                }
            }
        }
    } catch (e) {
        console.warn("Failed to fetch latest application for auto-fill:", e);
    }

    // LAYER 3: Type-Specific UI Adjustments
    if (type === 'Audition') {
        if (auditionFields) auditionFields.style.display = 'block';
        if (roleGroup) roleGroup.style.display = 'block';
        if (labelNote) labelNote.innerText = 'Additional Notes';
    } else if (type === 'Contest') {
        if (contestFields) contestFields.style.display = 'block';
        if (submissionGroup) submissionGroup.style.display = 'block';
        if (labelSubmission) labelSubmission.innerText = 'Short Film Link';
        if (labelNote) labelNote.innerText = 'Contest Category / Note';
    } else if (type === 'Film Event') {
        if (submissionGroup) {
            submissionGroup.style.display = 'block';
            if (labelSubmission) labelSubmission.innerText = 'Short Film Link (Optional)';
        }
        if (labelNote) labelNote.innerText = 'Special Note';
    } else {
        if (labelNote) labelNote.innerText = 'Message to Organizer';
    }
    
    // LAYER 4: Final Cleanup & UI Prep
    window._appState.videoData = null;
    window._appState.videoName = null;
    const videoStatus = document.getElementById('videoStatus');
    if (videoStatus) {
        videoStatus.innerText = 'Click to upload video';
        videoStatus.style.color = '#64748b';
    }

    window._appState.posterData = null;
    const posterStatus = document.getElementById('posterStatus');
    if (posterStatus) {
        posterStatus.innerText = 'Click to upload poster image';
        posterStatus.style.color = '#64748b';
    }

    // Show Linked Profile Preview
    if (document.getElementById('appUserProfileName')) {
        document.getElementById('appUserProfileName').innerText = currentUser?.username ? `@${currentUser.username}` : (currentUser?.email || 'User Profile');
    }
    
    const imgEl = document.getElementById('appUserImg');
    const initialsEl = document.getElementById('appUserInitials');
    if (imgEl && initialsEl) {
        if (currentUser?.profilePicture) {
            imgEl.src = currentUser.profilePicture;
            imgEl.style.display = 'block';
            initialsEl.style.display = 'none';
        } else {
            imgEl.style.display = 'none';
            initialsEl.style.display = 'flex';
            initialsEl.innerText = (currentUser?.name || '?').charAt(0).toUpperCase();
        }
    }

    document.getElementById('applicationModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeAppModal() {
    document.getElementById('applicationModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    pendingEventId = null;
}

async function submitEventApplication() {
    if (!currentUserId || currentUserId === 'null' || currentUserId === 'undefined') {
        currentUserId = localStorage.getItem('userId');
        if (!currentUserId) {
            showMessage('Please login again to continue.', 'error');
            setTimeout(() => window.location.href = 'index.html', 2000);
            return;
        }
    }

    if (!pendingEventId) return;

    const btn = document.querySelector('button[onclick="submitEventApplication()"]');
    const originalText = btn.innerText;
    
    const name = document.getElementById('appFullName').value.trim();
    const whatsapp = document.getElementById('appWhatsApp').value.trim();
    const email = document.getElementById('appEmail').value.trim();
    const submissionLink = document.getElementById('appSubmissionLink') ? document.getElementById('appSubmissionLink').value.trim() : '';
    const role = document.getElementById('appRole') ? document.getElementById('appRole').value.trim() : '';
    const note = document.getElementById('appNote').value.trim();

    // Audition Specific Data
    const age = document.getElementById('appAge') ? document.getElementById('appAge').value : '';
    const height = document.getElementById('appHeight') ? document.getElementById('appHeight').value : '';
    const location = document.getElementById('appLocation') ? document.getElementById('appLocation').value : '';
    const resumeUrl = window._appState.resumeData || '';
    const photos = window._appState.photos || [null, null, null];
    const shortFilmTitle = document.getElementById('appShortFilmTitle') ? document.getElementById('appShortFilmTitle').value.trim() : '';
    const teamName = document.getElementById('appTeamName') ? document.getElementById('appTeamName').value.trim() : '';

    if (!name || !whatsapp || !email) {
        showMessage('Please fill in Name, WhatsApp and Email', 'warning');
        return;
    }

    const event = allEvents.find(e => e.id == pendingEventId);
    if (!event) return;

    if (event.eventType === 'Audition') {
        if (!age || !height || !location) {
            showMessage('Age, Height and Location are required for auditions', 'warning');
            return;
        }
        if (!photos[0] && !photos[1] && !photos[2]) {
            showMessage('At least one photo is required for auditions', 'warning');
            return;
        }
        if (!resumeUrl) {
            showMessage('Please upload your Resume / Portfolio', 'warning');
            return;
        }
    } else if (event.eventType === 'Contest') {
        if (!shortFilmTitle || !teamName || !submissionLink) {
            showMessage('Title, Team Name and Short Film Link are required for contests', 'warning');
            return;
        }
    } else if (event.eventType === 'Film Event') {
        // Only common fields required for Film Events? 
        // User said "all fields mandatory", so if there's a role/submission link shown, it should be checked.
        if (document.getElementById('appRoleGroup')?.style.display === 'block' && !role) {
            showMessage('Please specify the Role', 'warning');
            return;
        }
        if (document.getElementById('appSubmissionGroup')?.style.display === 'block' && !submissionLink) {
            showMessage('Please provide the Submission Link', 'warning');
            return;
        }
    }

    // Collect App Info
    const appData = {
        applicantName: name,
        applicantEmail: email,
        location: location || whatsapp, 
        portfolioLink: submissionLink,
        role: role,
        additionalNote: note,
        age: age,
        height: height,
        mobileNumber: whatsapp,
        photo1: photos[0],
        photo2: photos[1],
        photo3: photos[2],
        resumeUrl: resumeUrl,
        resumeFileName: window._appState.resumeName || (currentUser?.resumeFileName || ''),
        videoUrl: window._appState.videoData || '',
        videoFileName: window._appState.videoName || '',
        posterUrl: window._appState.posterData || '',
        shortFilmTitle: shortFilmTitle,
        teamName: teamName
    };

    btn.disabled = true;
    btn.innerText = 'Applying...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/events/${pendingEventId}/apply?userId=${currentUserId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(appData)
        });

        if (response.ok) {
            const updatedEvent = await response.json();
            showMessage('Registered successfully!', 'success');
            
            const appsResponse = await fetch(`${API_BASE_URL}/api/events/applications/user/${currentUserId}`);
            if (appsResponse.ok) userApplications = await appsResponse.json();
            
            closeAppModal();
            const countEl = document.getElementById(`applicant-count-${pendingEventId}`);
            if (countEl) countEl.textContent = updatedEvent.applicants;
            searchEvents(); 
        } else {
            const err = await response.text();
            console.error('Registration failed:', response.status, err);
            
            if (err.includes('AUDITION_CLOSED')) {
                showMessage('Registration closed.', 'error');
            } else if (response.status === 413 || err.toLowerCase().includes('large') || err.toLowerCase().includes('size')) {
                showMessage('Files are too large. Please use smaller photos or a smaller resume.', 'error');
            } else {
                showMessage('Registration failed: ' + (err.length < 100 ? err : 'Server Error'), 'error');
            }
        }
    } catch (error) {
        console.error(error);
        showMessage('Connection error.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

// Audition Helper Functions
async function handleMultiPhotoUpload(input) {
    if (input.files && input.files.length > 0) {
        const files = Array.from(input.files).slice(0, 3);
        if (input.files.length > 3) {
            showMessage("Only the first 3 photos will be uploaded.", "info");
        }
        
        // Reset only photo slots
        window._appState.photos = [null, null, null];
        for (let i = 1; i <= 3; i++) clearAppPhotoPreview(i);

        for (let i = 0; i < files.length; i++) {
            try {
                // Aggressive compression for mobile to prevent OOM (800px max, 0.5 quality)
                const base64 = await uploadImage(files[i], 800, 0.5);
                if (base64) {
                    setAppPhotoPreview(i + 1, base64);
                    window._appState.photos[i] = base64;
                }
            } catch (e) {
                console.error("Failed to upload photo", e);
            }
        }
        
        // Update main upload box style if at least one photo is picked
        const box = document.getElementById('multiPhotoBox');
        if (box) box.classList.add('has-images');
    }
}

function setAppPhotoPreview(index, src) {
    const slot = document.getElementById(`slot${index}`);
    const img = document.getElementById(`photoPrev${index}`);
    if (slot && img) {
        if (!src) {
            clearAppPhotoPreview(index);
            return;
        }
        img.src = src;
        img.onload = () => {
            img.style.display = 'block';
            slot.classList.add('has-image');
            const placeholder = slot.querySelector('.slot-placeholder');
            if (placeholder) placeholder.style.display = 'none';
        };
        img.onerror = () => {
            img.style.display = 'none';
            slot.classList.remove('has-image');
            const placeholder = slot.querySelector('.slot-placeholder');
            if (placeholder) placeholder.style.display = 'flex';
        };
    }
}

function clearAppPhotoPreview(index) {
    const slot = document.getElementById(`slot${index}`);
    const img = document.getElementById(`photoPrev${index}`);
    if (slot && img) {
        img.src = '';
        img.style.display = 'none';
        slot.classList.remove('has-image');
        const placeholder = slot.querySelector('.slot-placeholder');
        if (placeholder) placeholder.style.display = 'flex';
    }
}

function removeAppPhoto(index, event) {
    if (event) event.stopPropagation();
    
    if (window._appState && window._appState.photos) {
        window._appState.photos[index - 1] = null;
        clearAppPhotoPreview(index);
        
        // Update main box style if no photos left
        const hasAny = window._appState.photos.some(p => p !== null);
        if (!hasAny) {
            const box = document.getElementById('multiPhotoBox');
            if (box) box.classList.remove('has-images');
        }
    }
}

async function handleAppResumeUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // 10MB limit for Resume
        if (file.size > 10 * 1024 * 1024) {
            showMessage("Resume file must be less than 10MB", "warning");
            input.value = '';
            return;
        }

        try {
            const resumeStatus = document.getElementById('resumeStatus');
            if (resumeStatus) resumeStatus.innerText = 'Reading file...';
            
            // For PDFs, uploadImage returns raw base64
            const base64 = await uploadImage(file);
            window._appState.resumeData = base64;
            window._appState.resumeName = file.name;
            if (resumeStatus) {
                resumeStatus.innerText = `Selected: ${truncateText(file.name, 20)}`;
                resumeStatus.style.color = '#10b981';
            }
        } catch (e) {
            showMessage("Failed to read resume file", "error");
        }
    }
}

async function handleAppVideoUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (file.size > maxSize) {
            showMessage("Video size must be less than 50MB", "warning");
            input.value = '';
            return;
        }

        try {
            const videoStatus = document.getElementById('videoStatus');
            if (videoStatus) videoStatus.innerText = 'Uploading video...';
            
            // For now, we store video as base64 in LONGTEXT, same as images/PDFs.
            // Note: Large base64 can impact DB performance, but requested logic is consistent.
            const reader = new FileReader();
            reader.onload = function(e) {
                window._appState.videoData = e.target.result;
                window._appState.videoName = file.name;
                if (videoStatus) {
                    videoStatus.innerText = `Uploaded: ${truncateText(file.name, 20)}`;
                    videoStatus.style.color = '#10b981';
                }
            };
            reader.readAsDataURL(file);
        } catch (e) {
            showMessage("Failed to upload video", "error");
        }
    }
}

async function handleAppPosterUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        try {
            const posterStatus = document.getElementById('posterStatus');
            if (posterStatus) posterStatus.innerText = 'Uploading poster...';
            
            const base64 = await uploadImage(file, 1000, 0.7); // Higher res for poster
            window._appState.posterData = base64;
            
            if (posterStatus) {
                posterStatus.innerText = `Selected: ${truncateText(file.name, 20)}`;
                posterStatus.style.color = '#10b981';
            }
        } catch (e) {
            showMessage("Failed to upload poster image", "error");
        }
    }
}

// Legacy Profile Completion Functions removed and replaced by dynamic application modal

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

function formatEventDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

// Check for direct event link and scroll
function checkAutoScroll() {
    if (hasScrolledToEvent) return;
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    if (eventId) {
        setTimeout(() => {
            const target = document.getElementById(`event-card-${eventId}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a temporary highlight effect
                target.style.transition = 'all 1s ease';
                target.style.border = '2px solid #3b82f6';
                target.style.boxShadow = '0 0 30px rgba(59, 130, 246, 0.3)';
                setTimeout(() => {
                    target.style.border = '1px solid #f1f5f9';
                    target.style.boxShadow = '0 10px 40px rgba(0,0,0,0.06)';
                }, 3000);
                hasScrolledToEvent = true;
            }
        }, 800); // Wait for animations to finish
    }
}
