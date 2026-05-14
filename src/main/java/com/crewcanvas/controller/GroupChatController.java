package com.crewcanvas.controller;

import com.crewcanvas.model.*;
import com.crewcanvas.service.GroupChatService;
import com.crewcanvas.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.*;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*")
public class GroupChatController {

    @Autowired
    private GroupChatService groupChatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody GroupCreateRequest request) {
        try {
            GroupChat group = groupChatService.createGroup(
                request.getName(), 
                request.getDescription(), 
                request.getCreatorId(), 
                request.getMemberIds()
            );
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMyGroups(@PathVariable Long userId) {
        return ResponseEntity.ok(groupChatService.getGroupsForUser(userId));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getMembers(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupChatService.getGroupMembers(groupId));
    }

    @PostMapping("/{groupId}/add")
    public ResponseEntity<?> addMember(@PathVariable Long groupId, @RequestParam Long userId, @RequestParam Long adderId) {
        String result = groupChatService.attemptToAddMember(groupId, userId, adderId);
        if ("SUCCESS".equals(result)) {
            return ResponseEntity.ok(Collections.singletonMap("message", "Member added"));
        } else if ("INVITATION_REQUIRED".equals(result)) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(Collections.singletonMap("status", "INVITE_SENT"));
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result);
        }
    }

    @DeleteMapping("/{groupId}/member/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long groupId, @PathVariable Long userId, @RequestParam Long adminId) {
        if (!groupChatService.isUserAdmin(groupId, adminId) && !userId.equals(adminId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only admins can remove members");
        }
        groupChatService.removeMember(groupId, userId);
        return ResponseEntity.ok("Member removed");
    }

    @GetMapping("/{groupId}/history")
    public ResponseEntity<?> getHistory(@PathVariable Long groupId, @RequestParam Long userId) {
        if (!groupChatService.isUserInGroup(groupId, userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Not a member of this group");
        }
        return ResponseEntity.ok(groupChatService.getGroupHistory(groupId));
    }

    @PostMapping("/{groupId}/promote")
    public ResponseEntity<?> promoteMember(@PathVariable Long groupId, @RequestParam Long userId) {
        groupChatService.promoteToAdmin(groupId, userId);
        return ResponseEntity.ok("Member promoted to ADMIN");
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(@RequestParam String token, @RequestParam Long userId) {
        try {
            GroupChat group = groupChatService.joinByToken(token, userId);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }
}

class GroupCreateRequest {
    private String name;
    private String description;
    private Long creatorId;
    private List<Long> memberIds;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getCreatorId() { return creatorId; }
    public void setCreatorId(Long creatorId) { this.creatorId = creatorId; }
    public List<Long> getMemberIds() { return memberIds; }
    public void setMemberIds(List<Long> memberIds) { this.memberIds = memberIds; }
}
