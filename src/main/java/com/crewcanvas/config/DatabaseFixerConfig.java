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

                // Manually add missing columns that Hibernate might fail to create in Production
                String[] columnsToAdd = {
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
                    "profile_picture LONGTEXT",
                    "cover_image LONGTEXT"
                };

                for (String colDef : columnsToAdd) {
                    String colName = colDef.split(" ")[0];
                    try {
                        jdbcTemplate.execute("ALTER TABLE users ADD COLUMN " + colDef);
                        System.out.println("SUCCESS: Added column " + colName);
                        
                        // Data Migration: If we just added the new column, try to copy data from the old one if it exists
                        if (colName.equals("expected_movie_remuneration")) {
                            try { jdbcTemplate.execute("UPDATE users SET expected_movie_remuneration = budget_movie WHERE expected_movie_remuneration IS NULL"); } catch (Exception e) {}
                        }
                        if (colName.equals("expected_webseries_remuneration")) {
                            try { jdbcTemplate.execute("UPDATE users SET expected_webseries_remuneration = budget_webseries WHERE expected_webseries_remuneration IS NULL"); } catch (Exception e) {}
                        }
                    } catch (Exception e) {
                        if (e.getMessage().contains("Duplicate column name") || e.getMessage().contains("already exists")) {
                            // Column already exists, ignore
                        } else {
                            System.err.println("NOTE: Could not add " + colName + ": " + e.getMessage());
                        }
                    }
                }
                
                // --- Optimize Event Applications ---
                String[] appCols = { "event_title TEXT", "event_type TEXT" };
                for (String colDef : appCols) {
                    try { jdbcTemplate.execute("ALTER TABLE event_applications ADD COLUMN " + colDef); } catch (Exception e) {}
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
                    "CREATE INDEX idx_posts_date ON posts(created_at)"
                };
                
                System.out.println("Optimizing database indexes for speed...");
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
