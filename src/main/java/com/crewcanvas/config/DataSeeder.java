package com.crewcanvas.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.Random;

@Configuration
@org.springframework.context.annotation.Profile("!prod")
public class DataSeeder {

    @Bean
    public CommandLineRunner seedAdminData(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // 1. Find Admin User ID
                Long adminId = null;
                try {
                    adminId = jdbcTemplate.queryForObject(
                        "SELECT id FROM users WHERE email LIKE 'crewcanvas2@gmail.com%' LIMIT 1", 
                        Long.class
                    );
                } catch (Exception e) {
                    System.out.println("Admin account not found. Skipping cleanup.");
                    return;
                }

                // Remove seeded data for Admin to clean up live site
                System.out.println("Cleaning up seed data for Admin (ID: " + adminId + ")...");
                
                // Remove post dependencies first due to foreign key constraints
                jdbcTemplate.update("DELETE FROM post_images WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", adminId);
                jdbcTemplate.update("DELETE FROM post_actual_comments WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", adminId);
                jdbcTemplate.update("DELETE FROM post_likes_users WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", adminId);
                jdbcTemplate.update("DELETE FROM post_links WHERE post_id IN (SELECT id FROM posts WHERE user_id = ?)", adminId);
                
                // Remove posts
                jdbcTemplate.update("DELETE FROM posts WHERE user_id = ?", adminId);
                // Remove projects
                jdbcTemplate.update("DELETE FROM projects WHERE user_id = ?", adminId);

                System.out.println("SUCCESS: Admin seed data removed.");

            } catch (Exception e) {
                System.err.println("Cleanup error: " + e.getMessage());
            }
        };
    }
}
