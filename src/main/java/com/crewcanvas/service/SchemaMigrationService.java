package com.crewcanvas.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SchemaMigrationService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void migrate() {
        System.out.println("Checking database schema for group messaging...");
        try {
            // Create group_chats table
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS group_chats (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "name TEXT, " +
                    "description TEXT, " +
                    "created_by BIGINT, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ") ENGINE=InnoDB;");

            // Create group_members table
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS group_members (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "group_id BIGINT NOT NULL, " +
                    "user_id BIGINT NOT NULL, " +
                    "role VARCHAR(50) DEFAULT 'MEMBER', " +
                    "joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "FOREIGN KEY (group_id) REFERENCES group_chats(id) ON DELETE CASCADE" +
                    ") ENGINE=InnoDB;");

            // Check if group_id column exists in messages table
            try {
                jdbcTemplate.execute("ALTER TABLE messages ADD COLUMN group_id BIGINT AFTER receiver_id;");
                System.out.println("Added group_id column to messages table.");
            } catch (Exception e) {
                // Column probably already exists
                if (!e.getMessage().contains("Duplicate column name")) {
                    System.err.println("Note: " + e.getMessage());
                }
            }

            // Check if terms_accepted column exists in users table
            try {
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN terms_accepted BOOLEAN DEFAULT FALSE;");
                System.out.println("Added terms_accepted column to users table.");
            } catch (Exception e) {
                if (!e.getMessage().contains("Duplicate column name")) {
                    System.err.println("Note adding terms_accepted: " + e.getMessage());
                }
            }

            // Check if group_add_privilege exists
            try {
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN group_add_privilege TEXT;");
                System.out.println("Added group_add_privilege column to users table.");
            } catch (Exception e) {
                if (!e.getMessage().contains("Duplicate column name")) {
                    System.err.println("Note adding group_add_privilege: " + e.getMessage());
                }
            }

            // Ensure Polls table exists
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS polls (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "question TEXT NOT NULL, " +
                    "post_id BIGINT, " +
                    "FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE" +
                    ") ENGINE=InnoDB;");

            // Ensure Poll Options table exists
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS poll_options (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "option_text TEXT NOT NULL, " +
                    "poll_id BIGINT, " +
                    "FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE" +
                    ") ENGINE=InnoDB;");

            // Ensure Poll Votes table exists
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS poll_votes (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "poll_id BIGINT NOT NULL, " +
                    "user_id BIGINT NOT NULL, " +
                    "option_id BIGINT NOT NULL, " +
                    "UNIQUE KEY uk_poll_user (poll_id, user_id)" +
                    ") ENGINE=InnoDB;");

            // Ensure connections table exists
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS connections (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "follower_id BIGINT NOT NULL, " +
                    "following_id BIGINT NOT NULL, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ") ENGINE=InnoDB;");

            // Ensure profile_claim_invitations table exists
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS profile_claim_invitations (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "profile_id BIGINT NOT NULL, " +
                    "token_hash VARCHAR(128) NOT NULL, " +
                    "phone VARCHAR(50), " +
                    "email VARCHAR(191), " +
                    "status VARCHAR(50) NOT NULL DEFAULT 'UNCLAIMED', " +
                    "created_by_admin_id BIGINT, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "sent_at TIMESTAMP NULL, " +
                    "opened_at TIMESTAMP NULL, " +
                    "expires_at TIMESTAMP NOT NULL, " +
                    "claimed_at TIMESTAMP NULL, " +
                    "claimed_by_user_id BIGINT, " +
                    "INDEX idx_claim_token_hash (token_hash), " +
                    "INDEX idx_claim_profile_id (profile_id), " +
                    "INDEX idx_claim_status (status)" +
                    ") ENGINE=InnoDB;");

            // Ensure profile_claim_audit_logs table exists
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS profile_claim_audit_logs (" +
                    "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                    "profile_id BIGINT NOT NULL, " +
                    "invitation_id BIGINT, " +
                    "event_type VARCHAR(60) NOT NULL, " +
                    "event_details VARCHAR(1000), " +
                    "actor_user_id BIGINT, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "INDEX idx_audit_profile_id (profile_id), " +
                    "INDEX idx_audit_event_type (event_type)" +
                    ") ENGINE=InnoDB;");

            // Check if claim_status column exists in users table
            try {
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN claim_status VARCHAR(50) DEFAULT 'CLAIMED';");
                System.out.println("Added claim_status column to users table.");
            } catch (Exception e) {
                if (!e.getMessage().contains("Duplicate column name")) {
                    System.err.println("Note adding claim_status: " + e.getMessage());
                }
            }

            // Update official user name to KrewCanvas Official
            try {
                jdbcTemplate.execute("UPDATE users SET name = 'KrewCanvas Official' WHERE email = 'crewcanvas2@gmail.com' OR name = 'CrewCanvas Official';");
                jdbcTemplate.execute("UPDATE messages SET content = REPLACE(REPLACE(content, 'crewcanvas.in', 'krewcanvas.in'), 'CrewCanvas', 'KrewCanvas') WHERE content LIKE '%CrewCanvas%' OR content LIKE '%crewcanvas.in%';");
                jdbcTemplate.execute("UPDATE notifications SET content = REPLACE(REPLACE(content, 'crewcanvas.in', 'krewcanvas.in'), 'CrewCanvas', 'KrewCanvas') WHERE content LIKE '%CrewCanvas%' OR content LIKE '%crewcanvas.in%';");
            } catch (Exception e) {
                System.err.println("Branding migration note: " + e.getMessage());
            }

            System.out.println("Database schema verified for groups, polls, connections, and profile claim features.");
        } catch (Exception e) {
            System.err.println("Migration warning: " + e.getMessage());
        }
    }
}
