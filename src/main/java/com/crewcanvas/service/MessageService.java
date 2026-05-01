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
    private EmailService emailService;

    @Autowired
    private com.crewcanvas.repository.UserRepository userRepository;

    @Autowired
    private com.crewcanvas.repository.ConnectionRepository connectionRepository;

    @Autowired
    private com.crewcanvas.repository.EventApplicationRepository eventApplicationRepository;

    public boolean canUserMessage(Long senderId, Long receiverId) {
        if (senderId == null || receiverId == null) {
            return false;
        }

        // Check recipient settings
        return userRepository.findById(receiverId).map(receiver -> {
            String permissions = receiver.getMessagePermissions();
            if (permissions == null || permissions.equals("Everyone")) {
                return true;
            }

            if (permissions.equals("Connections Only")) {
                // Check if sender follows receiver OR receiver follows sender (standard connection check)
                return connectionRepository.findByFollowerIdAndFollowingId(senderId, receiverId).isPresent() ||
                       connectionRepository.findByFollowerIdAndFollowingId(receiverId, senderId).isPresent();
            }

            return true; // Fallback
        }).orElse(true);
    }

    public Message sendMessage(Long senderId, Long receiverId, String content, String imageUrl, String fileUrl, String fileType, java.util.List<String> fileUrls) {
        if (!canUserMessage(senderId, receiverId)) {
            throw new RuntimeException("This user has restricted their message permissions.");
        }
        
        Message message = new Message(senderId, receiverId, content);
        message.setImageUrl(imageUrl);
        message.setFileUrl(fileUrl);
        message.setFileType(fileType);
        if (fileUrls != null) {
            message.setFileUrls(fileUrls);
        }
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

        // Send Email Notification if enabled
        try {
            userRepository.findById(receiverId).ifPresent(receiver -> {
                if (Boolean.TRUE.equals(receiver.getEmailNotifications())) {
                    userRepository.findById(senderId).ifPresent(senderUser -> {
                        String preview = notificationContent;
                        if (preview.length() > 50) preview = preview.substring(0, 50) + "...";
                        emailService.sendMessageNotificationEmail(receiver.getEmail(), senderUser.getName(), preview);
                    });
                }
            });
        } catch (Exception e) {
            System.err.println("Failed to send message email notification: " + e.getMessage());
        }

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

    public Optional<Message> getMessageById(Long id) {
        return messageRepository.findById(id);
    }

    public Message updateMessage(Long id, String newContent) {
        Optional<Message> messageOpt = messageRepository.findById(id);
        if (messageOpt.isPresent()) {
            Message message = messageOpt.get();
            message.setContent(newContent);
            message.setIsEdited(true);
            return messageRepository.save(message);
        }
        throw new RuntimeException("Message not found");
    }
}
