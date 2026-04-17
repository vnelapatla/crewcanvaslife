document.addEventListener('DOMContentLoaded', function() {
    // Initialize the feed
    initializeFeed();

    // Add event listeners
    setupEventListeners();

    // Modal Elements
    const modal = document.getElementById('createPostModal');
    const closeModal = document.getElementById('closeModal');
    const cancelPost = document.getElementById('cancelPost');
    const createPostBtn = document.querySelector('.create-post-btn');
    const postForm = document.getElementById('createPostForm');

    // Post Type Elements
    const textArea = document.getElementById('postText');
    const imageUpload = document.querySelector('.image-upload');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const videoLinkInput = document.getElementById('videoLinkInput');

    // Open Modal
    createPostBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    });

    // Close Modal
    function closeModalFunc() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        resetForm();
    }

    closeModal.addEventListener('click', closeModalFunc);
    cancelPost.addEventListener('click', closeModalFunc);

    // Close modal when clicking outside
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModalFunc();
        }
    });

    // Show all form elements by default since there are no type buttons
    textArea.style.display = 'block';
    imageUpload.style.display = 'block';

    // Image Upload Handling
    const imageUploadArea = document.getElementById('imageUploadArea');
    imageUploadArea.addEventListener('click', () => imageInput.click());
    imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = 'var(--primary-gradient-start)';
    });
    imageUploadArea.addEventListener('dragleave', () => {
        imageUploadArea.style.borderColor = 'var(--border-color)';
    });
    imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = 'var(--border-color)';
        handleImageUpload(e.dataTransfer.files);
    });
    imageInput.addEventListener('change', (e) => handleImageUpload(e.target.files));

    // Video link handling - no file upload, just URL input

    // Handle Image Upload
    function handleImageUpload(files) {
        imagePreview.innerHTML = '';
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button class="remove-preview">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    imagePreview.appendChild(previewItem);

                    // Add remove functionality
                    const removeBtn = previewItem.querySelector('.remove-preview');
                    removeBtn.addEventListener('click', () => {
                        previewItem.remove();
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Handle Video Link (no file upload needed)
    function handleVideoLink(url) {
        // This function can be used to validate video URLs if needed
        return url;
    }

    // Form Submission
    postForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Form submission started in feed.js');
        
        const formData = new FormData();
        
        // Get description from text area
        const description = textArea.value.trim();
        console.log('Description from feed.js:', description);
        
        if (!description) {
            console.log('No description provided');
            showMessage('Please add a description for your post', 'error');
            return;
        }
        
        // Add description to form data
        formData.append('description', description);
        
        // Handle image upload if present
        if (imageInput.files.length > 0) {
            console.log('Image file found:', imageInput.files[0].name);
            formData.append('media', imageInput.files[0]);
        }
        
        // Handle video link if present
        const videoLink = videoLinkInput.value.trim();
        if (videoLink) {
            console.log('Video link found:', videoLink);
            formData.append('videoLink', videoLink);
        }
        
        // Log the complete FormData
        console.log('FormData contents:');
        for (let pair of formData.entries()) {
            console.log(pair[0] + ':', pair[1]);
        }
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('No authentication token found');
                throw new Error('Please log in to create a post');
            }

            // Add token validation debugging
            console.log('Token found in localStorage');
            try {
                // Check token format
                const tokenParts = token.split('.');
                if (tokenParts.length !== 3) {
                    console.error('Invalid token format');
                    throw new Error('Invalid token format');
                }

                // Decode and check token payload
                const payload = JSON.parse(atob(tokenParts[1]));
                const currentTime = Math.floor(Date.now() / 1000);
                
                console.log('Token payload:', {
                    exp: new Date(payload.exp * 1000),
                    currentTime: new Date(currentTime * 1000),
                    isExpired: payload.exp < currentTime
                });

                if (payload.exp < currentTime) {
                    console.error('Token has expired');
                    throw new Error('Session expired. Please log in again.');
                }
            } catch (error) {
                console.error('Token validation error:', error);
                throw new Error('Invalid authentication token. Please log in again.');
            }
            
            console.log('Sending request to /api/posts');
            const response = await fetch('/api/posts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);
            
            if (!response.ok) {
                throw new Error(responseData.message || 'Failed to create post');
            }
            
            // Close modal and reset form
            closeModalFunc();
            
            // Reload posts
            await loadPosts();
            
            // Show success message
            showMessage('Post created successfully!', 'success');
        } catch (error) {
            console.error('Error creating post:', error);
            showMessage(error.message || 'Failed to create post. Please try again.', 'error');
        }
    });

    // Reset Form
    function resetForm() {
        textArea.value = '';
        imagePreview.innerHTML = '';
        imageInput.value = '';
        videoLinkInput.value = '';
    }
});

function initializeFeed() {
    // This function will be used to load posts from the server
    // For now, we're using static content from the HTML
    console.log('Feed initialized');
}

function setupEventListeners() {
    // Create Post Button
    const createPostBtn = document.querySelector('.create-post-btn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', handleCreatePost);
    }

    // Like Buttons
    const likeButtons = document.querySelectorAll('.action-btn:nth-child(1)');
    likeButtons.forEach(button => {
        button.addEventListener('click', handleLike);
    });

    // Comment Buttons
    const commentButtons = document.querySelectorAll('.action-btn:nth-child(2)');
    commentButtons.forEach(button => {
        button.addEventListener('click', handleComment);
    });

    // Share Buttons
    const shareButtons = document.querySelectorAll('.action-btn:nth-child(3)');
    shareButtons.forEach(button => {
        button.addEventListener('click', handleShare);
    });
}

function handleCreatePost() {
    // This function will handle the creation of new posts
    console.log('Create post clicked');
    // TODO: Implement post creation modal/form
}

function handleLike(event) {
    const button = event.currentTarget;
    const icon = button.querySelector('i');
    
    // Toggle between regular and solid heart icon
    if (icon.classList.contains('far')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        button.style.color = '#e74c3c'; // Red color for liked state
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        button.style.color = ''; // Reset to default color
    }
}

function handleComment(event) {
    // This function will handle the comment functionality
    console.log('Comment clicked');
    // TODO: Implement comment functionality
}

function handleShare(event) {
    // This function will handle the share functionality
    console.log('Share clicked');
    // TODO: Implement share functionality
}

// Function to load more posts when scrolling
window.addEventListener('scroll', function() {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1000) {
        // Load more posts when user is near the bottom
        loadMorePosts();
    }
});

function loadMorePosts() {
    // This function will load more posts from the server
    console.log('Loading more posts...');
    // TODO: Implement infinite scroll functionality
} 

const logo = document.querySelector('.sidebar .logo');
if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
        window.location.href = 'feed.html';
    });
}

// Global variables
let currentUser = null;
let posts = [];
let isViewOnlyMode = false;
let sharedPostId = null;

// Check if we're in view-only mode (shared post link)
function checkViewOnlyMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const postParam = urlParams.get('post');
    
    if (postParam) {
        isViewOnlyMode = true;
        sharedPostId = postParam;
        console.log('🔒 View-only mode activated for post:', postParam);
        
        // Add view-only-mode class to body for CSS styling
        document.body.classList.add('view-only-mode');
        
        // Add a visual indicator that this is a shared post view
        addSharedPostIndicator();
        
        return true;
    }
    return false;
}

// Add visual indicator for shared post view
function addSharedPostIndicator() {
    const header = document.querySelector('.header');
    if (header) {
        const indicator = document.createElement('div');
        indicator.className = 'shared-post-indicator';
        indicator.innerHTML = `
            <div style="background: #ff6b35; color: white; padding: 8px 16px; text-align: center; font-size: 14px; border-radius: 4px; margin: 10px;">
                🔗 Viewing Shared Post
            </div>
        `;
        header.insertBefore(indicator, header.firstChild);
    }
    
    // Block navigation to other sections in view-only mode
    blockNavigationLinks();
}

// Block navigation links in view-only mode
function blockNavigationLinks() {
    // Block sidebar navigation links
    const sidebarLinks = document.querySelectorAll('.sidebar .nav-item');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPopup();
        });
    });
    
    // Block top navigation links
    const topNavLinks = document.querySelectorAll('.top-nav a');
    topNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPopup();
        });
    });
    
    // Block logo click
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPopup();
        });
    }
    
    // Block profile dropdown links
    const profileLinks = document.querySelectorAll('.profile-dropdown a');
    profileLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPopup();
        });
    });
    
    // Block any other navigation links
    const allNavLinks = document.querySelectorAll('a[href*=".html"]');
    allNavLinks.forEach(link => {
        // Don't block the current page or external links
        if (!link.href.includes('feed.html') && !link.href.includes('http')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showLoginPopup();
            });
        }
    });
}

// Show login popup
function showLoginPopup() {
    const popup = document.createElement('div');
    popup.className = 'login-popup-overlay';
    popup.innerHTML = `
        <div class="login-popup">
            <div class="login-popup-content">
                <h3>🔒 Login Required</h3>
                <p>You need to login to interact with this post.</p>
                <div class="login-popup-buttons">
                    <button class="btn btn-primary" id="loginNowBtn">
                        Login Now
                    </button>
                    <button class="btn btn-secondary" id="cancelLoginBtn">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#login-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'login-popup-styles';
        style.textContent = `
            .login-popup-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }
            .login-popup {
                background: white;
                border-radius: 10px;
                padding: 30px;
                text-align: center;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                animation: slideIn 0.3s ease;
            }
            .login-popup h3 {
                color: #ff6b35;
                margin-bottom: 15px;
                font-size: 1.5em;
            }
            .login-popup p {
                color: #666;
                margin-bottom: 20px;
                font-size: 1.1em;
            }
            .login-popup-buttons {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .btn {
                padding: 12px 24px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                font-size: 1em;
                transition: all 0.3s ease;
            }
            .btn-primary {
                background: #ff6b35;
                color: white;
            }
            .btn-primary:hover {
                background: #e55a2b;
                transform: translateY(-2px);
            }
            .btn-secondary {
                background: #6c757d;
                color: white;
            }
            .btn-secondary:hover {
                background: #5a6268;
                transform: translateY(-2px);
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { 
                    opacity: 0;
                    transform: translateY(-20px);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(popup);
    
    // Add event listeners after the popup is added to DOM
    const loginBtn = popup.querySelector('#loginNowBtn');
    const cancelBtn = popup.querySelector('#cancelLoginBtn');
    
    // Login button event listener
    loginBtn.addEventListener('click', () => {
        console.log('Login button clicked, redirecting to index.html');
        window.location.href = '/index.html';
    });
    
    // Cancel button event listener
    cancelBtn.addEventListener('click', () => {
        console.log('Cancel button clicked, closing popup');
        popup.remove();
    });
    
    // Close popup when clicking outside
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.remove();
        }
    });
    
    // Close popup with Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            popup.remove();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Modified loadPosts function for view-only mode
async function loadPosts() {
    try {
        let response;
        
        if (isViewOnlyMode) {
            // In view-only mode, fetch posts without authentication
            console.log('🔒 View-only mode: Fetching posts without auth');
            response = await fetch('/api/posts');
        } else {
            // Normal mode, use authentication
            const token = localStorage.getItem('token');
            response = await fetch('/api/posts', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
        
        if (response.ok) {
            posts = await response.json();
            console.log('📄 Fetched posts:', posts.length, 'posts');
            
            if (isViewOnlyMode) {
                // In view-only mode, only show the specific post
                console.log('🔍 Looking for post ID:', sharedPostId);
                const targetPost = posts.find(post => post.id == sharedPostId);
                if (targetPost) {
                    posts = [targetPost]; // Only show this post
                    console.log('✅ View-only mode: Found and showing post', sharedPostId);
                } else {
                    posts = []; // Post not found
                    console.log('❌ Post not found:', sharedPostId);
                    console.log('Available post IDs:', posts.map(p => p.id));
                }
            }
            
            renderPosts();
        } else {
            console.error('Failed to load posts, status:', response.status);
        }
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Render posts function
function renderPosts() {
    const postFeed = document.getElementById('postFeed');
    if (!postFeed) {
        console.error('Post feed element not found');
        return;
    }

    // Create loading spinner if it doesn't exist
    let loadingSpinner = postFeed.querySelector('.loading-spinner');
    if (!loadingSpinner) {
        loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        postFeed.appendChild(loadingSpinner);
    }

    // Create no posts message if it doesn't exist
    let noPosts = postFeed.querySelector('.no-posts');
    if (!noPosts) {
        noPosts = document.createElement('div');
        noPosts.className = 'no-posts';
        noPosts.textContent = 'No posts yet. Be the first to post!';
        postFeed.appendChild(noPosts);
    }
    
    loadingSpinner.style.display = 'flex';
    noPosts.style.display = 'none';
    
    // Clear existing posts
    const existingPosts = postFeed.querySelectorAll('.post-card');
    existingPosts.forEach(post => post.remove());
        
        if (posts.length === 0) {
            console.log('No posts found');
            loadingSpinner.style.display = 'none';
            noPosts.style.display = 'block';
            return;
        }
        
        posts.forEach(post => {
            const postElement = createPostElement(post);
            postFeed.appendChild(postElement);
        });
    
        loadingSpinner.style.display = 'none';
}

// Function to highlight and scroll to a specific post
function highlightAndScrollToPost(postId) {
    const targetPost = document.querySelector(`[data-post-id="${postId}"]`);
    if (targetPost) {
        // Add highlight animation
        targetPost.style.animation = 'highlightPost 2s ease-in-out';
        targetPost.style.border = '2px solid #FF8A00';
        targetPost.style.borderRadius = '12px';
        
        // Scroll to the post
        targetPost.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Remove highlight after animation
        setTimeout(() => {
            targetPost.style.animation = '';
            targetPost.style.border = '';
        }, 2000);
        
        // Update URL to remove the post parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
}

// Add showMessage function if it doesn't exist
function showMessage(message, type) {
    console.log(`${type.toUpperCase()} message:`, message);
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Helper function to detect if video is a link or file
function isVideoLink(videoPath) {
    if (!videoPath) return false;
    
    // Check if it's a URL (starts with http:// or https://)
    if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        return true;
    }
    
    // Check if it's a YouTube, Vimeo, or other video platform URL
    const videoPlatforms = [
        'youtube.com',
        'youtu.be',
        'vimeo.com',
        'dailymotion.com',
        'facebook.com',
        'instagram.com',
        'tiktok.com'
    ];
    
    return videoPlatforms.some(platform => videoPath.includes(platform));
}

// Add createPostElement function
function createPostElement(post) {
    console.log('Creating post element for:', post);
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.setAttribute('data-post-id', post.id); // Add data attribute for targeting
    
    // Format the date
    const postDate = new Date(post.createdAt);
    const formattedDate = formatDate(postDate);
    
    // Get user info
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isLiked = post.likes.includes(currentUser?.id);
    
    postCard.innerHTML = `
        <div class="post-header">
            <img src="${post.author.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}`}" 
                 alt="${post.author.name}" 
                 class="post-avatar">
            <div class="post-user-info">
                <h3>${post.author.name}</h3>
                <span class="post-time">${formattedDate}</span>
            </div>
        </div>
        <div class="post-content">
            <p>${post.description}</p>
            ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
            ${post.video ? (isVideoLink(post.video) ? 
                `<div class="video-link-container">
                    <a href="${post.video}" target="_blank" class="video-link">
                        <i class="fas fa-play-circle"></i>
                        <span>Watch Video</span>
                    </a>
                    <p class="video-url">${post.video}</p>
                </div>` : 
                `<video controls class="post-video">
                    <source src="${post.video}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>`
            ) : ''}
        </div>
        <div class="post-actions">
            <div class="action-buttons">
                <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post.id}">
                    <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
                    <span class="action-count like-count">${post.likes.length}</span>
                </button>
                <button class="action-btn comment-btn" data-post-id="${post.id}">
                    <i class="far fa-comment"></i>
                    <span class="action-count comment-count">${post.comments.length}</span>
                </button>
                <button class="action-btn share-btn" data-post-id="${post.id}">
                    <i class="far fa-paper-plane"></i>
                    <span class="action-count share-count">${post.shares ? post.shares.length : 0}</span>
                </button>
                <button class="action-btn bookmark-btn">
                    <i class="far fa-bookmark"></i>
                </button>
            </div>
        </div>
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
            ${renderComments(post.comments)}
            <div class="add-comment">
                <input type="text" placeholder="Add a comment..." class="comment-input" data-post-id="${post.id}">
                <button class="submit-comment" data-post-id="${post.id}">Post</button>
            </div>
        </div>
    `;

    // Add event listeners for the post
    addPostEventListeners(postCard, post);
    
    return postCard;
}

// Add formatDate helper function
function formatDate(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
}

// Add renderComments helper function
function renderComments(comments) {
    if (!comments || comments.length === 0) {
        return '<p class="no-comments">No comments yet</p>';
    }
    
    return comments.map(comment => `
        <div class="comment">
            <img src="${comment.author.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}`}" 
                 alt="${comment.author.name}" 
                 class="comment-avatar">
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.author.name}</span>
                    <span class="comment-date">${formatDate(new Date(comment.createdAt))}</span>
                </div>
                <p class="comment-text">${comment.text}</p>
            </div>
        </div>
    `).join('');
}

// Add addPostEventListeners helper function
function addPostEventListeners(postElement, post) {
    // Like button
    const likeBtn = postElement.querySelector('.like-btn');
    if (isViewOnlyMode) {
        // In view-only mode, show login popup when trying to like
        likeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPopup();
        });
    } else {
    likeBtn.addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to like post');

            const result = await response.json();
            const likeCount = likeBtn.querySelector('.action-count');
            const likeIcon = likeBtn.querySelector('i');
            
            // Update like count with the new likes array length
            likeCount.textContent = result.likes.length;
            
            // Update button state based on whether user liked or unliked
            if (result.liked) {
                likeBtn.classList.add('liked');
                likeIcon.classList.remove('far');
                likeIcon.classList.add('fas');
            } else {
                likeBtn.classList.remove('liked');
                likeIcon.classList.remove('fas');
                likeIcon.classList.add('far');
            }
        } catch (error) {
            console.error('Error liking post:', error);
            showMessage('Failed to like post. Please try again.', 'error');
        }
    });
    }

    // Comment button
    const commentBtn = postElement.querySelector('.comment-btn');
    const commentsSection = postElement.querySelector('.comments-section');
    if (isViewOnlyMode) {
        // In view-only mode, show login popup when trying to comment
        commentBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPopup();
        });
    } else {
    commentBtn.addEventListener('click', () => {
        commentsSection.style.display = commentsSection.style.display === 'none' ? 'block' : 'none';
        if (commentsSection.style.display === 'block') {
            const commentInput = postElement.querySelector('.comment-input');
            commentInput.focus();
        }
    });
    }

    // Comment input behavior (Instagram style) - only in normal mode
    if (!isViewOnlyMode) {
    const commentInput = postElement.querySelector('.comment-input');
    const submitComment = postElement.querySelector('.submit-comment');
    
    commentInput.addEventListener('input', () => {
        const text = commentInput.value.trim();
        if (text) {
            submitComment.classList.add('active');
        } else {
            submitComment.classList.remove('active');
        }
    });
    
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitComment.click();
        }
    });
    
    submitComment.addEventListener('click', async () => {
        const text = commentInput.value.trim();
        if (!text) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${post.id}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            if (!response.ok) throw new Error('Failed to add comment');

            const comment = await response.json();
            const commentsContainer = postElement.querySelector('.comments-section');
            
            if (commentsContainer.querySelector('.no-comments')) {
                commentsContainer.innerHTML = '';
            }
            
            const commentElement = document.createElement('div');
            commentElement.className = 'comment';
            commentElement.innerHTML = `
                <img src="${comment.author.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}`}" 
                     alt="${comment.author.name}" 
                     class="comment-avatar">
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${comment.author.name}</span>
                        <span class="comment-date">just now</span>
                    </div>
                    <p class="comment-text">${comment.text}</p>
                </div>
            `;
            
            commentsContainer.insertBefore(commentElement, commentsContainer.querySelector('.add-comment'));
            commentInput.value = '';
            submitComment.classList.remove('active');
            
            // Update comment count
            const commentCount = commentBtn.querySelector('.action-count');
            const currentCount = parseInt(commentCount.textContent || '0');
            commentCount.textContent = currentCount + 1;
        } catch (error) {
            console.error('Error adding comment:', error);
            showMessage('Failed to add comment. Please try again.', 'error');
        }
    });
    }

    // Bookmark button (Instagram style)
    const bookmarkBtn = postElement.querySelector('.bookmark-btn');
    if (isViewOnlyMode) {
        // In view-only mode, show login popup when trying to bookmark
        bookmarkBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPopup();
        });
    } else {
    bookmarkBtn.addEventListener('click', () => {
        const icon = bookmarkBtn.querySelector('i');
        if (icon.classList.contains('far')) {
            icon.classList.remove('far');
            icon.classList.add('fas');
        } else {
            icon.classList.remove('fas');
            icon.classList.add('far');
        }
    });
    }

    // Share button (Instagram style)
    const shareBtn = postElement.querySelector('.share-btn');
    if (isViewOnlyMode) {
        // In view-only mode, show login popup when trying to share
        shareBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showLoginPopup();
        });
    } else {
    shareBtn.addEventListener('click', async () => {
            // Copy sharable link to clipboard - redirect to main feed with post ID
            const postUrl = `${window.location.origin}/feed.html?post=${post.id}`;
            try {
                await navigator.clipboard.writeText(postUrl);
                
                // Show success message on button
                const originalText = shareBtn.innerHTML;
                shareBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                shareBtn.style.color = '#28a745';
                
                // Show toast message
                showMessage('Sharable link copied to clipboard!', 'success');
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    shareBtn.innerHTML = originalText;
                    shareBtn.style.color = '';
                }, 2000);
                
            } catch (err) {
                showMessage('Failed to copy link. Please try again.', 'error');
            }
            
            // Optionally, keep the backend share logic for analytics
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/posts/${post.id}/share`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
                if (response.ok) {
            const result = await response.json();
            const shareCount = shareBtn.querySelector('.action-count');
            shareCount.textContent = result.shares.length;
            }
        } catch (error) {
                // Ignore backend share errors for now
        }
    });
    }
}
