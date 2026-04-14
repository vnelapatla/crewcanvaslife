package com.crewcanvas.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Manual schema updates are now handled via JPA columnDefinition annotations in models
        // Keeping this as a placeholder for potential future runtime data initialization
        System.out.println("Database schema managed by Hibernate.");
    }
}
