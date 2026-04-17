// Profile hover functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeProfilePopups();
    initializeProfileActions();
    initializeScrollIndicator();
});

function initializeProfilePopups() {
    document.querySelectorAll('.profile-card').forEach(card => {
        const name = card.querySelector('h3').textContent;
        const role = card.querySelector('.role').textContent;
        const rating = card.querySelector('.rating span').textContent;
        const bio = card.querySelector('.bio').textContent;
        const skills = Array.from(card.querySelectorAll('.skill-tag'))
            .map(skill => skill.textContent);
        const profileImage = card.querySelector('.profile-header img').src;
        
        card.addEventListener('click', (e) => {
            // Get card position
            const rect = card.getBoundingClientRect();
            const cardCenterX = rect.left + rect.width / 2;
            const cardCenterY = rect.top + rect.height / 2;

            const popup = document.createElement('div');
            popup.className = 'profile-popup';
            popup.innerHTML = `
                <button class="popup-close">
                    <i class="fas fa-times"></i>
                </button>
                <div class="profile-popup-content">
                    <img src="${profileImage}" alt="${name}" class="popup-profile-image">
                    <h4>${name}</h4>
                    <p>${role}</p>
                    <div class="popup-rating">
                        <i class="fas fa-star"></i>
                        <span>${rating}</span>
                    </div>
                    <p class="popup-bio">${bio}</p>
                    <div class="popup-skills">
                        ${skills.map(skill => `<span class="popup-skill">${skill}</span>`).join('')}
                    </div>
                </div>
            `;
            
            document.body.appendChild(popup);
            
            // Position the popup content at the card's center
            const popupContent = popup.querySelector('.profile-popup-content');
            popupContent.style.position = 'absolute';
            popupContent.style.left = `${cardCenterX}px`;
            popupContent.style.top = `${cardCenterY}px`;
            popupContent.style.transform = 'translate(-50%, -50%)';
            
            // Trigger animation
            requestAnimationFrame(() => {
                popup.style.opacity = '1';
                popupContent.style.position = 'relative';
                popupContent.style.left = 'auto';
                popupContent.style.top = 'auto';
                popupContent.style.transform = 'none';
            });

            // Close button functionality
            const closeBtn = popup.querySelector('.popup-close');
            closeBtn.addEventListener('click', () => {
                closePopup(popup, cardCenterX, cardCenterY);
            });

            // Close on click outside
            popup.addEventListener('click', (e) => {
                if (e.target === popup) {
                    closePopup(popup, cardCenterX, cardCenterY);
                }
            });

            // Close on escape key
            document.addEventListener('keydown', function closeOnEscape(e) {
                if (e.key === 'Escape') {
                    closePopup(popup, cardCenterX, cardCenterY);
                    document.removeEventListener('keydown', closeOnEscape);
                }
            });
        });
    });
}

function closePopup(popup, cardCenterX, cardCenterY) {
    const popupContent = popup.querySelector('.profile-popup-content');
    
    // Position the popup content back at the card's center
    popupContent.style.position = 'absolute';
    popupContent.style.left = `${cardCenterX}px`;
    popupContent.style.top = `${cardCenterY}px`;
    popupContent.style.transform = 'translate(-50%, -50%)';
    
    // Add closing class for animation
    popup.classList.add('closing');
    
    // Remove popup after animation
    setTimeout(() => {
        popup.remove();
    }, 400);
}

function initializeProfileActions() {
    // Connect button functionality
    document.querySelectorAll('.action-btn.connect').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.profile-card');
            const name = card.querySelector('h3').textContent;
            
            if (button.textContent.includes('Connect')) {
                button.innerHTML = '<i class="fas fa-check"></i> Connected';
                button.classList.add('connected');
                showNotification(`Connected with ${name}`);
            } else {
                button.innerHTML = '<i class="fas fa-user-plus"></i> Connect';
                button.classList.remove('connected');
                showNotification(`Disconnected from ${name}`);
            }
        });
    });

    // Message button functionality
    document.querySelectorAll('.action-btn.message').forEach(button => {
        button.addEventListener('click', (e) => {
            const card = e.target.closest('.profile-card');
            const name = card.querySelector('h3').textContent;
            window.location.href = `messages.html?recipient=${encodeURIComponent(name)}`;
        });
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Search functionality
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        document.querySelectorAll('.profile-card').forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const role = card.querySelector('.role').textContent.toLowerCase();
            const bio = card.querySelector('.bio').textContent.toLowerCase();
            const skills = Array.from(card.querySelectorAll('.skill-tag'))
                .map(skill => skill.textContent.toLowerCase());
            
            const isVisible = name.includes(searchTerm) ||
                            role.includes(searchTerm) ||
                            bio.includes(searchTerm) ||
                            skills.some(skill => skill.includes(searchTerm));
            
            card.style.display = isVisible ? 'block' : 'none';
        });
    });
}

function initializeScrollIndicator() {
    // Create scroll indicator element
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    scrollIndicator.innerHTML = `
        <div class="scroll-stick">
            <div class="scroll-ball"></div>
        </div>
        <span>Scroll</span>
    `;
    document.body.appendChild(scrollIndicator);

    // Hide scroll indicator when scrolled
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > 100) {
            scrollIndicator.classList.add('hidden');
        } else {
            scrollIndicator.classList.remove('hidden');
        }
        
        lastScrollTop = scrollTop;
    });
} 

const logo = document.querySelector('.sidebar .logo');
if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
        window.location.href = 'feed.html';
    });
}

// Show right panel if add comment is shown
postModalCommentBtn.addEventListener('click', function() {
    const igModalRightContainer = document.getElementById('igModalRightContainer');
    if (!document.querySelector('.ig-modal-right')) {
        igModalRightContainer.innerHTML = `
            <div class="ig-modal-right">
                <button class="post-modal-close" id="postModalClose">&times;</button>
                <div class="comments-section" id="postModalCommentsSection"></div>
                <div class="add-comment" id="postModalAddComment" style="display:flex;">
                    <input type="text" placeholder="Add a comment..." class="comment-input" id="postModalCommentInput">
                    <button class="submit-comment" id="postModalSubmitComment">Post</button>
                </div>
            </div>
        `;
        // Attach close button event
        const postModalCloseBtn = document.getElementById('postModalClose');
        if (postModalCloseBtn) {
            postModalCloseBtn.addEventListener('click', function() {
                postModalOverlay.classList.remove('active');
            });
        }
    } else {
        document.getElementById('postModalAddComment').style.display = 'flex';
        document.getElementById('postModalCommentInput').focus();
    }
});

// After fetching posts, fix empty state logic
if (posts && Array.isArray(posts) && posts.length > 0) {
    const postsEmptyState = document.getElementById('postsEmptyState');
    if (postsEmptyState) postsEmptyState.style.display = 'none';
    postsGrid.style.display = 'grid';
    // Render posts as before...
} else {
    const postsEmptyState = document.getElementById('postsEmptyState');
    if (postsEmptyState) postsEmptyState.style.display = 'block';
    postsGrid.style.display = 'grid';
}

// Event delegation for modal buttons
postModalOverlay.addEventListener('click', async function(e) {
    const post = window.currentModalPost;
    if (!post) return;
    // Like button
    if (e.target.closest('#postModalLikeBtn')) {
        const userId = user.id || 'me';
        const liked = post.likes && post.likes.includes(userId);
        let newLikes;
        if (liked) {
            newLikes = post.likes.filter(id => id !== userId);
        } else {
            newLikes = [...(post.likes || []), userId];
        }
        post.likes = newLikes;
        postModalLikes.textContent = newLikes.length;
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post.id}/like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ userId })
            });
            if (!res.ok) throw new Error('Failed to like/unlike');
        } catch (err) {
            alert('Failed to update like.');
        }
        return;
    }
    // Comment button
    if (e.target.closest('#postModalCommentBtn')) {
        document.getElementById('postModalCommentInput').focus();
        return;
    }
    // Submit comment
    if (e.target.closest('#postModalSubmitComment')) {
        const input = document.getElementById('postModalCommentInput');
        const text = input.value.trim();
        if (!text) return;
        const commentsSection = document.getElementById('postModalCommentsSection');
        const commentDiv = document.createElement('div');
        commentDiv.className = 'modal-comment';
        commentDiv.innerHTML = `<b>${user.name || 'You'}:</b> ${text}`;
        commentsSection.appendChild(commentDiv);
        post.comments = post.comments || [];
        post.comments.push({ author: user.name, text });
        postModalComments.textContent = post.comments.length;
        input.value = '';
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/${post.id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ text })
            });
            if (!res.ok) throw new Error('Failed to comment');
        } catch (err) {
            alert('Failed to add comment.');
        }
        return;
    }
    // Share button
    if (e.target.closest('#postModalShareBtn')) {
        const shareBtn = document.getElementById('postModalShareBtn');
        const postUrl = window.location.origin + `/post/${post.id}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            shareBtn.innerHTML = '<i class="far fa-paper-plane"></i> Copied!';
            setTimeout(() => {
                shareBtn.innerHTML = '<i class="far fa-paper-plane"></i>';
            }, 1200);
        }).catch(() => {
            alert('Failed to copy link.');
        });
        return;
    }
});
