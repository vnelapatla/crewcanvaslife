package com.crewcanvas.chat.service;

import com.crewcanvas.chat.model.Conversation;
import com.crewcanvas.chat.model.ConversationParticipant;
import com.crewcanvas.chat.model.Message;
import com.crewcanvas.chat.repository.ConversationParticipantRepository;
import com.crewcanvas.chat.repository.ConversationRepository;
import com.crewcanvas.chat.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationRepository conversationRepository;
    private final ConversationParticipantRepository participantRepository;
    private final MessageRepository messageRepository;

    public List<Map<String, Object>> getUserConversations(Long userId) {
        return conversationRepository.findUserConversations(userId);
    }

    public Page<Message> getConversationMessages(Long conversationId, int page, int size) {
        return messageRepository.findByConversationIdOrderByTimestampDesc(conversationId, PageRequest.of(page, size));
    }

    @Transactional
    public Message saveMessage(Long conversationId, Long senderId, String text) {
        Message message = new Message();
        message.setConversationId(conversationId);
        message.setSenderId(senderId);
        message.setMessageText(text);
        message.setTimestamp(LocalDateTime.now());
        message.setStatus("sent");
        return messageRepository.save(message);
    }

    @Transactional
    public Long getOrCreateConversation(Long user1Id, Long user2Id) {
        Optional<Long> existing = participantRepository.findConversationBetweenUsers(user1Id, user2Id);
        if (existing.isPresent()) {
            return existing.get();
        }

        Conversation conversation = new Conversation();
        conversation = conversationRepository.save(conversation);

        participantRepository.save(new ConversationParticipant(null, conversation.getId(), user1Id));
        participantRepository.save(new ConversationParticipant(null, conversation.getId(), user2Id));

        return conversation.getId();
    }
}
