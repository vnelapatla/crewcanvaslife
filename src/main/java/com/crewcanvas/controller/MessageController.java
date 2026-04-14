package com.crewcanvas.controller;

import com.crewcanvas.model.Message;
import com.crewcanvas.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody MessageRequest request) {
        try {
            Message message = messageService.sendMessage(
                    request.getSenderId(),
                    request.getReceiverId(),
                    request.getContent(),
                    request.getImageUrl(),
                    request.getFileUrl(),
                    request.getFileType());
            return ResponseEntity.status(HttpStatus.CREATED).body(message);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error sending message: " + e.getMessage());
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getConversation(@PathVariable Long userId, @RequestParam Long otherUserId) {
        try {
            List<Message> messages = messageService.getConversation(userId, otherUserId);
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
                map.put("isRead", m.getIsRead());
                map.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Backend Error: " + e.getClass().getName() + " - " + e.getMessage());
        }
    }


    @GetMapping("/conversations")
    public ResponseEntity<?> getUserMessages(@RequestParam Long userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().body("Error: userId parameter is required");
        }
        try {
            List<Message> messages = messageService.getUserMessages(userId);
            // Bulletproof test: convert to simple maps to avoid entity proxy issues
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
                map.put("isRead", m.getIsRead());
                map.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR in getUserMessages for user " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Backend Error: " + e.getClass().getName() + " - " + e.getMessage());
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
                map.put("isRead", m.getIsRead());
                map.put("createdAt", m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
                result.add(map);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Backend Error: " + e.getClass().getName() + " - " + e.getMessage());
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
}
