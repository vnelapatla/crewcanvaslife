package com.crewcanvas.user.messaging;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
public class UserEventProducer {

    private static final String REGISTRATION_TOPIC = "user-registration-topic";
    private static final String FOLLOW_TOPIC = "user-follow-topic";

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    public void sendUserRegistrationEvent(Long userId, String name, String email) {
        String message = String.format("{\"userId\": %d, \"name\": \"%s\", \"email\": \"%s\"}", userId, name, email);
        System.out.println("USER SERVICE (Producer): Shouting new user registration -> " + message);
        kafkaTemplate.send(REGISTRATION_TOPIC, message);
    }

    public void sendUserFollowEvent(Long followerId, Long followingId, String followerName, String followingName) {
        String message = String.format(
                "{\"followerId\": %d, \"followingId\": %d, \"followerName\": \"%s\", \"followingName\": \"%s\"}",
                followerId, followingId, followerName, followingName);
        System.out.println("USER SERVICE (Producer): Shouting new follow event -> " + message);
        kafkaTemplate.send(FOLLOW_TOPIC, message);
    }
}
