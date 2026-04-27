package com.crewcanvas.service;

import com.crewcanvas.model.Message;
import com.crewcanvas.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.crewcanvas.repository.UserRepository userRepository;

    @Autowired
    private com.crewcanvas.repository.ConnectionRepository connectionRepository;

    @Autowired
    private com.crewcanvas.repository.EventApplicationRepository eventApplicationRepository;

    public boolean canUserMessage(Long senderId, Long receiverId) {
        if (senderId.equals(receiverId)) return true;

        // 1. Admin check
        com.crewcanvas.model.User sender = userRepository.findById(senderId).orElse(null);
        if (sender != null && sender.getIsAdmin()) return true;

        com.crewcanvas.model.User receiver = userRepository.findById(receiverId).orElse(null);
        if (receiver != null && receiver.getIsAdmin()) return true;

        // 2. Follower/Mutual Follower check
        if (connectionRepository.findByFollowerIdAndFollowingId(senderId, receiverId).isPresent() ||
            connectionRepository.findByFollowerIdAndFollowingId(receiverId, senderId).isPresent()) {
            return true;
        }

        // 3. Event Creator to Applicant check
        if (eventApplicationRepository.isApplicantToCreatorsEvent(senderId, receiverId) ||
            eventApplicationRepository.isApplicantToCreatorsEvent(receiverId, senderId)) {
            return true;
        }

        return false;
    }

    public Message sendMessage(Long senderId, Long receiverId, String content, String imageUrl, String fileUrl, String fileType) {
        if (!canUserMessage(senderId, receiverId)) {
            throw new RuntimeException("You are not allowed to message this user. You must be following each other or be an event creator/applicant.");
        }
        Message message = new Message(senderId, receiverId, content);
        message.setImageUrl(imageUrl);
        message.setFileUrl(fileUrl);
        message.setFileType(fileType);
        Message savedMessage = messageRepository.save(message);

        // Trigger Notification
        String notificationType = "MESSAGE";
        String notificationContent = content != null && !content.isEmpty() ? content : 
                                    imageUrl != null ? "Sent an image" : 
                                    fileUrl != null ? "Sent a file" : "Sent a message";
        
        notificationService.createNotification(
            receiverId,
            senderId,
            notificationType,
            notificationContent,
            senderId.toString()
        );

        return savedMessage;
    }

    public List<Message> getConversation(Long userId1, Long userId2) {
        return messageRepository.findConversation(userId1, userId2);
    }

    public org.springframework.data.domain.Page<Message> getConversation(Long userId1, Long userId2, int page, int size) {
        return messageRepository.findConversation(userId1, userId2, org.springframework.data.domain.PageRequest.of(page, size));
    }

    public org.springframework.data.domain.Page<Message> getUserMessages(Long userId, int page, int size) {
        return messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId, org.springframework.data.domain.PageRequest.of(page, size));
    }

    public List<Message> getUserMessages(Long userId) {
        return messageRepository.findBySenderIdOrReceiverIdOrderByCreatedAtDesc(userId, userId);
    }

    public List<Message> getUnreadMessages(Long userId) {
        return messageRepository.findUnreadMessages(userId);
    }

    public void markConversationAsRead(Long senderId, Long receiverId) {
        messageRepository.markConversationAsRead(senderId, receiverId);
    }

    public Message markAsRead(Long messageId) {
        Optional<Message> messageOpt = messageRepository.findById(messageId);
        if (messageOpt.isPresent()) {
            Message message = messageOpt.get();
            message.setIsRead(true);
            return messageRepository.save(message);
        }
        throw new RuntimeException("Message not found");
    }

    public void deleteMessage(Long id) {
        messageRepository.deleteById(id);
    }
}
