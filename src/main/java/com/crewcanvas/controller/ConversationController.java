package com.crewcanvas.controller;

import com.crewcanvas.model.Message;
import com.crewcanvas.model.User;
import com.crewcanvas.service.MessageService;
import com.crewcanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.time.ZonedDateTime;
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

    @GetMapping({"", "/", "/{userId}"})
    public ResponseEntity<?> getConversations(@PathVariable(required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
        try {
            System.out.println("Fetching conversations for user: " + userId);
            List<Message> allMessages = messageService.getUserMessages(userId);
            
            // Group by other user to get unique conversations
            // LinkedHashMap preserves order (latest messages first)
            Map<Long, Message> latestMessageMap = new LinkedHashMap<>();
            for (Message m : allMessages) {
                Long senderId = m.getSenderId();
                Long receiverId = m.getReceiverId();
                
                if (senderId == null || receiverId == null) continue;

                Long otherId = Objects.equals(senderId, userId) ? receiverId : senderId;
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
                    convMap.put("otherUserId", otherUserId);
                    convMap.put("otherUser", otherUserMap);
                    convMap.put("lastMessage", lastMsg.getContent());
                    
                    // Safe date formatting for Instant
                    String formattedDate = null;
                    if (lastMsg.getCreatedAt() != null) {
                        try {
                            formattedDate = ZonedDateTime.ofInstant(lastMsg.getCreatedAt(), ZoneId.of("UTC")).format(ISO_FORMATTER);
                        } catch (Exception dateEx) {
                            formattedDate = lastMsg.getCreatedAt().toString(); // Fallback to ISO-8601
                        }
                    }
                    convMap.put("updatedAt", formattedDate);
                    
                    result.add(convMap);
                }
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error in getConversations for user " + userId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error loading conversations: " + e.getMessage());
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
