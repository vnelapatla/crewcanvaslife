package com.crewcanvas.controller;

import com.crewcanvas.model.Message;
import com.crewcanvas.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MessageService messageService;

    public ChatWebSocketController(SimpMessagingTemplate messagingTemplate, MessageService messageService) {
        this.messagingTemplate = messagingTemplate;
        this.messageService = messageService;
    }

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, Object> chatMessage) {
        try {
            Long senderId = Long.valueOf(chatMessage.get("senderId").toString());
            Long receiverId = Long.valueOf(chatMessage.get("receiverId").toString());
            String content = chatMessage.get("content") != null ? chatMessage.get("content").toString() : "";
            String imageUrl = chatMessage.get("imageUrl") != null ? chatMessage.get("imageUrl").toString() : null;
            String fileUrl = chatMessage.get("fileUrl") != null ? chatMessage.get("fileUrl").toString() : null;
            String fileType = chatMessage.get("fileType") != null ? chatMessage.get("fileType").toString() : null;

            // Save to DB using the monolith service
            Message savedMessage = messageService.sendMessage(
                senderId, 
                receiverId, 
                content, 
                imageUrl, 
                fileUrl, 
                fileType
            );

            // Send to receiver's topic
            messagingTemplate.convertAndSend(
                "/topic/messages/" + receiverId,
                savedMessage
            );
            
            // Send back to sender's topic
            messagingTemplate.convertAndSend(
                "/topic/messages/" + senderId,
                savedMessage
            );
        } catch (Exception e) {
            System.err.println("Error processing WebSocket message: " + e.getMessage());
        }
    }
}
