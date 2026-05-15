package com.crewcanvas.service;

import com.crewcanvas.model.GroupChat;
import com.crewcanvas.model.GroupMember;
import com.crewcanvas.repository.GroupChatRepository;
import com.crewcanvas.repository.GroupMemberRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class GroupChatService {

    @Autowired
    private GroupChatRepository groupChatRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Transactional
    public GroupChat createGroup(String name, String description, Long creatorId, List<Long> memberIds) {
        GroupChat group = new GroupChat(name, description, creatorId);
        group = groupChatRepository.save(group);

        // Add creator as Admin
        GroupMember creator = new GroupMember(group, creatorId, "ADMIN");
        groupMemberRepository.save(creator);

        // Add other members
        if (memberIds != null) {
            for (Long memberId : memberIds) {
                if (!memberId.equals(creatorId)) {
                    GroupMember member = new GroupMember(group, memberId, "MEMBER");
                    groupMemberRepository.save(member);
                }
            }
        }

        return group;
    }

    public List<GroupChat> getUserGroups(Long userId) {
        return groupChatRepository.findByUserId(userId);
    }

    public Optional<GroupChat> getGroup(Long groupId) {
        return groupChatRepository.findById(groupId);
    }

    public List<GroupMember> getGroupMembers(Long groupId) {
        return groupMemberRepository.findByGroupChatId(groupId);
    }

    @Transactional
    public void addMember(Long groupId, Long userId) {
        Optional<GroupChat> groupOpt = groupChatRepository.findById(groupId);
        if (groupOpt.isPresent()) {
            if (!groupMemberRepository.findByGroupChatIdAndUserId(groupId, userId).isPresent()) {
                GroupMember member = new GroupMember(groupOpt.get(), userId, "MEMBER");
                groupMemberRepository.save(member);
            }
        }
    }

    @Transactional
    public void removeMember(Long groupId, Long userId) {
        groupMemberRepository.findByGroupChatIdAndUserId(groupId, userId)
                .ifPresent(member -> groupMemberRepository.delete(member));
    }

    @Transactional
    public void promoteToAdmin(Long groupId, Long userId) {
        groupMemberRepository.findByGroupChatIdAndUserId(groupId, userId)
                .ifPresent(member -> {
                    member.setRole("ADMIN");
                    groupMemberRepository.save(member);
                });
    }

    public boolean isGroupAdmin(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupChatIdAndUserId(groupId, userId)
                .map(m -> "ADMIN".equals(m.getRole()))
                .orElse(false);
    }
}
