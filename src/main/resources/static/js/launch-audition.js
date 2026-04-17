document.addEventListener('DOMContentLoaded', () => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            // Update UI with user info
            document.querySelector('.user-name').textContent = user.name;
        } catch (error) {
            console.error('Error parsing user data:', error);
        }
    }

    // Check if we should automatically open events section
    const shouldOpenEvents = localStorage.getItem('openEventsSection');
    const urlParams = new URLSearchParams(window.location.search);
    const openEvents = urlParams.get('open') === 'events';
    
    console.log('Events section check:', { shouldOpenEvents, openEvents });
    
    if (shouldOpenEvents || openEvents) {
        console.log('Opening events section automatically...');
        localStorage.removeItem('openEventsSection');
        
        // Automatically open events section
        const eventsBtn = document.querySelector('.nav-tab-btn[data-section="events"]');
        const welcomeContent = document.getElementById('welcome-content');
        const eventsContent = document.getElementById('events-content');
        const auditionsContent = document.getElementById('auditions-content');
        const navTabBtns = document.querySelectorAll('.nav-tab-btn');

        if (eventsBtn && eventsContent) {
            // Remove active class from all buttons
            navTabBtns.forEach(b => b.classList.remove('active'));
            
            // Add active class to events button
            eventsBtn.classList.add('active');
            
            // Hide all content first
            welcomeContent.style.display = 'none';
            eventsContent.style.display = 'none';
            auditionsContent.style.display = 'none';
            
            // Show events content
            eventsContent.style.display = 'block';
        }
    }

    // Tab Switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Activate Upcoming Auditions tab if URL hash is #upcoming-auditions
    if (window.location.hash === '#upcoming-auditions') {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        const upcomingTabBtn = document.querySelector('.tab-btn[data-tab="upcoming"]');
        const upcomingTabPane = document.getElementById('upcoming');
        if (upcomingTabBtn && upcomingTabPane) {
            upcomingTabBtn.classList.add('active');
            upcomingTabPane.classList.add('active');
        }
        // Scroll to the Upcoming Auditions section after tab is visible
        const section = document.getElementById('upcoming-auditions-section');
        if (section) {
            setTimeout(() => {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Also scroll the main content if needed
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.scrollTop = section.getBoundingClientRect().top + mainContent.scrollTop - 60;
                }
                // Add highlight effect
                section.classList.add('highlight-section');
                setTimeout(() => {
                    section.classList.remove('highlight-section');
                }, 1600);
            }, 500);
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Modal functionality
    const newAuditionBtn = document.getElementById('newAuditionBtn');
    const newAuditionModal = document.getElementById('newAuditionModal');
    const closeModal = document.getElementById('closeModal');
    const cancelNewAudition = document.getElementById('cancelNewAudition');
    const auditionForm = document.querySelector('.audition-form');

    function openModal() {
        const eventsTabBtn = document.querySelector('.nav-tab-btn[data-section="events"]');
        const auditionModalContent = newAuditionModal.querySelector('.audition-modal-content');
        const eventModalContent = newAuditionModal.querySelector('.event-modal-content');
        if (eventsTabBtn && eventsTabBtn.classList.contains('active')) {
            if (auditionModalContent) auditionModalContent.style.display = 'none';
            if (eventModalContent) eventModalContent.style.display = 'block';
        } else {
            if (auditionModalContent) auditionModalContent.style.display = 'block';
            if (eventModalContent) eventModalContent.style.display = 'none';
        }
        newAuditionModal.style.display = 'flex';
        setTimeout(() => {
        newAuditionModal.classList.add('show');
        }, 10);
        document.body.style.overflow = 'hidden';
    }

    function closeModalHandler() {
        newAuditionModal.classList.remove('show');
        setTimeout(() => {
            newAuditionModal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }

    if (newAuditionBtn) {
        newAuditionBtn.addEventListener('click', function() {
            const creationTypeModal = document.getElementById('creationTypeModal');
            if (creationTypeModal) creationTypeModal.style.display = 'flex';
        });
    }
    if (newAuditionModal) {
        if (closeModal) {
            closeModal.addEventListener('click', closeModalHandler);
        }
        if (cancelNewAudition) {
            cancelNewAudition.addEventListener('click', closeModalHandler);
        }
        // Close modal when clicking outside
        newAuditionModal.addEventListener('click', (e) => {
            if (e.target === newAuditionModal) {
                closeModalHandler();
            }
        });
    }

    // Add close/cancel logic for event modal
    const closeEventModal = document.getElementById('closeEventModal');
    const cancelEventModal = document.getElementById('cancelEventModal');
    function closeEventModalHandler() {
        newAuditionModal.classList.remove('show');
        setTimeout(() => {
            newAuditionModal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }
    if (closeEventModal) closeEventModal.addEventListener('click', closeEventModalHandler);
    if (cancelEventModal) cancelEventModal.addEventListener('click', closeEventModalHandler);

    // Handle skills input
    const skillsInput = document.getElementById('skills-required');
    const addSkillBtn = document.querySelector('.add-skill-btn');
    const skillsTags = document.querySelector('.skills-tags');

    function addSkillTag(skill) {
        const tag = document.createElement('div');
        tag.className = 'skill-tag';
        tag.innerHTML = `
            <span>${skill}</span>
            <span class="remove-skill"><i class="fas fa-times"></i></span>
        `;
        
        tag.querySelector('.remove-skill').addEventListener('click', () => {
            tag.remove();
        });

        skillsTags.appendChild(tag);
    }

    if (addSkillBtn && skillsInput) {
    addSkillBtn.addEventListener('click', () => {
        const skill = skillsInput.value.trim();
        if (skill) {
            addSkillTag(skill);
            skillsInput.value = '';
        }
    });

    skillsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const skill = skillsInput.value.trim();
            if (skill) {
                addSkillTag(skill);
                skillsInput.value = '';
            }
        }
    });
    }

    // Handle form submission
    if (auditionForm) {
    auditionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Collect form data
        const formData = {
            title: document.getElementById('audition-title').value,
            projectType: document.getElementById('project-type').value,
            auditionDate: document.getElementById('audition-date').value,
            roleTitle: document.getElementById('role-title').value,
            roleDescription: document.getElementById('role-description').value,
            location: document.getElementById('location').value,
            contactEmail: document.getElementById('contact-email').value,
            contactPhone: document.getElementById('contact-phone').value,
                skills: Array.from(document.querySelectorAll('.skill-tag span:first-child')).map(span => span.textContent),
                customFields: Array.from(document.querySelectorAll('#custom-fields-container .form-group')).map(group => ({
                    label: group.querySelector('label').textContent,
                    value: group.querySelector('input').value
                }))
        };

        // Here you would typically send the data to your backend
        console.log('Form submitted:', formData);
        
        // Show success message
        showNotification('Audition launched successfully!');
        
        // Reset form and close modal
        auditionForm.reset();
            if (skillsTags) {
        skillsTags.innerHTML = '';
            }
            const customFieldsContainer = document.getElementById('custom-fields-container');
            if (customFieldsContainer) {
                customFieldsContainer.innerHTML = '';
            }
        closeModalHandler();

            // Add the new audition to the upcoming tab
            addNewAuditionCard(formData);
        });
    }

    // Function to add a new audition card
    function addNewAuditionCard(formData) {
        const upcomingTab = document.getElementById('upcoming');
        if (!upcomingTab) return;

        const auditionList = upcomingTab.querySelector('.audition-list');
        if (!auditionList) return;

        const card = document.createElement('div');
        card.className = 'audition-card';
        card.setAttribute('data-project-type', formData.projectType);

        card.innerHTML = `
            <div class="audition-header">
                <h3>${formData.roleTitle}</h3>
                <span class="audition-date">${new Date(formData.auditionDate).toLocaleDateString()}</span>
            </div>
            <div class="audition-details">
                <p class="project-type">${formData.projectType}</p>
                <p class="location">${formData.location}</p>
                <div class="skills">
                    ${formData.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>
            <div class="audition-actions">
                <button class="action-btn view">View Details</button>
                <button class="action-btn edit">Edit</button>
            </div>
        `;

        // Add animation class
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        auditionList.insertBefore(card, auditionList.firstChild);

        // Trigger animation
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 10);

        // Update tab count
        const upcomingTabBtn = document.querySelector('.tab-btn[data-tab="upcoming"]');
        if (upcomingTabBtn) {
            const countSpan = upcomingTabBtn.querySelector('.tab-count');
            if (countSpan) {
                const currentCount = parseInt(countSpan.textContent) || 0;
                countSpan.textContent = currentCount + 1;
            }
        }
    }

    // Notification function
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Handle custom fields
    const addCustomFieldBtn = document.getElementById('addCustomField');
    if (addCustomFieldBtn) {
        addCustomFieldBtn.addEventListener('click', () => {
        const container = document.getElementById('custom-fields-container');
            if (!container) return;
      
        const fieldLabel = prompt("Enter the title for the field:");
        if (!fieldLabel) return;
      
        const fieldType = prompt("Enter the type of field (e.g., text, number, date):", "text");
        if (!fieldType) return;
      
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'form-group';
      
        const label = document.createElement('label');
        label.textContent = fieldLabel;
      
        const wrapper = document.createElement('div');
        wrapper.className = 'input-wrapper';
      
        const input = document.createElement('input');
        input.type = fieldType;
        input.name = fieldLabel.toLowerCase().replace(/\s+/g, '-');
        input.required = true;
            input.placeholder = " ";

            const clearBtn = document.createElement('button');
            clearBtn.type = 'button';
            clearBtn.className = 'clear-btn';
            clearBtn.innerHTML = '&times;';
            clearBtn.style.display = 'none';
      
        input.addEventListener('input', () => {
          clearBtn.style.display = input.value ? 'block' : 'none';
        });
      
            clearBtn.addEventListener('click', () => {
          input.value = '';
                clearBtn.style.display = 'none';
          input.focus();
            });
      
        wrapper.appendChild(input);
        wrapper.appendChild(clearBtn);
        fieldGroup.appendChild(label);
        fieldGroup.appendChild(wrapper);
        container.appendChild(fieldGroup);
        });
    }

    // Handle search functionality
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const auditionCards = document.querySelectorAll('.audition-card');
            
            auditionCards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const location = card.querySelector('.location').textContent.toLowerCase();
                const skills = Array.from(card.querySelectorAll('.skill-tag'))
                    .map(tag => tag.textContent.toLowerCase());
                
                const matches = title.includes(searchTerm) || 
                              location.includes(searchTerm) || 
                              skills.some(skill => skill.includes(searchTerm));
                
                card.style.display = matches ? 'block' : 'none';
            });
        });
    }

    const logo = document.querySelector('.sidebar .logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.location.href = 'feed.html';
        });
    }

    // Handle notifications
    const notifications = document.querySelector('.notifications');
    if (notifications) {
        notifications.addEventListener('click', () => {
            // Here you would implement notifications panel
            alert('Notifications panel would open here');
        });
    }

    // Add event listener for the add field button
    const addFieldBtn = document.querySelector('.add-field-btn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', addCustomField);
    }

    // Prevent default submission for all forms except event creation, audition creation, and registration
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            console.log('[DEBUG] Form submitted:', form.id || form.className, 'at', new Date().toISOString());
            console.trace('[DEBUG] Stack trace for form submit:', form.id || form.className);
            if (
                !form.classList.contains('audition-form') &&
                form.id !== 'registrationForm' &&
                !form.classList.contains('event-form')
            ) {
                e.preventDefault();
                console.log('[DEBUG] Prevented default for form:', form.id || form.className);
            }
        });
    });

    // Prevent audition form submission if registration modal is open
    if (auditionForm) {
        auditionForm.addEventListener('submit', function(e) {
            const registrationModal = document.getElementById('registrationModal');
            if (registrationModal && registrationModal.style.display === 'flex') {
                e.preventDefault();
                console.log('[DEBUG] Prevented audition form submission because registration modal is open');
            }
        });
    }

    // Set eventId when Register is clicked
    const eventsList = document.querySelector('.events-list');
    if (eventsList) {
        eventsList.addEventListener('click', async function(e) {
            if (e.target.classList.contains('apply')) {
                const eventCard = e.target.closest('.event-card');
                if (eventCard && eventCard.dataset.eventId) {
                    const eventId = eventCard.dataset.eventId;
                    window.selectedEventId = eventId;
                    console.log('[DEBUG] Set window.selectedEventId:', window.selectedEventId);
                    
                    // Check if user is already registered
                    const isRegistered = await isUserRegistered(eventId);
                    if (isRegistered) {
                        alert('You are already registered for this event!');
                        return;
                    }
                    
                    document.getElementById('registrationModal').style.display = 'flex';
                    document.getElementById('registrationModal').classList.add('show');
                } else {
                    console.log('[DEBUG] No data-event-id found on event card');
                }
            }
        });
    }

    // Load user's registered events
    async function loadMyEvents() {
        console.log('loadMyEvents function called');
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, returning');
            return;
        }
        
        try {
            const response = await fetch('/api/events/user/registrations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch registrations');
            }
            
            const registrations = await response.json();
            const myEventsList = document.getElementById('my-events-list');
            
            if (!myEventsList) return;
            
            // Clear existing content
            myEventsList.innerHTML = '';
            
            if (registrations.length === 0) {
                myEventsList.innerHTML = `
                    <div class="no-events-message" style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem; color: #ccc;"></i>
                        <p>You haven't registered for any events yet.</p>
                        <p>Check out the upcoming events to get started!</p>
                    </div>
                `;
                return;
            }
            
            // Display each registered event
            registrations.forEach(registration => {
                const eventCard = document.createElement('div');
                eventCard.className = 'event-card';
                eventCard.dataset.eventId = registration.event_id;
                
                eventCard.innerHTML = `
                    <div class="event-header">
                        <h3>${registration.event_title}</h3>
                        <span class="event-date">${new Date(registration.start_date).toLocaleDateString()}</span>
                    </div>
                    <div class="event-details">
                        <p><i class="fas fa-user" style="color: orange; margin-right: 6px;"></i>Registered as: ${registration.name}</p>
                        <p><i class="fas fa-envelope" style="color: orange; margin-right: 6px;"></i>${registration.email}</p>
                        <p><i class="fas fa-phone" style="color: orange; margin-right: 6px;"></i>${registration.phone}</p>
                        <p><i class="fas fa-map-marker-alt" style="color: orange; margin-right: 6px;"></i>${registration.city}, ${registration.state}</p>
                        <p><i class="fas fa-calendar-check" style="color: orange; margin-right: 6px;"></i>Registration Date: ${new Date(registration.registration_date).toLocaleDateString()}</p>
                    </div>
                    <div class="event-actions">
                        <button class="action-btn registered" disabled>
                            <i class="fas fa-check"></i> Registered
                        </button>
                    </div>
                `;
                
                // Style the registered button
                const registeredBtn = eventCard.querySelector('.action-btn.registered');
                registeredBtn.style.background = 'green';
                registeredBtn.style.color = 'white';
                registeredBtn.style.cursor = 'not-allowed';
                
                myEventsList.appendChild(eventCard);
            });
        } catch (error) {
            console.error('Error loading my events:', error);
            const myEventsList = document.getElementById('my-events-list');
            if (myEventsList) {
                myEventsList.innerHTML = `
                    <div class="error-message" style="text-align: center; padding: 2rem; color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <p>Failed to load your events. Please try again later.</p>
                    </div>
                `;
            }
        }
    }

    // Load my events when the tab is clicked
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            console.log('Tab clicked:', tabId);
            if (tabId === 'my-events') {
                console.log('Loading my events...');
                loadMyEvents();
            }
        });
    });

    // Update registration success to refresh my events
    const regForm = document.getElementById('registrationForm');
    if (regForm) {
        regForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            
            if (!currentEventId) {
                console.log('[DEBUG] No event selected for registration');
                alert('No event selected for registration.');
                return;
            }
            
            const token = localStorage.getItem('token');
            
            // Check if form has file inputs
            const hasFileInputs = regForm.querySelector('input[type="file"]');
            
            try {
                if (hasFileInputs) {
                    // Use FormData for forms with files
                    const formData = new FormData();
                    formData.append('event_id', currentEventId);
                    
                    // Get all form inputs
                    const formInputs = regForm.querySelectorAll('input, select, textarea');
                    console.log('[DEBUG] Found form inputs:', formInputs.length);
                    
                    formInputs.forEach((input, index) => {
                        console.log(`[DEBUG] Processing input ${index}:`, input.type, input.name, input.id, input.value);
                        
                        if (input.type === 'file') {
                            // Handle file uploads
                            const file = input.files[0];
                            if (file) {
                                const fieldName = input.name || input.id.replace('reg_', '');
                                console.log(`[DEBUG] File input: ${fieldName} = ${file.name}`);
                                formData.append(fieldName, file);
                            }
                        } else if (input.type === 'checkbox') {
                            // Handle checkboxes - collect all checked values
                            if (input.checked) {
                                const fieldName = input.name || input.id.replace('reg_', '');
                                console.log(`[DEBUG] Checkbox checked: ${fieldName} = ${input.value}`);
                                if (formData.has(fieldName)) {
                                    const existingValue = formData.get(fieldName);
                                    if (Array.isArray(existingValue)) {
                                        existingValue.push(input.value);
                                        formData.set(fieldName, existingValue);
                                    } else {
                                        formData.set(fieldName, [existingValue, input.value]);
                                    }
                                } else {
                                    formData.append(fieldName, input.value);
                                }
                            }
                        } else if (input.type !== 'submit' && input.type !== 'button') {
                            // Handle other input types
                            const fieldName = input.name || input.id.replace('reg_', '');
                            console.log(`[DEBUG] Input field: ${fieldName} = ${input.value}`);
                            
                            // Map field names to expected backend field names
                            let mappedFieldName = fieldName;
                            
                            // Handle both old format (regName) and new format (reg_name_text)
                            if (fieldName === 'regName' || fieldName === 'name' || fieldName.includes('reg_name_')) {
                                mappedFieldName = 'name';
                            } else if (fieldName === 'regAge' || fieldName === 'age' || fieldName.includes('reg_age_')) {
                                mappedFieldName = 'age';
                            } else if (fieldName === 'regGender' || fieldName === 'gender' || fieldName.includes('reg_gender_')) {
                                mappedFieldName = 'gender';
                            } else if (fieldName === 'regEmail' || fieldName === 'email' || fieldName.includes('reg_email_')) {
                                mappedFieldName = 'email';
                            } else if (fieldName === 'regCity' || fieldName === 'city' || fieldName.includes('reg_city_')) {
                                mappedFieldName = 'city';
                            } else if (fieldName === 'regState' || fieldName === 'state' || fieldName.includes('reg_state_')) {
                                mappedFieldName = 'state';
                            } else if (fieldName === 'regPhone' || fieldName === 'phone' || fieldName.includes('reg_phone_')) {
                                mappedFieldName = 'phone';
                            }
                            
                            formData.append(mappedFieldName, input.value);
                            console.log(`[DEBUG] Mapped field: ${fieldName} -> ${mappedFieldName} = ${input.value}`);
                        }
                    });
                    
                    console.log('[DEBUG] FormData created for file upload');
                    
                    const response = await fetch(`/api/events/${currentEventId}/register`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                            // Don't set Content-Type for FormData, browser will set it with boundary
                        },
                        body: formData
                    });
                    
                    console.log('[DEBUG] Registration response status:', response.status);
                    let data;
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        data = await response.json();
                    } else {
                        // Try to get text (likely HTML error page)
                        const text = await response.text();
                        throw new Error('Server returned non-JSON response: ' + text.substring(0, 200));
                    }
                    
                    if (!response.ok) throw new Error(data.message || 'Registration failed');
                    
                    alert('Registration successful!');
                    regForm.reset();
                    document.getElementById('registrationModal').style.display = 'none';
                    document.getElementById('registrationModal').classList.remove('show');
                    
                    // Update the register button for the event BEFORE resetting currentEventId
                    const eventCard = document.querySelector(`[data-event-id="${currentEventId}"]`);
                    if (eventCard) {
                        const registerBtn = eventCard.querySelector('.action-btn.apply');
                        if (registerBtn) {
                            registerBtn.innerHTML = '<i class="fas fa-check"></i> Registered';
                            registerBtn.style.background = 'green';
                            registerBtn.style.color = 'white';
                            registerBtn.disabled = true;
                        }
                    }
                    
                    currentEventId = null; // Reset current event ID after using it
                    
                    // Refresh my events if that tab is active
                    const myEventsTab = document.querySelector('.tab-btn[data-tab="my-events"]');
                    if (myEventsTab && myEventsTab.classList.contains('active')) {
                        loadMyEvents();
                    }
                } else {
                    // Use JSON for forms without files
            const registrationData = {
                event_id: currentEventId
            };
            
            // Get all form inputs
            const formInputs = regForm.querySelectorAll('input, select, textarea');
                    console.log('[DEBUG] Found form inputs:', formInputs.length);
                    
                    formInputs.forEach((input, index) => {
                        console.log(`[DEBUG] Processing input ${index}:`, input.type, input.name, input.id, input.value);
                        
                if (input.type === 'checkbox') {
                    // Handle checkboxes - collect all checked values
                    if (input.checked) {
                        const fieldName = input.name || input.id.replace('reg_', '');
                                console.log(`[DEBUG] Checkbox checked: ${fieldName} = ${input.value}`);
                        if (registrationData[fieldName]) {
                            if (Array.isArray(registrationData[fieldName])) {
                                registrationData[fieldName].push(input.value);
                            } else {
                                registrationData[fieldName] = [registrationData[fieldName], input.value];
                            }
                        } else {
                            registrationData[fieldName] = input.value;
                        }
                    }
                } else if (input.type !== 'submit' && input.type !== 'button') {
                    // Handle other input types
                    const fieldName = input.name || input.id.replace('reg_', '');
                            console.log(`[DEBUG] Input field: ${fieldName} = ${input.value}`);
                            
                            // Map field names to expected backend field names
                            let mappedFieldName = fieldName;
                            
                            // Handle both old format (regName) and new format (reg_name_text)
                            if (fieldName === 'regName' || fieldName === 'name' || fieldName.includes('reg_name_')) {
                                mappedFieldName = 'name';
                            } else if (fieldName === 'regAge' || fieldName === 'age' || fieldName.includes('reg_age_')) {
                                mappedFieldName = 'age';
                            } else if (fieldName === 'regGender' || fieldName === 'gender' || fieldName.includes('reg_gender_')) {
                                mappedFieldName = 'gender';
                            } else if (fieldName === 'regEmail' || fieldName === 'email' || fieldName.includes('reg_email_')) {
                                mappedFieldName = 'email';
                            } else if (fieldName === 'regCity' || fieldName === 'city' || fieldName.includes('reg_city_')) {
                                mappedFieldName = 'city';
                            } else if (fieldName === 'regState' || fieldName === 'state' || fieldName.includes('reg_state_')) {
                                mappedFieldName = 'state';
                            } else if (fieldName === 'regPhone' || fieldName === 'phone' || fieldName.includes('reg_phone_')) {
                                mappedFieldName = 'phone';
                            }
                            
                            registrationData[mappedFieldName] = input.value;
                            console.log(`[DEBUG] Mapped field: ${fieldName} -> ${mappedFieldName} = ${input.value}`);
                }
            });
            
            console.log('[DEBUG] Registration data:', registrationData);
            
                const response = await fetch(`/api/events/${currentEventId}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(registrationData)
                });
                
                console.log('[DEBUG] Registration response status:', response.status);
                let data;
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    data = await response.json();
                } else {
                    // Try to get text (likely HTML error page)
                    const text = await response.text();
                    throw new Error('Server returned non-JSON response: ' + text.substring(0, 200));
                }
                
                if (!response.ok) throw new Error(data.message || 'Registration failed');
                
                alert('Registration successful!');
                regForm.reset();
                document.getElementById('registrationModal').style.display = 'none';
                document.getElementById('registrationModal').classList.remove('show');
                
                    // Update the register button for the event BEFORE resetting currentEventId
                const eventCard = document.querySelector(`[data-event-id="${currentEventId}"]`);
                if (eventCard) {
                    const registerBtn = eventCard.querySelector('.action-btn.apply');
                    if (registerBtn) {
                        registerBtn.innerHTML = '<i class="fas fa-check"></i> Registered';
                        registerBtn.style.background = 'green';
                        registerBtn.style.color = 'white';
                        registerBtn.disabled = true;
                    }
                }
                    
                    currentEventId = null; // Reset current event ID after using it
                
                // Refresh my events if that tab is active
                const myEventsTab = document.querySelector('.tab-btn[data-tab="my-events"]');
                if (myEventsTab && myEventsTab.classList.contains('active')) {
                    loadMyEvents();
                    }
                }
            } catch (error) {
                alert('Registration error: ' + error.message);
                console.error('[DEBUG] Registration error:', error);
            }
        });
    }

    // Event background image preview
    const eventBgInput = document.getElementById('event-bg-image');
    const eventBgPreview = document.getElementById('event-bg-preview');
    if (eventBgInput && eventBgPreview) {
        eventBgInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    eventBgPreview.src = e.target.result;
                    eventBgPreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                eventBgPreview.src = '#';
                eventBgPreview.style.display = 'none';
            }
        });
    }

    // Add New Event form submission
    const eventForm = document.querySelector('.event-form');


    // Helper to check if user is registered for an event
    async function isUserRegistered(eventId) {
        const token = localStorage.getItem('token');
        if (!token) return false;
        try {
            const res = await fetch(`/api/events/${eventId}/is-registered`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) return false;
            const data = await res.json();
            return data.registered;
        } catch (e) {
            return false;
        }
    }

    function formatDateOnly(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        // Format as YYYY-MM-DD
        return d.toISOString().slice(0, 10);
    }

    // Update addNewEventCard to check registration status
    function addNewEventCard({ id, title, date, time, location, description, organizer, mobile, email, bgUrl, end_date, last_submission_date, created_by }) {
        const eventsList = document.querySelector('.events-list');
        if (!eventsList) return;
        const card = document.createElement('div');
        card.className = 'event-card';
        if (id) card.dataset.eventId = id;
        if (bgUrl) {
            card.style.setProperty('--event-bg', `url('${bgUrl}')`);
        }
        
        // Get current user info to check if they created this event
        const userStr = localStorage.getItem('user');
        let currentUserId = null;
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                currentUserId = user.id;
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        
        // Check if current user is the creator of this event (using created_by field)
        const isEventCreator = currentUserId && created_by && currentUserId === created_by;
        
        // Determine type and label robustly
        let typeLabel = 'Contest';
        let isContest = true;
        if (title) {
            const lowerTitle = title.trim().toLowerCase();
            if (lowerTitle.includes('workshop')) {
                typeLabel = 'Workshop';
                isContest = false;
            } else if (lowerTitle.includes('course')) {
                typeLabel = 'Course';
                isContest = false;
            }
        }
        
        card.innerHTML = `
            <div class="event-header">
                <h3>${title}</h3>
                ${typeLabel === 'Workshop' || typeLabel === 'Course'
                    ? `<div class="event-date" style="display: flex; flex-direction: column; align-items: flex-end; text-align: right;">
                            <span style="font-weight: 600;">Event Date</span>
                            <span style="margin-top: 2px;">${formatDateOnly(date)}</span>
                       </div>`
                    : typeLabel === 'Contest' && last_submission_date
                        ? `<div class="event-date" style="display: flex; flex-direction: column; align-items: flex-end; text-align: right;">
                                <span style="font-weight: 600;">Last Date for Submission</span>
                                <span style="margin-top: 2px;">${formatDateOnly(last_submission_date)}</span>
                           </div>`
                        : ''}
            </div>
            <div class="event-details">
                ${typeLabel === 'Contest' ? `<div style='margin-bottom: 4px;'><span style='font-weight: 600; color: orange;'>Event Date: </span>${formatDateOnly(date)}</div>` : ''}
                <p><i class='fas fa-clock' style='color: orange; margin-right: 6px;'></i> ${time}</p>
                <p class="location">${location}</p>
                <div class="skills">
                    <span class="skill-tag">${typeLabel}</span>
                </div>
                <p><i class='fas fa-user' style='color: orange; margin-right: 6px;'></i>Organized By : ${organizer}</p>&nbsp;
                <p><i class='fas fa-phone' style='color: orange; margin-right: 6px;'></i>${mobile} &nbsp;  | &nbsp;  <i class='fas fa-envelope' style='color: orange; margin-right: 6px;'></i>${email}</p>
                <p>${description}</p>
            </div>
            <div class="event-actions">
                ${isEventCreator ? `
                    <div class="creator-actions" style="display: flex; gap: 8px; margin-bottom: 10px; flex-wrap: wrap;">
                        <button class="action-btn manage" onclick="openEventDashboard(${id})" style="background: #4CAF50; color: white; font-size: 11px; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; transition: all 0.3s;">
                            <i class="fas fa-chart-bar"></i> Manage
                        </button>
                        <button class="action-btn download" onclick="downloadEventData(${id})" style="background: #2196F3; color: white; font-size: 11px; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; transition: all 0.3s;">
                            <i class="fas fa-download"></i> Export
                        </button>
                        <button class="action-btn files" onclick="downloadEventFiles(${id})" style="background: #FF9800; color: white; font-size: 11px; padding: 6px 10px; border: none; border-radius: 4px; cursor: pointer; transition: all 0.3s;">
                            <i class="fas fa-file"></i> Files
                        </button>
                    </div>
                ` : ''}
                <button class="action-btn apply">Register</button>
            </div>
        `;
        eventsList.insertBefore(card, eventsList.firstChild);
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 10);

        // Check registration status and update button
        const registerBtn = card.querySelector('.action-btn.apply');
        if (id && registerBtn) {
            isUserRegistered(id).then(registered => {
                if (registered) {
                    registerBtn.innerHTML = '<i class="fas fa-check"></i> Registered';
                    registerBtn.style.background = 'green';
                    registerBtn.style.color = 'white';
                    registerBtn.disabled = true;
                } else {
                    registerBtn.disabled = false;
                    registerBtn.innerHTML = 'Register';
                    registerBtn.style.background = '';
                    registerBtn.style.color = '';
                }
            });
        }
    }

    // --- Hardcoded event registration status for 40-Day Acting Workshop ---
    (async function() {
        const hardcodedEventId = "1";
        const eventCard = document.querySelector('.event-card[data-event-id="1"]');
        if (eventCard) {
            const registerBtn = eventCard.querySelector('.action-btn.apply');
            if (registerBtn) {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const res = await fetch(`/api/events/${hardcodedEventId}/is-registered`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.registered) {
                                registerBtn.innerHTML = '<i class="fas fa-check"></i> Registered';
                                registerBtn.style.background = 'green';
                                registerBtn.style.color = 'white';
                                registerBtn.disabled = true;
                            }
                        }
                    } catch (e) {
                        // Optionally handle error
                    }
                }
            }
        }
    })();

    // Segmented button filter logic
    const filterGroup = document.getElementById('main-filter-group');
    function filterVisibleCardsBtn(value) {
        const eventsContent = document.getElementById('events-content');
        if (eventsContent && eventsContent.style.display !== 'none') {
            const cards = eventsContent.querySelectorAll('.event-card');
            cards.forEach(card => {
                let type = card.getAttribute('data-type');
                if (!type) {
                    const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
                    const skills = Array.from(card.querySelectorAll('.skill-tag')).map(s => s.textContent.toLowerCase());
                    if (skills.includes('workshop') || title.includes('workshop')) type = 'workshop';
                    else if (skills.includes('course') || title.includes('course')) type = 'course';
                    else type = 'event';
                    card.setAttribute('data-type', type);
                }
                card.style.display = (value === 'all' || value === type) ? '' : 'none';
            });
        }
    }
    if (filterGroup) {
        filterGroup.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                filterGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterVisibleCardsBtn(btn.getAttribute('data-value'));
            });
        });
        // Set initial filter
        const initialActive = filterGroup.querySelector('.filter-btn.active');
        if (initialActive) filterVisibleCardsBtn(initialActive.getAttribute('data-value'));
    }

    // Creation Type Modal
    const creationTypeModal = document.getElementById('creationTypeModal');
    const workshopModalContent = document.getElementById('workshopModalContent');
    if (creationTypeModal) {
        document.querySelectorAll('.creation-type-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const type = btn.getAttribute('data-type');
                creationTypeModal.style.display = 'none';
                // Hide all modals first
                if (newAuditionModal) {
                    newAuditionModal.style.display = 'none';
                    newAuditionModal.classList.remove('show');
                }
                // Always show event modal for all three types
                if (newAuditionModal) {
                    const auditionModalContent = newAuditionModal.querySelector('.audition-modal-content');
                    const eventModalContent = newAuditionModal.querySelector('.event-modal-content');
                    if (auditionModalContent) auditionModalContent.style.display = 'none';
                    if (eventModalContent) eventModalContent.style.display = 'block';
                    newAuditionModal.style.display = 'flex';
                    setTimeout(() => { newAuditionModal.classList.add('show'); }, 10);
                    document.body.style.overflow = 'hidden';
                    // Pre-fill event title for workshop or course
                    const eventTitle = document.getElementById('event-title');
                    if (type === 'workshop') {
                        if (eventTitle && !eventTitle.value.toLowerCase().includes('workshop')) {
                            eventTitle.value = 'Workshop - ';
                        }
                        // Reset time label and input for workshop
                        const eventTimeLabel = document.querySelector('label[for="event-time"]');
                        const eventTimeInput = document.getElementById('event-time');
                        if (eventTimeLabel) eventTimeLabel.textContent = 'Time Duration';
                        if (eventTimeInput) eventTimeInput.type = 'text';
                    } else if (type === 'course') {
                        if (eventTitle && !eventTitle.value.toLowerCase().includes('course')) {
                            eventTitle.value = 'Course - ';
                        }
                        // Reset time label and input for course
                        const eventTimeLabel = document.querySelector('label[for="event-time"]');
                        const eventTimeInput = document.getElementById('event-time');
                        if (eventTimeLabel) eventTimeLabel.textContent = 'Time Duration';
                        if (eventTimeInput) eventTimeInput.type = 'text';
                    } else if (type === 'event') {
                        if (eventTitle && (eventTitle.value.toLowerCase().includes('workshop') || eventTitle.value.toLowerCase().includes('course'))) {
                            eventTitle.value = '';
                        }
                    }
                }
            });
        });
    }

    // Add logic to show/hide last-submission-date-group based on event type selection
    // Find the event type selection buttons and add event listeners
    const lastSubmissionDateGroup = document.getElementById('last-submission-date-group');
    let selectedEventType = null;

    if (creationTypeModal) {
        creationTypeModal.addEventListener('click', function(e) {
            if (e.target.classList.contains('creation-type-btn')) {
                selectedEventType = e.target.dataset.type;
                if (selectedEventType === 'event' || selectedEventType === 'contest') {
                    if (lastSubmissionDateGroup) lastSubmissionDateGroup.style.display = '';
                } else {
                    if (lastSubmissionDateGroup) lastSubmissionDateGroup.style.display = 'none';
                }
            }
        });
    }

    // Ensure cancel button in creationTypeModal closes the modal
    const closeCreationTypeModalBtn = document.getElementById('closeCreationTypeModal');
    if (closeCreationTypeModalBtn && creationTypeModal) {
        closeCreationTypeModalBtn.addEventListener('click', function() {
            creationTypeModal.style.display = 'none';
        });
    }

    // Add this function near the top-level functions
    async function loadEvents() {
        const eventsList = document.querySelector('.events-list');
        if (!eventsList) return;
        eventsList.innerHTML = '';
        try {
            const response = await fetch('/api/events');
            if (!response.ok) throw new Error('Failed to fetch events');
            const events = await response.json();
            if (!Array.isArray(events) || events.length === 0) {
                eventsList.innerHTML = '<div class="no-events-message">No events found.</div>';
                return;
            }
            events.forEach(event => {
                addNewEventCard({
                    id: event.id,
                    title: event.title,
                    date: event.start_date,
                    end_date: event.end_date,
                    last_submission_date: event.last_submission_date,
                    time: event.time,
                    location: event.location,
                    description: event.description,
                    organizer: event.organizer_name,
                    mobile: event.organizer_phone,
                    email: event.organizer_email,
                    bgUrl: event.image ? event.image : '',
                    created_by: event.created_by
                });
            });
        } catch (err) {
            eventsList.innerHTML = '<div class="error-message">Failed to load events.</div>';
            console.error('Error loading events:', err);
        }
    }

    // Load events on page load if events tab is visible
    const eventsContent = document.getElementById('events-content');
    if (eventsContent && eventsContent.style.display !== 'none') {
        loadEvents();
    }
    // Also load events when switching to the events tab
    const eventsTabBtn = document.querySelector('.nav-tab-btn[data-section="events"]');
    if (eventsTabBtn) {
        eventsTabBtn.addEventListener('click', loadEvents);
    }

    // --- FORM BUILDER LOGIC (moved from form-builder.js) ---
    // Only declare these once, scoped for the modal
    let customFields = [];
    let previewMode = false;
    const defaultFields = [
      { label: 'Name', type: 'text', required: true },
      { label: 'Email', type: 'email', required: true },
      { label: 'Age', type: 'number', required: true },
      { label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'], required: true },
      { label: 'Phone Number', type: 'tel', required: true },
      { label: 'City', type: 'text', required: true },
      { label: 'State', type: 'text', required: true },
    ];
    function setupFormBuilderModal() {
      const customFieldsContainer = document.getElementById('customFieldsContainer');
      const addCustomFieldBtn = document.getElementById('addCustomFieldBtn');
      const logicContainer = document.getElementById('logicContainer');
      const addLogicBtn = document.getElementById('addLogicBtn');
      const previewSection = document.getElementById('previewSection');
      const togglePreviewBtn = document.getElementById('togglePreview');
      const formBuilderForm = document.getElementById('formBuilderForm');
      const previewForm = document.getElementById('previewForm');
      // --- DYNAMIC CUSTOM FIELD BUILDER ---
      function renderCustomFields() {
        const customFieldsContainer = document.getElementById('customFieldsContainer');
        if (!customFieldsContainer) return;
        customFieldsContainer.innerHTML = '';
        customFields.forEach((field, idx) => {
          const row = document.createElement('div');
          row.className = 'form-row';
          row.style.alignItems = 'flex-end';
          // Label input
          const labelInput = document.createElement('input');
          labelInput.type = 'text';
          labelInput.placeholder = 'Field label';
          labelInput.value = field.label || '';
          labelInput.className = 'form-control';
          labelInput.style.marginRight = '10px';
          labelInput.oninput = (e) => {
            customFields[idx].label = e.target.value;
          };
          // Type select
          const typeSelect = document.createElement('select');
          typeSelect.className = 'form-control';
          typeSelect.style.marginRight = '10px';
          ['text','number','email','date','url','select','checkbox','textarea','file'].forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            if (field.type === type) opt.selected = true;
            typeSelect.appendChild(opt);
          });
          typeSelect.onchange = (e) => {
            customFields[idx].type = e.target.value;
            if (e.target.value !== 'select' && e.target.value !== 'checkbox') {
              delete customFields[idx].options;
            }
            renderCustomFields();
          };
          row.appendChild(labelInput);
          row.appendChild(typeSelect);
          // Options input (if select/checkbox)
          let optionsInput = null;
          if (field.type === 'select' || field.type === 'checkbox') {
            optionsInput = document.createElement('input');
            optionsInput.type = 'text';
            optionsInput.placeholder = 'Options (comma separated) - Required for ' + field.type;
            optionsInput.value = field.options ? field.options.join(',') : '';
            optionsInput.className = 'form-control';
            optionsInput.style.marginRight = '10px';
            optionsInput.style.borderColor = (!field.options || field.options.length === 0) ? '#ff6b6b' : '#ccc';
            optionsInput.oninput = (e) => {
              const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
              customFields[idx].options = options;
              e.target.style.borderColor = options.length > 0 ? '#ccc' : '#ff6b6b';
            };
            row.appendChild(optionsInput);
            
            // Add warning if no options
            if (!field.options || field.options.length === 0) {
              const warning = document.createElement('div');
              warning.style.color = '#ff6b6b';
              warning.style.fontSize = '12px';
              warning.style.marginTop = '5px';
              warning.textContent = `⚠️ ${field.type} fields require at least one option`;
              row.appendChild(warning);
            }
          }
          // Remove button
          const removeBtn = document.createElement('button');
          removeBtn.type = 'button';
          removeBtn.className = 'cancel-btn';
          removeBtn.textContent = 'Remove';
          removeBtn.onclick = () => {
            customFields.splice(idx, 1);
            renderCustomFields();
          };
          row.appendChild(removeBtn);
          customFieldsContainer.appendChild(row);
        });
      }
      function editCustomField(idx) {
        const field = customFields[idx];
        const label = prompt('Field label:', field.label);
        if (!label) return;
        let type = prompt('Field type (text, number, email, date, select, checkbox, textarea):', field.type);
        if (!type) return;
        let options = undefined;
        if (type === 'select' || type === 'checkbox') {
          const opts = prompt('Options (comma separated):', field.options ? field.options.join(',') : '');
          if (!opts) return;
          options = opts.split(',').map(s => s.trim()).filter(Boolean);
        }
        customFields[idx] = { label, type, options };
        renderCustomFields();
      }
      if (addCustomFieldBtn) {
        addCustomFieldBtn.onclick = () => {
          customFields.push({ label: '', type: 'text' });
          renderCustomFields();
        };
      }
      function renderPreview() {
        if (!previewForm) return;
        previewForm.innerHTML = '';
        // Render default fields
        defaultFields.forEach(field => {
          const wrapper = document.createElement('div');
          wrapper.className = 'preview-field';
          const label = document.createElement('label');
          label.className = 'preview-label';
          label.textContent = field.label + (field.required ? ' *' : '');
          let input;
          if (field.type === 'select') {
            input = document.createElement('select');
            input.className = 'preview-select';
            field.options.forEach(opt => {
              const option = document.createElement('option');
              option.value = opt;
              option.textContent = opt;
              input.appendChild(option);
            });
          } else {
            input = document.createElement('input');
            input.className = 'preview-input';
            input.type = field.type;
          }
          input.required = field.required;
          wrapper.appendChild(label);
          wrapper.appendChild(input);
          previewForm.appendChild(wrapper);
        });
        // Render custom fields (apply conditional logic)
        customFields.forEach(field => {
          // Check if this field should be shown based on logic
          let show = true;
          // For preview, just show all fields (logic applies on real form)
          if (show) {
            const wrapper = document.createElement('div');
            wrapper.className = 'preview-field';
            const label = document.createElement('label');
            label.className = 'preview-label';
            label.textContent = field.label;
            let input;
            if (field.type === 'select') {
              input = document.createElement('select');
              input.className = 'preview-select';
              field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
              });
            } else if (field.type === 'checkbox') {
              input = document.createElement('input');
              input.type = 'checkbox';
              input.className = 'preview-input';
            } else if (field.type === 'textarea') {
              input = document.createElement('textarea');
              input.className = 'preview-input';
            } else {
              input = document.createElement('input');
              input.className = 'preview-input';
              input.type = field.type;
            }
            wrapper.appendChild(label);
            wrapper.appendChild(input);
            previewForm.appendChild(wrapper);
          }
        });
      }
      if (togglePreviewBtn) {
        togglePreviewBtn.onclick = () => {
          previewMode = !previewMode;
          if (previewSection && formBuilderForm) {
            previewSection.style.display = previewMode ? 'block' : 'none';
            formBuilderForm.style.display = previewMode ? 'none' : 'block';
            togglePreviewBtn.textContent = previewMode ? 'Edit Mode' : 'Preview Mode';
            if (previewMode) renderPreview();
          }
        };
      }
      if (formBuilderForm) {
        formBuilderForm.onsubmit = async (e) => {
          e.preventDefault();
          const eventId = window.currentEventId;
          if (!eventId) {
            alert('Event ID not found. Please create the event first.');
            return;
          }
          
          // Validate custom fields before saving
          for (let i = 0; i < customFields.length; i++) {
            const field = customFields[i];
            if (!field.label || field.label.trim() === '') {
              alert(`Field ${i + 1} must have a label.`);
              return;
            }
            if ((field.type === 'select' || field.type === 'checkbox') && (!field.options || field.options.length === 0)) {
              alert(`Field "${field.label}" (${field.type}) must have at least one option.`);
              return;
            }
          }
          
          const formStructure = {
            defaultFields,
            customFields
          };
          const token = localStorage.getItem('token');
          try {
            const response = await fetch(`/api/events/${eventId}/registration-form`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ form_structure: formStructure })
            });
            if (!response.ok) throw new Error('Failed to save registration form');
            // Show success banner and close modal/step
            const banner = document.getElementById('eventSuccessBanner');
            if (banner) {
              banner.style.display = 'block';
              banner.style.opacity = '1';
              setTimeout(() => {
                banner.style.opacity = '0';
                setTimeout(() => { banner.style.display = 'none'; }, 400);
              }, 2500);
            }
            // Close the registration form step/modal
            document.getElementById('registrationFormBuilderStep').style.display = 'none';
            document.getElementById('eventCreationStep').style.display = 'block';
            // Also close the event creation modal
            if (typeof closeEventModalHandler === 'function') {
              closeEventModalHandler();
            }
          } catch (err) {
            alert('Error saving registration form: ' + err.message);
          }
        };
      }
      // Initial render
      renderCustomFields();
    }
    // Show form builder sliding panel after event creation
    const nextToFormBuilderBtn = document.getElementById('nextToFormBuilder');
    let backToEventFormBtn = document.getElementById('backToEventForm');
    if (nextToFormBuilderBtn && eventForm) {
        nextToFormBuilderBtn.addEventListener('click', async function() {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('You must be logged in to create an event.');
                return;
            }
            const title = document.getElementById('event-title').value;
            const date = document.getElementById('event-date').value;
            const endDate = document.getElementById('event-end-date').value;
            const time = document.getElementById('event-time').value;
            const location = document.getElementById('event-location').value;
            const description = document.getElementById('event-description').value;
            const organizer = document.getElementById('organizer-name').value;
            const mobile = document.getElementById('organizer-mobile').value;
            const email = document.getElementById('organizer-email').value;
            const bgInput = document.getElementById('event-bg-image');
            let skills = [];
            const skillsTags = document.querySelector('.skills-tags');
            if (skillsTags) {
                skills = Array.from(skillsTags.querySelectorAll('.skill-tag span:first-child')).map(span => span.textContent);
            }
            const formData = new FormData();
            formData.append('title', title);
            formData.append('start_date', date);
            formData.append('end_date', endDate);
            formData.append('time', time);
            formData.append('location', location);
            formData.append('description', description);
            formData.append('organizer_name', organizer);
            formData.append('organizer_phone', mobile);
            formData.append('organizer_email', email);
            if (skills.length > 0) formData.append('skills', JSON.stringify(skills));
            if (bgInput && bgInput.files && bgInput.files[0]) {
                formData.append('image', bgInput.files[0]);
            }
            const lastSubmissionDate = document.getElementById('event-last-submission-date')?.value;
            if (lastSubmissionDate) {
                formData.append('last_submission_date', lastSubmissionDate);
            }
            try {
                const response = await fetch('/api/events/create', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                if (!response.ok) throw new Error('Failed to create event');
                const newEvent = await response.json();
                window.currentEventId = newEvent.id; // <-- Store eventId for form save
                document.getElementById('eventCreationStep').style.display = 'none';
                document.getElementById('registrationFormBuilderStep').style.display = 'block';
                setupFormBuilderModal();
                backToEventFormBtn = document.getElementById('backToEventForm');
                if (backToEventFormBtn) {
                    backToEventFormBtn.onclick = function() {
                        document.getElementById('registrationFormBuilderStep').style.display = 'none';
                        document.getElementById('eventCreationStep').style.display = 'block';
                    };
                }
            } catch (error) {
                alert('Error creating event: ' + error.message);
            }
        });
    }

    // Close or back from form builder panel
    if (backToEventFormBtn) {
      backToEventFormBtn.onclick = function() {
          document.getElementById('formBuilderPanel').classList.remove('slide-in');
      };
    }

    // Registration Modal Functionality
const registrationModal = document.getElementById('registrationModal');
const registrationForm = document.getElementById('registrationForm');

console.log('[DEBUG] Registration modal found:', !!registrationModal);
console.log('[DEBUG] Registration form found:', !!registrationForm);

    // Function to fetch and display custom registration form
    async function loadCustomRegistrationForm(eventId) {
        try {
            console.log('[DEBUG] Fetching custom registration form for event:', eventId);
            console.log('[DEBUG] Making request to:', `/api/events/${eventId}/registration-form`);
            
            const response = await fetch(`/api/events/${eventId}/registration-form`);
            console.log('[DEBUG] Response status:', response.status);
            console.log('[DEBUG] Response headers:', response.headers);
            
            if (response.ok) {
                const data = await response.json();
                console.log('[DEBUG] Custom form found:', data);
                console.log('[DEBUG] Form structure:', data.form_structure);
                console.log('[DEBUG] Form structure type:', typeof data.form_structure);
                
                if (data.form_structure) {
                    console.log('[DEBUG] Form structure found, displaying complete form');
                    // Display complete form with both default and custom fields
                    displayCompleteForm(data.form_structure);
                    return true;
                } else {
                    console.log('[DEBUG] No form structure found, using default form');
                    displayDefaultForm();
                    return false;
                }
            } else if (response.status === 404) {
                console.log('[DEBUG] No custom form found (404), using default form');
                // Show default form
                displayDefaultForm();
                return false;
            } else {
                console.log('[DEBUG] Error response:', response.status, response.statusText);
                const errorText = await response.text();
                console.log('[DEBUG] Error response body:', errorText);
                throw new Error('Failed to fetch registration form');
            }
        } catch (error) {
            console.error('[DEBUG] Error fetching registration form:', error);
            // Fallback to default form
            displayDefaultForm();
            return false;
        }
    }

    // Function to display complete form with both default and custom fields
    function displayCompleteForm(formStructure) {
        console.log('[DEBUG] Displaying complete form with structure:', formStructure);
        
        const formContainer = document.getElementById('registrationForm');
        if (!formContainer) {
            console.error('[DEBUG] Form container not found!');
            return;
        }
        console.log('[DEBUG] Form container found:', formContainer);
        
        // Clear existing form
        formContainer.innerHTML = '';
        console.log('[DEBUG] Cleared form container');
        
        // Add form title
        const formTitle = document.createElement('h4');
        formTitle.textContent = 'Event Registration Form';
        formTitle.style.marginBottom = '20px';
        formTitle.style.color = '#ff6b35';
        formContainer.appendChild(formTitle);
        console.log('[DEBUG] Added form title');
        
        // Display default fields first
        const defaultFields = formStructure.defaultFields || [];
        console.log('[DEBUG] Processing default fields:', defaultFields);
        defaultFields.forEach((field, index) => {
            console.log('[DEBUG] Processing default field:', field, 'at index:', index);
            
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = field.label;
            if (field.required) {
                label.innerHTML += ' <span style="color: red;">*</span>';
            }
            
            const input = createFormInput(field);
            console.log('[DEBUG] Created input for default field:', field.label, 'Input element:', input);
            
            fieldGroup.appendChild(label);
            fieldGroup.appendChild(input);
            formContainer.appendChild(fieldGroup);
            
            console.log('[DEBUG] Added default field:', field.label);
        });
        
        // Display custom fields
        const customFields = formStructure.customFields || [];
        console.log('[DEBUG] Processing custom fields:', customFields);
        customFields.forEach((field, index) => {
            console.log('[DEBUG] Processing custom field:', field, 'at index:', index);
            
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = field.label;
            if (field.required) {
                label.innerHTML += ' <span style="color: red;">*</span>';
            }
            
            const input = createFormInput(field);
            console.log('[DEBUG] Created input for custom field:', field.label, 'Input element:', input);
            
            fieldGroup.appendChild(label);
            fieldGroup.appendChild(input);
            formContainer.appendChild(fieldGroup);
            
            console.log('[DEBUG] Added custom field:', field.label);
        });
        
        // Add submit button
        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'submit-btn';
        submitBtn.textContent = 'Submit Registration';
        formContainer.appendChild(submitBtn);
        
        console.log('[DEBUG] Complete form display finished');
        console.log('[DEBUG] Final form container HTML:', formContainer.innerHTML);
    }

    // Function to create form input based on field type
    function createFormInput(field) {
        console.log('[DEBUG] Creating input for field:', field);
        console.log('[DEBUG] Field type:', field.type);
        console.log('[DEBUG] Field label:', field.label);
        
        let input;
        
        // Create unique ID by adding field type to avoid conflicts with same labels
        const uniqueId = `reg_${field.label.toLowerCase().replace(/\s+/g, '_')}_${field.type}`;
        
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'number':
            case 'url':
                input = document.createElement('input');
                input.type = field.type;
                input.id = uniqueId;
                input.name = uniqueId;
                if (field.required) input.required = true;
                console.log('[DEBUG] Created input field:', field.type, 'with id:', input.id);
                break;
                
            case 'select':
                input = document.createElement('select');
                input.id = uniqueId;
                input.name = uniqueId;
                if (field.required) input.required = true;
                
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = `Select ${field.label}`;
                input.appendChild(defaultOption);
                
                    // Add options if they exist
                    if (field.options && Array.isArray(field.options) && field.options.length > 0) {
                    field.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.toLowerCase();
                        optionElement.textContent = option;
                        input.appendChild(optionElement);
                    });
                    } else {
                        // If no options provided, add some default options
                        const defaultOptions = ['Option 1', 'Option 2', 'Option 3'];
                        defaultOptions.forEach(option => {
                            const optionElement = document.createElement('option');
                            optionElement.value = option.toLowerCase().replace(/\s+/g, '_');
                        optionElement.textContent = option;
                        input.appendChild(optionElement);
                    });
                }
                console.log('[DEBUG] Created select field with options:', field.options);
                break;
                
            case 'textarea':
                input = document.createElement('textarea');
                input.id = uniqueId;
                input.name = uniqueId;
                input.rows = 4;
                if (field.required) input.required = true;
                console.log('[DEBUG] Created textarea field');
                break;
                
            case 'file':
                input = document.createElement('input');
                input.type = 'file';
                input.id = uniqueId;
                input.name = uniqueId;
                input.accept = 'image/*'; // Accept only image files
                if (field.required) input.required = true;
                
                // Add file info display
                const fileInfo = document.createElement('div');
                fileInfo.id = `${uniqueId}_info`;
                fileInfo.style.fontSize = '12px';
                fileInfo.style.color = '#666';
                fileInfo.style.marginTop = '5px';
                fileInfo.textContent = 'Accepted formats: JPG, PNG, GIF, WEBP (Max 5MB)';
                
                // Create container for input and info
                const fileContainer = document.createElement('div');
                fileContainer.appendChild(input);
                fileContainer.appendChild(fileInfo);
                
                // Add file change listener to show selected file name
                input.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
                        fileInfo.style.color = '#28a745';
                    } else {
                        fileInfo.textContent = 'Accepted formats: JPG, PNG, GIF, WEBP (Max 5MB)';
                        fileInfo.style.color = '#666';
                    }
                });
                
                input = fileContainer; // Return the container instead of just the input
                console.log('[DEBUG] Created file input field');
                break;
                
            case 'checkbox':
                input = document.createElement('div');
                input.className = 'checkbox-group';
                
                if (field.options && Array.isArray(field.options)) {
                    field.options.forEach(option => {
                        const checkboxContainer = document.createElement('div');
                        checkboxContainer.className = 'checkbox-item';
                        
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.id = `reg_${option.toLowerCase().replace(/\s+/g, '_')}`;
                        checkbox.name = uniqueId;
                        checkbox.value = option;
                        
                        const checkboxLabel = document.createElement('label');
                        checkboxLabel.htmlFor = checkbox.id;
                        checkboxLabel.textContent = option;
                        
                        checkboxContainer.appendChild(checkbox);
                        checkboxContainer.appendChild(checkboxLabel);
                        input.appendChild(checkboxContainer);
                    });
                }
                console.log('[DEBUG] Created checkbox group with options:', field.options);
                break;
                
            default:
                input = document.createElement('input');
                input.type = 'text';
                input.id = uniqueId;
                input.name = uniqueId;
                if (field.required) input.required = true;
                console.log('[DEBUG] Created default text field');
        }
        
        console.log('[DEBUG] Final input element:', input);
        console.log('[DEBUG] Input HTML:', input.outerHTML);
        return input;
    }

    // Function to display default form
    function displayDefaultForm() {
        console.log('[DEBUG] Displaying default form');
        
        const formContainer = document.getElementById('registrationForm');
        if (!formContainer) {
            console.error('[DEBUG] Form container not found for default form!');
            return;
        }
        
        // Clear existing form
        formContainer.innerHTML = `
            <div class="form-group">
                <label for="regName">Full Name</label>
                <input type="text" id="regName" name="regName" required>
            </div>
            <div class="form-group">
                <label for="regAge">Age</label>
                <input type="number" id="regAge" name="regAge" min="1" max="120" required>
            </div>
            <div class="form-group">
                <label for="regGender">Gender</label>
                <select id="regGender" name="regGender" required>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
            </div>
            <div class="form-group">
                <label for="regEmail">Email</label>
                <input type="email" id="regEmail" name="regEmail" required>
            </div>
            <div class="form-group">
                <label for="regCity">City</label>
                <input type="text" id="regCity" name="regCity" required>
            </div>
            <div class="form-group">
                <label for="regState">State</label>
                <input type="text" id="regState" name="regState" required>
            </div>
            <div class="form-group">
                <label for="regPhone">Phone Number</label>
                <input type="tel" id="regPhone" name="regPhone" required>
            </div>
            <button type="submit" class="submit-btn">Submit Registration</button>
        `;
        
        console.log('[DEBUG] Default form displayed successfully');
    }

    // Store current event ID for registration
    let currentEventId = null;

    // Use event delegation to handle register button clicks for dynamically created cards
    document.addEventListener('click', async (event) => {
        // Check if the clicked element is a register button
        if (event.target.classList.contains('action-btn') && event.target.classList.contains('apply')) {
            console.log('[DEBUG] Register button clicked');
            
        // Get event ID from the button's parent card
            const eventCard = event.target.closest('.event-card');
            console.log('[DEBUG] Event card found:', !!eventCard);
            console.log('[DEBUG] Event card element:', eventCard);
            
        if (eventCard) {
            currentEventId = eventCard.dataset.eventId;
            // Also set the window.selectedEventId for backward compatibility
            window.selectedEventId = currentEventId;
            console.log('[DEBUG] Register button clicked for event:', currentEventId);
            console.log('[DEBUG] Set window.selectedEventId:', currentEventId);
                console.log('[DEBUG] Event card dataset:', eventCard.dataset);
            
            // Show modal first
                console.log('[DEBUG] Showing registration modal');
                console.log('[DEBUG] Modal element:', registrationModal);
                if (registrationModal) {
            registrationModal.style.display = 'flex';
            registrationModal.offsetHeight; // Trigger reflow
            registrationModal.classList.add('show');
            document.body.style.overflow = 'hidden';
                    console.log('[DEBUG] Modal displayed successfully');
                } else {
                    console.error('[DEBUG] Registration modal not found!');
                    alert('Error: Registration modal not found.');
                    return;
                }
            
            // Load custom form or default form
            await loadCustomRegistrationForm(currentEventId);
        } else {
            console.error('[DEBUG] Could not find event card for register button');
                console.log('[DEBUG] Button element:', event.target);
                console.log('[DEBUG] Button parent:', event.target.parentElement);
                console.log('[DEBUG] Button parent parent:', event.target.parentElement?.parentElement);
            alert('Error: Could not identify event for registration.');
            }
        }
});
}); 

// Test function to create a sample custom form (for debugging)
function createTestCustomForm() {
    const testFormStructure = [
        {
            label: 'Full Name',
            type: 'text',
            required: true
        },
        {
            label: 'Email Address',
            type: 'email',
            required: true
        },
        {
            label: 'Age',
            type: 'number',
            required: true
        },
        {
            label: 'Experience Level',
            type: 'select',
            options: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
            required: true
        },
        {
            label: 'Skills',
            type: 'checkbox',
            options: ['Acting', 'Dancing', 'Singing', 'Comedy', 'Drama'],
            required: false
        },
        {
            label: 'Bio',
            type: 'textarea',
            required: false
        }
    ];
    
    console.log('[DEBUG] Test form structure:', testFormStructure);
    displayCustomForm(testFormStructure);
}

// Add test function to window for debugging
window.createTestCustomForm = createTestCustomForm;

// Event Creator Management Functions
async function openEventDashboard(eventId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to access event management');
            return;
        }

        // Open event dashboard in new tab
        window.open(`/event-dashboard.html?eventId=${eventId}`, '_blank');
    } catch (error) {
        console.error('Error opening event dashboard:', error);
        alert('Error opening event dashboard');
    }
}

async function downloadEventData(eventId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to download event data');
            return;
        }

        // Show loading message
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Exporting...';
        button.disabled = true;

        const response = await fetch(`/api/events/${eventId}/export-registrations?format=csv`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `event-${eventId}-registrations.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            // Show success message
            showNotification('Event data exported successfully!');
        } else {
            throw new Error('Failed to export data');
        }
    } catch (error) {
        console.error('Error downloading event data:', error);
        alert('Error downloading event data');
    } finally {
        // Reset button
        const button = event.target;
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

async function downloadEventFiles(eventId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in to download files');
            return;
        }

        // Show loading message
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
        button.disabled = true;

        const response = await fetch(`/api/events/${eventId}/registrations-with-files`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            let downloadCount = 0;

            data.registrations.forEach(registration => {
                registration.uploadedFiles.forEach(file => {
                    const link = document.createElement('a');
                    link.href = file.downloadUrl;
                    link.download = `${registration.name}-${file.originalName}`;
                    link.click();
                    downloadCount++;
                });
            });

            if (downloadCount > 0) {
                showNotification(`Downloaded ${downloadCount} files!`);
            } else {
                showNotification('No files to download');
            }
        } else {
            throw new Error('Failed to download files');
        }
    } catch (error) {
        console.error('Error downloading event files:', error);
        alert('Error downloading event files');
    } finally {
        // Reset button
        const button = event.target;
        button.innerHTML = originalText;
        button.disabled = false;
    }
}

// Global function to show notifications
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Make functions globally available
window.openEventDashboard = openEventDashboard;
window.downloadEventData = downloadEventData;
window.downloadEventFiles = downloadEventFiles;
window.showNotification = showNotification; 
