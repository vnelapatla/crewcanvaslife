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

            System.out.println("Database schema verified for groups and polls.");
        } catch (Exception e) {
            System.err.println("Migration warning: " + e.getMessage());
        }
    }
}
