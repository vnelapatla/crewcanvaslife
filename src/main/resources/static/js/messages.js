document.addEventListener('DOMContentLoaded', async () => {
    // Initialize encryption system
    try {
        await window.messageEncryption.initialize();
        console.log('Encryption system initialized successfully');
    } catch (error) {
        console.error('Failed to initialize encryption:', error);
    }

    // Initialize chat area with enhanced animations
    const chatArea = document.querySelector('.chat-area');
    const messagesList = document.querySelector('.messages-list');

    // Initialize emoji picker functionality
    initializeEmojiPicker();

    // Add scroll to bottom button with Instagram-style animation
    const scrollButton = document.createElement('button');
    scrollButton.className = 'scroll-to-bottom';
    scrollButton.innerHTML = '<i class="fas fa-chevron-down"></i>';
    messagesList.appendChild(scrollButton);

    // Enhanced scroll functionality with smooth animations
    function scrollToBottom(smooth = true) {
        messagesList.scrollTo({
            top: messagesList.scrollHeight,
            behavior: smooth ? 'smooth' : 'auto'
        });
    }

    // Instagram-style scroll button visibility
    function checkScrollButton() {
        const isNearBottom = messagesList.scrollHeight - messagesList.scrollTop - messagesList.clientHeight < 100;
        scrollButton.classList.toggle('visible', !isNearBottom);
    }

    // Add enhanced scroll event listener
    messagesList.addEventListener('scroll', checkScrollButton);

    // Enhanced scroll button click with animation
    scrollButton.addEventListener('click', () => {
        scrollToBottom();
        scrollButton.style.transform = 'scale(0.9)';
        setTimeout(() => {
            scrollButton.style.transform = 'scale(1)';
        scrollButton.classList.remove('visible');
        }, 150);
    });

    // Enhanced search functionality with Instagram-style filtering
    const searchInput = document.querySelector('.search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
    const conversationItems = document.querySelectorAll('.conversation-item');
            
    conversationItems.forEach(item => {
                const name = item.querySelector('h4').textContent.toLowerCase();
                const matches = name.includes(searchTerm);
                
                item.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                if (matches) {
                    item.style.opacity = '1';
                    item.style.transform = 'translateX(0)';
                    item.style.display = 'flex';
                } else {
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(-20px)';
                    setTimeout(() => {
                        if (!name.includes(searchInput.value.toLowerCase())) {
                            item.style.display = 'none';
                        }
                    }, 300);
                }
            });
        });
    }

    // Instagram-style stat item animations
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
        });
        
        item.addEventListener('click', () => {
            item.style.transform = 'scale(0.95)';
            setTimeout(() => {
                item.style.transform = 'scale(1.05)';
                setTimeout(() => {
                item.style.transform = 'scale(1)';
                }, 100);
            }, 100);
        });
    });

    // Enhanced conversation handler with Instagram-style animations
    function initializeConversationHandlers() {
        const conversationItems = document.querySelectorAll('.conversation-item');
        const chatArea = document.querySelector('.chat-area');
        const messageInput = document.querySelector('.message-input');
        const backBtn = document.querySelector('.back-btn');
        
        // Debug: Check if elements exist
        console.log('Chat elements found:', {
            conversationItems: conversationItems.length,
            chatArea: !!chatArea,
            messageInput: !!messageInput,
            backBtn: !!backBtn
        });

        // If no elements found, try again after a short delay
        if (!chatArea || !messageInput || conversationItems.length === 0) {
            console.warn('Some elements not found, retrying in 500ms...');
            setTimeout(() => {
                initializeConversationHandlers();
            }, 500);
            return;
        }
        
        // Back button functionality
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                // Hide chat area
                if (chatArea && messageInput) {
                    chatArea.classList.remove('active');
                    messageInput.classList.remove('active');
                    
                    // Clear any inline styles
                    chatArea.style.display = '';
                    chatArea.style.opacity = '';
                    chatArea.style.transform = '';
                    
                    console.log('Chat area deactivated');
                }
                
                // Remove active state from all conversations
                conversationItems.forEach(conv => {
                    conv.classList.remove('active');
                    conv.style.transform = 'translateX(0) scale(1)';
                    conv.style.boxShadow = 'none';
                });
                
                // Add back button animation
                backBtn.style.transform = 'translateX(-5px) scale(0.9)';
                setTimeout(() => {
                    backBtn.style.transform = 'translateX(0) scale(1)';
                }, 150);
            });
        }
        
        conversationItems.forEach(item => {
            // Add hover effects
            item.addEventListener('mouseenter', () => {
                item.style.transform = 'translateX(12px) scale(1.02)';
                const img = item.querySelector('img');
                img.style.transform = 'scale(1.15) rotate(5deg)';
                
                // Add glow effect
                item.style.boxShadow = '0 8px 32px rgba(224, 64, 95, 0.2)';
            });
            
            item.addEventListener('mouseleave', () => {
                if (!item.classList.contains('active')) {
                    item.style.transform = 'translateX(0) scale(1)';
                    item.style.boxShadow = 'none';
                }
                const img = item.querySelector('img');
                img.style.transform = 'scale(1) rotate(0deg)';
            });
            
            item.addEventListener('click', () => {
                // Enhanced click animation
                item.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    // Remove active class from all items with animation
                    conversationItems.forEach(conv => {
                        conv.classList.remove('active');
                        conv.style.transform = 'translateX(0) scale(1)';
                        conv.style.boxShadow = 'none';
                    });

                    // Add active class to clicked item with enhanced animation
                    item.classList.add('active');
                    item.style.transform = 'translateX(12px) scale(1.02)';
                    item.style.boxShadow = '0 8px 32px rgba(224, 64, 95, 0.3)';
                    
                    // Show chat area with enhanced Instagram-style animation
                    if (chatArea && messageInput) {
                        // Remove any conflicting inline styles first
                        chatArea.style.display = '';
                        chatArea.style.opacity = '';
                        chatArea.style.transform = '';
                        
                        // Add active class (this will trigger CSS display: flex)
                        chatArea.classList.add('active');
                        messageInput.classList.add('active');
                        
                        // Force a reflow to ensure CSS is applied
                        chatArea.offsetHeight;
                        
                        console.log('Chat area activated:', chatArea.classList.contains('active'));
                    } else {
                        console.error('Chat area or message input not found!');
                    }
                    
                    // Update chat header with enhanced animations
            const userName = item.querySelector('h4').textContent;
            const userImg = item.querySelector('img').src;
            const chatHeader = document.querySelector('.chat-user-info');
            
            // Animate header update
            chatHeader.style.transform = 'translateY(-10px)';
                    chatHeader.style.opacity = '0.7';
                    
                    setTimeout(() => {
                        // Update header content
                        chatHeader.querySelector('h3').textContent = userName;
                        chatHeader.querySelector('.default-chat-icon').style.display = 'none';
                        
                        // Add user image to header if not exists
                        let headerImg = chatHeader.querySelector('img');
                        if (!headerImg) {
                            headerImg = document.createElement('img');
                            headerImg.alt = 'User';
                            chatHeader.insertBefore(headerImg, chatHeader.querySelector('div'));
                        }
                        headerImg.src = userImg;
                        headerImg.style.display = 'block';
                        
                        // Update status with animation
                        const statusElement = chatHeader.querySelector('.status');
                        statusElement.textContent = 'Active now';
                        statusElement.style.color = 'var(--instagram-green)';
                        
                        // Animate header back
                        chatHeader.style.transform = 'translateY(0)';
                        chatHeader.style.opacity = '1';
                        
                        // Clear messages and add Instagram-style welcome message
                        messagesList.innerHTML = `
                            <div class="no-messages">
                                <div style="width: 96px; height: 96px; margin: 0 auto 24px; background: var(--instagram-gradient); border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
                                    <i class="fas fa-paper-plane" style="font-size: 40px; color: white;"></i>
                                </div>
                                <p style="font-size: 24px; font-weight: 300; margin-bottom: 8px; color: var(--instagram-black);">Your conversation with ${userName}</p>
                                <p style="font-size: 14px; color: var(--instagram-gray);">Start the conversation by sending a message</p>
                            </div>
                        `;
                        
                        // Re-add scroll button
                        messagesList.appendChild(scrollButton);
                        
                        // Remove unread badge with animation
                        const unreadBadge = item.querySelector('.unread-badge');
                        if (unreadBadge) {
                            unreadBadge.style.transform = 'scale(0)';
                            unreadBadge.style.opacity = '0';
                            setTimeout(() => unreadBadge.remove(), 300);
                        }
                    }, 150);
                }, 100);
            });
        });
    }

    // Initialize conversation handlers with delay to ensure DOM is ready
    setTimeout(() => {
        initializeConversationHandlers();
    }, 100);

    // Backup: Simple direct event handler as fallback
    const setupSimpleHandler = () => {
        const conversations = document.querySelectorAll('.conversation-item');
        const chatArea = document.querySelector('.chat-area');
        const messageInput = document.querySelector('.message-input');
        
        console.log('Backup handler - Found elements:', {
            conversations: conversations.length,
            chatArea: !!chatArea,
            messageInput: !!messageInput
        });
        
        conversations.forEach(item => {
            item.addEventListener('click', () => {
                console.log('Conversation clicked!');
                
                if (chatArea) {
                    chatArea.style.display = 'flex';
                    chatArea.classList.add('active');
                    console.log('Chat area shown');
                }
                
                if (messageInput) {
                    messageInput.style.display = 'block';
                    messageInput.classList.add('active');
                    console.log('Message input shown');
                }
            });
        });
    };
    
    // Setup backup handler after a delay
    setTimeout(setupSimpleHandler, 200);

    // Test button handler for debugging
    setTimeout(() => {
        const testBtn = document.getElementById('testChatBtn');
        if (testBtn) {
            console.log('✅ Test button found! Setting up click handler...');
            testBtn.onclick = function() {
                console.log('🔧 TEST BUTTON CLICKED!');
                
                const chatArea = document.querySelector('.chat-area');
                const messageInput = document.querySelector('.message-input');
                
                if (chatArea) {
                    console.log('Chat area found, making visible...');
                    chatArea.style.display = 'flex';
                    chatArea.style.opacity = '1';
                    chatArea.style.transform = 'translateX(0)';
                    chatArea.classList.add('active');
                } else {
                    console.log('Chat area NOT found');
                }
                
                if (messageInput) {
                    console.log('Message input found, making visible...');
                    messageInput.style.display = 'block';
                    messageInput.classList.add('active');
                } else {
                    console.log('Message input NOT found');
                }
            };
        } else {
            console.log('Test button NOT found');
        }
    }, 1000);

    // WhatsApp-style attachment menu functionality
    function initializeAttachmentMenu() {
        const attachBtn = document.querySelector('.attach-btn');
        const attachmentMenu = document.querySelector('.attachment-menu');
        const attachmentOptions = document.querySelectorAll('.attachment-option');
        let overlay;

        if (!attachBtn || !attachmentMenu) return;

        // Create overlay for closing menu
        overlay = document.createElement('div');
        overlay.className = 'attachment-overlay';
        document.body.appendChild(overlay);

        // Toggle attachment menu
        attachBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = attachmentMenu.classList.contains('show');
            
            if (isOpen) {
                closeAttachmentMenu();
            } else {
                openAttachmentMenu();
            }
        });

        // Close menu when clicking overlay
        overlay.addEventListener('click', closeAttachmentMenu);

        // Handle attachment option clicks
        attachmentOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = option.dataset.type;
                handleAttachmentType(type, option);
                closeAttachmentMenu();
            });

            // Add staggered animation entrance
            option.style.opacity = '0';
            option.style.transform = 'translateX(-20px)';
        });

        function openAttachmentMenu() {
            attachmentMenu.classList.add('show');
            attachBtn.classList.add('active');
            overlay.classList.add('show');
            
            // Staggered animation for options
            attachmentOptions.forEach((option, index) => {
                setTimeout(() => {
                    option.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                    option.style.opacity = '1';
                    option.style.transform = 'translateX(0)';
                }, index * 50);
            });
        }

        function closeAttachmentMenu() {
            attachmentMenu.classList.remove('show');
            attachBtn.classList.remove('active');
            overlay.classList.remove('show');
            
            // Reset options animation
            attachmentOptions.forEach(option => {
                option.style.opacity = '0';
                option.style.transform = 'translateX(-20px)';
            });
        }

        function handleAttachmentType(type, option) {
            // Add click animation
            option.style.transform = 'scale(0.95)';
            setTimeout(() => {
                option.style.transform = 'translateX(0)';
            }, 150);
            
            switch(type) {
                case 'image':
                    document.getElementById('imageInput').click();
                    break;
                case 'video':
                    document.getElementById('videoInput').click();
                    break;
                case 'document':
                    document.getElementById('documentInput').click();
                    break;
                case 'audio':
                    document.getElementById('audioInput').click();
                    break;
                case 'camera':
                    // For camera, we'll use the image input with capture attribute
                    const cameraInput = document.createElement('input');
                    cameraInput.type = 'file';
                    cameraInput.accept = 'image/*';
                    cameraInput.capture = 'environment';
                    cameraInput.style.display = 'none';
                    document.body.appendChild(cameraInput);
                    cameraInput.click();
                    cameraInput.addEventListener('change', (e) => {
                        handleFileSelection(e.target.files, 'camera');
                        document.body.removeChild(cameraInput);
                    });
                    break;
                case 'location':
                    handleLocationShare();
                    break;
                default:
                    console.log('Attachment type:', type);
            }
        }

        // Handle file input changes
        const fileInputs = ['imageInput', 'videoInput', 'documentInput', 'audioInput'];
        fileInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', (e) => {
                    const type = inputId.replace('Input', '');
                    handleFileSelection(e.target.files, type);
                });
            }
        });

        function handleFileSelection(files, type) {
            if (files.length > 0) {
                const fileList = Array.from(files);
                
                // Validate files based on type
                const validFiles = validateFiles(fileList, type);
                
                if (validFiles.length > 0) {
                    showFilePreview(validFiles, type);
                } else {
                    showErrorNotification(`Invalid ${type} files selected. Please try again.`);
                }
            }
        }

        function validateFiles(files, type) {
            const validFiles = [];
            const maxSizes = {
                image: 10 * 1024 * 1024, // 10MB
                video: 100 * 1024 * 1024, // 100MB
                document: 50 * 1024 * 1024, // 50MB
                audio: 20 * 1024 * 1024 // 20MB
            };

            const allowedTypes = {
                image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
                video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
                document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
                audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac']
            };

            files.forEach(file => {
                const isValidType = allowedTypes[type]?.includes(file.type) || type === 'camera';
                const isValidSize = file.size <= maxSizes[type];

                if (isValidType && isValidSize) {
                    validFiles.push(file);
                }
            });

            return validFiles;
        }

        function showFilePreview(files, type) {
            // Create an enhanced file preview modal
            const modal = document.createElement('div');
            modal.className = 'file-preview-modal';
            
            const filePreviewsHTML = files.map((file, index) => {
                const fileSize = formatFileSize(file.size);
                let previewContent = '';
                
                if (type === 'image' || type === 'camera') {
                    const imageUrl = URL.createObjectURL(file);
                    previewContent = `<img src="${imageUrl}" alt="${file.name}" class="file-preview-image">`;
                } else if (type === 'video') {
                    const videoUrl = URL.createObjectURL(file);
                    previewContent = `<video src="${videoUrl}" controls class="file-preview-video"></video>`;
                } else if (type === 'audio') {
                    const audioUrl = URL.createObjectURL(file);
                    previewContent = `<audio src="${audioUrl}" controls class="file-preview-audio"></audio>`;
                } else {
                    previewContent = `<div class="file-preview-document">
                        <i class="fas fa-${getFileIcon(type)}"></i>
                        <span>${file.name}</span>
                    </div>`;
                }
                
                return `
                    <div class="file-preview-item" data-index="${index}">
                        ${previewContent}
                        <div class="file-info">
                            <p class="file-name">${file.name}</p>
                            <p class="file-size">${fileSize}</p>
                        </div>
                        <button class="remove-file" data-index="${index}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }).join('');

            modal.innerHTML = `
                <div class="file-preview-overlay"></div>
                <div class="file-preview-content">
                    <div class="file-preview-header">
                        <h3>Send ${files.length} ${type}${files.length > 1 ? 's' : ''}</h3>
                        <button class="file-preview-close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="file-preview-list">
                        ${filePreviewsHTML}
                    </div>
                    <div class="file-preview-actions">
                        <input type="text" class="file-caption" placeholder="Add a caption...">
                        <div class="file-action-buttons">
                            <button class="btn-cancel">Cancel</button>
                            <button class="btn-send">
                                <i class="fas fa-paper-plane"></i>
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Add event listeners
            const closeBtn = modal.querySelector('.file-preview-close');
            const cancelBtn = modal.querySelector('.btn-cancel');
            const sendBtn = modal.querySelector('.btn-send');
            const overlay = modal.querySelector('.file-preview-overlay');
            
            // Close modal events
            [closeBtn, cancelBtn, overlay].forEach(element => {
                element.addEventListener('click', () => {
                    modal.remove();
                    // Clean up object URLs
                    files.forEach(file => {
                        if (file.type.startsWith('image/') || file.type.startsWith('video/') || file.type.startsWith('audio/')) {
                            URL.revokeObjectURL(URL.createObjectURL(file));
                        }
                    });
                });
            });

            // Remove individual files
            modal.querySelectorAll('.remove-file').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const index = parseInt(e.target.closest('.remove-file').dataset.index);
                    files.splice(index, 1);
                    e.target.closest('.file-preview-item').remove();
                    
                    // Update header
                    modal.querySelector('.file-preview-header h3').textContent = 
                        `Send ${files.length} ${type}${files.length > 1 ? 's' : ''}`;
                    
                    // Close modal if no files left
                    if (files.length === 0) {
                        modal.remove();
                    }
                });
            });

            // Send files
            sendBtn.addEventListener('click', () => {
                const caption = modal.querySelector('.file-caption').value.trim();
                sendFiles(files, type, caption);
                modal.remove();
            });

        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function sendFiles(files, type, caption) {
            // Create file message in chat
            const messagesList = document.querySelector('.messages-list');
            if (!messagesList) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent file-message';
            
            const filesHTML = files.map(file => {
                if (type === 'image' || type === 'camera') {
                    const imageUrl = URL.createObjectURL(file);
                    return `<img src="${imageUrl}" alt="${file.name}" class="message-image">`;
                } else if (type === 'video') {
                    const videoUrl = URL.createObjectURL(file);
                    return `<video src="${videoUrl}" controls class="message-video"></video>`;
                } else if (type === 'audio') {
                    const audioUrl = URL.createObjectURL(file);
                    return `<audio src="${audioUrl}" controls class="message-audio"></audio>`;
                } else {
                    return `<div class="message-document">
                        <i class="fas fa-${getFileIcon(type)}"></i>
                        <span>${file.name}</span>
                        <small>${formatFileSize(file.size)}</small>
                    </div>`;
                }
            }).join('');

            messageDiv.innerHTML = `
                <div class="message-content">
                    <div class="file-attachments">
                        ${filesHTML}
                    </div>
                    ${caption ? `<p class="file-caption">${caption}</p>` : ''}
                    <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            `;

            messagesList.appendChild(messageDiv);
            
            // Scroll to bottom
            messagesList.scrollTop = messagesList.scrollHeight;
            
            // Show success notification
            showSuccessNotification(`${files.length} ${type}${files.length > 1 ? 's' : ''} sent successfully!`);
        }

        function showSuccessNotification(message) {
            const notification = createNotification(message, 'success');
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }

        function showErrorNotification(message) {
            const notification = createNotification(message, 'error');
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 4000);
        }

        function createNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                    <span>${message}</span>
                </div>
            `;

            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'success' ? '#20C997' : '#E74C3C'};
                color: white;
                border-radius: 8px;
                padding: 12px 16px;
                max-width: 300px;
                z-index: 10000;
                animation: slideInNotification 0.3s ease-out;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            `;

            return notification;
        }

        function getFileIcon(type) {
            const icons = {
                image: 'image',
                video: 'video',
                document: 'file-alt',
                audio: 'volume-up',
                camera: 'camera'
            };
            return icons[type] || 'file';
        }

        function handleLocationShare() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        showLocationPreview(latitude, longitude);
                    },
                    (error) => {
                        console.error('Location error:', error);
                        showLocationError();
                    }
                );
            } else {
                showLocationError();
            }
        }

        function showLocationPreview(lat, lon) {
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="background: var(--instagram-white); border-radius: 12px; padding: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15); position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 300px; border-left: 4px solid var(--instagram-green);">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--instagram-green); display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; color: var(--instagram-black); font-size: 14px;">Location Shared</h4>
                            <p style="margin: 4px 0 0 0; color: var(--instagram-gray); font-size: 12px;">Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => document.body.removeChild(notification), 3000);
        }

        function showLocationError() {
            const notification = document.createElement('div');
            notification.innerHTML = `
                <div style="background: var(--instagram-white); border-radius: 12px; padding: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15); position: fixed; top: 20px; right: 20px; z-index: 10000; max-width: 300px; border-left: 4px solid #FF6B6B;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: #FF6B6B; display: flex; align-items: center; justify-content: center; color: white;">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div>
                            <h4 style="margin: 0; color: var(--instagram-black); font-size: 14px;">Location Unavailable</h4>
                            <p style="margin: 4px 0 0 0; color: var(--instagram-gray); font-size: 12px;">Please enable location access</p>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(notification);
            setTimeout(() => document.body.removeChild(notification), 3000);
        }
    }

    // Initialize attachment menu
    initializeAttachmentMenu();

    function initializeMessageInput(container) {
        const messageInput = container.querySelector('.message-input-field');
        const sendButton = container.querySelector('.send-btn');
        const attachButton = container.querySelector('.attach-btn');
        
        // Flag to prevent duplicate sends
        let isSending = false;

        console.log('Initializing message input with elements:', {
            container: !!container,
            messageInput: !!messageInput,
            sendButton: !!sendButton,
            attachButton: !!attachButton
        });

        if (!messageInput || !sendButton) {
            console.error('Message input elements not found!');
            return;
        }

        // Add input animation
        messageInput.addEventListener('input', () => {
            if (messageInput.value.length > 0) {
                sendButton.style.transform = 'scale(1.1)';
                sendButton.style.color = 'var(--primary-color)';
            } else {
                sendButton.style.transform = 'scale(1)';
                sendButton.style.color = 'var(--text-secondary)';
            }
        });

        function showTypingIndicator() {
            const typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = `
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            `;
            messagesList.insertBefore(typingIndicator, scrollButton);
            scrollToBottom();
            return typingIndicator;
        }

        async function sendMessage() {
            console.log('Send message function called!');
            
            // Prevent multiple simultaneous sends
            if (isSending || sendButton.disabled) {
                console.log('Message already being sent, ignoring click');
                return;
            }
            
            const message = messageInput.value.trim();
            console.log('Message content:', message);
            
            if (message) {
                // Set sending flag and disable button
                isSending = true;
                sendButton.disabled = true;
                sendButton.style.opacity = '0.5';
                
                const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                // Animate send button
                sendButton.style.transform = 'scale(0.9) rotate(-5deg)';
                setTimeout(() => {
                    sendButton.style.transform = 'scale(1) rotate(0deg)';
                    sendButton.style.color = 'var(--text-secondary)';
                }, 150);
                
                // Get current chat user ID
                const currentChatUserId = document.querySelector('.chat-user-info')?.dataset?.userId;
                console.log('Current chat user ID:', currentChatUserId);
                
                if (!currentChatUserId) {
                    showErrorNotification('No recipient selected. Please select a conversation first.');
                    // Re-enable send button
                    sendButton.disabled = false;
                    sendButton.style.opacity = '1';
                    isSending = false; // Reset sending flag
                    return;
                }

                try {
                    let encryptedMessage = message;
                    let signature = null;
                    let isEncrypted = false;

                    // Try to use encryption if available
                    if (window.messageEncryption && window.messageEncryption.hasKeys) {
                        try {
                            // Initialize encryption if not already done
                            if (!window.messageEncryption.hasKeys()) {
                                await window.messageEncryption.initialize();
                            }

                            // Get recipient's public key
                            const recipientPublicKey = await window.messageEncryption.getUserPublicKey(currentChatUserId);
                            
                            // Derive shared key
                            const keys = window.messageEncryption.loadKeys();
                            const myPrivateKey = await window.messageEncryption.importPrivateKey(keys.privateKey);
                            const sharedKey = await window.messageEncryption.deriveSharedKey(recipientPublicKey, myPrivateKey);
                            
                            // Encrypt the message
                            encryptedMessage = await window.messageEncryption.encryptMessage(message, sharedKey);
                            
                            // Sign the message
                            signature = await window.messageEncryption.signMessage(message, myPrivateKey);
                            isEncrypted = true;
                        } catch (encryptionError) {
                            console.warn('Encryption failed, sending unencrypted message:', encryptionError);
                            // Continue with unencrypted message
                        }
                    }

                    console.log('Sending message to backend...');
                    // Send message to backend
                    const response = await fetch('https://api.crewcanvas.in/api/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({
                            receiverId: currentChatUserId,
                            content: encryptedMessage,
                            isEncrypted: isEncrypted,
                            signature: signature
                        })
                    });

                    console.log('Backend response status:', response.status);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Failed to send message');
                    }

                    const sentMessage = await response.json();
                    console.log('Message sent successfully:', sentMessage);

                    // Create message element
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message sent';
                    messageElement.dataset.messageId = sentMessage.id;
                    messageElement.innerHTML = `
                        <div class="message-content">
                            <p>${message}</p>
                            <span class="message-time">${time}</span>
                            <div class="message-status">
                                <i class="fas fa-check-double" style="color: #4CAF50;"></i>
                                ${isEncrypted ? '<span class="encryption-badge">🔒</span>' : ''}
                            </div>
                        </div>
                    `;
                    
                    // Add message with animation
                    messageElement.style.opacity = '0';
                    messageElement.style.transform = 'scale(0.8)';
                    messagesList.insertBefore(messageElement, scrollButton);
                    
                    // Trigger animation
                    requestAnimationFrame(() => {
                        messageElement.style.opacity = '1';
                        messageElement.style.transform = 'scale(1)';
                    });
                    
                    messageInput.value = '';
                    scrollToBottom();
                    
                    showSuccessNotification(isEncrypted ? 'Message sent securely! 🔒' : 'Message sent!');

                } catch (error) {
                    console.error('Error sending message:', error);
                    showErrorNotification('Failed to send message: ' + error.message);
                    
                    // Show message as failed
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message sent failed';
                    messageElement.innerHTML = `
                        <div class="message-content">
                            <p>${message}</p>
                            <span class="message-time">${time}</span>
                            <div class="message-status">
                                <i class="fas fa-exclamation-triangle" style="color: #f44336;"></i>
                                <span class="error-text">Failed to send</span>
                            </div>
                        </div>
                    `;
                    
                    messagesList.insertBefore(messageElement, scrollButton);
                    scrollToBottom();
                } finally {
                    // Re-enable send button
                    sendButton.disabled = false;
                    sendButton.style.opacity = '1';
                    isSending = false; // Reset sending flag
                }
            }
        }

        console.log('Setting up event listeners for send button and input...');
        sendButton.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        attachButton.addEventListener('click', () => {
            attachButton.style.transform = 'rotate(45deg)';
            setTimeout(() => attachButton.style.transform = 'rotate(0deg)', 300);
            // Here you would implement file attachment functionality
            alert('File attachment feature coming soon!');
        });

        // Add message input focus animation
        messageInput.addEventListener('focus', () => {
            container.style.transform = 'translateY(-2px)';
            container.style.boxShadow = '0 -5px 15px rgba(0, 0, 0, 0.1)';
        });

        messageInput.addEventListener('blur', () => {
            container.style.transform = 'translateY(0)';
            container.style.boxShadow = 'none';
        });

        // Add placeholder animation
        messageInput.addEventListener('focus', () => {
            messageInput.placeholder = 'Type your message...';
        });

        messageInput.addEventListener('blur', () => {
            if (!messageInput.value) {
                messageInput.placeholder = 'Type your message...';
            }
        });

        console.log('Message input initialization completed!');
    }

    // Initialize message input functionality
    const messageInputContainer = document.querySelector('.message-input');
    if (messageInputContainer) {
        initializeMessageInput(messageInputContainer);
    }

    // Fallback: Direct event listener setup
    // COMMENTED OUT TO PREVENT DUPLICATE MESSAGES
    /*
    setTimeout(() => {
        const sendButton = document.querySelector('.send-btn');
        const messageInput = document.querySelector('.message-input-field');
        
        console.log('Fallback: Checking for send button and input:', {
            sendButton: !!sendButton,
            messageInput: !!messageInput
        });
        
        if (sendButton && messageInput) {
            console.log('Setting up fallback event listeners...');
            
            // Remove any existing listeners to avoid duplicates
            sendButton.replaceWith(sendButton.cloneNode(true));
            const newSendButton = document.querySelector('.send-btn');
            
            newSendButton.addEventListener('click', async () => {
                console.log('Fallback send button clicked!');
                const message = messageInput.value.trim();
                console.log('Fallback message content:', message);
                
                if (message) {
                    // Get current chat user ID
                    const currentChatUserId = document.querySelector('.chat-user-info')?.dataset?.userId;
                    console.log('Fallback current chat user ID:', currentChatUserId);
                    
                    if (!currentChatUserId) {
                        showErrorNotification('No recipient selected. Please select a conversation first.');
                        return;
                    }

                    try {
                        // Send message to backend (unencrypted for fallback)
                        const response = await fetch('https://api.crewcanvas.in/api/messages', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({
                                receiverId: currentChatUserId,
                                content: message,
                                isEncrypted: false,
                                signature: null
                            })
                        });

                        console.log('Fallback backend response status:', response.status);
                        if (!response.ok) {
                            const errorData = await response.json();
                            throw new Error(errorData.message || 'Failed to send message');
                        }

                        const sentMessage = await response.json();
                        console.log('Fallback message sent successfully:', sentMessage);

                        // Create message element
                        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const messageElement = document.createElement('div');
                        messageElement.className = 'message sent';
                        messageElement.dataset.messageId = sentMessage.id;
                        messageElement.innerHTML = `
                            <div class="message-content">
                                <p>${message}</p>
                                <span class="message-time">${time}</span>
                                <div class="message-status">
                                    <i class="fas fa-check-double" style="color: #4CAF50;"></i>
                                </div>
                            </div>
                        `;
                        
                        // Add message to chat
                        const messagesList = document.querySelector('.messages-list');
                        if (messagesList) {
                            messagesList.appendChild(messageElement);
                            messagesList.scrollTop = messagesList.scrollHeight;
                        }
                        
                        messageInput.value = '';
                        showSuccessNotification('Message sent!');
                        
                    } catch (error) {
                        console.error('Fallback error sending message:', error);
                        showErrorNotification('Failed to send message: ' + error.message);
                    }
                }
            });
            
            // Also add Enter key listener
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    newSendButton.click();
                }
            });
            
            console.log('Fallback event listeners set up successfully!');
        }
    }, 2000); // Wait 2 seconds for everything to load
    */

    // Notification functions
    function showSuccessNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    function showErrorNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification error';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }

    // Enhanced mobile view handling
    const handleMobileView = () => {
        const conversationsList = document.querySelector('.conversations-list');
        if (window.innerWidth <= 768) {
            conversationsList.classList.remove('active');
        } else {
            conversationsList.classList.add('active');
        }
    };

    window.addEventListener('resize', handleMobileView);
    handleMobileView();

    // Add message input focus animation
    const messageInput = document.querySelector('.message-input-field');
    if (messageInput) {
        messageInput.addEventListener('focus', () => {
            messageInput.parentElement.style.transform = 'translateY(-2px)';
        });

        messageInput.addEventListener('blur', () => {
            messageInput.parentElement.style.transform = 'translateY(0)';
        });
    }

    // Add message hover effects
    const messages = document.querySelectorAll('.message');
    messages.forEach(message => {
        message.addEventListener('mouseenter', () => {
            message.style.transform = 'scale(1.02)';
            const content = message.querySelector('.message-content');
            if (content) {
                content.style.transform = 'scale(1.02)';
            }
        });
        
        message.addEventListener('mouseleave', () => {
            message.style.transform = 'scale(1)';
            const content = message.querySelector('.message-content');
            if (content) {
                content.style.transform = 'scale(1)';
            }
        });
    });

    // Add profile image hover effects
    const profileImages = document.querySelectorAll('.conversation-item img, .chat-user-info img');
    profileImages.forEach(img => {
        img.addEventListener('mouseenter', () => {
            img.style.transform = 'scale(1.1) rotate(5deg)';
        });
        
        img.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // Add smooth scroll to bottom when new message arrives
    const observer = new MutationObserver(() => {
        messagesList.scrollTo({
            top: messagesList.scrollHeight,
            behavior: 'smooth'
        });
    });

    observer.observe(messagesList, { childList: true });

    // Add message read status animation
    const readStatuses = document.querySelectorAll('.read-status');
    readStatuses.forEach(status => {
        status.addEventListener('click', () => {
            status.style.transform = 'scale(1.2)';
            setTimeout(() => status.style.transform = 'scale(1)', 150);
        });
    });

    // Add message reaction functionality
    const messageElements = document.querySelectorAll('.message');
    messageElements.forEach(message => {
        message.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            
            // Remove existing reaction menu
            const existingMenu = document.querySelector('.reaction-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
            
            // Create reaction menu
            const reactionMenu = document.createElement('div');
            reactionMenu.className = 'reaction-menu';
            reactionMenu.innerHTML = `
                <span>👍</span>
                <span>❤️</span>
                <span>😂</span>
                <span>😮</span>
                <span>😢</span>
            `;
            message.appendChild(reactionMenu);
            
            // Position the menu
            const rect = message.getBoundingClientRect();
            reactionMenu.style.top = `${rect.top - 40}px`;
            reactionMenu.style.left = `${rect.left}px`;
            
            // Remove menu on click outside
            document.addEventListener('click', function removeMenu(e) {
                if (!reactionMenu.contains(e.target)) {
                    reactionMenu.remove();
                    document.removeEventListener('click', removeMenu);
                }
            });
        });
    });

    // Function to load and decrypt messages
    async function loadMessages(userId) {
        try {
            const response = await fetch(`https://api.crewcanvas.in/api/messages/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load messages');
            }

            const messages = await response.json();
            const messagesList = document.querySelector('.messages-list');
            
            // Clear existing messages
            const existingMessages = messagesList.querySelectorAll('.message');
            existingMessages.forEach(msg => msg.remove());

            // Process each message
            for (const message of messages) {
                let displayContent = message.content;
                let isDecrypted = false;

                // If message is encrypted, try to decrypt it
                if (message.is_encrypted) {
                    try {
                        // Get sender's public key
                        const senderPublicKey = await window.messageEncryption.getUserPublicKey(message.sender_id);
                        
                        // Derive shared key
                        const keys = window.messageEncryption.loadKeys();
                        const myPrivateKey = await window.messageEncryption.importPrivateKey(keys.privateKey);
                        const sharedKey = await window.messageEncryption.deriveSharedKey(senderPublicKey, myPrivateKey);
                        
                        // Decrypt the message
                        displayContent = await window.messageEncryption.decryptMessage(message.content, sharedKey);
                        isDecrypted = true;
                    } catch (decryptError) {
                        console.error('Failed to decrypt message:', decryptError);
                        displayContent = '[Encrypted message - unable to decrypt]';
                    }
                }

                // Create message element
                const messageElement = document.createElement('div');
                messageElement.className = `message ${message.sender_id === getCurrentUserId() ? 'sent' : 'received'}`;
                messageElement.dataset.messageId = message.id;
                
                const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                if (message.sender_id === getCurrentUserId()) {
                    // Sent message
                    messageElement.innerHTML = `
                        <div class="message-content">
                            <p>${displayContent}</p>
                            <span class="message-time">${time}</span>
                            <div class="message-status">
                                <i class="fas fa-check-double" style="color: #4CAF50;"></i>
                                ${isDecrypted ? '<span class="encryption-badge">🔒</span>' : ''}
                            </div>
                        </div>
                    `;
                } else {
                    // Received message
                    const senderImg = document.querySelector('.chat-user-info img')?.src || '/images/profile.jpg';
                    messageElement.innerHTML = `
                        <img src="${senderImg}" alt="User">
                        <div class="message-content">
                            <p>${displayContent}</p>
                            <span class="message-time">${time}</span>
                            ${isDecrypted ? '<span class="encryption-badge">🔒</span>' : ''}
                        </div>
                    `;
                }

                messagesList.appendChild(messageElement);
            }

            scrollToBottom();
        } catch (error) {
            console.error('Error loading messages:', error);
            showErrorNotification('Failed to load messages');
        }
    }

    // Helper function to get current user ID
    function getCurrentUserId() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.id;
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
        return null;
    }

    // Update conversation handler to load messages
    const originalConversationHandler = window.loadConversation;
    if (originalConversationHandler) {
        window.loadConversation = async function(userId, userName, userPicture) {
            // Call original handler
            originalConversationHandler(userId, userName, userPicture);
            
            // Load and decrypt messages
            await loadMessages(userId);
        };
    }
});

// Emoji Picker Functionality
function initializeEmojiPicker() {
    const emojiBtn = document.querySelector('.emoji-btn');
    const emojiPicker = document.querySelector('.emoji-picker');
    const emojiCategories = document.querySelectorAll('.emoji-category');
    const emojiCategoryContents = document.querySelectorAll('.emoji-category-content');
    const emojiItems = document.querySelectorAll('.emoji-item');
    const messageInput = document.querySelector('.text-input-container input');

    if (!emojiBtn || !emojiPicker) return;

    // Toggle emoji picker
    emojiBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        emojiPicker.classList.toggle('show');
    });

    // Category switching
    emojiCategories.forEach(category => {
        category.addEventListener('click', () => {
            const targetCategory = category.dataset.category;
            
            // Update active category button
            emojiCategories.forEach(cat => cat.classList.remove('active'));
            category.classList.add('active');
            
            // Show corresponding emoji content
            emojiCategoryContents.forEach(content => {
                content.classList.remove('active');
                if (content.dataset.category === targetCategory) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Emoji selection
    emojiItems.forEach(emoji => {
        emoji.addEventListener('click', () => {
            if (messageInput) {
                const cursorPos = messageInput.selectionStart;
                const textBefore = messageInput.value.substring(0, cursorPos);
                const textAfter = messageInput.value.substring(cursorPos);
                
                messageInput.value = textBefore + emoji.textContent + textAfter;
                messageInput.focus();
                
                // Set cursor position after the inserted emoji
                const newCursorPos = cursorPos + emoji.textContent.length;
                messageInput.setSelectionRange(newCursorPos, newCursorPos);
            }
            
            // Close emoji picker after selection
            emojiPicker.classList.remove('show');
        });
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.classList.remove('show');
        }
    });

    // Close emoji picker on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            emojiPicker.classList.remove('show');
        }
    });
}

const logo = document.querySelector('.sidebar .logo');
if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
        window.location.href = 'feed.html';
    });
}
