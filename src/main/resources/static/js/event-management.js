/**
 * Event Management Logic
 * Handles applicant tracking and status updates.
 */

const EventManagement = {
    applicants: [],
    eventId: new URLSearchParams(window.location.search).get('id'),

    async init() {
        if (!this.eventId) {
            showMessage('No event ID specified', 'error');
            return;
        }
        await this.loadEventDetails();
        await this.loadApplicants();
    },

    async loadEventDetails() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events/${this.eventId}`);
            if (response.ok) {
                const event = await response.json();
                document.getElementById('eventTitleDisplay').innerText = event.title;
                document.getElementById('totalApplicants').innerText = event.applicants || 0;
            }
        } catch (error) {
            console.error('Error loading event:', error);
        }
    },

    async loadApplicants() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events/${this.eventId}/applicants`);
            if (response.ok) {
                this.applicants = await response.json();
                this.updateCounts();
                this.render();
            }
        } catch (error) {
            console.error('Error loading applicants:', error);
            showMessage('Error loading applicants', 'error');
        }
    },

    updateCounts() {
        const shortlisted = this.applicants.filter(a => a.status === 'shortlisted').length;
        const pending = this.applicants.filter(a => a.status === 'pending').length;
        
        document.getElementById('shortlistedCount').innerText = shortlisted;
        document.getElementById('pendingCount').innerText = pending;
    },

    render(data = this.applicants) {
        const tbody = document.getElementById('applicant-tbody');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #888;">No applications found.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(app => `
            <tr>
                <td data-label="Name"><b>${app.applicantName || 'Unknown User'}</b><br><small style="color:#888">${app.applicantEmail || ''}</small></td>
                <td data-label="Role">${app.role || '-'}</td>
                <td data-label="Experience"><div style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${app.experience || ''}">${app.experience || '-'}</div></td>
                <td data-label="Location">${app.location || '-'}</td>
                <td data-label="Status"><span class="status-badge status-${app.status || 'pending'}">${(app.status || 'pending').toUpperCase()}</span></td>
                <td data-label="Actions" class="action-btns">
                    <button class="btn-action" title="Shortlist" onclick="EventManagement.updateStatus(${app.id}, 'shortlisted')">✅</button>
                    <button class="btn-action" title="Reject" onclick="EventManagement.updateStatus(${app.id}, 'rejected')">❌</button>
                </td>
            </tr>
        `).join('');
    },

    filterApplicants(query) {
        const q = query.toLowerCase();
        const filtered = this.applicants.filter(app => 
            (app.applicantName && app.applicantName.toLowerCase().includes(q)) || 
            (app.applicantEmail && app.applicantEmail.toLowerCase().includes(q)) ||
            (app.role && app.role.toLowerCase().includes(q)) ||
            (app.location && app.location.toLowerCase().includes(q))
        );
        this.render(filtered);
    },

    exportCSV() {
        console.log('[EventManagement] Exporting CSV for event:', this.eventId);
        console.log('[EventManagement] Applicants data:', this.applicants);

        if (!this.applicants || this.applicants.length === 0) {
            console.warn('[EventManagement] No applicants to export.');
            showMessage('No data to export', 'info');
            return;
        }

        const headers = ['Name', 'Email', 'Role', 'Experience', 'Location', 'Status', 'Applied At'];
        
        // Helper to escape CSV values
        const escapeCSV = (val) => {
            if (val === null || val === undefined) return '""';
            const s = String(val).replace(/"/g, '""');
            return `"${s}"`;
        };

        try {
            const rows = this.applicants.map(app => [
                escapeCSV(app.applicantName),
                escapeCSV(app.applicantEmail),
                escapeCSV(app.role),
                escapeCSV(app.experience),
                escapeCSV(app.location),
                escapeCSV(app.status),
                escapeCSV(app.appliedAt)
            ]);

            const csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
            
            console.log('[EventManagement] CSV Content size:', csvContent.length);

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `applicants_event_${this.eventId}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            
            // Small delay before cleanup to ensure trigger
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                console.log('[EventManagement] Export link cleaned up.');
            }, 100);

            showMessage('Data exported successfully', 'success');
        } catch (err) {
            console.error('[EventManagement] Export Failed:', err);
            // Fallback to data URI if Blob fails
            try {
                const headers = ['Name', 'Email', 'Role', 'Experience', 'Location', 'Status', 'Applied At'];
                const rows = this.applicants.map(app => [app.applicantName, app.applicantEmail, app.role, '', app.location, app.status]);
                const csvString = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
                const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvString);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "applicants_export_fallback.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showMessage('Exported via fallback method', 'info');
            } catch (fallbackErr) {
                showMessage('Export failed. Check console for details.', 'error');
            }
        }
    },

    async updateStatus(id, newStatus) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/events/application/${id}/status?status=${newStatus}`, {
                method: 'PUT'
            });

            if (response.ok) {
                const updatedApp = await response.json();
                const index = this.applicants.findIndex(a => a.id === id);
                if (index !== -1) {
                    this.applicants[index] = updatedApp;
                    this.updateCounts();
                    this.render();
                    showMessage(`Status updated to ${newStatus}`, 'success');
                }
            } else {
                showMessage('Error updating status', 'error');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            showMessage('Error updating status', 'error');
        }
    }
};

// Global aliases for HTML event handlers
window.filterApplicants = (val) => EventManagement.filterApplicants(val);
window.exportCSV = () => EventManagement.exportCSV();

document.addEventListener('DOMContentLoaded', () => EventManagement.init());
