package com.crewcanvas.service;

import com.crewcanvas.model.Conversation;
import com.crewcanvas.repository.ConversationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ConversationService {

    @Autowired
    private ConversationRepository conversationRepository;

    public Conversation startConversation(Long senderId, Long receiverId) {
        Optional<Conversation> existing = conversationRepository.findBetweenUsers(senderId, receiverId);
        if (existing.isPresent()) {
            return existing.get();
        }

        Conversation conversation = new Conversation(senderId, receiverId);
        conversation.setUpdatedAt(LocalDateTime.now());
        return conversationRepository.save(conversation);
    }

    public List<Conversation> getConversations(Long userId) {
        return conversationRepository.findByUserId(userId);
    }

    public void updateLastMessage(Long conversationId, String content) {
        conversationRepository.findById(conversationId).ifPresent(c -> {
            c.setLastMessage(content);
            c.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(c);
        });
    }

    public void updateLastMessage(Long user1Id, Long user2Id, String content) {
        conversationRepository.findBetweenUsers(user1Id, user2Id).ifPresent(c -> {
            c.setLastMessage(content);
            c.setUpdatedAt(LocalDateTime.now());
            conversationRepository.save(c);
        });
    }
}
