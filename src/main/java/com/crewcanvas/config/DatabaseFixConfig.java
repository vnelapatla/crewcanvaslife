package com.crewcanvas.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseFixConfig {

    @Bean
    public CommandLineRunner fixDatabaseColumns(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                System.out.println("Applying database fixes for large attachments...");
                
                // Manually alter columns to LONGTEXT to support 50MB Base64 data
                jdbcTemplate.execute("ALTER TABLE messages MODIFY COLUMN content LONGTEXT");
                jdbcTemplate.execute("ALTER TABLE messages MODIFY COLUMN image_url LONGTEXT");
                jdbcTemplate.execute("ALTER TABLE messages MODIFY COLUMN file_url LONGTEXT");
                
                System.out.println("Database columns updated successfully!");
            } catch (Exception e) {
                System.err.println("Database fix notice: " + e.getMessage());
                // This might fail if columns already LONGTEXT or table doesn't exist yet, 
                // but that's okay, Hibernate will handle the rest.
            }
        };
    }
}
