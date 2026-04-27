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
        if (senderId == null || receiverId == null) {
            System.err.println("Permission Denied: senderId or receiverId is null");
            return false;
        }
        if (senderId.equals(receiverId)) return true;

        System.out.println("Checking messaging permission: " + senderId + " -> " + receiverId);

        // 1. Admin check
        com.crewcanvas.model.User sender = userRepository.findById(senderId).orElse(null);
        if (sender != null && sender.getIsAdmin()) {
            System.out.println("Permission Granted: Sender is Admin");
            return true;
        }

        com.crewcanvas.model.User receiver = userRepository.findById(receiverId).orElse(null);
        if (receiver != null && receiver.getIsAdmin()) {
            System.out.println("Permission Granted: Receiver is Admin");
            return true;
        }

        // 2. Follower/Mutual Follower check
        boolean senderFollowsReceiver = connectionRepository.findByFollowerIdAndFollowingId(senderId, receiverId).isPresent();
        boolean receiverFollowsSender = connectionRepository.findByFollowerIdAndFollowingId(receiverId, senderId).isPresent();
        
        if (senderFollowsReceiver || receiverFollowsSender) {
            System.out.println("Permission Granted: Connection exists (SenderFollows: " + senderFollowsReceiver + ", ReceiverFollows: " + receiverFollowsSender + ")");
            return true;
        }

        // 3. Event Creator to Applicant check
        boolean isEventRelation = eventApplicationRepository.isApplicantToCreatorsEvent(senderId, receiverId) ||
                                  eventApplicationRepository.isApplicantToCreatorsEvent(receiverId, senderId);
        if (isEventRelation) {
            System.out.println("Permission Granted: Event Creator/Applicant relation exists");
            return true;
        }

        System.err.println("Permission Denied: No valid relationship found between " + senderId + " and " + receiverId);
        return false;
    }

    public Message sendMessage(Long senderId, Long receiverId, String content, String imageUrl, String fileUrl, String fileType) {
        if (!canUserMessage(senderId, receiverId)) {
            String reason = "Messaging is restricted. You must be following each other, be mutual followers, or have an active event relationship.";
            throw new RuntimeException(reason);
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
