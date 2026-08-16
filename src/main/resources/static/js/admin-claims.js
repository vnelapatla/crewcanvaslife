// Admin Profile Claims Management Script
let currentClaimFilter = 'ALL';
let claimProfiles = [];

document.addEventListener("DOMContentLoaded", function() {
    fetchClaimMetrics();
    fetchClaimProfiles();
});

function getApiBaseUrl() {
    return (typeof API_BASE_URL !== 'undefined') ? API_BASE_URL : '';
}

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

async function fetchClaimMetrics() {
    try {
        const res = await fetch(`${getApiBaseUrl()}/api/admin/profile-claims/metrics`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const data = await res.json();
            if (document.getElementById('metricUnclaimed')) document.getElementById('metricUnclaimed').innerText = data.unclaimedCount || 0;
            if (document.getElementById('metricInvited')) document.getElementById('metricInvited').innerText = data.invitedCount || 0;
            if (document.getElementById('metricClaimed')) document.getElementById('metricClaimed').innerText = data.claimedCount || 0;
            if (document.getElementById('metricConversion')) document.getElementById('metricConversion').innerText = (data.conversionRate || 0) + '%';
        }
    } catch (e) {
        console.error("Failed to fetch claim metrics:", e);
    }
}

async function fetchClaimProfiles() {
    try {
        const res = await fetch(`${getApiBaseUrl()}/api/admin/profile-claims?status=${currentClaimFilter}`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            claimProfiles = await res.json();
            renderClaimTable(claimProfiles);
        }
    } catch (e) {
        console.error("Failed to fetch claim profiles:", e);
    }
}

function filterClaims(status, btn) {
    currentClaimFilter = status;
    document.querySelectorAll('.claim-filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    fetchClaimProfiles();
}

function renderClaimTable(profiles) {
    const tbody = document.getElementById('claimTableBody');
    if (!tbody) return;

    if (!profiles || profiles.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 30px;">No profiles found for current filter.</td></tr>`;
        return;
    }

    tbody.innerHTML = profiles.map(p => {
        const status = p.claimStatus || 'CLAIMED';
        const isClaimed = status === 'CLAIMED';
        const statusBadgeClass = isClaimed ? 'badge-claimed' : (status === 'INVITED' ? 'badge-invited' : 'badge-unclaimed');
        
        return `
            <tr>
                <td style="font-weight: 700; color: #1e293b;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 14px; color: var(--primary-orange);">
                            ${p.profilePicture ? `<img src="${p.profilePicture}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">` : `<i class="fas fa-user"></i>`}
                        </div>
                        <span>${p.name || 'Untitled'}</span>
                    </div>
                </td>
                <td>${p.role || p.userType || 'Actor'}</td>
                <td><span class="status-badge ${statusBadgeClass}">${status}</span></td>
                <td>${p.phone || 'Not Provided'}</td>
                <td>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        ${!isClaimed ? `
                            <button onclick="generateAndCopyClaimLink(${p.id}, '${(p.phone || '').replace(/'/g, "\\'")}')" class="btn-action-sm" title="Generate/Copy Claim Link">
                                <i class="fas fa-link"></i> Link
                            </button>
                            <button onclick="sendWhatsAppClaim(${p.id}, '${(p.name || '').replace(/'/g, "\\'")}', '${(p.phone || '').replace(/'/g, "\\'")}')" class="btn-action-sm btn-wa" title="Send via WhatsApp">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </button>
                        ` : `<span style="font-size: 12px; color: #10b981; font-weight: 700;"><i class="fas fa-check-circle"></i> Active</span>`}
                        <button onclick="viewClaimActivity(${p.id}, '${(p.name || '').replace(/'/g, "\\'")}')" class="btn-action-sm" style="background: #f1f5f9; color: #475569;" title="View Audit Log">
                            <i class="fas fa-history"></i> Log
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

async function openCreateUnclaimedModal() {
    const modal = document.getElementById('createUnclaimedModal');
    if (modal) modal.style.display = 'flex';
}

function closeCreateUnclaimedModal() {
    const modal = document.getElementById('createUnclaimedModal');
    if (modal) modal.style.display = 'none';
}

async function submitUnclaimedProfile() {
    const getValue = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    const name = getValue('unclaimedName');
    const role = getValue('unclaimedRole');
    const phone = getValue('unclaimedPhone');
    const email = getValue('unclaimedEmail');
    const location = getValue('unclaimedLocation');
    const profilePicture = getValue('unclaimedProfilePicture');
    const resume = getValue('unclaimedResume');
    const showreel = getValue('unclaimedShowreel');

    const userType = getValue('unclaimedUserType');
    const experience = getValue('unclaimedExperience');
    const height = getValue('unclaimedHeight');
    const weight = getValue('unclaimedWeight');
    const ageRange = getValue('unclaimedAgeRange');
    const gender = getValue('unclaimedGender');
    const bodyType = getValue('unclaimedBodyType');
    const languages = getValue('unclaimedLanguages');

    const cameraExpertise = getValue('unclaimedCameraExpertise');
    const editingSoftware = getValue('unclaimedEditingSoftware');
    const daws = getValue('unclaimedDaws');
    const genres = getValue('unclaimedGenres');
    const skills = getValue('unclaimedSkills');
    const bio = getValue('unclaimedBio');

    const recentPictures = getValue('unclaimedRecentPictures');
    const portfolioVideos = getValue('unclaimedPortfolioVideos');

    const instagram = getValue('unclaimedInstagram');
    const youtube = getValue('unclaimedYoutube');
    const tiktok = getValue('unclaimedTiktok');
    const twitter = getValue('unclaimedTwitter');

    const expectedMovieRemuneration = getValue('unclaimedExpectedMovieRemuneration');
    const expectedWebseriesRemuneration = getValue('unclaimedExpectedWebseriesRemuneration');

    if (!name) {
        alert("Please enter actor/member name.");
        return;
    }

    try {
        const headers = getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        const res = await fetch(`${getApiBaseUrl()}/api/admin/profile-claims/create`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                name, role, phone, email, location, bio,
                profilePicture, resume, showreel, userType, experience,
                height, weight, ageRange, gender, bodyType, languages,
                cameraExpertise, editingSoftware, daws, genres, skills,
                recentPictures, portfolioVideos,
                instagram, youtube, tiktok, twitter,
                expectedMovieRemuneration, expectedWebseriesRemuneration
            })
        });

        const data = await res.json();
        if (res.ok) {
            const finalLink = formatClaimLink(data.claimLink);
            alert("✨ Success! 100% Full Unclaimed Profile created.\n\nClaim Link Generated:\n" + finalLink);
            closeCreateUnclaimedModal();
            fetchClaimMetrics();
            fetchClaimProfiles();
        } else {
            alert("Error: " + (data.message || data));
        }
    } catch (e) {
        alert("Failed to create profile: " + e);
    }
}

async function submitInlineUnclaimedProfile() {
    const nameEl = document.getElementById('unclaimedNameInline');
    const roleEl = document.getElementById('unclaimedRoleInline');
    const phoneEl = document.getElementById('unclaimedPhoneInline');
    const locationEl = document.getElementById('unclaimedLocationInline');

    const name = nameEl ? nameEl.value.trim() : '';
    const role = roleEl ? roleEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const location = locationEl ? locationEl.value.trim() : '';

    if (!name) {
        alert("Please enter Actor Name.");
        return;
    }

    try {
        const headers = getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        const res = await fetch(`${getApiBaseUrl()}/api/admin/profile-claims/create`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ name, role, phone, location })
        });

        const data = await res.json();
        if (res.ok) {
            const finalLink = formatClaimLink(data.claimLink);
            alert("✨ Success! Unclaimed actor profile created.\n\nClaim Link Generated:\n" + finalLink);
            if (nameEl) nameEl.value = '';
            if (roleEl) roleEl.value = '';
            if (phoneEl) phoneEl.value = '';
            if (locationEl) locationEl.value = '';
            fetchClaimMetrics();
            fetchClaimProfiles();
        } else {
            alert("Error: " + (data.message || data));
        }
    } catch (e) {
        alert("Failed to create profile: " + e);
    }
}

function formatClaimLink(rawLink) {
    if (!rawLink) return rawLink;
    let updated = rawLink.replace(/krewcanvas\.in/gi, 'crewcanvas.in').replace(/krewcanvas/gi, 'crewcanvas');
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return updated.replace(/https?:\/\/[^\/]+/, window.location.origin);
    }
    return updated;
}

async function generateAndCopyClaimLink(profileId, phone) {
    try {
        const headers = getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        const res = await fetch(`${getApiBaseUrl()}/api/admin/profile-claims/${profileId}/invite`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ phone })
        });

        if (res.ok) {
            const data = await res.json();
            const finalLink = formatClaimLink(data.claimLink);
            navigator.clipboard.writeText(finalLink);
            alert("Claim link copied to clipboard!\n\n" + finalLink);
            fetchClaimProfiles();
        } else {
            alert("Error generating claim link.");
        }
    } catch (e) {
        alert("Server error.");
    }
}

async function sendWhatsAppClaim(profileId, name, phone) {
    try {
        const headers = getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        const res = await fetch(`${getApiBaseUrl()}/api/admin/profile-claims/${profileId}/invite`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ phone })
        });

        if (res.ok) {
            const data = await res.json();
            let cleanPhone = (phone || '').replace(/[^\d]/g, '');
            if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

            const finalLink = formatClaimLink(data.claimLink);

            let msg = `Hi ${name}!\n\n`;
            msg += `We have created your official professional profile on CrewCanvas.\n\n`;
            msg += `Click the link below to take 1-click control of your profile:\n`;
            msg += `${finalLink}\n\n`;
            msg += `Welcome to CrewCanvas!`;

            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
            window.open(waUrl, '_blank');
            fetchClaimProfiles();
        }
    } catch (e) {
        alert("Error launching WhatsApp.");
    }
}

async function viewClaimActivity(profileId, name) {
    try {
        const res = await fetch(`${getApiBaseUrl()}/api/admin/profile-claims/${profileId}/activity`, {
            headers: getAuthHeaders()
        });
        if (res.ok) {
            const logs = await res.json();
            let logMsg = `Audit Log for ${name}:\n\n`;
            if (logs.length === 0) {
                logMsg += "No audit events recorded yet.";
            } else {
                logs.forEach(l => {
                    logMsg += `• [${new Date(l.createdAt).toLocaleString()}] ${l.eventType}: ${l.eventDetails}\n`;
                });
            }
            alert(logMsg);
        }
    } catch (e) {
        alert("Error fetching audit logs.");
    }
}
