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

                // Manually add google_id if Hibernate failed to do so
                // Using 191 instead of 255 to stay safe within InnoDB index limits if needed
                try {
                    jdbcTemplate.execute("ALTER TABLE users ADD COLUMN google_id VARCHAR(191) UNIQUE");
                    System.out.println("SUCCESS: google_id column added to 'users' table.");
                } catch (Exception e) {
                    if (e.getMessage().contains("Duplicate column name") || e.getMessage().contains("already exists")) {
                        System.out.println("NOTE: google_id column already exists.");
                    } else {
                        System.err.println("ERROR adding google_id: " + e.getMessage());
                    }
                }
                
                System.out.println("Database maintenance completed.");
            } catch (Exception e) {
                System.err.println("Database fix error: " + e.getMessage());
            }
        };
    }
}
