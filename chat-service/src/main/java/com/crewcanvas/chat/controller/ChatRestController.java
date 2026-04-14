package com.crewcanvas.chat.controller;

import com.crewcanvas.chat.model.Message;
import com.crewcanvas.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatRestController {

    private final ChatService chatService;

    @GetMapping("/conversations/{userId}")
    public List<Map<String, Object>> getConversations(@PathVariable Long userId) {
        return chatService.getUserConversations(userId);
    }

    @GetMapping("/messages/{conversationId}")
    public Page<Message> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return chatService.getConversationMessages(conversationId, page, size);
    }

    @PostMapping("/conversation/get-or-create")
    public Long getOrCreateConversation(@RequestBody Map<String, Long> request) {
        return chatService.getOrCreateConversation(request.get("user1Id"), request.get("user2Id"));
    }

    @PostMapping("/message")
    public Message sendMessage(@RequestBody Map<String, Object> request) {
        Long conversationId = Long.valueOf(request.get("conversationId").toString());
        Long senderId = Long.valueOf(request.get("senderId").toString());
        String content = request.get("content").toString();
        return chatService.saveMessage(conversationId, senderId, content);
    }
}
