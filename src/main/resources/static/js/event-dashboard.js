// Event Dashboard & Application Management
let currentEventId = null;
let currentEvent = null;
let allApplicants = [];
let filteredApplicants = [];

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentEventId = urlParams.get('id');

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
        const res = await fetch(`${API_BASE_URL}/api/events/user/${userId}`);
        if (res.ok) {
            const events = await res.json();
            renderEventList(events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

function renderEventList(events) {
    const list = document.getElementById('eventList');
    if (events.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding: 50px; color: #94a3b8;">You haven\'t created any events yet.</div>';
        return;
    }

    list.innerHTML = events.map(event => `
        <div class="event-card">
            <div class="event-info">
                <h3>${event.title}</h3>
                <div class="event-details">
                    <div><b>Type:</b> ${event.eventType}</div>
                    <div><b>Date:</b> ${formatDate(event.date || event.startDate)}</div>
                    <div><b>Location:</b> ${event.location}</div>
                    <div><b>Applicants:</b> ${event.applicants || 0}</div>
                    <div style="margin-top:10px; color: #64748b;">${event.description || ''}</div>
                </div>
            </div>
            <div class="event-actions">
                <button class="manage-btn" onclick="window.location.href='event-dashboard.html?id=${event.id}'">Manage Applications</button>
                <button class="delete-btn" onclick="deleteEvent(${event.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

async function showManagementView() {
    document.getElementById('listView').style.display = 'none';
    document.getElementById('mgmtView').style.display = 'block';

    try {
        console.log(`Loading management view for event: ${currentEventId}`);
        
        // Load Event Details
        const eventRes = await fetch(`${API_BASE_URL}/api/events/${currentEventId}`);
        if (eventRes.ok) {
            currentEvent = await eventRes.json();
            document.getElementById('mgmtEventTitle').innerText = currentEvent.title;
        }

        // Load Applicants
        const applicantsRes = await fetch(`${API_BASE_URL}/api/events/${currentEventId}/applicants`);
        if (applicantsRes.ok) {
            const rawApplicants = await applicantsRes.json();
            console.log(`Fetched ${rawApplicants.length} raw applicants:`, rawApplicants);
            
            // Enrich with user details
            allApplicants = await Promise.all(rawApplicants.map(async (app) => {
                try {
                    const user = await getUserProfile(app.userId);
                    return { ...app, user: user || { name: 'Unknown User', email: 'N/A' } };
                } catch (e) {
                    console.error(`Failed to enrich applicant ${app.id}:`, e);
                    return { ...app, user: { name: 'Error Loading', email: 'N/A' } };
                }
            }));
            
            filteredApplicants = [...allApplicants];
            renderApplicantsTable();
            updateStats();
        } else {
            const errorText = await applicantsRes.text();
            console.error('Server error fetching applicants:', errorText);
            // If the server returned an error starting with "Error:", use that message directly
            const cleanError = errorText.startsWith('Error:') ? errorText : `Server returned ${applicantsRes.status}: ${errorText}`;
            showMessage(`Error loading applicants: ${cleanError}`, 'error');
            renderApplicantsTable(); 
        }
    } catch (error) {
        console.error('Network or parsing error:', error);
        showMessage('Network error or server is down. Please try again.', 'error');
    }
}

function renderApplicantsTable() {
    const body = document.getElementById('applicantsBody');
    if (filteredApplicants.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px; color:#94a3b8;">No applicants found.</td></tr>';
        return;
    }

    body.innerHTML = filteredApplicants.map(app => `
        <tr>
            <td data-label="Name">
                <div class="applicant-info">
                    <div class="name">${app.user?.name || 'Unknown'}</div>
                    <div class="email">${app.user?.email || ''}</div>
                </div>
            </td>
            <td data-label="Role">${app.user?.role || '-'}</td>
            <td data-label="Experience">${app.user?.experience || '-'}</td>
            <td data-label="Location">${app.user?.location || '-'}</td>
            <td data-label="Status">
                <span class="status-badge status-${(app.status || 'PENDING').toLowerCase()}">${app.status || 'PENDING'}</span>
            </td>
            <td data-label="Actions">
                <div class="action-icons">
                    <button class="icon-btn btn-check" onclick="updateAppStatus(${app.id}, 'SHORTLISTED')" title="Shortlist">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="icon-btn btn-cross" onclick="updateAppStatus(${app.id}, 'REJECTED')" title="Reject">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    const total = allApplicants.length;
    const shortlisted = allApplicants.filter(a => a.status === 'SHORTLISTED').length;
    const pending = allApplicants.filter(a => a.status === 'PENDING').length;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statShortlisted').innerText = shortlisted;
    document.getElementById('statPending').innerText = pending;
}

function filterApplicants(query) {
    query = query.toLowerCase();
    filteredApplicants = allApplicants.filter(app => 
        (app.user?.name || '').toLowerCase().includes(query) || 
        (app.user?.email || '').toLowerCase().includes(query) ||
        (app.user?.role || '').toLowerCase().includes(query)
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
            // Update local state and re-render
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
                showMessage('Event deleted', 'success');
                showListView();
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
        app.user?.name || '',
        app.user?.email || '',
        app.user?.role || '',
        app.user?.experience || '',
        app.user?.location || '',
        app.status,
        new Date(app.appliedAt).toLocaleString()
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `applicants_${currentEvent.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('Data exported to CSV', 'success');
}
