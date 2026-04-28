// v2.1.0 - Resolved selectedImageFiles undefined issue
let currentFeedPage = 0;
let isLoading = false;
let hasMore = true;
const PAGE_SIZE = 10;
let currentUserId = null;
let selectedImageFiles = []; // Array for multiple images
let isPollMode = false;
let editingPostId = null;
let editingImages = [];
let isUploading = false;

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    await loadFeed(0, true);
    setupImageUpload();
    setupEditImageUpload();
    setupInfiniteScroll();
    
    // Add Load More fallback listener
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            if (!isLoading && hasMore) {
                loadFeed(currentFeedPage);
            }
        });
    }

    // Auto-scroll to post if postId is in URL
    const postId = getQueryParam('postId');
    if (postId) {
        setTimeout(() => {
            const postEl = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (postEl) {
                postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                postEl.style.boxShadow = "0 0 25px rgba(255, 140, 0, 0.4)";
                postEl.style.border = "1px solid var(--primary-orange)";
                setTimeout(() => {
                    postEl.style.boxShadow = "";
                    postEl.style.border = "";
                }, 4000);
            }
        }, 500); 
    }
});

// Load feed posts
async function loadFeed(page = 0, refresh = false) {
    if (isLoading || (!hasMore && !refresh)) return;
    
    isLoading = true;
    const container = document.getElementById('feedContainer');
    const loader = document.querySelector('.scroll-load');
    
    if (loader) loader.style.opacity = '1';
    if (refresh) {
        currentFeedPage = 0;
        hasMore = true;
        if (container) container.innerHTML = '';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/posts?page=${page}&size=${PAGE_SIZE}`);
        if (response.ok) {
            let data = await response.json();
            const posts = data.content ? data.content : data;
            
            // Map backend 'userDetails' to frontend 'user' property for compatibility
            posts.forEach(p => {
                if (p.userDetails && !p.user) {
                    p.user = p.userDetails;
                }
            });
            if (posts.length < PAGE_SIZE) {
                hasMore = false;
            }

            // --- OPTIMIZATION: Render IMMEDIATELY with what we have ---
            // This ensures mobile users see posts even if profile fetching is slow
            console.log('Fetched posts:', posts.length, posts);
            displayPosts(posts, refresh);

            // Now fetch missing profiles in the background
            const uniqueUserIds = [...new Set(posts.filter(p => p.userId && !p.user).map(p => p.userId))];
            
            if (uniqueUserIds.length > 0) {
                // Fetch in parallel but don't block the UI refresh
                const profilePromises = uniqueUserIds.map(id => getUserProfile(id));
                Promise.all(profilePromises).then(() => {
                    // Update any avatars that were missing
                    posts.forEach(post => {
                        if (!post.user && post.userId) {
                            getUserProfile(post.userId).then(profile => {
                                if (profile) {
                                    post.user = profile;
                                    updatePostWithUser(post);
                                }
                            });
                        }
                    });
                });
            }

            currentFeedPage = page + 1;
        } else {
            if (refresh) {
                container.innerHTML = '<p class="no-data">No posts yet. Be the first to post!</p>';
            }
            hasMore = false;
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        if (refresh) {
            container.innerHTML = '<p class="no-data">Error loading feed. Please try again.</p>';
        }
    } finally {
        isLoading = false;
        if (loader) loader.style.opacity = '0';
        updateLoadMoreButton();
    }
}

function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = (hasMore && !isLoading) ? 'block' : 'none';
    }
}

// Setup Infinite Scroll
function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            loadFeed(currentFeedPage);
        }
    }, { threshold: 0.1 });

    const loader = document.querySelector('.scroll-load');
    if (loader) observer.observe(loader);
}

// Display posts
function displayPosts(posts, refresh = false) {
    const container = document.getElementById('feedContainer');
    if (!container) return;

    if (posts.length === 0 && refresh) {
        container.innerHTML = '<p class="no-data">No posts yet. Be the first to post!</p>';
        return;
    }

    const postsHtml = posts.map(post => renderPostHTML(post)).join('');
    
    if (refresh) {
        container.innerHTML = postsHtml;
    } else {
        container.insertAdjacentHTML('beforeend', postsHtml);
    }
}

// Surgically update a post card's user info once fetched
function updatePostWithUser(post) {
    if (!post.user) return;
    const postCard = document.querySelector(`.post-card[data-post-id="${post.id}"]`);
    if (!postCard) return;

    const userLink = postCard.querySelector('.post-user-link');
    if (userLink) {
        userLink.innerHTML = `
            ${renderAvatar(post.user, 'post-avatar')}
            <div>
                <h4 style="margin:0; font-size:15px;">${post.user.name || 'Unknown Creative'}</h4>
                <span style="font-size:11px; color:#999;">${formatDate(post.createdAt)}</span>
            </div>
        `;
    }
}

function renderPostHTML(post) {
    // Handle both legacy string arrays and new List format
    let images = [];
    if (post.imageUrls && post.imageUrls.length > 0) {
        images = post.imageUrls;
    } else if (post.imageUrl) {
        images = post.imageUrl.split(',');
    }

    let mediaHtml = '';
    if (images.length === 1) {
        mediaHtml = `
            <div class="post-slider-container">
                ${renderMediaContent(images[0], 'post-image')}
            </div>
        `;
    } else if (images.length > 1) {
        mediaHtml = `
            <div class="post-slider-container">
                <div id="slider-${post.id}" class="post-slider" onscroll="updateSliderDots(${post.id})">
                    ${images.map(img => `
                        <div class="post-slider-item">
                            ${renderMediaContent(img, '')}
                        </div>
                    `).join('')}
                </div>
                <button class="slider-nav-btn prev" onclick="moveSlider(${post.id}, -1)">❮</button>
                <button class="slider-nav-btn next" onclick="moveSlider(${post.id}, 1)">❯</button>
                <div class="slider-dots" id="dots-${post.id}">
                    ${images.map((_, i) => `<span class="slider-dot ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
                </div>
            </div>
        `;
    }
    
    const link = (post.externalLinks && post.externalLinks.length > 0) ? post.externalLinks[0] : post.externalLink;
    
    let pollHtml = '';
    if (post.isPoll) {
        console.log('Rendering poll for post:', post.id, post.pollQuestion);
        const votes = post.pollVotes || {};
        const totalVotes = Object.keys(votes).length;
        const optionVotes = {};
        if (post.pollOptions) {
            post.pollOptions.forEach((_, i) => optionVotes[i] = 0);
            Object.values(votes).forEach(optIdx => {
                if (optionVotes[optIdx] !== undefined) optionVotes[optIdx]++;
            });
        }

        const userVotedOption = votes[currentUserId];

        pollHtml = `
            <div class="poll-container">
                <h4 class="poll-question">${post.pollQuestion}</h4>
                <div class="poll-options">
                    ${(post.pollOptions || []).map((opt, i) => {
                        const count = optionVotes[i] || 0;
                        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const isSelected = userVotedOption === i;
                        return `
                            <div class="poll-option ${isSelected ? 'selected' : ''}" onclick="votePoll(${post.id}, ${i})">
                                <div class="poll-progress" style="width: ${percent}%"></div>
                                <div class="poll-option-content">
                                    <span class="poll-option-text">${opt}</span>
                                    <span class="poll-percent">${percent}%</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="poll-stats">
                    <i class="fa-solid fa-users-viewfinder"></i> ${totalVotes} votes
                </div>
            </div>
        `;
    }

    return `
    <div class="post-card fade-in" data-post-id="${post.id}">
        <div class="post-header">
            <a href="profile.html?userId=${post.userId}" class="post-user-link" style="display:flex; gap:12px; align-items:center; text-decoration:none; color:inherit;">
                ${renderAvatar(post.user || { name: 'Unknown' }, 'post-avatar')}
                <div>
                    <h4 style="margin:0; font-size:15px;">${post.user?.name || 'Unknown Creative'}</h4>
                    <span style="font-size:11px; color:#999;">${formatDate(post.createdAt)}</span>
                </div>
            </a>
            ${post.userId == currentUserId ? `
                <div class="post-actions-menu">
                    <button onclick="editPost(${post.id})" title="Edit">✏️</button>
                    <button onclick="deletePost(${post.id})" title="Delete">🗑️</button>
                </div>
            ` : ''}
        </div>
        <div class="post-content" style="padding: 15px 0;">
            ${post.content ? `<p style="margin-bottom:15px; line-height:1.6;">${post.content}</p>` : ''}
            
            ${pollHtml}

            ${link ? `
                <div style="margin-bottom:15px;">
                    <a href="${link}" target="_blank" style="color:var(--primary-orange); text-decoration:none; font-weight:700; font-size:13px;">
                        🔗 ${link}
                    </a>
                </div>
            ` : ''}

            ${mediaHtml}
        </div>
        <div class="post-footer" style="padding-top:15px; border-top:1px solid #f1f5f9; display:flex; gap:20px;">
            <button class="post-action-btn ${post.likedByUsers && post.likedByUsers.includes(parseInt(currentUserId)) ? 'liked' : ''}" onclick="likePost(${post.id})">
                ❤️ <span id="likes-count-${post.id}">${post.likes || 0}</span>
            </button>
            <button class="post-action-btn" onclick="toggleCommentBox(${post.id})">
                💬 <span>${post.comments || 0}</span>
            </button>
            <button class="post-action-btn" onclick="shareContent('post', ${post.id})" title="Share Post">
                🔗 Share
            </button>
        </div>
        
        <div id="comment-box-${post.id}" style="display:none; padding:15px; border-top:1px solid #f1f5f9; background:#fafafa; border-radius:0 0 16px 16px;">
            <div style="margin-bottom:10px; max-height: 150px; overflow-y: auto;">
                ${post.actualComments && post.actualComments.length > 0 
                    ? post.actualComments.map(c => `<div style="font-size:13px; margin-bottom:5px; padding:8px; background:white; border-radius:8px; border:1px solid #eee;">💬 ${c}</div>`).join('') 
                    : '<div style="font-size:12px; color:#aaa; margin-bottom:10px;">No comments yet. Be the first!</div>'}
            </div>
            <div style="display:flex; gap:10px;">
                <input type="text" id="comment-input-${post.id}" placeholder="Type a comment..." style="flex:1; padding:8px; border:1px solid #ddd; border-radius:8px; font-size:13px; outline:none;">
                <button class="auth-btn" style="width:auto; padding:8px 15px; font-size:13px;" onclick="commentPost(${post.id})">Post</button>
            </div>
        </div>
    </div>
    `;
}

// Setup Multi-Image Upload
function setupImageUpload() {
    const imageInput = document.getElementById('postImage');
    const previewContainer = document.getElementById('imagePreviewContainer');

    if (!imageInput || !previewContainer) return;

    imageInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            for (const file of files) {
                // Restriction: Only admin (crewcanvas2@gmail.com) can select videos
                const isVideo = file.type.startsWith('video/') || 
                                file.name.match(/\.(mp4|webm|ogg|mov|avi|flv|wmv)$/i);
                
                if (isVideo && !getCurrentUserIsAdmin()) {
                    showMessage('Video uploads in posts are restricted to administrators.', 'error');
                    continue;
                }

                try {
                    const base64 = await uploadImage(file);
                    selectedImageFiles.push(base64);
                    
                    const previewDiv = document.createElement('div');
                    previewDiv.style.cssText = "position:relative; width:80px; height:80px; background:#000; border-radius:8px; overflow:hidden;";
                    
                    if (isVideoFile(base64)) {
                        previewDiv.innerHTML = `
                            <video src="${base64}" style="width:100%; height:100%; object-fit:cover;"></video>
                            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:white; font-size:12px; pointer-events:none;"><i class="fa-solid fa-play"></i></div>
                            <button onclick="removeSelectedImage(this, '${base64}')" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10;">✕</button>
                        `;
                    } else {
                        previewDiv.innerHTML = `
                            <img src="${base64}" style="width:100%; height:100%; object-fit:cover;">
                            <button onclick="removeSelectedImage(this, '${base64}')" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.6); color:white; border:none; border-radius:50%; width:18px; height:18px; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10;">✕</button>
                        `;
                    }
                    previewContainer.appendChild(previewDiv);
                } catch (error) {
                    showMessage('We couldn’t upload that image. Please try a different one.', 'error');
                }
            }
        }
    });
}

// Remove specifically selected image from array
function removeSelectedImage(btnElement, base64) {
    const index = selectedImageFiles.indexOf(base64);
    if (index > -1) {
        selectedImageFiles.splice(index, 1);
    }
    btnElement.parentElement.remove();
}

function togglePollMode() {
    isPollMode = !isPollMode;
    const standardInputs = document.getElementById('standardPostInputs');
    const pollInputs = document.getElementById('pollPostInputs');
    const pollBtn = document.getElementById('pollToggleBtn');
    const mediaBtn = document.getElementById('mediaBtn');
    
    if (isPollMode) {
        standardInputs.style.display = 'none';
        pollInputs.style.display = 'block';
        pollBtn.style.color = '#ff8c00';
        mediaBtn.style.display = 'none';
    } else {
        standardInputs.style.display = 'block';
        pollInputs.style.display = 'none';
        pollBtn.style.color = 'inherit';
        mediaBtn.style.display = 'block';
    }
}

function addPollOption() {
    const container = document.getElementById('pollOptionsContainer');
    const optionCount = container.querySelectorAll('.poll-option-input').length;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'poll-option-input';
    input.placeholder = `Option ${optionCount + 1}`;
    input.style.cssText = "width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 8px; font-size: 13px;";
    container.appendChild(input);
}

async function createPost() {
    const postBtn = document.getElementById('submitPostBtn');
    let body = { userId: currentUserId };

    if (isPollMode) {
        const questionEl = document.getElementById('pollQuestion');
        const question = questionEl ? questionEl.value.trim() : '';
        const optionInputs = document.querySelectorAll('.poll-option-input');
        const options = Array.from(optionInputs).map(i => i.value.trim()).filter(v => v !== '');

        if (!question || options.length < 2) {
            showMessage('Please enter a question and at least 2 options', 'error');
            return;
        }
        body.isPoll = true;
        body.pollQuestion = question;
        body.pollOptions = options;
    } else {
        const content = document.getElementById('postContent').value.trim();
        const link = document.getElementById('postLink').value.trim();

        if (!content && selectedImageFiles.length === 0) {
            showMessage('Please write something or add media', 'error');
            return;
        }
        body.content = content;
        body.imageUrls = selectedImageFiles;
        body.externalLinks = link ? [link] : [];
    }

    console.log('Sending post payload:', JSON.stringify(body));

    try {
        if (postBtn) {
            postBtn.disabled = true;
            postBtn.innerHTML = '<span class="loader-tiny"></span> Posting...';
        }

        const response = await fetch(`${API_BASE_URL}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (response.ok) {
            showMessage('Post created successfully!', 'success');
            if (isPollMode) {
                document.getElementById('pollQuestion').value = '';
                const container = document.getElementById('pollOptionsContainer');
                container.innerHTML = `
                    <input type="text" class="poll-option-input" placeholder="Option 1" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 8px; font-size: 13px;">
                    <input type="text" class="poll-option-input" placeholder="Option 2" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #eee; margin-bottom: 8px; font-size: 13px;">
                `;
                togglePollMode(); // Return to standard mode
            } else {
                document.getElementById('postContent').value = '';
                document.getElementById('postLink').value = '';
                selectedImageFiles = [];
                document.getElementById('imagePreviewContainer').innerHTML = '';
            }
            loadFeed(0, true);
        } else {
            showMessage('We couldn’t post that right now. Please check your content and try again.', 'error');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showMessage('Unable to reach the studio. Please check your connection.', 'error');
    } finally {
        if (postBtn) {
            postBtn.disabled = false;
            postBtn.innerHTML = 'Post';
        }
    }
}

async function deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}?userId=${currentUserId}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showMessage('Deleted');
            loadFeed(0, true);
        }
    } catch (e) {
        console.error(e);
    }
}

async function likePost(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: currentUserId })
        });
        if (response.ok) {
            const updatedPost = await response.json();
            const likesCount = document.getElementById(`likes-count-${postId}`);
            if (likesCount) {
                likesCount.textContent = updatedPost.likes;
                const btn = likesCount.parentElement;
                btn.classList.toggle('liked', updatedPost.likedByUsers.includes(parseInt(currentUserId)));
            }
        } else {
            showMessage('Unable to like this post. Please try again later.', 'error');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

function toggleCommentBox(postId) {
    const box = document.getElementById(`comment-box-${postId}`);
    if (box) {
        box.style.display = box.style.display === 'none' ? 'block' : 'none';
        
        // Auto focus the input if opened
        if(box.style.display === 'block') {
            document.getElementById(`comment-input-${postId}`).focus();
        }
    }
}

async function commentPost(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input ? input.value.trim() : "";
    
    if (!text) {
        showMessage('Please type a comment first!', 'error');
        return;
    }

    try {
        // Get current user's name for display
        let userName = "A User";
        try {
            const userRes = await fetch(`${API_BASE_URL}/api/profile/${currentUserId}`);
            if(userRes.ok) {
                const profile = await userRes.json();
                userName = profile.name || userName;
            }
        } catch(err) {}

        const finalComment = `**${userName}**: ${text}`;

        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: finalComment,
                userId: currentUserId
            })
        });
        if (response.ok) {
            const updatedPost = await response.json();
            loadFeed(0, true); // Refresh or we could surgically update the comment list
            showMessage('Your comment has been posted!', 'success');
        } else {
            showMessage('We couldn’t post your comment. Please try again.', 'error');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function editPost(postId) {
    editingPostId = postId;
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`);
        if (response.ok) {
            const post = await response.json();
            
            // Populate content
            document.getElementById('editPostContent').value = post.content || '';
            
            // Populate images
            editingImages = [];
            if (post.imageUrls) {
                editingImages = [...post.imageUrls];
            } else if (post.imageUrl) {
                editingImages = post.imageUrl.split(',').filter(s => s.trim() !== '');
            }
            
            renderEditImagePreviews();
            
            // Show Modal
            document.getElementById('editPostModal').style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scroll
        } else {
            showMessage('We couldn’t load the post details. Please refresh the page.', 'error');
        }
    } catch (e) {
        console.error('Error fetching post for edit:', e);
        showMessage('Oops! Something went wrong while loading the post.', 'error');
    }
}

function closeEditModal() {
    document.getElementById('editPostModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    editingPostId = null;
    editingImages = [];
}

function renderEditImagePreviews() {
    const container = document.getElementById('editImagePreviewContainer');
    if (!container) return;
    
    container.innerHTML = editingImages.map((img, index) => `
        <div class="preview-item">
            ${isVideoFile(img) ? 
                `<video src="${img}" style="width:100%; height:100%; object-fit:cover;"></video>
                 <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:white; pointer-events:none;"><i class="fa-solid fa-play"></i></div>` : 
                `<img src="${img}" alt="Preview">`
            }
            <button class="remove-img-btn" onclick="removeEditingImage(${index})">✕</button>
        </div>
    `).join('');
}

function removeEditingImage(index) {
    editingImages.splice(index, 1);
    renderEditImagePreviews();
}

function setupEditImageUpload() {
    const imageInput = document.getElementById('editPostImage');
    if (!imageInput) return;

    imageInput.onchange = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            // Restriction: Only admin (crewcanvas2@gmail.com) can select videos
            const isVideo = file.type.startsWith('video/') || 
                            file.name.match(/\.(mp4|webm|ogg|mov|avi|flv|wmv)$/i);
            
            if (isVideo && !getCurrentUserIsAdmin()) {
                showMessage('Video uploads in posts are restricted to administrators.', 'error');
                continue;
            }

            try {
                const base64 = await uploadImage(file);
                if (base64) {
                    editingImages.push(base64);
                }
            } catch (error) {
                showMessage('Image upload failed. Please try again.', 'error');
            }
        }
        renderEditImagePreviews();
        imageInput.value = ''; // Reset
    };
}

async function saveEditPost() {
    const saveBtn = document.getElementById('saveEditBtn');
    const content = document.getElementById('editPostContent').value.trim();
    
    if (!content && editingImages.length === 0) {
        showMessage('Post cannot be empty', 'error');
        return;
    }

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="loader-tiny"></span> Saving...';
        }

        const response = await fetch(`${API_BASE_URL}/api/posts/${editingPostId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content,
                imageUrls: editingImages
            })
        });

        if (response.ok) {
            showMessage('Post updated successfully!', 'success');
            closeEditModal();
            loadFeed(0, true);
        } else {
            showMessage('We couldn’t update your post. Please check your connection.', 'error');
        }
    } catch (error) {
        console.error('Error saving post:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
    }
}

// Slider Navigation
function moveSlider(postId, direction) {
    const slider = document.getElementById(`slider-${postId}`);
    if (slider) {
        const itemWidth = slider.offsetWidth;
        slider.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
    }
}

// Update Slider Dots on Scroll
function updateSliderDots(postId) {
    const slider = document.getElementById(`slider-${postId}`);
    const dotsContainer = document.getElementById(`dots-${postId}`);
    if (slider && dotsContainer) {
        const index = Math.round(slider.scrollLeft / slider.offsetWidth);
        const dots = dotsContainer.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === index);
        });
    }
}

async function votePoll(postId, optionIndex) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUserId,
                optionIndex: optionIndex
            })
        });
        if (response.ok) {
            const updatedPost = await response.json();
            
            // Surgically update only this poll's container
            const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (postCard) {
                const pollContainer = postCard.querySelector('.poll-container');
                if (pollContainer) {
                    const votes = updatedPost.pollVotes || {};
                    const totalVotes = Object.keys(votes).length;
                    const optionVotes = {};
                    updatedPost.pollOptions.forEach((_, i) => optionVotes[i] = 0);
                    Object.values(votes).forEach(optIdx => {
                        if (optionVotes[optIdx] !== undefined) optionVotes[optIdx]++;
                    });

                    const userVotedOption = votes[currentUserId];

                    // Update each option
                    const optionsList = pollContainer.querySelectorAll('.poll-option');
                    optionsList.forEach((optEl, i) => {
                        const count = optionVotes[i] || 0;
                        const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                        const isSelected = userVotedOption === i;

                        optEl.className = `poll-option ${isSelected ? 'selected' : ''}`;
                        const progress = optEl.querySelector('.poll-progress');
                        if (progress) progress.style.width = `${percent}%`;
                        const percentEl = optEl.querySelector('.poll-percent');
                        if (percentEl) percentEl.textContent = `${percent}%`;
                    });

                    // Update stats
                    const stats = pollContainer.querySelector('.poll-stats');
                    if (stats) {
                        stats.innerHTML = `<i class="fa-solid fa-users-viewfinder"></i> ${totalVotes} votes`;
                    }
                }
            }
        } else {
            showMessage('Unable to submit your vote. Please try again later.', 'error');
        }
    } catch (e) {
        console.error('Error voting:', e);
    }
}

