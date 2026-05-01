// v2.2.0 - Smart Search & Profile-Based Relevance Feed
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

// --- Search & Filter State ---
let searchMode = false;        
let searchQuery = '';          
let smartFilterActive = false; 
let currentUserProfile = null; 
let searchDebounceTimer = null;

// Advanced Filters
let currentSortBy = 'latest';
let currentContentType = 'all';
let currentTimeframe = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    
    // If a specific post is shared, focus on it
    const postId = getQueryParam('postId');
    if (postId) {
        // If guest, ensure create box stays hidden
        const createCard = document.querySelector('.create-post-card');
        if (createCard) createCard.style.display = 'none';
        
        // Add a "View All Feed" button at the top
        const sectionHeader = document.querySelector('.section-header');
        if (sectionHeader) {
            sectionHeader.innerHTML += `
                <button onclick="window.location.href='feed.html'" class="auth-btn" style="width: auto; padding: 6px 15px; font-size: 12px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; margin-left: auto;">
                    <i class="fa-solid fa-arrow-left"></i> Back to Feed
                </button>
            `;
            sectionHeader.style.display = 'flex';
            sectionHeader.style.alignItems = 'center';
            sectionHeader.style.marginBottom = '20px';
        }
    }

    await loadFeed(0, true);
    setupImageUpload();
    setupEditImageUpload();
    setupInfiniteScroll();
    setupFeedSearch();

    // Pre-fetch user profile to enable smart filtering
    if (currentUserId) {
        getUserProfile(currentUserId).then(profile => {
            if (profile) {
                currentUserProfile = profile;
                checkAndApplySmartFilter(profile);
            }
        });
    }
    
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
    scrollToPostFromUrl();
});


function scrollToPostFromUrl() {
    const postId = getQueryParam('postId');
    if (!postId) return;

    // Check if post is already in DOM
    const existing = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    if (!existing) {
        // If not in first page, fetch it specifically and prepend
        fetch(`${API_BASE_URL}/api/posts/${postId}`)
            .then(res => res.ok ? res.json() : null)
            .then(post => {
                if (post) {
                    // Check again to avoid duplicates
                    if (!document.querySelector(`.post-card[data-post-id="${postId}"]`)) {
                        displayPosts([post], false, true); // Prepend
                    }
                    performScroll(postId);
                }
            })
            .catch(err => console.error("Error fetching shared post:", err));
    } else {
        performScroll(postId);
    }
}

function performScroll(postId) {
    // Retry finding the post for up to 3 seconds
    let attempts = 0;
    const interval = setInterval(() => {
        const postEl = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (postEl) {
            clearInterval(interval);
            setTimeout(() => {
                postEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                postEl.style.boxShadow = "0 0 30px rgba(255, 140, 0, 0.6)";
                postEl.style.border = "2px solid var(--primary-orange)";
                postEl.style.zIndex = "10";
                setTimeout(() => {
                    postEl.style.boxShadow = "";
                    postEl.style.border = "";
                }, 4000);
            }, 200);
        }
        
        attempts++;
        if (attempts > 30) {
            clearInterval(interval);
            console.log("Post scroll failed after 3s:", postId);
        }
    }, 100);
}

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
function displayPosts(posts, refresh = false, prepend = false) {
    const container = document.getElementById('feedContainer');
    if (!container) return;

    if (posts.length === 0 && refresh) {
        container.innerHTML = '<p class="no-data">No posts yet. Be the first to post!</p>';
        return;
    }

    const postsHtml = posts.map(post => renderPostHTML(post)).join('');
    
    if (refresh) {
        container.innerHTML = postsHtml;
    } else if (prepend) {
        container.insertAdjacentHTML('afterbegin', postsHtml);
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
                <h4 style="margin:0; font-size:15px; display: flex; align-items: center; gap: 4px;">
                    ${post.user.name || 'Unknown Creative'}
                    ${post.user.isVerifiedProfessional ? `<i class="fa-solid fa-circle-check" style="color:var(--primary-orange); font-size: 11px;" title="Verified Professional"></i>` : ''}
                </h4>
                <div style="font-size:9px; color:${post.user.isVerifiedProfessional ? 'var(--primary-orange)' : '#999'}; font-weight:800; text-transform:uppercase; letter-spacing:0.3px; margin-top:1px;">
                    ${typeof getUserDisplayStatus === 'function' ? getUserDisplayStatus(post.user) : (post.user.userType || 'Explorer').toUpperCase()}
                </div>
                <span style="font-size:10px; color:#999; opacity:0.8;">${formatDate(post.createdAt)}</span>
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
                    <h4 style="margin:0; font-size:15px; display: flex; align-items: center; gap: 4px;">
                        ${post.user?.name || 'Unknown Creative'}
                        ${post.user?.isVerifiedProfessional ? `<i class="fa-solid fa-circle-check" style="color:var(--primary-orange); font-size: 11px;" title="Verified Professional"></i>` : ''}
                    </h4>
                    <div style="font-size:9px; color:${post.user?.isVerifiedProfessional ? 'var(--primary-orange)' : '#999'}; font-weight:800; text-transform:uppercase; letter-spacing:0.3px; margin-top:1px;">
                        ${typeof getUserDisplayStatus === 'function' ? getUserDisplayStatus(post.user) : (post.user?.userType || 'Explorer').toUpperCase()}
                    </div>
                    <span style="font-size:10px; color:#999; opacity:0.8;">${formatDate(post.createdAt)}</span>
                </div>
            </a>
            ${post.userId == currentUserId ? `
                <div class="post-actions-menu">
                    <button onclick="editPost(${post.id})" title="Edit">✏️</button>
                    <button onclick="deletePost(${post.id})" title="Delete">🗑️</button>
                </div>
            ` : ''}
        </div>
        <div class="post-content" style="padding: 10px 0 5px 0; cursor: pointer;" onclick="handleDoubleTap(${post.id}, event)">
            ${post.content ? `<p style="margin-bottom:10px; line-height:1.5;">${post.content}</p>` : ''}
            
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
        <div class="post-footer" style="padding-top:12px; border-top:1px solid #f1f5f9; display:flex; gap:20px;">
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
            <div id="comment-list-${post.id}" style="margin-bottom:10px; max-height: 150px; overflow-y: auto;">
                ${post.actualComments && post.actualComments.length > 0 
                    ? post.actualComments.map(c => `<div style="font-size:13px; margin-bottom:5px; padding:8px; background:white; border-radius:8px; border:1px solid #eee;">💬 ${c}</div>`).join('') 
                    : '<div class="no-comments-msg" style="font-size:12px; color:#aaa; margin-bottom:10px;">No comments yet. Be the first!</div>'}
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
            const newPost = await response.json();
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
            
            // Prepend new post instead of reloading feed
            displayPosts([newPost], false, true);
            
            // Clear no-data message if it exists
            const noData = document.querySelector('.no-data');
            if (noData) noData.remove();
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
            const postEl = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (postEl) {
                postEl.style.opacity = '0';
                postEl.style.transform = 'scale(0.9)';
                setTimeout(() => postEl.remove(), 300);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

async function likePost(postId) {
    const likesCount = document.getElementById(`likes-count-${postId}`);
    const btn = likesCount ? likesCount.parentElement : null;
    if (!likesCount || !btn) return;

    // Optimistic UI Update
    const isLiked = btn.classList.contains('liked');
    const currentLikes = parseInt(likesCount.textContent) || 0;
    
    // Toggle state immediately
    btn.classList.toggle('liked');
    likesCount.textContent = isLiked ? currentLikes - 1 : currentLikes + 1;

    // Play like sound if liking
    if (!isLiked && typeof playSound === 'function') playSound('like');

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
            // Sync with server just in case other people liked it too
            likesCount.textContent = updatedPost.likes;
            btn.classList.toggle('liked', updatedPost.likedByUsers.includes(parseInt(currentUserId)));
        } else {
            // Revert on error
            btn.classList.toggle('liked', isLiked);
            likesCount.textContent = currentLikes;
            showMessage('Unable to like this post. Please try again later.', 'error');
        }
    } catch (e) {
        console.error('Error:', e);
        // Revert on error
        btn.classList.toggle('liked', isLiked);
        likesCount.textContent = currentLikes;
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
            showMessage('Your comment has been posted!', 'success');
            
            // Update UI surgically
            input.value = '';
            
            // Update comment count
            const commentBtn = document.querySelector(`.post-card[data-post-id="${postId}"] .post-action-btn[onclick*="toggleCommentBox"] span`);
            if (commentBtn) {
                commentBtn.textContent = updatedPost.comments;
            }
            
            // Add comment to list
            const commentList = document.getElementById(`comment-list-${postId}`);
            if (commentList) {
                // Remove "No comments yet" if it exists
                const noComments = commentList.querySelector('.no-comments-msg');
                if (noComments) noComments.remove();
                
                const newCommentHtml = `<div style="font-size:13px; margin-bottom:5px; padding:8px; background:white; border-radius:8px; border:1px solid #eee; animation: fadeIn 0.3s ease;">💬 ${finalComment}</div>`;
                commentList.insertAdjacentHTML('beforeend', newCommentHtml);
                commentList.scrollTop = commentList.scrollHeight;
            }
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
            const updatedPost = await response.json();
            showMessage('Post updated successfully!', 'success');
            closeEditModal();
            
            // Update post card surgically
            const postCard = document.querySelector(`.post-card[data-post-id="${editingPostId}"]`);
            if (postCard) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = renderPostHTML(updatedPost);
                postCard.replaceWith(tempDiv.firstElementChild);
            }
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

// ============================================================
//  SMART SEARCH & PROFILE-BASED RELEVANCE FEED
// ============================================================

/**
 * Wire up the search bar - debounce input and handle clear button
 */
function setupFeedSearch() {
    const input = document.getElementById('feedSearchInput');
    const clearBtn = document.getElementById('feedSearchClearBtn');
    if (!input) return;

    input.addEventListener('input', () => {
        const val = input.value.trim();
        if (clearBtn) clearBtn.style.display = val ? 'flex' : 'none';

        clearTimeout(searchDebounceTimer);
        if (val.length === 0) {
            clearFeedSearch();
            return;
        }
        if (val.length < 2) return;
        searchDebounceTimer = setTimeout(() => executeFeedSearch(val), 400);
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = input.value.trim();
            if (val.length >= 1) {
                clearTimeout(searchDebounceTimer);
                executeFeedSearch(val);
            }
        }
        if (e.key === 'Escape') clearFeedSearch();
    });
}

/**
 * Execute a keyword search against /api/posts/search
 * Falls back to scanning top 50 posts and suggesting if zero matches
 */
async function executeFeedSearch(keyword) {
    // If keyword is empty, but we have filters, we still allow search
    searchMode = true;
    searchQuery = keyword || '';
    smartFilterActive = false;

    const container = document.getElementById('feedContainer');
    const loader = document.querySelector('.scroll-load');
    const infoEl = document.getElementById('searchResultsInfo');
    const chipEl = document.getElementById('smartFilterChip');

    if (chipEl) chipEl.style.display = 'none';
    if (loader) loader.style.opacity = '1';
    if (infoEl) { infoEl.style.display = 'none'; infoEl.textContent = ''; }
    
    if (container) {
        container.innerHTML = `
            <div class="search-loading-state" style="padding: 60px 20px; text-align: center; color: #94a3b8; animation: fadeIn 0.3s ease;">
                <div class="loader-dots" style="margin-bottom: 15px; display: flex; justify-content: center;">
                    <div class="dot dot-1" style="background:#ff8c00;"></div>
                    <div class="dot dot-2" style="background:#ff8c00;"></div>
                    <div class="dot dot-3" style="background:#ff8c00;"></div>
                </div>
                <p style="font-size: 14px; font-weight: 600; color: #475569;">Searching for "${escapeHtml(searchQuery)}"</p>
                <p style="font-size: 12px; margin-top: 4px;">Searching for people and posts...</p>
            </div>
        `;
    }

    hasMore = false; // pause infinite scroll during search

    try {
        const params = new URLSearchParams({
            q: searchQuery,
            t: currentTimeframe,
            sortBy: currentSortBy,
            type: currentContentType,
            page: 0,
            size: 50
        });

        // Parallel fetch for users and posts
        const [postsRes, usersRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/posts/search?${params.toString()}`),
            searchQuery.length >= 2 ? fetch(`${API_BASE_URL}/api/profile/search?query=${encodeURIComponent(searchQuery)}&currentUserId=${currentUserId || ''}&excludeFollowed=false&size=10`) : Promise.resolve({ ok: true, json: () => [] })
        ]);

        if (!postsRes.ok) throw new Error('Post search failed');
        const postsData = await postsRes.json();
        const posts = postsData.content ? postsData.content : postsData;
        posts.forEach(p => { if (p.userDetails && !p.user) p.user = p.userDetails; });

        let users = [];
        if (usersRes.ok) {
            const usersData = await usersRes.json();
            users = usersData.content ? usersData.content : usersData;
        }

        if (container) container.innerHTML = ''; // clear loading state

        // 1. Display People Section if found
        if (users.length > 0) {
            const peopleSection = document.createElement('div');
            peopleSection.className = 'search-people-section';
            peopleSection.innerHTML = `
                <div class="search-section-header">
                    <h4>PEOPLE</h4>
                    <a href="crew-search.html?query=${encodeURIComponent(searchQuery)}" class="view-all-link">View all creators</a>
                </div>
                <div class="search-users-grid">
                    ${users.map(u => `
                        <div class="search-user-card" onclick="window.location.href='profile.html?userId=${u.id || u.userId}'">
                            ${renderAvatar(u, 'user-mini-avatar')}
                            <div class="user-info">
                                <span class="user-name">${u.name}</span>
                                <span class="user-role">${u.isVerifiedProfessional ? 'Professional' : (u.role || u.userType || 'Explorer')}</span>
                            </div>
                            <i class="fa-solid fa-chevron-right"></i>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(peopleSection);
        }

        // 2. Display Posts Section
        if (posts.length > 0) {
            const postHeader = document.createElement('div');
            postHeader.className = 'search-section-header';
            postHeader.style.marginTop = users.length > 0 ? '20px' : '0';
            postHeader.innerHTML = `<h4>POSTS</h4>`;
            container.appendChild(postHeader);

            displayPosts(posts, false); // USE FALSE to append instead of clearing the People section!
            
            if (infoEl) {
                infoEl.style.display = 'block';
                let timeText = currentTimeframe === 'day' ? 'past 24h' : currentTimeframe === 'week' ? 'past week' : currentTimeframe === 'month' ? 'past month' : '';
                let sortText = currentSortBy === 'top' ? 'sorted by top' : '';
                let typeText = currentContentType !== 'all' ? `(${currentContentType})` : '';
                
                let msg = `Found <span class="highlight">${posts.length}</span> ${typeText} post${posts.length !== 1 ? 's' : ''}`;
                if (searchQuery) msg += ` for "<span class="highlight">${escapeHtml(searchQuery)}</span>"`;
                if (timeText) msg += ` from <span class="highlight">${timeText}</span>`;
                if (sortText) msg += ` ${sortText}`;
                
                infoEl.innerHTML = msg;
            }
        } else {
            if (users.length === 0) {
                showNoSearchResults(searchQuery);
            } else {
                // If we found users but no posts, show a friendly message below the people
                const noPostsMsg = document.createElement('div');
                noPostsMsg.className = 'no-posts-found-small';
                noPostsMsg.style.padding = '30px 20px';
                noPostsMsg.style.textAlign = 'center';
                noPostsMsg.innerHTML = `
                    <p style="color: #64748b; font-size: 14px; font-weight: 500;">No posts found for "${escapeHtml(searchQuery)}"</p>
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">But you can connect with the creators above!</p>
                `;
                container.appendChild(noPostsMsg);
            }
        }
    } catch (err) {
        console.error('Search error:', err);
        showNoSearchResults(searchQuery);
    } finally {
        if (loader) loader.style.opacity = '0';
    }
}

// --- Advanced Filter Functions ---

function toggleFilterModal() {
    const modal = document.getElementById('filterModal');
    if (!modal) return;
    
    const isShowing = modal.style.display === 'flex';
    modal.style.display = isShowing ? 'none' : 'flex';
    
    if (!isShowing) {
        // Sync modal UI with current state
        syncFilterUI();
        document.body.style.overflow = 'hidden'; // prevent background scroll
    } else {
        document.body.style.overflow = '';
    }
}

function handleModalOutsideClick(e) {
    if (e.target.id === 'filterModal') {
        toggleFilterModal();
    }
}

function syncFilterUI() {
    // Sort By
    const sortInputs = document.querySelectorAll('input[name="sortBy"]');
    sortInputs.forEach(input => {
        input.checked = input.value === currentSortBy;
    });
    
    // Date Posted
    const dateInputs = document.querySelectorAll('input[name="datePosted"]');
    dateInputs.forEach(input => {
        input.checked = input.value === currentTimeframe;
    });
    
    // Content Type
    const typeInputs = document.querySelectorAll('input[name="contentType"]');
    typeInputs.forEach(input => {
        input.checked = input.value === currentContentType;
    });
}

function applyFilters() {
    // Get values from UI
    currentSortBy = document.querySelector('input[name="sortBy"]:checked').value;
    currentTimeframe = document.querySelector('input[name="datePosted"]:checked').value;
    currentContentType = document.querySelector('input[name="contentType"]:checked').value;
    
    // Update the legacy hidden select if needed (optional)
    const legacySelect = document.getElementById('feedTimeFilter');
    if (legacySelect) legacySelect.value = currentTimeframe;
    
    toggleFilterModal();
    
    const input = document.getElementById('feedSearchInput');
    const keyword = input ? input.value.trim() : '';
    executeFeedSearch(keyword);
}

function resetFilters() {
    currentSortBy = 'latest';
    currentTimeframe = 'all';
    currentContentType = 'all';
    syncFilterUI();
}

/**
 * Handle time filter change - re-run search if keyword exists
 */
function onTimeFilterChange() {
    const input = document.getElementById('feedSearchInput');
    const keyword = input ? input.value.trim() : '';
    if (keyword) {
        executeFeedSearch(keyword);
    }
}

/**
 * When no keyword results found, scan top 50 posts and suggest them.
 */
async function showNoSearchResults(keyword) {
    const container = document.getElementById('feedContainer');
    const infoEl = document.getElementById('searchResultsInfo');

    try {
        const res = await fetch(`${API_BASE_URL}/api/posts?page=0&size=50`);
        let suggestions = [];
        if (res.ok) {
            const data = await res.json();
            suggestions = data.content ? data.content : data;
            suggestions.forEach(p => { if (p.userDetails && !p.user) p.user = p.userDetails; });
        }

        if (container) {
            container.innerHTML = `
                <div class="no-search-results">
                    <div class="no-search-icon">🔍</div>
                    <h3>No results found for "${escapeHtml(keyword)}"</h3>
                    <p>We couldn't find any exact matches for your search.</p>
                    <button class="scan-btn" onclick="clearFeedSearch()">
                        <i class="fa-solid fa-arrow-left"></i> Back to All Posts
                    </button>
                </div>
            `;
            if (suggestions.length > 0) {
                const suggestHeader = document.createElement('div');
                suggestHeader.style.cssText = 'padding: 12px 40px 4px; font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;';
                suggestHeader.textContent = `Recent Posts (${suggestions.length})`;
                container.appendChild(suggestHeader);
                const postsHtml = suggestions.map(p => renderPostHTML(p)).join('');
                container.insertAdjacentHTML('beforeend', postsHtml);
            }
        }
        if (infoEl) {
            infoEl.style.display = 'block';
            infoEl.innerHTML = `No results for "<span class="highlight">${escapeHtml(keyword)}</span>" — showing suggestions`;
        }
    } catch (err) {
        console.error('Error loading suggestions:', err);
        if (container) container.innerHTML = `<p class="no-data">No posts found for "${escapeHtml(keyword)}".</p>`;
    }
}

/**
 * Clear search mode and restore normal feed
 */
function clearFeedSearch() {
    searchMode = false;
    searchQuery = '';
    const input = document.getElementById('feedSearchInput');
    const clearBtn = document.getElementById('feedSearchClearBtn');
    const infoEl = document.getElementById('searchResultsInfo');
    const timeFilter = document.getElementById('feedTimeFilter');
    if (input) input.value = '';
    if (clearBtn) clearBtn.style.display = 'none';
    if (infoEl) { infoEl.style.display = 'none'; infoEl.textContent = ''; }
    if (timeFilter) timeFilter.value = 'all';

    hasMore = true;
    loadFeed(0, true);
}

/**
 * Check user's profile — if role/skills are set, auto-apply smart filter.
 * Before profile is updated: show normal feed (no filter).
 * After profile updated: show relevant posts based on role + skills.
 */
function checkAndApplySmartFilter(profile) { return; }
function applySmartFilterToCurrentFeed(keywords) { return; }
function clearSmartFilter() { return; }

/**
 * Escape HTML to prevent XSS in search result display
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
