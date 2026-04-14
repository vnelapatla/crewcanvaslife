package com.crewcanvas.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestController {

    @GetMapping("/test")
    public String test() {
        return "CrewCanvas Backend is RUNNING! 🎬";
    }

    @GetMapping("/fix-db")
    public String fixDb(@org.springframework.beans.factory.annotation.Autowired javax.sql.DataSource dataSource) {
        try (java.sql.Connection conn = dataSource.getConnection();
             java.sql.Statement stmt = conn.createStatement()) {
            
            stmt.executeUpdate("ALTER TABLE users MODIFY COLUMN profile_picture LONGTEXT");
            stmt.executeUpdate("ALTER TABLE users MODIFY COLUMN cover_image LONGTEXT");
            
            return "Database columns profile_picture and cover_image successfully altered to LONGTEXT!";
        } catch (java.sql.SQLException e) {
            return "Error fixing database: " + e.getMessage();
        }
    }
}
