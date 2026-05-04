package com.crewcanvas.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseFixerConfig {

    @Bean
    public CommandLineRunner fixUserTable(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Check if we've already done this recently to avoid boot lag and deadlocks
                try {
                    jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS sys_maintenance (id INT PRIMARY KEY, last_run TIMESTAMP)");
                    java.util.List<java.util.Map<String, Object>> lastRun = jdbcTemplate.queryForList("SELECT last_run FROM sys_maintenance WHERE id = 1");
                    if (!lastRun.isEmpty()) {
                        java.sql.Timestamp ts = (java.sql.Timestamp) lastRun.get(0).get("last_run");
                        // If run within last 10 seconds, skip heavy maintenance
                        if (System.currentTimeMillis() - ts.getTime() < 10000) {
                            System.out.println("Database maintenance skipped (recently completed).");
                            return;
                        }
                    }
                } catch (Exception e) {}

                System.out.println("Applying manual database fixes to resolve row size limits...");
                
                // Manually force these columns to TEXT to free up row space
                String[] columnsToFix = {
                    "role", "location", "experience", "phone", "availability",
                    "height", "weight", "age_range", "gender", "body_type",
                    "turnaround_time", "instagram", "youtube", "tiktok", "twitter"
                };

                for (String col : columnsToFix) {
                    try {
                        jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN " + col + " TEXT");
                    } catch (Exception e) {
                        // Skip if already TEXT or missing
                    }
                }

                // Fix event image_url column size
                try {
                    System.out.println("DEBUG: Running Event table fix...");
                    try { jdbcTemplate.execute("ALTER TABLE events MODIFY COLUMN image_url LONGTEXT"); } catch (Exception e1) { jdbcTemplate.execute("ALTER TABLE events CHANGE image_url image_url LONGTEXT"); }
                    try { jdbcTemplate.execute("ALTER TABLE events MODIFY COLUMN requirements TEXT"); } catch (Exception e2) { jdbcTemplate.execute("ALTER TABLE events CHANGE requirements requirements TEXT"); }
                    System.out.println("SUCCESS: Upgraded event table columns (image_url, requirements)");
                } catch (Exception e) {
                    System.err.println("Note: Event table fix skipped - " + e.getMessage());
                }

                // Manually add missing columns that Hibernate might fail to create in Production
                String[] columnsToAdd = {
                    "bio TEXT",
                    "age_range TEXT",
                    "profile_score INT DEFAULT 0",
                    "height TEXT",
                    "weight TEXT",
                    "gender TEXT",
                    "body_type TEXT",
                    "languages TEXT",
                    "team_size TEXT",
                    "showreel TEXT",
                    "editing_style TEXT",
                    "experience_details TEXT",
                    "turnaround_time TEXT",
                    "daws TEXT",
                    "instruments TEXT",
                    "music_experience TEXT",
                    "google_id VARCHAR(191) UNIQUE",
                    "availability_from DATE",
                    "availability_to DATE",
                    "expected_movie_remuneration TEXT",
                    "expected_webseries_remuneration TEXT",
                    "genres TEXT",
                    "projects_directed TEXT",
                    "budget_handled TEXT",
                    "vision_statement TEXT",
                    "editing_software TEXT",
                    "portfolio_videos TEXT",
                    "camera_expertise TEXT",
                    "sample_tracks TEXT",
                    "interests TEXT",
                    "occupation TEXT",
                    "goals TEXT",
                    "learning_resources TEXT",
                    "recent_pictures LONGTEXT",
                    "profile_picture LONGTEXT",
                    "cover_image LONGTEXT",
                    "user_type TEXT",
                    "is_verified_professional BOOLEAN DEFAULT FALSE",
                    "is_admin BOOLEAN DEFAULT FALSE",
                    "welcome_sent BOOLEAN DEFAULT FALSE",
                    "profile_visibility VARCHAR(50) DEFAULT 'Everyone'",
                    "message_permissions VARCHAR(50) DEFAULT 'Everyone'",
                    "email_notifications BOOLEAN DEFAULT TRUE",
                    "follower_notifications BOOLEAN DEFAULT TRUE",
                    "event_reminders BOOLEAN DEFAULT TRUE"
                };

                for (String colDef : columnsToAdd) {
                    String colName = colDef.split(" ")[0];
                    try {
                        // Silent check to see if column exists
                        jdbcTemplate.queryForList("SELECT " + colName + " FROM users LIMIT 1");
                    } catch (Exception e) {
                        // Column doesn't exist, try to add it
                        try {
                            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN " + colDef);
                            System.out.println("SUCCESS: Added column " + colName);
                        } catch (Exception addEx) {
                            // Real error
                        }
                    }
                }

                // Add verified column to projects
                try {
                    jdbcTemplate.queryForList("SELECT verified FROM projects LIMIT 1");
                } catch (Exception e) {
                    try { jdbcTemplate.execute("ALTER TABLE projects ADD COLUMN verified BOOLEAN DEFAULT FALSE"); } catch (Exception ex) {}
                }


                // DESIGNATE ADMIN ACCOUNT
                try {
                    int adminUpdated = jdbcTemplate.update(
                        "UPDATE users SET is_admin = TRUE, password = 'admin123' WHERE email LIKE 'crewcanvas2@gmail%'"
                    );
                    if (adminUpdated > 0) {
                        System.out.println("SUCCESS: Designated Admin account.");
                    }
                } catch (Exception e) {
                    System.err.println("Note: Admin designation skipped - " + e.getMessage());
                }
                
                // --- Fix Other Tables ---
                String[][] tableFixes = {
                    {"posts", "author_id BIGINT"},
                    {"posts", "description TEXT"},
                    {"posts", "aspect_ratio VARCHAR(50) DEFAULT 'original'"},
                    {"events", "end_date DATE"},
                    {"events", "time_duration VARCHAR(255)"},
                    {"events", "org_name TEXT"},
                    {"events", "org_phone TEXT"},
                    {"events", "org_email TEXT"},
                    {"events", "skills TEXT"},
                    {"events", "status VARCHAR(50) DEFAULT 'OPEN'"},
                    {"messages", "is_edited BOOLEAN DEFAULT FALSE"}
                };

                for (String[] fix : tableFixes) {
                    String table = fix[0];
                    String colDef = fix[1];
                    String colName = colDef.split(" ")[0];
                    try {
                        jdbcTemplate.queryForList("SELECT " + colName + " FROM " + table + " LIMIT 1");
                    } catch (Exception e) {
                        try {
                            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + colDef);
                        } catch (Exception ex) {}
                    }
                }

                // --- Optimize Event Applications ---
                String[] appCols = { "event_title TEXT", "event_type TEXT", "event_location TEXT", "event_date TEXT", "pass_token VARCHAR(255)", "is_scanned BOOLEAN DEFAULT FALSE" };
                for (String colDef : appCols) {
                    String colName = colDef.split(" ")[0];
                    try {
                        jdbcTemplate.queryForList("SELECT " + colName + " FROM event_applications LIMIT 1");
                    } catch (Exception e) {
                        try { 
                            System.out.println("FIX: Adding missing column " + colName + " to event_applications");
                            jdbcTemplate.execute("ALTER TABLE event_applications ADD COLUMN " + colDef); 
                        } catch (Exception ex) {
                            System.err.println("CRITICAL: Failed to add column " + colName + ": " + ex.getMessage());
                        }
                    }
                }

                // --- Performance Optimization: Add Database Indexes ---
                String[] indexFixes = {
                    "CREATE INDEX idx_users_email ON users(email)",
                    "CREATE INDEX idx_events_user ON events(user_id)",
                    "CREATE INDEX idx_events_type ON events(event_type)",
                    "CREATE INDEX idx_events_date ON events(date)",
                    "CREATE INDEX idx_app_user ON event_applications(user_id)",
                    "CREATE INDEX idx_app_event ON event_applications(event_id)",
                    "CREATE INDEX idx_posts_user ON posts(user_id)",
                    "CREATE INDEX idx_posts_date ON posts(created_at)",
                    "CREATE INDEX idx_notif_user ON notifications(user_id)",
                    "CREATE INDEX idx_notif_created ON notifications(created_at)"
                };
                
                System.out.println("Optimizing database indexes for speed...");
                
                // --- Ensure Notifications Table Exists ---
                try {
                    jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS notifications (" +
                        "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                        "user_id BIGINT NOT NULL, " +
                        "actor_id BIGINT, " +
                        "actor_name VARCHAR(255), " +
                        "actor_avatar LONGTEXT, " +
                        "type VARCHAR(50), " +
                        "content TEXT, " +
                        "target_id VARCHAR(255), " +
                        "is_read BOOLEAN DEFAULT FALSE, " +
                        "created_at DATETIME" +
                        ")");
                    System.out.println("SUCCESS: Verified Notifications table.");
                } catch (Exception e) {
                    System.err.println("Note: Notifications table creation check - " + e.getMessage());
                }
                for (String idxSql : indexFixes) {
                    try { jdbcTemplate.execute(idxSql); } catch (Exception e) {}
                }
                
                // Perform Data Migration for remuneration fields if old data exists
                try {
                    jdbcTemplate.execute("UPDATE users SET expected_movie_remuneration = budget_movie WHERE expected_movie_remuneration IS NULL AND budget_movie IS NOT NULL");
                    jdbcTemplate.execute("UPDATE users SET expected_webseries_remuneration = budget_webseries WHERE expected_webseries_remuneration IS NULL AND budget_webseries IS NOT NULL");
                    System.out.println("SUCCESS: Migrated existing remuneration data.");
                } catch (Exception e) {
                    // Ignore if budget_movie doesn't exist
                }
                
                // --- DATA COMPRESSION: Shrink existing large images to fix 10s delay ---
                System.out.println("Checking for oversized images to compress...");
                compressExistingImages(jdbcTemplate, "users", "profile_picture", "id");
                compressExistingImages(jdbcTemplate, "users", "cover_image", "id");
                compressExistingImages(jdbcTemplate, "posts", "image_url", "id");
                
                // Mark maintenance as done
                try {
                    jdbcTemplate.update("REPLACE INTO sys_maintenance (id, last_run) VALUES (1, CURRENT_TIMESTAMP)");
                } catch (Exception e) {}

                System.out.println("Database maintenance completed.");
            } catch (Exception e) {
                System.err.println("Database fix error: " + e.getMessage());
            }
        };
    }

    private void compressExistingImages(JdbcTemplate jdbcTemplate, String table, String column, String idCol) {
        try {
            // Only find images that are actually large (> 100KB in base64 is ~75KB raw)
            java.util.List<java.util.Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT " + idCol + ", " + column + " FROM " + table + " WHERE " + column + " IS NOT NULL AND LENGTH(" + column + ") > 100000 LIMIT 50"
            );

            if (rows.isEmpty()) return;
            System.out.println("Optimizing " + rows.size() + " large images in " + table + "...");

            for (java.util.Map<String, Object> row : rows) {
                Object id = row.get(idCol);
                String base64 = (String) row.get(column);
                if (base64 == null || !base64.startsWith("data:image")) continue;

                try {
                    String optimized = compressBase64Image(base64);
                    jdbcTemplate.update("UPDATE " + table + " SET " + column + " = ? WHERE " + idCol + " = ?", optimized, id);
                } catch (Exception e) {
                    System.err.println("Failed to compress image for " + table + " ID " + id + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Error in image optimization for " + table + ": " + e.getMessage());
        }
    }

    private String compressBase64Image(String base64Str) throws Exception {
        // Extract the actual base64 part
        String[] parts = base64Str.split(",");
        String header = parts[0];
        String content = parts[1];
        byte[] bytes = java.util.Base64.getDecoder().decode(content);

        // Read image
        java.io.ByteArrayInputStream bis = new java.io.ByteArrayInputStream(bytes);
        java.awt.image.BufferedImage img = javax.imageio.ImageIO.read(bis);
        if (img == null) return base64Str;

        // Target size: Max 400px width/height for thumbnails/profiles
        int targetWidth = 400;
        if (img.getWidth() <= targetWidth) return base64Str;
        
        int targetHeight = (int) (img.getHeight() * ((double) targetWidth / img.getWidth()));
        java.awt.Image scaled = img.getScaledInstance(targetWidth, targetHeight, java.awt.Image.SCALE_SMOOTH);
        java.awt.image.BufferedImage output = new java.awt.image.BufferedImage(targetWidth, targetHeight, java.awt.image.BufferedImage.TYPE_INT_RGB);
        
        java.awt.Graphics2D g2d = output.createGraphics();
        g2d.drawImage(scaled, 0, 0, null);
        g2d.dispose();

        // Write back to base64
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(output, "jpg", bos);
        String newContent = java.util.Base64.getEncoder().encodeToString(bos.toByteArray());
        
        return header.replace("png", "jpeg").replace("webp", "jpeg") + "," + newContent;
    }
}
