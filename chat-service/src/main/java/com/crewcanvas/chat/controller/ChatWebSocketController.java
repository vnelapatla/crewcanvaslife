package com.crewcanvas.chat.controller;

import com.crewcanvas.chat.model.Message;
import com.crewcanvas.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Map<String, Object> chatMessage) {
        Long conversationId = Long.valueOf(chatMessage.get("conversationId").toString());
        Long senderId = Long.valueOf(chatMessage.get("senderId").toString());
        String content = chatMessage.get("content").toString();
        Long receiverId = Long.valueOf(chatMessage.get("receiverId").toString());

        // Save to DB
        Message savedMessage = chatService.saveMessage(conversationId, senderId, content);

        // Send to receiver's private queue
        messagingTemplate.convertAndSendToUser(
                receiverId.toString(),
                "/queue/messages",
                savedMessage
        );
        
        // Optionally send back to sender for confirmation if needed, 
        // but often the sender's UI updates optimistically.
    }
}
