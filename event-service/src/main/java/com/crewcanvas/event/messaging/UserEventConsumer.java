package com.crewcanvas.event.messaging;

import com.crewcanvas.event.model.Notification;
import com.crewcanvas.event.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;

@Service
public class UserEventConsumer {

    @Autowired
    private NotificationRepository notificationRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private SagaResultProducer sagaResultProducer;

    @KafkaListener(topics = "user-registration-topic", groupId = "event-service-group")
    public void consumeUserRegistrationEvent(String message) {
        Long userId = -1L;
        try {
            Map<String, Object> data = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {
            });
            userId = Long.valueOf(data.get("userId").toString());
            String name = data.get("name").toString();

            // Simulate a failure for demonstration if name is "FAIL"
            if ("FAIL".equalsIgnoreCase(name)) {
                throw new RuntimeException("CRITICAL ERROR: Failed to prepare welcome pack for user " + name);
            }

            // Normal Initialization (happy path)
            Notification notification = Notification.builder()
                    .recipientUserId(userId)
                    .type("WELCOME")
                    .message("Welcome to CrewCanvas, " + name + "! We are glad to have you here.")
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            System.out.println(">>> [SAGA STEP SUCCESS] Event Service initialized user " + name);

            // 🔥 Report success back to Saga
            sagaResultProducer.sendSuccessEvent(userId);

        } catch (Exception e) {
            System.err.println(">>> [SAGA STEP FAILURE] Error: " + e.getMessage());
            // 🔥 Report failure back to Saga for compensation
            if (userId != -1L) {
                sagaResultProducer.sendFailedEvent(userId, e.getMessage());
            }
        }
    }

    @KafkaListener(topics = "user-follow-topic", groupId = "event-service-group")
    public void consumeUserFollowEvent(String message) {
        try {
            Map<String, Object> data = objectMapper.readValue(message, Map.class);
            Long followerId = Long.valueOf(data.get("followerId").toString());
            Long followingId = Long.valueOf(data.get("followingId").toString());
            String followerName = data.get("followerName").toString();

            // Notification for the person who was just followed
            Notification notification = Notification.builder()
                    .recipientUserId(followingId)
                    .type("FOLLOW")
                    .message(followerName + " started following you!")
                    .isRead(false)
                    .build();

            notificationRepository.save(notification);
            System.out.println(">>> [SAVE] Follow Notification for UserID: " + followingId);
        } catch (Exception e) {
            System.err.println("Error processing follow message: " + e.getMessage());
        }
    }
}
