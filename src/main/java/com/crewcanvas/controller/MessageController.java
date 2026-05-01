package com.crewcanvas.controller;

import com.crewcanvas.model.Message;
import com.crewcanvas.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private com.crewcanvas.service.NotificationService notificationService;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    @MessageMapping("/chat.sendMessage")
    public void sendWebSocketMessage(@Payload MessageRequest request) {
        try {
            Message savedMessage = messageService.sendMessage(
                    request.getSenderId(),
                    request.getReceiverId(),
                    request.getContent(),
                    request.getImageUrl(),
                    request.getFileUrl(),
                    request.getFileType(),
                    request.getFileUrls()
            );

            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", savedMessage.getId());
            map.put("senderId", savedMessage.getSenderId());
            map.put("receiverId", savedMessage.getReceiverId());
            map.put("content", savedMessage.getContent());
            map.put("imageUrl", savedMessage.getImageUrl());
            map.put("fileUrl", savedMessage.getFileUrl());
            map.put("fileType", savedMessage.getFileType());
            map.put("fileUrls", savedMessage.getFileUrls());
            map.put("isRead", savedMessage.getIsRead());
            map.put("createdAt", savedMessage.getCreatedAt() != null ? ZonedDateTime.ofInstant(savedMessage.getCreatedAt(), ZoneId.of("UTC")).format(ISO_FORMATTER) : null);

            messagingTemplate.convertAndSend("/topic/messages/" + request.getReceiverId(), map);
            messagingTemplate.convertAndSend("/topic/messages/" + request.getSenderId(), map);

        } catch (Exception e) {
            System.err.println("Error sending websocket message: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest request) {
        try {
            Message savedMessage = messageService.sendMessage(
                    request.getSenderId(),
                    request.getReceiverId(),
                    request.getContent(),
                    request.getImageUrl(),
                    request.getFileUrl(),
                    request.getFileType(),
                    request.getFileUrls());

            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", savedMessage.getId());
            map.put("senderId", savedMessage.getSenderId());
            map.put("receiverId", savedMessage.getReceiverId());
            map.put("content", savedMessage.getContent());
            map.put("imageUrl", savedMessage.getImageUrl());
            map.put("fileUrl", savedMessage.getFileUrl());
            map.put("fileType", savedMessage.getFileType());
            map.put("fileUrls", savedMessage.getFileUrls());
            map.put("isRead", savedMessage.getIsRead());
            map.put("createdAt", savedMessage.getCreatedAt() != null ? ZonedDateTime.ofInstant(savedMessage.getCreatedAt(), ZoneId.of("UTC")).format(ISO_FORMATTER) : null);

            messagingTemplate.convertAndSend("/topic/messages/" + request.getReceiverId(), map);
            messagingTemplate.convertAndSend("/topic/messages/" + request.getSenderId(), map);



            return ResponseEntity.status(HttpStatus.CREATED).body(savedMessage);
        } catch (Exception e) {
            String msg = e.getMessage();
            // If it's one of our known business logic errors, show it
            if (msg != null && (msg.contains("restricted") || msg.contains("allowed") || msg.contains("relationship"))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(msg);
            }
            // Otherwise show a friendly generic message
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("We're having trouble sending your message. Please try again in a moment.");
        }
    }

    @GetMapping("/check-permission")
    public ResponseEntity<?> checkPermission(@RequestParam Long senderId, @RequestParam Long receiverId) {
        try {
            boolean allowed = messageService.canUserMessage(senderId, receiverId);
            return ResponseEntity.ok(java.util.Collections.singletonMap("allowed", allowed));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to verify messaging permissions at this time.");
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getConversation(@PathVariable Long userId, @RequestParam Long otherUserId, 
                                            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        try {
            org.springframework.data.domain.Page<Message> messages = messageService.getConversation(userId, otherUserId, page, size);
            java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
            for (Message m : messages.getContent()) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", m.getId());
                map.put("senderId", m.getSenderId());
                map.put("receiverId", m.getReceiverId());
                map.put("content", m.getContent());
                map.put("imageUrl", m.getImageUrl());
                map.put("fileUrl", m.getFileUrl());
                map.put("fileType", m.getFileType());
                map.put("fileUrls", m.getFileUrls());
                map.put("isRead", m.getIsRead());
                map.put("createdAt", m.getCreatedAt() != null ? ZonedDateTime.ofInstant(m.getCreatedAt(), ZoneId.of("UTC")).format(ISO_FORMATTER) : null);
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("We couldn't load your conversation. Please refresh and try again.");
        }
    }


    @GetMapping("/conversations")
    public ResponseEntity<?> getUserMessages(@RequestParam Long userId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        if (userId == null) {
            return ResponseEntity.badRequest().body("Error: userId parameter is required");
        }
        try {
            org.springframework.data.domain.Page<Message> messages = messageService.getUserMessages(userId, page, size);
            // Bulletproof test: convert to simple maps to avoid entity proxy issues
            java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
            for (Message m : messages.getContent()) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", m.getId());
                map.put("senderId", m.getSenderId());
                map.put("receiverId", m.getReceiverId());
                map.put("content", m.getContent());
                map.put("imageUrl", m.getImageUrl());
                map.put("fileUrl", m.getFileUrl());
                map.put("fileType", m.getFileType());
                map.put("fileUrls", m.getFileUrls());
                map.put("isRead", m.getIsRead());
                map.put("createdAt", m.getCreatedAt() != null ? ZonedDateTime.ofInstant(m.getCreatedAt(), ZoneId.of("UTC")).format(ISO_FORMATTER) : null);
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in getUserMessages: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to load recent chats.");
        }
    }



    @GetMapping("/unread")
    public ResponseEntity<?> getUnreadMessages(@RequestParam Long userId) {
        try {
            List<Message> messages = messageService.getUnreadMessages(userId);
            java.util.List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
            for (Message m : messages) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", m.getId());
                map.put("senderId", m.getSenderId());
                map.put("receiverId", m.getReceiverId());
                map.put("content", m.getContent());
                map.put("imageUrl", m.getImageUrl());
                map.put("fileUrl", m.getFileUrl());
                map.put("fileType", m.getFileType());
                map.put("fileUrls", m.getFileUrls());
                map.put("isRead", m.getIsRead());
                map.put("createdAt", m.getCreatedAt() != null ? ZonedDateTime.ofInstant(m.getCreatedAt(), ZoneId.of("UTC")).format(ISO_FORMATTER) : null);
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to check notifications.");
        }
    }


    @PutMapping("/read-all")
    public ResponseEntity<?> markConversationAsRead(@RequestParam Long senderId, @RequestParam Long receiverId) {
        try {
            messageService.markConversationAsRead(senderId, receiverId);
            return ResponseEntity.ok("Messages marked as read");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to update message status.");
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        try {
            Message message = messageService.markAsRead(id);
            return ResponseEntity.ok(message);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
        try {
            messageService.deleteMessage(id);
            return ResponseEntity.ok("Message deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}

class MessageRequest {
    private Long senderId;
    private Long receiverId;
    private String content;
    private String imageUrl;
    private String fileUrl;
    private String fileType;
    private java.util.List<String> fileUrls;

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }
    
    public java.util.List<String> getFileUrls() {
        return fileUrls;
    }
    
    public void setFileUrls(java.util.List<String> fileUrls) {
        this.fileUrls = fileUrls;
    }
}
