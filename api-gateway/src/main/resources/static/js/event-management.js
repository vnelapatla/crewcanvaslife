/**
 * Event Management Logic
 * Handles applicant tracking and status updates.
 */

const EventManagement = {
    applicants: [
        { id: 101, name: "Arjun Reddy", role: "Protagonist", exp: "5 Years", loc: "Mumbai", status: "shortlisted" },
        { id: 102, name: "Priya Sharma", role: "Antagonist", exp: "3 Years", loc: "Delhi", status: "pending" },
        { id: 103, name: "Rahul Verma", role: "DOP", exp: "8 Years", loc: "Bangalore", status: "pending" },
        { id: 104, name: "Sneha Kapur", role: "Lead", exp: "2 Years", loc: "Mumbai", status: "rejected" }
    ],

    init() {
        this.render();
    },

    render() {
        const tbody = document.getElementById('applicant-tbody');
        if (!tbody) return;

        tbody.innerHTML = this.applicants.map(app => `
            <tr>
                <td><b>${app.name}</b></td>
                <td>${app.role}</td>
                <td>${app.exp}</td>
                <td>${app.loc}</td>
                <td><span class="status-badge status-${app.status}">${app.status.toUpperCase()}</span></td>
                <td class="action-btns">
                    <span class="action-icon" onclick="EventManagement.updateStatus(${app.id}, 'shortlisted')">✅</span>
                    <span class="action-icon" onclick="EventManagement.updateStatus(${app.id}, 'rejected')">❌</span>
                </td>
            </tr>
        `).join('');
    },

    updateStatus(id, newStatus) {
        const app = this.applicants.find(a => a.id === id);
        if (app) {
            app.status = newStatus;
            this.render();
            showMessage(`Status updated for ${app.name}`, 'success');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => EventManagement.init());
