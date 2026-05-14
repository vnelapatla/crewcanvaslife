package com.crewcanvas.service;

import com.crewcanvas.model.*;
import com.crewcanvas.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupChatService {

    @Autowired
    private GroupChatRepository groupChatRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConnectionRepository connectionRepository;

    @Transactional
    public GroupChat createGroup(String name, String description, Long creatorId, List<Long> initialMemberIds) {
        GroupChat group = new GroupChat(name, creatorId);
        group.setDescription(description);
        GroupChat savedGroup = groupChatRepository.save(group);

        // Add creator as ADMIN
        groupMemberRepository.save(new GroupMember(savedGroup.getId(), creatorId, "ADMIN"));

        // Add other members if allowed
        if (initialMemberIds != null) {
            for (Long userId : initialMemberIds) {
                if (!userId.equals(creatorId)) {
                    attemptToAddMember(savedGroup.getId(), userId, creatorId);
                }
            }
        }

        return savedGroup;
    }

    public String attemptToAddMember(Long groupId, Long userId, Long adderId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (!userOpt.isPresent()) return "User not found";

        User user = userOpt.get();
        String privilege = user.getGroupAddPrivilege() != null ? user.getGroupAddPrivilege() : "Everyone";

        boolean canAdd = false;
        if (privilege.equals("Everyone")) {
            canAdd = true;
        } else if (privilege.equals("Connections Only")) {
            canAdd = connectionRepository.findByFollowerIdAndFollowingId(adderId, userId).isPresent() ||
                     connectionRepository.findByFollowerIdAndFollowingId(userId, adderId).isPresent();
        }

        if (canAdd) {
            if (!groupMemberRepository.findByGroupIdAndUserId(groupId, userId).isPresent()) {
                groupMemberRepository.save(new GroupMember(groupId, userId, "MEMBER"));
                return "SUCCESS";
            }
            return "ALREADY_MEMBER";
        } else {
            // Send an invitation link via private message
            GroupChat group = groupChatRepository.findById(groupId).orElse(null);
            if (group != null) {
                String inviteLink = "Join our group: " + group.getName() + " \nLink: " + "/join-group?token=" + group.getInviteToken();
                // We use MessageService to send this, but to avoid circular dependency, 
                // we'll just handle the repo call or rely on the caller to send it.
                // For now, I'll return a special status that the Controller can use.
                return "INVITE_LINK_SENT";
            }
            return "INVITATION_REQUIRED";
        }
    }

    public List<GroupChat> getGroupsForUser(Long userId) {
        List<GroupMember> memberships = groupMemberRepository.findByUserId(userId);
        List<Long> groupIds = memberships.stream().map(GroupMember::getGroupId).collect(Collectors.toList());
        return groupChatRepository.findAllById(groupIds);
    }

    public List<GroupMember> getGroupMembers(Long groupId) {
        return groupMemberRepository.findByGroupId(groupId);
    }

    public boolean isUserInGroup(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId).isPresent();
    }

    public boolean isUserAdmin(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(m -> m.getRole().equals("ADMIN"))
                .orElse(false);
    }

    @Transactional
    public void removeMember(Long groupId, Long userId) {
        groupMemberRepository.deleteByGroupIdAndUserId(groupId, userId);
    }

    @Transactional
    public void promoteToAdmin(Long groupId, Long userId) {
        groupMemberRepository.findByGroupIdAndUserId(groupId, userId).ifPresent(m -> {
            m.setRole("ADMIN");
            groupMemberRepository.save(m);
        });
    }

    public List<Message> getGroupHistory(Long groupId) {
        return messageRepository.findByGroupIdOrderByCreatedAtAsc(groupId);
    }

    public GroupChat joinByToken(String token, Long userId) {
        Optional<GroupChat> groupOpt = groupChatRepository.findByInviteToken(token);
        if (!groupOpt.isPresent()) throw new RuntimeException("Invalid invite token");

        GroupChat group = groupOpt.get();
        if (!isUserInGroup(group.getId(), userId)) {
            groupMemberRepository.save(new GroupMember(group.getId(), userId, "MEMBER"));
        }
        return group;
    }
}
