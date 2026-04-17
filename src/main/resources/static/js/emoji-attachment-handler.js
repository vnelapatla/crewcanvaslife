// Emoji and Attachment Handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Emoji and Attachment handler loaded');
    
    // Wait for DOM to be ready
    setTimeout(function() {
        initializeEmojiPicker();
        initializeAttachmentMenu();
    }, 1500); // Wait longer to ensure chat area is loaded
});

function initializeEmojiPicker() {
    const emojiBtn = document.querySelector('.emoji-btn');
    const emojiPicker = document.querySelector('.emoji-picker');
    const emojiCategories = document.querySelectorAll('.emoji-category');
    const emojiCategoryContents = document.querySelectorAll('.emoji-category-content');
    const emojiItems = document.querySelectorAll('.emoji-item');
    const messageInput = document.querySelector('.text-input-container input');

    console.log('Emoji elements found:', {
        emojiBtn: !!emojiBtn,
        emojiPicker: !!emojiPicker,
        categories: emojiCategories.length,
        items: emojiItems.length,
        messageInput: !!messageInput
    });

    if (!emojiBtn || !emojiPicker) {
        console.log('Emoji elements not found, retrying...');
        setTimeout(initializeEmojiPicker, 1000);
        return;
    }

    // Toggle emoji picker
    emojiBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Emoji button clicked');
        emojiPicker.classList.toggle('show');
    });

    // Category switching
    emojiCategories.forEach(function(category) {
        category.addEventListener('click', function() {
            const targetCategory = category.dataset.category;
            console.log('Emoji category clicked:', targetCategory);
            
            // Update active category button
            emojiCategories.forEach(function(cat) {
                cat.classList.remove('active');
            });
            category.classList.add('active');
            
            // Show corresponding emoji content
            emojiCategoryContents.forEach(function(content) {
                content.classList.remove('active');
                if (content.dataset.category === targetCategory) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Emoji selection
    emojiItems.forEach(function(emoji) {
        emoji.addEventListener('click', function() {
            console.log('Emoji selected:', emoji.textContent);
            
            if (messageInput) {
                const cursorPos = messageInput.selectionStart || messageInput.value.length;
                const textBefore = messageInput.value.substring(0, cursorPos);
                const textAfter = messageInput.value.substring(cursorPos);
                
                messageInput.value = textBefore + emoji.textContent + textAfter;
                messageInput.focus();
                
                // Set cursor position after the inserted emoji
                const newCursorPos = cursorPos + emoji.textContent.length;
                messageInput.setSelectionRange(newCursorPos, newCursorPos);
                
                console.log('Emoji inserted into message input');
            }
            
            // Close emoji picker after selection
            emojiPicker.classList.remove('show');
        });
    });

    // Close emoji picker when clicking outside
    document.addEventListener('click', function(e) {
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.classList.remove('show');
        }
    });

    // Close emoji picker on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            emojiPicker.classList.remove('show');
        }
    });

    console.log('✅ Emoji picker initialized successfully');
}

function initializeAttachmentMenu() {
    const attachBtn = document.querySelector('.attach-btn');
    const attachmentMenu = document.querySelector('.attachment-menu');
    const attachmentOptions = document.querySelectorAll('.attachment-option');

    console.log('Attachment elements found:', {
        attachBtn: !!attachBtn,
        attachmentMenu: !!attachmentMenu,
        options: attachmentOptions.length
    });

    if (!attachBtn || !attachmentMenu) {
        console.log('Attachment elements not found, retrying...');
        setTimeout(initializeAttachmentMenu, 1000);
        return;
    }

    // Create overlay for closing menu
    let overlay = document.querySelector('.attachment-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'attachment-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'transparent';
        overlay.style.zIndex = '999';
        overlay.style.display = 'none';
        document.body.appendChild(overlay);
    }

    // Toggle attachment menu
    attachBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        console.log('Attachment button clicked');
        
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
    attachmentOptions.forEach(function(option) {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = option.dataset.type;
            console.log('Attachment option clicked:', type);
            handleAttachmentType(type);
            closeAttachmentMenu();
        });
    });

    function openAttachmentMenu() {
        console.log('Opening attachment menu');
        attachmentMenu.classList.add('show');
        attachBtn.classList.add('active');
        overlay.style.display = 'block';
        
        // Staggered animation for options
        attachmentOptions.forEach(function(option, index) {
            setTimeout(function() {
                option.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                option.style.opacity = '1';
                option.style.transform = 'translateX(0)';
            }, index * 50);
        });
    }

    function closeAttachmentMenu() {
        console.log('Closing attachment menu');
        attachmentMenu.classList.remove('show');
        attachBtn.classList.remove('active');
        overlay.style.display = 'none';
    }

    function handleAttachmentType(type) {
        console.log('Handling attachment type:', type);
        
        switch(type) {
            case 'image':
                console.log('Opening image picker');
                createFileInput('image/*', type);
                break;
            case 'video':
                console.log('Opening video picker');
                createFileInput('video/*', type);
                break;
            case 'document':
                console.log('Opening document picker');
                createFileInput('.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx', type);
                break;
            case 'audio':
                console.log('Opening audio picker');
                createFileInput('audio/*', type);
                break;
            case 'camera':
                console.log('Opening camera');
                createFileInput('image/*', type, true);
                break;
            case 'location':
                console.log('Sharing location');
                handleLocationShare();
                break;
            default:
                console.log('Unknown attachment type:', type);
        }
    }

    function createFileInput(accept, type, useCamera = false) {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = accept;
        if (useCamera) {
            fileInput.capture = 'environment';
        }
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                console.log('Files selected:', e.target.files.length);
                handleFileSelection(Array.from(e.target.files), type);
            }
            document.body.removeChild(fileInput);
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
    }

    function handleFileSelection(files, type) {
        console.log('Processing files:', files.length, 'type:', type);
        
        // Simple file preview and send
        const messagesList = document.querySelector('.messages-list');
        if (!messagesList) {
            console.error('Messages list not found');
            return;
        }

        files.forEach(function(file) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent file-message';
            
            let fileContent = '';
            if (type === 'image' || type === 'camera') {
                const imageUrl = URL.createObjectURL(file);
                fileContent = `<img src="${imageUrl}" alt="${file.name}" style="max-width: 300px; max-height: 200px; border-radius: 12px; object-fit: cover;">`;
            } else if (type === 'video') {
                const videoUrl = URL.createObjectURL(file);
                fileContent = `<video src="${videoUrl}" controls style="max-width: 300px; max-height: 200px; border-radius: 12px;"></video>`;
            } else if (type === 'audio') {
                const audioUrl = URL.createObjectURL(file);
                fileContent = `<audio src="${audioUrl}" controls style="width: 250px;"></audio>`;
            } else {
                fileContent = `<div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #f5f5f5; border-radius: 12px; max-width: 250px;">
                    <i class="fas fa-file" style="font-size: 20px; color: #E4405F;"></i>
                    <div>
                        <div style="font-weight: 500;">${file.name}</div>
                        <div style="color: #666; font-size: 11px;">${formatFileSize(file.size)}</div>
                    </div>
                </div>`;
            }

            messageDiv.innerHTML = `
                <div class="message-content">
                    ${fileContent}
                    <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
            `;

            messagesList.appendChild(messageDiv);
            messagesList.scrollTop = messagesList.scrollHeight;
        });
        
        console.log('✅ Files processed and displayed');
    }

    function handleLocationShare() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const { latitude, longitude } = position.coords;
                    console.log('Location obtained:', latitude, longitude);
                    
                    const messagesList = document.querySelector('.messages-list');
                    if (messagesList) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message sent';
                        messageDiv.innerHTML = `
                            <div class="message-content">
                                <div style="padding: 12px 16px; background: #f5f5f5; border-radius: 12px; max-width: 250px;">
                                    <i class="fas fa-map-marker-alt" style="color: #E4405F; margin-right: 8px;"></i>
                                    <strong>Location Shared</strong><br>
                                    <small>Lat: ${latitude.toFixed(6)}, Lon: ${longitude.toFixed(6)}</small>
                                </div>
                                <span class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        `;
                        messagesList.appendChild(messageDiv);
                        messagesList.scrollTop = messagesList.scrollHeight;
                    }
                },
                function(error) {
                    console.error('Location error:', error);
                    alert('Unable to access location. Please enable location services.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    console.log('✅ Attachment menu initialized successfully');
} 
