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

    list.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-image-sm" style="width: 80px; height: 80px; border-radius: 12px; overflow: hidden; flex-shrink: 0;">
                <img src="${event.imageUrl || getEventDefaultImage(event.eventType)}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="event-info">
                <h3>${event.title}</h3>
                <div class="event-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; background: #f8fafc; padding: 12px; border-radius: 12px; font-size: 13px;">
                    <div><b style="width: auto;">Type:</b> ${event.eventType}</div>
                    <div><b style="width: auto;">Date:</b> ${formatDate(event.date || event.startDate)}${event.endDate ? ` to ${formatDate(event.endDate)}` : ''}</div>
                    <div><b style="width: auto;">Loc:</b> ${event.location}</div>
                    <div><b style="width: auto;">Price:</b> ${event.price === 0 ? 'Free' : `₹${event.price || 0}`}</div>
                    <div><b style="width: auto;">Seats:</b> ${event.capacity || 'Unlimited'}</div>
                    <div><i class="fas fa-users"></i> ${event.applicants || 0} Registered</div>
                    <div style="grid-column: span 2; margin-top:2px; color: #64748b; font-size: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"><b>Desc:</b> ${event.description || ''}</div>
                </div>
            <div class="event-actions">
                <button class="manage-btn" onclick="window.location.href='event-dashboard.html?id=${event.id}'">Manage Applications</button>
                <button class="manage-btn" style="background: #f1f5f9; color: #64748b; margin-top: 8px;" onclick="shareContent('event', ${event.id}, '${event.title.replace(/'/g, "\\'")}')">
                    <i class="fas fa-share-alt"></i> Share Link
                </button>
                <button class="delete-btn" onclick="deleteEvent(${event.id})">Delete</button>
            </div>
        </div>
    `).join('');
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
}

async function showManagementView() {
    document.getElementById('listView').style.display = 'none';
    document.getElementById('mgmtView').style.display = 'block';

    try {
        await fetchEventDetails();
        
        // Load Applicants
        const applicantsRes = await fetch(`${API_BASE_URL}/api/events/${currentEventId}/applicants`);
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
    if (!body) return;

    if (filteredApplicants.length === 0) {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px; color:#94a3b8;">No applicants found.</td></tr>';
        return;
    }

    body.innerHTML = filteredApplicants.map((app, index) => {
        const isLowCompleteness = app.matchScore < -2000;
        const rankLabel = isLowCompleteness ? 'NEXT ORDER' : `#${index + 1} MATCH`;
        const rankColor = isLowCompleteness ? '#94a3b8' : '#ff8c00';

        return `
            <tr>
                <td data-label="Rank">
                    <div style="width:32px; height:32px; background:${rankColor}; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:11px;">
                        ${isLowCompleteness ? '!' : index + 1}
                    </div>
                    <div style="font-size:9px; color:${rankColor}; font-weight:800; margin-top:4px;">${rankLabel}</div>
                </td>
                <td data-label="Name">
                    <div class="applicant-info">
                        <div class="name">${app.applicantName || 'Unknown'}</div>
                        <div class="email">${app.applicantEmail || ''}</div>
                    </div>
                </td>
                <td data-label="Role">${app.role || '-'}</td>
                <td data-label="Experience">${app.experience || '-'}</td>
                <td data-label="Location">${app.location || '-'}</td>
                <td data-label="Status">
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <span class="status-badge status-${(app.status || 'PENDING').toLowerCase()}">${(app.status || 'PENDING') === 'PENDING' ? 'REGISTERED' : app.status.replace('_', ' ')}</span>
                        ${app.scanned ? '<span style="font-size:10px; color:#10b981; font-weight:700;"><i class="fas fa-check-double"></i> SCANNED</span>' : ''}
                    </div>
                </td>
                <td data-label="Actions">
                    <div class="action-icons">
                        <button class="icon-btn" onclick="window.location.href='profile.html?userId=${app.userId}'" title="View Profile" style="background:#e0e7ff; color:#4338ca; border: 1px solid #c7d2fe; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-user" style="font-size: 12px;"></i>
                        </button>
                        <button class="icon-btn" onclick="window.location.href='messages.html?userId=${app.userId}&from=applicant'" title="Message" style="background:#fef3c7; color:#d97706; border: 1px solid #fde68a; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-comment" style="font-size: 12px;"></i>
                        </button>
                        
                        ${app.status === 'PENDING' ? `
                            <button class="icon-btn btn-check" onclick="updateAppStatus(${app.id}, 'SHORTLISTED')" title="Shortlist">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}

                        ${app.status === 'SHORTLISTED' && ['audition', 'contest'].includes((currentEvent.eventType || '').toLowerCase()) ? `
                            <button class="icon-btn" onclick="updateAppStatus(${app.id}, 'SELECTED')" title="Final Select" style="background:#dcfce7; color:#16a34a; border: 1px solid #bbf7d0;">
                                <i class="fas fa-trophy"></i>
                            </button>
                            <button class="icon-btn" onclick="updateAppStatus(${app.id}, 'NOT_SELECTED')" title="Final Reject" style="background:#fee2e2; color:#ef4444; border: 1px solid #fecaca;">
                                <i class="fas fa-user-minus"></i>
                            </button>
                        ` : ''}

                        ${!app.scanned && app.status === 'SHORTLISTED' && currentEvent.eventType === 'Film Event' ? `
                            <button class="icon-btn" onclick="manualCheckIn(${app.id})" title="Manual Check-in" style="background:#dcfce7; color:#166534; border: 1px solid #bbf7d0;">
                                <i class="fas fa-qrcode"></i>
                            </button>
                        ` : ''}
                        
                        ${app.status === 'PENDING' ? `
                            <button class="icon-btn btn-cross" onclick="updateAppStatus(${app.id}, 'REJECTED')" title="Reject">
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
    if (imgUrlEl) imgUrlEl.value = currentEvent.imageUrl || '';
    
    const reqEl = document.getElementById('editRequirements');
    if (reqEl) reqEl.value = currentEvent.requirements || '';
    
    document.getElementById('editDescription').value = currentEvent.description || '';
    
    const statusEl = document.getElementById('editStatus');
    if (statusEl) statusEl.value = currentEvent.status || 'OPEN';

    document.getElementById('editModal').style.display = 'flex';
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
        status: document.getElementById('editStatus') ? document.getElementById('editStatus').value : (currentEvent.status || 'OPEN')
    };

    console.log('Updated Event Payload:', updatedData);

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
        (app.role || '').toLowerCase().includes(query)
    );
    renderApplicantsTable();
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
