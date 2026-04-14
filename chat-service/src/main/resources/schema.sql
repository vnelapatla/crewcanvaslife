-- Messaging System Schema

-- Users table (Reflecting the required fields)
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    profile_image VARCHAR(500),
    status VARCHAR(50) DEFAULT 'offline'
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation Participants table
CREATE TABLE IF NOT EXISTS conversation_participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX (conversation_id),
    INDEX (user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message_text LONGTEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, read
    FOREIGN KEY (conversation_id) REFERENCES conversations(id),
    FOREIGN KEY (sender_id) REFERENCES users(id),
    INDEX (conversation_id),
    INDEX (sender_id),
    INDEX (timestamp)
);

-- Sample Data for testing
INSERT INTO users (name, profile_image, status) VALUES ('John Doe', 'https://ui-avatars.com/api/?name=John+Doe', 'online');
INSERT INTO users (name, profile_image, status) VALUES ('Jane Smith', 'https://ui-avatars.com/api/?name=Jane+Smith', 'offline');
INSERT INTO users (name, profile_image, status) VALUES ('Michael Scott', 'https://ui-avatars.com/api/?name=Michael+Scott', 'online');

-- Queries requested:

-- 1. Fetch user conversations (with last message)
-- SELECT c.id as conversation_id, u.name as other_user_name, u.profile_image, m.message_text as last_message, m.timestamp as last_message_time
-- FROM conversations c
-- JOIN conversation_participants cp1 ON c.id = cp1.conversation_id
-- JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp1.user_id != cp2.user_id
-- JOIN users u ON cp2.user_id = u.id
-- LEFT JOIN messages m ON m.id = (
--     SELECT id FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1
-- )
-- WHERE cp1.user_id = ?;

-- 2. Fetch messages (paginated)
-- SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT ? OFFSET ?;
