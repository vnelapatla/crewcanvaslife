let currentPage = 0;
let isLoading = false;
let hasMore = true;
const PAGE_SIZE = 5;
let currentUserId = null;
let selectedImageFiles = []; // Array for multiple images

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    currentUserId = getCurrentUserId();
    loadFeed(0, true);
    setupImageUpload();
    setupInfiniteScroll();
});

// Load feed posts
async function loadFeed(page = 0, refresh = false) {
    if (isLoading || (!hasMore && !refresh)) return;
    
    isLoading = true;
    const container = document.getElementById('feedContainer');
    const loader = document.querySelector('.scroll-load');
    
    if (loader) loader.style.display = 'flex';
    if (refresh) {
        currentPage = 0;
        hasMore = true;
        if (container) container.innerHTML = '';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/posts?page=${page}&size=${PAGE_SIZE}`);
        if (response.ok) {
            let data = await response.json();
            const posts = data.content ? data.content : data;
            
            if (posts.length < PAGE_SIZE) {
                hasMore = false;
            }

            // --- OPTIMIZATION: Render IMMEDIATELY with what we have ---
            // This ensures mobile users see posts even if profile fetching is slow
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

            currentPage = page + 1;
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
        if (loader) loader.style.display = 'none';
    }
}

// Setup Infinite Scroll
function setupInfiniteScroll() {
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
            loadFeed(currentPage);
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
                <img src="${images[0]}" class="post-image" alt="Post content" loading="lazy" style="margin-top:0;">
            </div>
        `;
    } else if (images.length > 1) {
        mediaHtml = `
            <div class="post-slider-container">
                <div id="slider-${post.id}" class="post-slider" onscroll="updateSliderDots(${post.id})">
                    ${images.map(img => `
                        <div class="post-slider-item">
                            <img src="${img}" alt="Post content" loading="lazy">
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
                    <button onclick="editPost(${post.id}, '${post.content.replace(/'/g, "\\'")}')" title="Edit">✏️</button>
                    <button onclick="deletePost(${post.id})" title="Delete">🗑️</button>
                </div>
            ` : ''}
        </div>
        <div class="post-content" style="padding: 15px 0;">
            <p style="margin-bottom:15px; line-height:1.6;">${post.content}</p>
            
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
                try {
                    const base64 = await uploadImage(file);
                    selectedImageFiles.push(base64);
                    
                    const previewDiv = document.createElement('div');
                    previewDiv.style.cssText = "position:relative; width:80px; height:80px;";
                    previewDiv.innerHTML = `
                        <img src="${base64}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
                        <button onclick="removeSelectedImage(this, '${base64}')" style="position:absolute; top:-5px; right:-5px; background:red; color:white; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; cursor:pointer;">✕</button>
                    `;
                    previewContainer.appendChild(previewDiv);
                } catch (error) {
                    showMessage(error.message, 'error');
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

async function createPost() {
    const postBtn = document.querySelector('.auth-btn[onclick="createPost()"]');
    const content = document.getElementById('postContent').value.trim();
    const link = document.getElementById('postLink').value.trim();

    if (!content && selectedImageFiles.length === 0) {
        showMessage('Please write something or add media', 'error');
        return;
    }

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
            body: JSON.stringify({
                userId: currentUserId,
                content: content,
                imageUrls: selectedImageFiles,
                externalLinks: link ? [link] : []
            })
        });

        if (response.ok) {
            showMessage('Post created successfully!', 'success');
            document.getElementById('postContent').value = '';
            document.getElementById('postLink').value = '';
            selectedImageFiles = [];
            document.getElementById('imagePreviewContainer').innerHTML = '';
            loadFeed(0, true);
        } else {
            const error = await response.text();
            showMessage('Error: ' + error, 'error');
        }
    } catch (error) {
        console.error('Error creating post:', error);
        showMessage('Connection Error', 'error');
    } finally {
        const postBtn = document.querySelector('.auth-btn[onclick="createPost()"]');
        if (postBtn) {
            postBtn.disabled = false;
            postBtn.innerHTML = 'Post';
        }
    }
}

async function deletePost(postId) {
    if (!confirm('Delete this post?')) return;
    try {
        const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
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
            showMessage('Could not like post', 'error');
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
            body: JSON.stringify({text: finalComment})
        });
        if (response.ok) {
            const updatedPost = await response.json();
            loadFeed(0, true); // Refresh or we could surgically update the comment list
            showMessage('Comment added gracefully!', 'success');
        } else {
            showMessage('Error commenting', 'error');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function editPost(postId, currentContent) {
    const newContent = prompt("Edit your post:", currentContent);
    if (newContent !== null && newContent.trim() !== "") {
        try {
            const response = await fetch(`${API_BASE_URL}/api/posts/${postId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newContent.trim()
                })
            });
            if (response.ok) {
                showMessage('Post updated!');
                loadFeed(0, true);
            } else {
                showMessage('Failed to update post.', 'error');
            }
        } catch (e) {
            console.error('Error updating post', e);
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

