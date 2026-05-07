-- PERFORMANCE OPTIMIZATION INDEXES
-- Run this in your MySQL environment to fix lag issues.

USE crewcanvas_db;

-- 1. Optimize Event Lookups (Fixes 10s lag on Events page)
ALTER TABLE events ADD INDEX idx_event_type (event_type);
ALTER TABLE events ADD INDEX idx_user_id (user_id);
ALTER TABLE events ADD INDEX idx_status (status);
ALTER TABLE events ADD INDEX idx_created_at (created_at DESC);
ALTER TABLE events ADD INDEX idx_date (date DESC);

-- 2. Optimize Application Lookups
ALTER TABLE event_applications ADD INDEX idx_event_id (event_id);
ALTER TABLE event_applications ADD INDEX idx_user_id (user_id);
ALTER TABLE event_applications ADD INDEX idx_applied_at (applied_at DESC);
ALTER TABLE event_applications ADD INDEX idx_pass_token (pass_token);

-- 3. Optimize Feed & Social (Fixes 5s lag on Feed/Dashboard)
ALTER TABLE posts ADD INDEX idx_user_id (user_id);
ALTER TABLE posts ADD INDEX idx_created_at (created_at DESC);
ALTER TABLE comments ADD INDEX idx_post_id (post_id);
ALTER TABLE comments ADD INDEX idx_user_id (user_id);

-- 4. Optimize User Search
ALTER TABLE users ADD INDEX idx_email (email);
ALTER TABLE users ADD INDEX idx_is_admin (is_admin);
ALTER TABLE users ADD INDEX idx_is_verified (is_verified_professional);
ALTER TABLE users ADD INDEX idx_profile_score (profile_score);

-- Success Indicator
SELECT 'Performance indexes successfully created!' AS status;
