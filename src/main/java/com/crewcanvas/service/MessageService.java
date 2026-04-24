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

    public Message sendMessage(Long senderId, Long receiverId, String content, String imageUrl, String fileUrl, String fileType) {
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
        
        // Special handling for call signals
        if (content != null && content.startsWith("__CALL_SIGNAL__:")) {
            notificationType = "CALL";
            notificationContent = "is calling you";
        }
        
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
