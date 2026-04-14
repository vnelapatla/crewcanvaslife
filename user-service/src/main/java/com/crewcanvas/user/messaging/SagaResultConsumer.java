package com.crewcanvas.user.messaging;

import com.crewcanvas.user.service.UserService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class SagaResultConsumer {

    @Autowired
    private UserService userService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @KafkaListener(topics = "user-init-success-topic", groupId = "user-service-saga-group")
    public void consumeSuccessResult(String message) {
        try {
            Map<String, Object> data = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {
            });
            Long userId = Long.valueOf(data.get("userId").toString());

            System.out.println("<<< [SAGA - FINAL] User Service setting user " + userId + " as ACTIVE.");
            userService.updateStatus(userId, "ACTIVE");

        } catch (Exception e) {
            System.err.println("Error processing success message: " + e.getMessage());
        }
    }

    @KafkaListener(topics = "user-init-failed-topic", groupId = "user-service-saga-group")
    public void consumeFailedResult(String message) {
        try {
            Map<String, Object> data = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {
            });
            Long userId = Long.valueOf(data.get("userId").toString());
            String reason = data.get("reason").toString();

            System.out.println("<<< [Saga Compensation] !!! ROLLBACK !!! " + reason);
            System.out.println("<<< [Saga Compensation] Deleting UserID: " + userId + " to maintain consistency.");

            // Delete the user from user-service database (COMPENSATION)
            userService.deleteUser(userId);

        } catch (Exception e) {
            System.err.println("Error processing failure message: " + e.getMessage());
        }
    }
}
