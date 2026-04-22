package com.crewcanvas.controller;

import com.crewcanvas.model.Message;
import com.crewcanvas.model.User;
import com.crewcanvas.service.MessageService;
import com.crewcanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/conversations")
@CrossOrigin(origins = "*")
public class ConversationController {

    @Autowired
    private MessageService messageService;

    @Autowired
    private UserService userService;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    @GetMapping("/{userId}")
    public ResponseEntity<?> getConversations(@PathVariable Long userId) {
        try {
            List<Message> allMessages = messageService.getUserMessages(userId);
            
            // Group by other user to get unique conversations
            Map<Long, Message> latestMessageMap = new LinkedHashMap<>();
            for (Message m : allMessages) {
                Long otherId = m.getSenderId().equals(userId) ? m.getReceiverId() : m.getSenderId();
                if (!latestMessageMap.containsKey(otherId)) {
                    latestMessageMap.put(otherId, m);
                }
            }

            List<Map<String, Object>> result = new ArrayList<>();
            for (Map.Entry<Long, Message> entry : latestMessageMap.entrySet()) {
                Long otherUserId = entry.getKey();
                Message lastMsg = entry.getValue();
                
                Optional<User> otherUserOpt = userService.findById(otherUserId);
                if (otherUserOpt.isPresent()) {
                    User otherUser = otherUserOpt.get();
                    Map<String, Object> convMap = new HashMap<>();
                    Map<String, Object> otherUserMap = new HashMap<>();
                    otherUserMap.put("id", otherUser.getId());
                    otherUserMap.put("name", otherUser.getName());
                    otherUserMap.put("role", otherUser.getRole());
                    otherUserMap.put("profilePicture", otherUser.getProfilePicture());

                    convMap.put("user1Id", userId);
                    convMap.put("user2Id", otherUserId);
                    convMap.put("user2", otherUserMap);
                    convMap.put("lastMessage", lastMsg.getContent());
                    convMap.put("updatedAt", lastMsg.getCreatedAt() != null ? lastMsg.getCreatedAt().format(ISO_FORMATTER) : null);
                    
                    result.add(convMap);
                }
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/start")
    public ResponseEntity<?> startConversation(@RequestBody Map<String, Long> request) {
        // Just a placeholder to satisfy the frontend if it calls /start
        // In monolith, we don't necessarily need a 'conversation' record, 
        // just sending a message creates the relation.
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        return ResponseEntity.ok(response);
    }
}
