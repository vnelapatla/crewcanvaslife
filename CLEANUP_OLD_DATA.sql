-- SQL script to keep only the last 1 month of posts and auditions (events)
-- This deletes everything older than 30 days from the database.

-- 1. Disable foreign key constraints temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- 2. DELETE OLD EVENTS (Keep only the last 30 days)
DELETE FROM events WHERE created_at < NOW() - INTERVAL 30 DAY;

-- Clean up orphaned event applications
DELETE FROM event_applications WHERE event_id NOT IN (SELECT id FROM events);

-- 3. DELETE OLD POSTS (Keep only the last 30 days)
DELETE FROM posts WHERE created_at < NOW() - INTERVAL 30 DAY;

-- Clean up all child data associated with deleted posts
DELETE FROM comments WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM comment_likes WHERE comment_id NOT IN (SELECT id FROM comments);
DELETE FROM post_likes_users WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM post_reposts_users WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM post_images WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM post_links WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM polls WHERE post_id NOT IN (SELECT id FROM posts);
DELETE FROM poll_options WHERE poll_id NOT IN (SELECT id FROM polls);
DELETE FROM poll_votes WHERE poll_id NOT IN (SELECT id FROM polls);

-- 4. Re-enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;
