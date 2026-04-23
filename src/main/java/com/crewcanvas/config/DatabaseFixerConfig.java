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
                
                // Perform Data Migration for remuneration fields if old data exists
                try {
                    jdbcTemplate.execute("UPDATE users SET expected_movie_remuneration = budget_movie WHERE expected_movie_remuneration IS NULL AND budget_movie IS NOT NULL");
                    jdbcTemplate.execute("UPDATE users SET expected_webseries_remuneration = budget_webseries WHERE expected_webseries_remuneration IS NULL AND budget_webseries IS NOT NULL");
                    System.out.println("SUCCESS: Migrated existing remuneration data.");
                } catch (Exception e) {
                    // Ignore if budget_movie doesn't exist
                }
                
                System.out.println("Database maintenance completed.");
            } catch (Exception e) {
                System.err.println("Database fix error: " + e.getMessage());
            }
        };
    }
}
