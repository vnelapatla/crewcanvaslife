-- CREWCANVAS DATABASE SYNC SCRIPT
-- This script ensures your MySQL 'users' table matches the User.java entity.
-- Run this in MySQL Workbench or your preferred SQL tool.

USE crewcanvas_db;

-- 1. Ensure core identity and system fields exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(191) UNIQUE,
ADD COLUMN IF NOT EXISTS user_type TEXT,
ADD COLUMN IF NOT EXISTS is_verified_professional BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS profile_score INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS welcome_sent BOOLEAN DEFAULT FALSE;

-- 2. Ensure professional and availability fields exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS skills TEXT,
ADD COLUMN IF NOT EXISTS experience TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT,
ADD COLUMN IF NOT EXISTS availability_from DATE,
ADD COLUMN IF NOT EXISTS availability_to DATE,
ADD COLUMN IF NOT EXISTS expected_movie_remuneration TEXT,
ADD COLUMN IF NOT EXISTS expected_webseries_remuneration TEXT;

-- 3. Ensure craft-specific fields exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS genres TEXT,
ADD COLUMN IF NOT EXISTS projects_directed TEXT,
ADD COLUMN IF NOT EXISTS budget_handled TEXT,
ADD COLUMN IF NOT EXISTS vision_statement TEXT,
ADD COLUMN IF NOT EXISTS editing_software TEXT,
ADD COLUMN IF NOT EXISTS portfolio_videos TEXT,
ADD COLUMN IF NOT EXISTS camera_expertise TEXT,
ADD COLUMN IF NOT EXISTS sample_tracks TEXT;

-- 4. Ensure role-specific details exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS height TEXT,
ADD COLUMN IF NOT EXISTS weight TEXT,
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS body_type TEXT,
ADD COLUMN IF NOT EXISTS languages TEXT,
ADD COLUMN IF NOT EXISTS team_size TEXT,
ADD COLUMN IF NOT EXISTS showreel TEXT,
ADD COLUMN IF NOT EXISTS editing_style TEXT,
ADD COLUMN IF NOT EXISTS experience_details TEXT,
ADD COLUMN IF NOT EXISTS turnaround_time TEXT,
ADD COLUMN IF NOT EXISTS daws TEXT,
ADD COLUMN IF NOT EXISTS instruments TEXT,
ADD COLUMN IF NOT EXISTS music_experience TEXT;

-- 5. Ensure social links exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS youtube TEXT,
ADD COLUMN IF NOT EXISTS tiktok TEXT,
ADD COLUMN IF NOT EXISTS twitter TEXT;

-- 6. Ensure personal info and stats exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS goals TEXT,
ADD COLUMN IF NOT EXISTS learning_resources TEXT,
ADD COLUMN IF NOT EXISTS followers INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS following INT DEFAULT 0;

-- 7. Ensure media and metadata fields exist
ALTER TABLE users
MODIFY COLUMN profile_picture LONGTEXT,
MODIFY COLUMN cover_image LONGTEXT,
ADD COLUMN IF NOT EXISTS recent_pictures LONGTEXT,
ADD COLUMN IF NOT EXISTS resume LONGBLOB,
ADD COLUMN IF NOT EXISTS resume_file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS resume_content_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(50) DEFAULT 'Everyone',
ADD COLUMN IF NOT EXISTS message_permissions VARCHAR(50) DEFAULT 'Everyone',
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS follower_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS event_reminders BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS created_at DATETIME,
ADD COLUMN IF NOT EXISTS updated_at DATETIME;

-- 8. Final modifications for TEXT consistency
ALTER TABLE users 
MODIFY COLUMN bio TEXT,
MODIFY COLUMN skills TEXT,
MODIFY COLUMN experience TEXT,
MODIFY COLUMN location TEXT;

-- Success indicator
SELECT 'Database schema sync complete!' AS status;
