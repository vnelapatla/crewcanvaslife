package com.crewcanvas.controller;

import com.crewcanvas.model.Conversation;
import com.crewcanvas.service.ConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/conversations")
@CrossOrigin(origins = "*")
public class ConversationController {

    @Autowired
    private ConversationService conversationService;

    @PostMapping("/start")
    public ResponseEntity<?> startConversation(@RequestBody Map<String, Long> request) {
        Long senderId = request.get("senderId");
        Long receiverId = request.get("receiverId");

        if (senderId == null || receiverId == null) {
            return ResponseEntity.badRequest().body("senderId and receiverId are required");
        }

        Conversation conversation = conversationService.startConversation(senderId, receiverId);
        return ResponseEntity.ok(conversation);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getConversations(@PathVariable Long userId) {
        List<Conversation> conversations = conversationService.getConversations(userId);
        return ResponseEntity.ok(conversations);
    }
}
