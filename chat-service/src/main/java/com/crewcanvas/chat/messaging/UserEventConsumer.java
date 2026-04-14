package com.crewcanvas.chat.messaging;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class UserEventConsumer {

    @KafkaListener(topics = "user-registration-topic", groupId = "chat-service-group")
    public void consumeUserRegistrationEvent(String message) {
        System.out.println("================================");
        System.out.println("CHAT SERVICE (Consumer): I just heard a Kafka message too!");
        System.out.println("Received Payload: " + message);
        System.out.println("ACTION: Creating a default 'Global Chat' room for this new user in the background...");
        System.out.println("================================");
    }
}
