package com.crewcanvas.service;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SchemaMigrationService {

    private static final Logger logger = LoggerFactory.getLogger(SchemaMigrationService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @PostConstruct
    @Transactional
    public void migrateSchema() {
        try {
            logger.info("🎬 Starting FORCEFUL schema migration for Group Messaging...");
            
            // For MySQL: Disable foreign keys, modify, then enable
            try {
                entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 0").executeUpdate();
                
                try {
                    entityManager.createNativeQuery("ALTER TABLE messages MODIFY receiver_id BIGINT NULL").executeUpdate();
                    logger.info("✅ MySQL: receiver_id is now nullable.");
                } catch (Exception e) {
                    // Try H2 syntax if MySQL fails
                    entityManager.createNativeQuery("ALTER TABLE messages ALTER COLUMN receiver_id SET NULL").executeUpdate();
                    logger.info("✅ H2: receiver_id is now nullable.");
                }
                
                entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS = 1").executeUpdate();
            } catch (Exception e) {
                logger.warn("⚠️ Migration warning: Could not run DB-specific commands. Manual fix might be needed.");
            }
            
            logger.info("🚀 Schema migration completed.");
        } catch (Exception e) {
            logger.error("❌ Critical error during schema migration: {}", e.getMessage());
        }
    }
}
