package com.crewcanvas.controller;

import com.crewcanvas.model.GroupChat;
import com.crewcanvas.model.GroupMember;
import com.crewcanvas.service.GroupChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE})
public class GroupChatController {

    @Autowired
    private GroupChatService groupChatService;

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String description = (String) request.get("description");
        Long creatorId = Long.valueOf(request.get("creatorId").toString());
        List<Integer> memberIdsInt = (List<Integer>) request.get("memberIds");
        
        List<Long> memberIds = memberIdsInt != null ? memberIdsInt.stream().map(Integer::longValue).toList() : null;

        GroupChat group = groupChatService.createGroup(name, description, creatorId, memberIds);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserGroups(@PathVariable("userId") Long userId) {
        return ResponseEntity.ok(groupChatService.getUserGroups(userId));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable("groupId") Long groupId) {
        return ResponseEntity.ok(groupChatService.getGroupMembers(groupId));
    }

    @PostMapping("/{groupId}/add")
    public ResponseEntity<?> addMember(@PathVariable("groupId") Long groupId, @RequestParam("userId") Long userId) {
        groupChatService.addMember(groupId, userId);
        return ResponseEntity.ok("Member added");
    }

    @DeleteMapping("/{groupId}/remove")
    public ResponseEntity<?> removeMember(@PathVariable("groupId") Long groupId, @RequestParam("userId") Long userId) {
        groupChatService.removeMember(groupId, userId);
        return ResponseEntity.ok("Member removed");
    }

    @PostMapping("/{groupId}/promote")
    public ResponseEntity<?> promoteMember(@PathVariable("groupId") Long groupId, @RequestParam("userId") Long userId) {
        groupChatService.promoteToAdmin(groupId, userId);
        return ResponseEntity.ok("Member promoted to admin");
    }
}
