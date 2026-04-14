package com.crewcanvas.event.messaging;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class SagaResultProducer {

    public static final String SUCCESS_TOPIC = "user-init-success-topic";
    public static final String FAILED_TOPIC = "user-init-failed-topic";

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    public void sendSuccessEvent(Long userId) {
        String message = String.format("{\"userId\": %d}", userId);
        System.out.println("EVENT SERVICE (Saga Producer): Initialization SUCCESS for user " + userId);
        kafkaTemplate.send(SUCCESS_TOPIC, message);
    }

    public void sendFailedEvent(Long userId, String reason) {
        String message = String.format("{\"userId\": %d, \"reason\": \"%s\"}", userId, reason);
        System.out.println(
                "EVENT SERVICE (Saga Producer): Initialization FAILED for user " + userId + ". Reason: " + reason);
        kafkaTemplate.send(FAILED_TOPIC, message);
    }
}
