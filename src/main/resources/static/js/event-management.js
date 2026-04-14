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

    render() {
        const tbody = document.getElementById('applicant-tbody');
        if (!tbody) return;

        if (this.applicants.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 40px; color: #888;">No applications yet.</td></tr>';
            return;
        }

        tbody.innerHTML = this.applicants.map(app => `
            <tr>
                <td><b>${app.applicantName}</b><br><small style="color:#888">${app.applicantEmail || ''}</small></td>
                <td>${app.role || '-'}</td>
                <td>${app.experience || '-'}</td>
                <td>${app.location || '-'}</td>
                <td><span class="status-badge status-${app.status}">${app.status.toUpperCase()}</span></td>
                <td class="action-btns">
                    <button class="btn-action" title="Shortlist" onclick="EventManagement.updateStatus(${app.id}, 'shortlisted')">✅</button>
                    <button class="btn-action" title="Reject" onclick="EventManagement.updateStatus(${app.id}, 'rejected')">❌</button>
                </td>
            </tr>
        `).join('');
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

document.addEventListener('DOMContentLoaded', () => EventManagement.init());
