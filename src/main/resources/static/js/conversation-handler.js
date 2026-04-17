// Simple conversation click handler
document.addEventListener('DOMContentLoaded', function() {
    console.log('Conversation handler loaded');
    
    // Wait a bit for DOM to be fully ready
    setTimeout(function() {
        loadConnectionsFromBackend();
        setupBackButton();
    }, 1000);
});

async function loadConnectionsFromBackend() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return;
        }

        console.log('🔄 Loading connections from backend...');
        console.log('Token exists:', !!token);
        
        const response = await fetch('https://api.crewcanvas.in/api/messages/connections', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Connections data received:', data);
        console.log('📈 Counts:', {
            following: data.following,
            followers: data.followers,
            mutual: data.mutual,
            connectionsCount: data.connections ? data.connections.length : 0
        });

        // Update the connection counts in the header
        updateConnectionCounts(data);
        
        // Update the conversations list with real data
        updateConversationsList(data.connections);
        
        // Setup conversation handlers after loading data
        setupConversationHandlers();
        
    } catch (error) {
        console.error('❌ Error loading connections:', error);
        // Fallback to existing static data if backend fails
        setupConversationHandlers();
    }
}

function updateConnectionCounts(data) {
    console.log('Updating connection counts with data:', data);
    
    // Update Following count - target the span that contains the text
    const followingElement = document.querySelector('.connection-stats .stat-item:nth-child(1) span:last-child');
    if (followingElement) {
        followingElement.textContent = `${data.following} Following`;
        console.log('✅ Updated Following count to:', data.following);
    } else {
        console.error('❌ Following element not found');
    }
    
    // Update Followers count - target the span that contains the text
    const followersElement = document.querySelector('.connection-stats .stat-item:nth-child(2) span:last-child');
    if (followersElement) {
        followersElement.textContent = `${data.followers} Followers`;
        console.log('✅ Updated Followers count to:', data.followers);
    } else {
        console.error('❌ Followers element not found');
    }
    
    // Update Mutual count - target the span that contains the text
    const mutualElement = document.querySelector('.connection-stats .stat-item:nth-child(3) span:last-child');
    if (mutualElement) {
        mutualElement.textContent = `${data.mutual} Mutual`;
        console.log('✅ Updated Mutual count to:', data.mutual);
    } else {
        console.error('❌ Mutual element not found');
    }
    
    console.log('✅ Updated connection counts:', {
        following: data.following,
        followers: data.followers,
        mutual: data.mutual
    });
}

function updateConversationsList(connections) {
    const connectionsSection = document.querySelector('.connections-section');
    if (!connectionsSection) {
        console.error('Connections section not found');
        return;
    }

    // Clear existing conversations
    connectionsSection.innerHTML = '';

    // Add each connection as a conversation item
    connections.forEach(connection => {
        const conversationItem = document.createElement('div');
        conversationItem.className = 'conversation-item';
        conversationItem.setAttribute('data-user-id', connection.id);
        conversationItem.setAttribute('data-user-name', connection.name);
        
        conversationItem.innerHTML = `
            <img src="${connection.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(connection.name)}&background=random&color=fff&size=56`}" alt="${connection.name}">
            <div class="conversation-content">
                <div class="conversation-header">
                    <h4>${connection.name}</h4>
                    <span class="time">now</span>
                </div>
                <p class="last-message">Click to start chatting</p>
            </div>
            <div class="conversation-status">
                <span class="connection-type ${connection.type}">${connection.type}</span>
                <div class="online-indicator"></div>
            </div>
        `;

        connectionsSection.appendChild(conversationItem);
    });

    console.log(`✅ Updated conversations list with ${connections.length} connections`);
}

function setupBackButton() {
    const backBtn = document.querySelector('.back-btn');
    
    console.log('Setting up back button:', !!backBtn);
    
    if (!backBtn) {
        console.log('Back button not found, retrying...');
        setTimeout(setupBackButton, 1000);
        return;
    }
    
    backBtn.addEventListener('click', function() {
        console.log('🔙 Back button clicked!');
        
        const chatArea = document.querySelector('.chat-area');
        const messageInput = document.querySelector('.message-input');
        const conversationItems = document.querySelectorAll('.conversation-item');
        const conversationsList = document.querySelector('.conversations-list');
        
        // Hide chat area
        if (chatArea) {
            console.log('✅ Hiding chat area...');
            chatArea.classList.remove('active');
            chatArea.style.display = 'none';
            chatArea.style.opacity = '0';
            chatArea.style.transform = 'translateX(100%)';
        }
        
        // Hide message input
        if (messageInput) {
            console.log('✅ Hiding message input...');
            messageInput.classList.remove('active');
            messageInput.style.display = 'none';
        }
        
        // Remove active state from all conversations
        conversationItems.forEach(function(conv) {
            conv.classList.remove('active');
            conv.style.transform = 'translateX(0) scale(1)';
            conv.style.boxShadow = 'none';
        });
        
        // Show conversations list on mobile
        if (window.innerWidth <= 768 && conversationsList) {
            conversationsList.style.display = 'block';
            console.log('✅ Showing conversations list on mobile');
        }
        
        // Add back button animation
        backBtn.style.transform = 'translateX(-5px) scale(0.9)';
        setTimeout(function() {
            backBtn.style.transform = 'translateX(0) scale(1)';
        }, 150);
        
        console.log('🎉 Back button completed successfully!');
    });
    
    console.log('✅ Back button handler set up successfully');
}

function setupConversationHandlers() {
    const conversationItems = document.querySelectorAll('.conversation-item');
    const chatArea = document.querySelector('.chat-area');
    const messageInput = document.querySelector('.message-input');
    
    console.log('Setting up conversation handlers:', {
        conversations: conversationItems.length,
        chatArea: !!chatArea,
        messageInput: !!messageInput
    });
    
    conversationItems.forEach(function(item, index) {
        console.log(`Setting up handler for conversation ${index + 1}`);
        
        item.addEventListener('click', function() {
            console.log(' Conversation clicked!');
            
            // Remove active class from all conversations
            conversationItems.forEach(function(conv) {
                conv.classList.remove('active');
            });
            
            // Add active class to clicked conversation
            item.classList.add('active');
            
            // Show chat area
            if (chatArea) {
                console.log('✅ Making chat area visible...');
                chatArea.style.display = 'flex';
                chatArea.style.opacity = '1';
                chatArea.style.transform = 'translateX(0)';
                chatArea.style.visibility = 'visible';
                chatArea.classList.add('active');
                console.log('✅ Chat area is now visible');
            } else {
                console.error('❌ Chat area not found!');
            }
            
            // Show message input
            if (messageInput) {
                console.log('✅ Making message input visible...');
                messageInput.style.display = 'block';
                messageInput.classList.add('active');
                console.log('✅ Message input is now visible');
            } else {
                console.error('❌ Message input not found!');
            }
            
            // Update chat header with user info
            updateChatHeader(item);
            
            // Hide conversations list on mobile
            if (window.innerWidth <= 768) {
                const conversationsList = document.querySelector('.conversations-list');
                if (conversationsList) {
                    conversationsList.style.display = 'none';
                }
            }
            
            console.log('🎉 Conversation handler completed successfully!');
        });
    });
}

function updateChatHeader(conversationItem) {
    const userName = conversationItem.querySelector('h4').textContent;
    const userImg = conversationItem.querySelector('img').src;
    const chatHeader = document.querySelector('.chat-user-info');
    
    if (chatHeader) {
        // Update header name
        const nameElement = chatHeader.querySelector('h3');
        if (nameElement) {
            nameElement.textContent = userName;
        }
        
        // Update header image
        let headerImg = chatHeader.querySelector('img');
        if (!headerImg) {
            headerImg = document.createElement('img');
            headerImg.alt = 'User';
            chatHeader.insertBefore(headerImg, chatHeader.firstChild);
        }
        headerImg.src = userImg;
        headerImg.style.display = 'block';
        
        // Update status
        const statusElement = chatHeader.querySelector('.status');
        if (statusElement) {
            statusElement.textContent = 'Active now';
            statusElement.style.color = '#22C55E';
        }
        
        // Set user ID for messaging system - use the dynamic ID from backend
        const userId = conversationItem.getAttribute('data-user-id');
        
        if (userId) {
            chatHeader.setAttribute('data-user-id', userId);
            console.log('✅ Chat header updated for:', userName, 'with ID:', userId);
        } else {
            console.error('❌ No user ID found for conversation item');
        }
    }
} 

// Global function to refresh connection counts (can be called from other parts of the app)
async function refreshConnectionCounts() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No authentication token found');
            return;
        }

        const response = await fetch('https://api.crewcanvas.in/api/messages/connections', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        updateConnectionCounts(data);
        
        console.log('✅ Connection counts refreshed');
        return data;
    } catch (error) {
        console.error('Error refreshing connection counts:', error);
    }
}

// Manual test function - call this from browser console to debug
function testConnectionCounts() {
    console.log('🧪 Testing connection counts update...');
    
    // Test if elements exist
    const followingElement = document.querySelector('.connection-stats .stat-item:nth-child(1) span:last-child');
    const followersElement = document.querySelector('.connection-stats .stat-item:nth-child(2) span:last-child');
    const mutualElement = document.querySelector('.connection-stats .stat-item:nth-child(3) span:last-child');
    
    console.log('Elements found:', {
        following: !!followingElement,
        followers: !!followersElement,
        mutual: !!mutualElement
    });
    
    if (followingElement) console.log('Following element text:', followingElement.textContent);
    if (followersElement) console.log('Followers element text:', followersElement.textContent);
    if (mutualElement) console.log('Mutual element text:', mutualElement.textContent);
    
    // Test with dummy data
    const testData = {
        following: 5,
        followers: 3,
        mutual: 2
    };
    
    console.log('Testing with dummy data:', testData);
    updateConnectionCounts(testData);
}

// Expose test function globally
window.testConnectionCounts = testConnectionCounts;

// Expose the function globally so it can be called from other scripts
window.refreshConnectionCounts = refreshConnectionCounts; 
