// Event Dashboard & Application Management
let currentEventId = null;
let currentEvent = null;
let toggleBtn = null;
let allApplicants = [];
let filteredApplicants = [];
let eventsCache = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');
    toggleBtn = document.getElementById('toggleStatusBtn');

    if (typeof initUniversalHeader === 'function') {
        initUniversalHeader();
    }
    await loadCurrentUser();

    if (currentEventId) {
        showManagementView();
    } else {
        showListView();
    }
});

async function showListView() {
    document.getElementById('listView').style.display = 'block';
    document.getElementById('mgmtView').style.display = 'none';
    
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
        // If admin, load ALL events, otherwise just user events
        const url = (currentUser && currentUser.isAdmin) 
            ? `${API_BASE_URL}/api/events` 
            : `${API_BASE_URL}/api/events/user/${userId}`;
            
        const res = await fetch(url);
        if (res.ok) {
            const events = await res.json();
            eventsCache = events;
            renderEventList(events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function renderEventList(events) {
    const list = document.getElementById('eventList');
    if (!list) return;

    if (events.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding: 50px; color: #94a3b8;">You haven\'t created any events yet.</div>';
        return;
    }

    list.innerHTML = events.map(event => {
        const detailsHtml = [];
        detailsHtml.push(`<div><b style="color: #64748b; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Schedule</b> ${formatDate(event.date || event.startDate)}</div>`);
        if (event.price !== undefined && event.price !== null) detailsHtml.push(`<div><b style="color: #64748b; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Budget/Price</b> ${event.price === 0 ? 'Free' : '₹' + event.price}</div>`);
        if (event.capacity !== undefined && event.capacity !== null && event.capacity > 0) detailsHtml.push(`<div><b style="color: #64748b; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Capacity</b> ${event.capacity}</div>`);
        if (event.description && event.description.trim()) detailsHtml.push(`<div style="grid-column: 1 / -1;"><b style="color: #64748b; font-size: 10px; text-transform: uppercase; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">About this Opportunity</b> ${event.description}</div>`);

        const gridHtml = detailsHtml.length > 0 ? `
        <div class="event-details" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; background: #f8fafc; padding: 20px; border-radius: 16px; font-size: 13px; border: 1px solid #f1f5f9;">
            ${detailsHtml.join('')}
        </div>` : '';

        return `
        <div class="event-card" style="display: flex; flex-direction: column; height: auto; padding: 0; overflow: hidden; border-radius: 24px; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #f1f5f9; margin-bottom: 25px;">
            <div class="event-banner" style="width: 100%; height: 350px; position: relative; overflow: hidden; background: #000; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <img src="${event.imageUrl || getEventDefaultImage(event.eventType)}" 
                     style="width: 100%; height: 100%; object-fit: contain; display: block;">
                <div style="position: absolute; top: 15px; left: 15px; display: flex; gap: 8px;">
                    <span style="background: rgba(67, 56, 202, 0.9); color: white; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 100px; text-transform: uppercase; backdrop-filter: blur(8px);">${event.eventType}</span>
                    ${event.isManaged ? `<span style="background: rgba(255, 140, 0, 0.9); color: white; font-size: 10px; font-weight: 800; padding: 4px 12px; border-radius: 100px; text-transform: uppercase; backdrop-filter: blur(8px);"><i class="fas fa-check-circle"></i> Managed</span>` : ''}
                </div>
            </div>

            <div style="padding: 25px; display: flex; flex-direction: column;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                    <div class="event-info">
                        <h3 style="margin: 0; font-size: 22px; color: #1e293b; font-family: 'Outfit', sans-serif;">${event.title}</h3>
                        <div style="display: flex; gap: 12px; margin-top: 8px; color: #64748b; font-size: 13px; font-weight: 600;">
                            <span><i class="fas fa-map-marker-alt" style="color: var(--primary-orange);"></i> ${event.location}</span>
                            <span><i class="fas fa-users" style="color: var(--primary-orange);"></i> ${event.applicants || 0} Registered</span>
                        </div>
                    </div>
                    <div class="event-actions" style="display: flex; gap: 8px; flex-shrink: 0;">
                        <button class="manage-btn" style="margin:0; padding: 10px 20px; border-radius: 12px; background: #0f172a; color: white;" onclick="window.location.href='event-dashboard.html?id=${event.id}'">Manage</button>
                        <button class="manage-btn" style="margin:0; width: 44px; height: 44px; padding: 0; background: #f1f5f9; color: #64748b; border-radius: 12px;" onclick="shareContent('event', ${event.id}, '${event.title.replace(/'/g, "\\'")}')" title="Share Link">
                            <i class="fas fa-share-alt"></i>
                        </button>
                        <button class="delete-btn" style="margin:0; width: 44px; height: 44px; padding: 0; background: #fee2e2; color: #ef4444; border-radius: 12px;" onclick="deleteEvent(${event.id})" title="Delete Event">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                ${gridHtml}
            </div>
        </div>
        `;
    }).join('');
}

async function fetchEventDetails() {
    const eventRes = await fetch(`${API_BASE_URL}/api/events/${currentEventId}`);
    if (!eventRes.ok) return;
    currentEvent = await eventRes.json();
    
    document.getElementById('mgmtEventTitle').innerText = currentEvent.title;
    
    const detailsHtml = `
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-top: 10px; font-size: 13px; color: #64748b;">
            <span id="mgmtStatusBadge" class="status-badge" style="background: ${currentEvent.status === 'CLOSED' ? '#fee2e2' : '#dcfce7'}; color: ${currentEvent.status === 'CLOSED' ? '#ef4444' : '#15803d'}; font-size: 11px; font-weight: 800; padding: 4px 12px;">
                <i class="fas ${currentEvent.status === 'CLOSED' ? 'fa-lock' : 'fa-lock-open'}"></i> ${currentEvent.status || 'OPEN'}
            </span>
            <span><i class="far fa-calendar-alt"></i> ${formatDate(currentEvent.date)}${currentEvent.endDate ? ` to ${formatDate(currentEvent.endDate)}` : ''}</span>
            <span><i class="fas fa-map-marker-alt"></i> ${currentEvent.location}</span>
            ${currentEvent.timeDuration ? `<span><i class="far fa-clock"></i> ${currentEvent.timeDuration}</span>` : ''}
        </div>
        <button class="btn-premium-sm" style="background: var(--primary-orange, #ff8c00); margin-top: 15px; color: white; width: auto; padding: 8px 16px;" onclick="shareContent('event', ${currentEvent.id}, '${currentEvent.title.replace(/'/g, "\\'")}')">
            <i class="fas fa-share-alt"></i> Share Event Link
        </button>
        ${currentEvent.eventType === 'Film Event' ? `
            <button class="btn-premium-sm" style="background: #0f172a; margin-top: 15px; color: white; width: auto; padding: 8px 16px; margin-left: 10px;" onclick="window.location.href='scan.html'">
                <i class="fas fa-qrcode"></i> Scan Tickets
            </button>
        ` : ''}
    `;
    
    let detailsContainer = document.getElementById('mgmtEventDetails');
    if (!detailsContainer) {
        const titleEl = document.getElementById('mgmtEventTitle');
        detailsContainer = document.createElement('div');
        detailsContainer.id = 'mgmtEventDetails';
        titleEl.parentNode.insertBefore(detailsContainer, titleEl.nextSibling);
    }
    detailsContainer.innerHTML = detailsHtml;

    const type = currentEvent.eventType || 'Event';
    const badge = document.getElementById('mgmtStatusBadge');
    if (currentEvent.status === 'CLOSED') {
        badge.className = 'status-badge status-rejected';
        badge.innerHTML = '<i class="fas fa-lock"></i> CLOSED';
        if (toggleBtn) {
            toggleBtn.innerHTML = `<i class="fas fa-lock-open"></i> Open ${type}`;
            toggleBtn.style.color = '#16a34a';
        }
    } else {
        badge.className = 'status-badge status-registered';
        badge.innerHTML = '<i class="fas fa-lock-open"></i> OPEN';
        if (toggleBtn) {
            toggleBtn.innerHTML = `<i class="fas fa-lock"></i> Close ${type}`;
            toggleBtn.style.color = '#ef4444';
        }
    }

    // Handle Managed Audition Share Link
    const shareBtn = document.getElementById('shareCastingDeckBtn');
    if (shareBtn) {
        if (currentEvent.isManaged && currentEvent.shareKey) {
            shareBtn.style.display = 'block';
        } else {
            shareBtn.style.display = 'none';
        }
    }
}

function copyShareLink() {
    if (!currentEvent || !currentEvent.shareKey) {
        showMessage('This is not a managed audition.', 'error');
        return;
    }
    
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared-audition.html?key=${currentEvent.shareKey}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
        showMessage('Casting Deck Link copied to clipboard!', 'success');
        
        // Visual feedback on button
        const btn = document.getElementById('shareCastingDeckBtn');
        const originalHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Link Copied!';
        setTimeout(() => {
            btn.innerHTML = originalHtml;
        }, 2000);
    }).catch(err => {
        console.error('Copy failed:', err);
        prompt('Copy the link manually:', shareUrl);
    });
}

async function showManagementView() {
    document.getElementById('listView').style.display = 'none';
    document.getElementById('mgmtView').style.display = 'block';

    try {
        await fetchEventDetails();
        
        // Load Applicants
        const viewerId = getCurrentUserId();
        const applicantsRes = await fetch(`${API_BASE_URL}/api/events/${currentEventId}/applicants?viewerId=${viewerId}`);
        if (applicantsRes.ok) {
            const rawApplicants = await applicantsRes.json();
            allApplicants = rawApplicants;
            filteredApplicants = [...allApplicants];
            renderApplicantsTable();
            updateStats();
        } else {
            const errorText = await applicantsRes.text();
            showMessage(`Error loading applicants: ${errorText}`, 'error');
            renderApplicantsTable(); 
        }
    } catch (error) {
        console.error('Error loading management view:', error);
        showMessage('Connection error.', 'error');
    }
}

function renderApplicantsTable() {
    const body = document.getElementById('applicantsBody');
    const table = document.querySelector('.applicants-table');
    if (!body || !table) return;

    const isContest = (currentEvent.eventType || '').toLowerCase() === 'contest';
    const isAudition = (currentEvent.eventType || '').toLowerCase() === 'audition';

    // Update Headers
    const thead = table.querySelector('thead');
    if (thead) {
        thead.innerHTML = `
            <tr>
                <th style="width: 50px;">RANK</th>
                <th>NAME</th>
                <th>EMAIL ADDRESS</th>
                <th>MOBILE NUMBER</th>
                <th style="width: 100px;">STATUS</th>
                <th style="width: 150px;">ACTIONS</th>
            </tr>
        `;
    }

    if (filteredApplicants.length === 0) {
        body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:#94a3b8;">No applicants found.</td></tr>`;
        return;
    }

    body.innerHTML = filteredApplicants.map((app, index) => {
        const isLowCompleteness = app.matchScore < -2000;
        const rankLabel = isLowCompleteness ? 'NEXT ORDER' : `#${index + 1} MATCH`;
        const rankColor = isLowCompleteness ? '#94a3b8' : '#ff8c00';

        const isContest = (currentEvent.eventType || '').toLowerCase() === 'contest';
        
        return `
            <tr>
                <td data-label="Rank">
                    <div style="width:32px; height:32px; background:${rankColor}; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:11px;">
                        ${isLowCompleteness ? '!' : index + 1}
                    </div>
                </td>
                <td data-label="Name">
                    <div style="font-weight:700; color:#1e293b;">${app.applicantName || 'Unknown'}</div>
                </td>
                <td data-label="Email">
                    <div style="color:#64748b; font-size:13px;">${app.applicantEmail || ''}</div>
                </td>
                <td data-label="Mobile">
                    <div style="font-weight:600; color:#1e293b; font-size:13px;">${app.mobileNumber || '-'}</div>
                </td>
                <td data-label="Status">
                    <span class="status-badge status-${(app.status || 'PENDING').toLowerCase()}" style="font-size:9px;">${(app.status || 'PENDING') === 'PENDING' ? 'REG' : app.status.replace('_', ' ')}</span>
                </td>
                <td data-label="Actions">
                    <div class="action-icons">
                        <button class="icon-btn" onclick="openApplicantDetailModal(${app.id})" title="View Details" style="background:#fff8f1; color:#ff8c00; border: 1px solid #ffedd5;">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="icon-btn" onclick="window.location.href='profile.html?userId=${app.userId}'" title="Profile" style="background:#e0e7ff; color:#4338ca; border: 1px solid #c7d2fe;">
                            <i class="fas fa-user"></i>
                        </button>
                        <button class="icon-btn" onclick="window.location.href='messages.html?userId=${app.userId}&from=applicant'" title="Message" style="background:#fef3c7; color:#d97706; border: 1px solid #fde68a;">
                            <i class="fas fa-comment"></i>
                        </button>
                        
                        ${app.status === 'PENDING' ? `
                            <button class="icon-btn btn-check" onclick="updateAppStatus(${app.id}, 'SHORTLISTED')" title="Shortlist">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}

                        ${app.status === 'SHORTLISTED' && ['audition', 'contest'].includes((currentEvent.eventType || '').toLowerCase()) ? `
                            <button class="icon-btn" onclick="updateAppStatus(${app.id}, 'SELECTED')" title="Select" style="background:#dcfce7; color:#16a34a; border: 1px solid #bbf7d0;">
                                <i class="fas fa-trophy"></i>
                            </button>
                        ` : ''}
                        
                        ${app.status === 'PENDING' ? `
                            <button class="icon-btn btn-cross" onclick="updateAppStatus(${app.id}, 'Reject')" title="Reject">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    const total = allApplicants.length;
    const shortlisted = allApplicants.filter(a => a.status === 'SHORTLISTED').length;
    const pending = allApplicants.filter(a => a.status === 'PENDING').length;

    const statTotal = document.getElementById('statTotal');
    const statShortlisted = document.getElementById('statShortlisted');
    const statPending = document.getElementById('statPending');

    if (statTotal) statTotal.innerText = total;
    if (statShortlisted) statShortlisted.innerText = shortlisted;
    if (statPending) statPending.innerText = pending;
}

function openEditModal() {
    if (!currentEvent && currentEventId) {
        currentEvent = eventsCache.find(e => e.id == currentEventId);
    }
    
    if (!currentEvent) {
        console.error("No event data found");
        return;
    }
    
    document.body.style.overflow = 'hidden';
    document.getElementById('editTitle').value = currentEvent.title || '';
    document.getElementById('editType').value = currentEvent.eventType || '';
    document.getElementById('editDate').value = formatDateForInput(currentEvent.date);
    document.getElementById('editLocation').value = currentEvent.location || '';
    document.getElementById('editCapacity').value = currentEvent.capacity || 0;
    
    const priceEl = document.getElementById('editPrice');
    if (priceEl) priceEl.value = currentEvent.price || 0;
    
    const endDateEl = document.getElementById('editEndDate');
    if (endDateEl) endDateEl.value = formatDateForInput(currentEvent.endDate);
    
    const timeEl = document.getElementById('editTimeDuration');
    if (timeEl) timeEl.value = currentEvent.timeDuration || '';
    
    const orgNameEl = document.getElementById('editOrgName');
    if (orgNameEl) orgNameEl.value = currentEvent.orgName || '';
    
    const orgEmailEl = document.getElementById('editOrgEmail');
    if (orgEmailEl) orgEmailEl.value = currentEvent.orgEmail || '';
    
    const orgPhoneEl = document.getElementById('editOrgPhone');
    if (orgPhoneEl) orgPhoneEl.value = currentEvent.orgPhone || '';
    
    const imgUrlEl = document.getElementById('editImageUrl');
    const previewImg = document.getElementById('editPreviewImg');
    const placeholder = document.getElementById('editPreviewPlaceholder');
    const clearBtn = document.getElementById('clearEditImageBtn');
    
    if (imgUrlEl) imgUrlEl.value = currentEvent.imageUrl || '';
    
    if (currentEvent.imageUrl) {
        if (previewImg) {
            previewImg.src = currentEvent.imageUrl;
            previewImg.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (clearBtn) clearBtn.style.display = 'block';
    } else {
        if (previewImg) previewImg.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
        if (clearBtn) clearBtn.style.display = 'none';
    }
    
    const reqEl = document.getElementById('editRequirements');
    if (reqEl) reqEl.value = currentEvent.requirements || '';
    
    document.getElementById('editDescription').value = currentEvent.description || '';
    
    const adminNoteEl = document.getElementById('editAdminNote');
    if (adminNoteEl) adminNoteEl.value = currentEvent.adminNote || '';
    
    const statusEl = document.getElementById('editStatus');
    if (statusEl) statusEl.value = currentEvent.status || 'OPEN';

    // Managed Options
    const managedOptions = document.getElementById('editManagedOptions');
    if (managedOptions) {
        managedOptions.style.display = currentEvent.isManaged ? 'block' : 'none';
        if (currentEvent.isManaged) {
            const methodSelect = document.getElementById('editRegistrationMethod');
            if (methodSelect) {
                methodSelect.value = currentEvent.externalLink ? 'external' : 'internal';
                const linkInput = document.getElementById('editExternalLink');
                if (linkInput) linkInput.value = currentEvent.externalLink || '';
                toggleEditRegistrationLink();
            }
        }
    }

    updateEditFormFields(currentEvent.eventType || 'Audition');

    document.getElementById('editModal').style.display = 'flex';
}

function toggleEditRegistrationLink() {
    const methodSelect = document.getElementById('editRegistrationMethod');
    const method = methodSelect ? methodSelect.value : 'internal';
    const linkGroup = document.getElementById('editExternalLinkGroup');
    if (linkGroup) {
        linkGroup.style.display = (method === 'external') ? 'block' : 'none';
    }
}

function updateEditFormFields(type) {
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
    if (document.getElementById('labelEditTitle')) document.getElementById('labelEditTitle').innerText = config.title;
    if (document.getElementById('labelEditDate')) document.getElementById('labelEditDate').innerText = config.date;
    if (document.getElementById('labelEditEndDate')) document.getElementById('labelEditEndDate').innerText = config.endDate;
    if (document.getElementById('labelEditTime')) document.getElementById('labelEditTime').innerText = config.time;
    if (document.getElementById('labelEditPrice')) document.getElementById('labelEditPrice').innerText = config.price;
    if (document.getElementById('labelEditRequirements')) document.getElementById('labelEditRequirements').innerText = config.skills;
    if (document.getElementById('labelEditCapacity')) document.getElementById('labelEditCapacity').innerText = config.capacity;
    if (document.getElementById('labelEditDescription')) document.getElementById('labelEditDescription').innerText = config.desc;

    // Handle visibility
    const endDateGroup = document.getElementById('editEndDateGroup');
    const skillsGroup = document.getElementById('editSkillsGroup');
    const capacityGroup = document.getElementById('editCapacityGroup');
    const priceGroup = document.getElementById('editPriceGroup');

    if (endDateGroup) endDateGroup.style.display = 'block'; 
    if (skillsGroup) skillsGroup.style.display = 'block'; 
    if (capacityGroup) capacityGroup.style.display = 'block';
    if (priceGroup) priceGroup.style.display = 'block';
    
    const adminNoteGroup = document.getElementById('editAdminNoteGroup');
    if (adminNoteGroup) {
        adminNoteGroup.style.display = currentEvent.isManaged ? 'block' : 'none';
    }

    // Specific hiding logic
    if (type === 'Film Event') {
        if (endDateGroup) endDateGroup.style.display = 'none';
    }
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openBroadcastModal() {
    if (allApplicants.filter(a => a.status === 'SHORTLISTED').length === 0) {
        showMessage('No shortlisted applicants to broadcast to.', 'info');
        return;
    }
    
    const type = currentEvent.eventType || 'Event';
    const isAudition = type.toLowerCase() === 'audition';
    
    // Update Modal Title and Text
    const modalTitle = document.querySelector('#broadcastModal h2');
    const modalDesc = document.querySelector('#broadcastModal p b');
    const modalLabels = document.querySelectorAll('#broadcastModal .mgmt-label');
    const submitBtn = document.querySelector('button[onclick="sendBroadcast()"]');
    
    if (modalTitle) modalTitle.innerText = `Broadcast ${type} Details`;
    if (modalDesc) modalDesc.innerText = `all shortlisted applicants`;
    
    if (modalLabels.length >= 3) {
        modalLabels[0].innerText = `${type} Location`;
        modalLabels[1].innerText = `${type} Date`;
        modalLabels[2].innerText = `${type} Time`;
    }
    
    if (submitBtn) submitBtn.innerText = `Send to All Shortlisted`;

    document.getElementById('broadcastModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Pre-fill with event date if available
    if (currentEvent && currentEvent.date) {
        document.getElementById('bcDate').value = formatDateForInput(currentEvent.date);
    }
}

function closeBroadcastModal() {
    document.getElementById('broadcastModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

async function toggleEventStatus() {
    if (!currentEvent) return;
    
    const type = currentEvent.eventType || 'Event';
    const newStatus = currentEvent.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
    const confirmMsg = newStatus === 'CLOSED' ? 
        `Are you sure you want to close this ${type.toLowerCase()}? No more applications will be accepted.` : 
        `Reopen this ${type.toLowerCase()} for new applications?`;
        
    if (!confirm(confirmMsg)) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/events/${currentEventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...currentEvent, status: newStatus })
        });
        
        if (res.ok) {
            showMessage(`${type} ${newStatus === 'CLOSED' ? 'closed' : 'reopened'} successfully!`, 'success');
            fetchEventDetails(); // Refresh UI
        } else {
            showMessage('Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error toggling status:', error);
        showMessage('Connection error', 'error');
    }
}

async function sendBroadcast() {
    const location = document.getElementById('bcLocation').value.trim();
    const date = document.getElementById('bcDate').value;
    const time = document.getElementById('bcTime').value.trim();
    
    if (!location || !date || !time) {
        showMessage(`Please fill in all ${type.toLowerCase()} details`, 'error');
        return;
    }
    
    const btn = document.querySelector('button[onclick="sendBroadcast()"]');
    const originalText = btn.innerText;
    btn.disabled = true;
    btn.innerText = 'Sending...';
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/events/${currentEventId}/broadcast`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, date, time })
        });
        
        if (res.ok) {
            showMessage('Broadcast initiated! Emails and messages are being sent in the background.', 'success');
            setTimeout(closeBroadcastModal, 1000);
        } else {
            const err = await res.text();
            showMessage('Failed to send broadcast: ' + err, 'error');
        }
    } catch (error) {
        console.error('Error sending broadcast:', error);
        showMessage('Connection error', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
}

async function saveEventEdits() {
    console.log('--- Starting Event Edit Save Process ---');
    const btn = document.querySelector('button[onclick="saveEventEdits()"]');
    const originalText = btn ? (btn.innerText || btn.textContent) : 'Save Changes';

    const updatedData = {
        title: document.getElementById('editTitle').value.trim(),
        eventType: document.getElementById('editType').value,
        date: document.getElementById('editDate').value,
        location: document.getElementById('editLocation').value.trim(),
        capacity: parseInt(document.getElementById('editCapacity').value) || 0,
        price: document.getElementById('editPrice') ? parseFloat(document.getElementById('editPrice').value) || 0.0 : (currentEvent.price || 0),
        endDate: document.getElementById('editEndDate') ? (document.getElementById('editEndDate').value || null) : (currentEvent.endDate || null),
        timeDuration: document.getElementById('editTimeDuration') ? document.getElementById('editTimeDuration').value.trim() : (currentEvent.timeDuration || ''),
        orgName: document.getElementById('editOrgName') ? document.getElementById('editOrgName').value.trim() : (currentEvent.orgName || ''),
        orgEmail: document.getElementById('editOrgEmail') ? document.getElementById('editOrgEmail').value.trim() : (currentEvent.orgEmail || ''),
        orgPhone: document.getElementById('editOrgPhone') ? document.getElementById('editOrgPhone').value.trim() : (currentEvent.orgPhone || ''),
        imageUrl: document.getElementById('editImageUrl') ? document.getElementById('editImageUrl').value.trim() : (currentEvent.imageUrl || ''),
        requirements: document.getElementById('editRequirements') ? document.getElementById('editRequirements').value.trim() : (currentEvent.requirements || ''),
        description: document.getElementById('editDescription').value.trim(),
        adminNote: document.getElementById('editAdminNote') ? document.getElementById('editAdminNote').value.trim() : (currentEvent.adminNote || ''),
        status: document.getElementById('editStatus') ? document.getElementById('editStatus').value : (currentEvent.status || 'OPEN'),
        externalLink: (currentEvent.isManaged && document.getElementById('editRegistrationMethod').value === 'external') ? document.getElementById('editExternalLink').value.trim() : null
    };

    console.log('DEBUG: updatedData isManaged:', currentEvent.isManaged);
    console.log('DEBUG: updatedData externalLink:', updatedData.externalLink);
    console.log('DEBUG: Full updatedData Payload:', updatedData);

    if (btn) {
        btn.disabled = true;
        btn.innerText = 'Saving...';
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/events/${currentEventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedData)
        });

        if (res.ok) {
            const savedEvent = await res.json();
            console.log('Event updated successfully:', savedEvent);
            showMessage('Event updated successfully', 'success');
            
            setTimeout(() => {
                closeEditModal();
                currentEvent = savedEvent;
                fetchEventDetails();
                
                const idx = eventsCache.findIndex(e => e.id == currentEventId);
                if (idx > -1) eventsCache[idx] = currentEvent;
            }, 800);
            
        } else {
            const errorText = await res.text();
            console.error('Server error saving event:', errorText);
            showMessage('Failed to update event: ' + errorText, 'error');
            alert('SERVER ERROR: ' + errorText);
        }
    } catch (error) {
        console.error('Error saving edits:', error);
        showMessage('Connection error', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = originalText;
        }
    }
}

function filterApplicants(query) {
    query = query.toLowerCase();
    filteredApplicants = allApplicants.filter(app => 
        (app.applicantName || '').toLowerCase().includes(query) || 
        (app.applicantEmail || '').toLowerCase().includes(query) ||
        (app.role || '').toLowerCase().includes(query) ||
        (app.teamName || '').toLowerCase().includes(query) ||
        (app.shortFilmTitle || '').toLowerCase().includes(query)
    );
    renderApplicantsTable();
}

function openApplicantDetailModal(appId) {
    const app = allApplicants.find(a => a.id == appId);
    if (!app) return;

    const modal = document.getElementById('applicantDetailModal');
    const isContest = (currentEvent.eventType || '').toLowerCase() === 'contest';
    const isAudition = (currentEvent.eventType || '').toLowerCase() === 'audition';
    
    // Header
    document.getElementById('detName').innerText = app.applicantName || 'Unknown';
    document.getElementById('detEmail').innerText = app.applicantEmail || '';
    const avatar = document.getElementById('detAvatar');
    avatar.innerText = (app.applicantName || '?').charAt(0).toUpperCase();

    // Basic Info
    document.getElementById('detPhone').innerText = app.mobileNumber || '-';
    document.getElementById('detLocation').innerText = app.location || '-';
    
    // Audition specific (Hide for contests)
    document.getElementById('detAgeGroup').style.display = isAudition ? 'block' : 'none';
    document.getElementById('detHeightGroup').style.display = isAudition ? 'block' : 'none';
    document.getElementById('detRoleGroup').style.display = (isAudition && app.role) ? 'block' : 'none';
    
    if (isAudition) {
        document.getElementById('detAge').innerText = app.age || '-';
        document.getElementById('detHeight').innerText = app.height || '-';
        document.getElementById('detRole').innerText = app.role || '-';
    }

    // Contest specific
    const contestGroup = document.getElementById('detContestGroup');
    contestGroup.style.display = isContest ? 'block' : 'none';
    if (isContest) {
        document.getElementById('detFilmTitle').innerText = app.shortFilmTitle || '-';
        document.getElementById('detTeamName').innerText = app.teamName || '-';
        const filmLink = document.getElementById('detFilmLink');
        if (app.portfolioLink) {
            filmLink.innerText = "Watch Film Submission";
            filmLink.href = app.portfolioLink;
            filmLink.style.color = "#2563eb";
        } else {
            filmLink.innerText = "No link provided";
            filmLink.href = "#";
            filmLink.style.color = "#94a3b8";
        }
    }

    // Photos (Strictly hide for contests)
    const photoGroup = document.getElementById('detPhotoGroup');
    const photoGrid = document.getElementById('detPhotoGrid');
    photoGrid.innerHTML = '';
    const photos = [app.photo1, app.photo2, app.photo3].filter(p => p && p.trim() !== '');
    
    if (!isContest && photos.length > 0) {
        photoGroup.style.display = 'block';
        photos.forEach(p => {
            const img = document.createElement('img');
            img.src = p;
            img.style.width = '100%';
            img.style.aspectRatio = '3/4';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '12px';
            img.onclick = () => openBase64InNewTab(p);
            img.style.cursor = 'pointer';
            img.title = "Click to view full image";
            photoGrid.appendChild(img);
        });
    } else {
        photoGroup.style.display = 'none';
    }

    // Resume
    const resumeGroup = document.getElementById('detResumeGroup');
    const resumeLink = document.getElementById('detResumeLink');
    
    // Always clear the old click handler first to prevent opening the previous applicant's resume/photo
    resumeLink.onclick = null;

    if (!isContest && app.resumeUrl) {
        resumeGroup.style.display = 'block';
        resumeLink.href = app.resumeUrl;
        
        // Add a visual indicator if the resume is actually an image (which might be the case if uploaded incorrectly)
        const isImageResume = app.resumeUrl.startsWith('data:image/');
        if (isImageResume) {
            resumeLink.innerHTML = '<i class="fas fa-image" style="color: #f59e0b; font-size: 18px;"></i> View Resume (Image Format)';
        } else {
            resumeLink.innerHTML = '<i class="fas fa-file-pdf" style="color: #ef4444; font-size: 18px;"></i> View Resume / Portfolio';
        }

        // Use a clean, fresh handler for the current applicant's resume
        const currentResumeData = app.resumeUrl;
        const currentResumeName = app.resumeFileName;
        resumeLink.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openBase64InNewTab(currentResumeData, 'application/pdf', currentResumeName);
        };
    } else {
        resumeGroup.style.display = 'none';
        resumeLink.href = "#";
    }

    // Video / Portfolio Link
    const videoGroup = document.getElementById('detVideoGroup');
    const videoLink = document.getElementById('detVideoLink');
    const portLink = app.portfolioLink || app.videoUrl;

    if (portLink && portLink.length > 5) {
        videoGroup.style.display = 'block';
        videoLink.href = portLink;
        videoLink.onclick = (e) => {
            e.preventDefault();
            window.open(portLink, '_blank');
        };
    } else {
        videoGroup.style.display = 'none';
    }

    // Notes
    document.getElementById('detNotes').innerText = app.additionalNote || app.experience || 'No additional notes provided.';

    // Action Buttons
    const shortlistBtn = document.getElementById('detShortlistBtn');
    const rejectBtn = document.getElementById('detRejectBtn');
    
    shortlistBtn.onclick = () => { updateAppStatus(app.id, 'SHORTLISTED'); closeApplicantDetailModal(); };
    rejectBtn.onclick = () => { updateAppStatus(app.id, 'REJECTED'); closeApplicantDetailModal(); };

    modal.style.display = 'flex';
}

function closeApplicantDetailModal() {
    document.getElementById('applicantDetailModal').style.display = 'none';
}

async function updateAppStatus(applicationId, newStatus) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/events/applications/${applicationId}/status?status=${newStatus}`, {
            method: 'PATCH'
        });
        if (res.ok) {
            showMessage(`Applicant ${newStatus.toLowerCase()} successfully`, 'success');
            const appIndex = allApplicants.findIndex(a => a.id === applicationId);
            if (appIndex > -1) {
                allApplicants[appIndex].status = newStatus;
                filteredApplicants = [...allApplicants];
                renderApplicantsTable();
                updateStats();
            }
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

async function deleteEvent(eventId) {
    if (confirm('Are you sure you want to delete this event?')) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/events/${eventId}`, { method: 'DELETE' });
            if (res.ok) {
                showMessage('Event deleted successfully', 'success');
                setTimeout(() => {
                    window.location.href = 'event-dashboard.html';
                }, 1000);
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    }
}

function exportApplicantsData() {
    if (allApplicants.length === 0) {
        showMessage('No data to export', 'info');
        return;
    }

    const headers = ['Name', 'Email', 'Role', 'Experience', 'Location', 'Status', 'Applied At'];
    const rows = allApplicants.map(app => [
        app.applicantName || '',
        app.applicantEmail || '',
        app.role || '',
        app.experience || '',
        app.location || '',
        app.status,
        app.appliedAt ? new Date(app.appliedAt).toLocaleString() : ''
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `applicants_${currentEvent?.title?.replace(/\s+/g, '_') || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function loadCurrentUser() {
    const userId = getCurrentUserId();
    if (!userId) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/${userId}`);
        if (response.ok) {
            currentUser = await response.json();
            const picEle = document.getElementById('userAvatarSmall');
            if (picEle && currentUser.profilePicture) {
                picEle.src = currentUser.profilePicture;
                picEle.style.display = 'block';
                
                // Hide initials
                const initialsEle = document.getElementById('userInitialsSmall');
                if (initialsEle) initialsEle.style.display = 'none';
                
                // Update localStorage
                localStorage.setItem('userAvatar', currentUser.profilePicture);
            }
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

async function manualCheckIn(applicationId) {
    if (!confirm('Manually mark this applicant as attended?')) return;
    
    try {
        const app = allApplicants.find(a => a.id === applicationId);
        if (!app || !app.passToken) {
            showMessage('Error: No pass token generated yet. Applicant must be shortlisted first.', 'error');
            return;
        }

        const res = await fetch(`${API_BASE_URL}/api/events/pass/validate?token=${app.passToken}`, {
            method: 'POST'
        });

        if (res.ok) {
            showMessage('Check-in successful!', 'success');
            const appIndex = allApplicants.findIndex(a => a.id === applicationId);
            if (appIndex > -1) {
                allApplicants[appIndex].scanned = true;
                filteredApplicants = [...allApplicants];
                renderApplicantsTable();
            }
        } else {
            const err = await res.text();
            showMessage(`Check-in failed: ${err}`, 'error');
        }
    } catch (e) {
        console.error(e);
        showMessage('Connection error during check-in', 'error');
    }
}

// CC-MAY-2026: Image Upload Handlers for Dashboard [Nelpatla Venkatesh]
async function handleEditImageUpload(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        try {
            const previewImg = document.getElementById('editPreviewImg');
            const placeholder = document.getElementById('editPreviewPlaceholder');
            const clearBtn = document.getElementById('clearEditImageBtn');
            const urlInput = document.getElementById('editImageUrl');
            
            if (placeholder) placeholder.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Processing...</p>';
            
            const base64 = await uploadImage(file);
            
            if (base64) {
                if (previewImg) {
                    previewImg.src = base64;
                    previewImg.style.display = 'block';
                }
                if (placeholder) placeholder.style.display = 'none';
                if (clearBtn) clearBtn.style.display = 'block';
                if (urlInput) urlInput.value = base64;
            }
        } catch (err) {
            console.error('Image upload failed:', err);
            showMessage('Failed to process image. Please try another.', 'error');
        } finally {
            const placeholder = document.getElementById('editPreviewPlaceholder');
            if (placeholder && placeholder.style.display !== 'none') {
                placeholder.innerHTML = '<i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 5px;"></i><p style="font-size: 11px; font-weight: 600;">Click to change banner</p>';
            }
        }
    }
}

function clearEditImage() {
    const previewImg = document.getElementById('editPreviewImg');
    const placeholder = document.getElementById('editPreviewPlaceholder');
    const clearBtn = document.getElementById('clearEditImageBtn');
    const urlInput = document.getElementById('editImageUrl');
    const fileInput = document.getElementById('editImageInput');
    
    if (previewImg) {
        previewImg.src = '';
        previewImg.style.display = 'none';
    }
    if (placeholder) {
        placeholder.style.display = 'block';
        placeholder.innerHTML = '<i class="fas fa-cloud-upload-alt" style="font-size: 24px; margin-bottom: 5px;"></i><p style="font-size: 11px; font-weight: 600;">Click to change banner</p>';
    }
    if (clearBtn) clearBtn.style.display = 'none';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
}
