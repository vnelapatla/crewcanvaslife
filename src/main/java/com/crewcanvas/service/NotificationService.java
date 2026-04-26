package com.crewcanvas.service;

import com.crewcanvas.model.Notification;
import com.crewcanvas.model.User;
import com.crewcanvas.repository.NotificationRepository;
import com.crewcanvas.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public Notification createNotification(Long recipientId, Long actorId, String type, String content, String targetId) {
        Notification notification = new Notification();
        notification.setUserId(recipientId);
        notification.setActorId(actorId);
        notification.setType(type);
        notification.setContent(content);
        notification.setTargetId(targetId);

        if (actorId != null) {
            userRepository.findById(actorId).ifPresent(actor -> {
                notification.setActorName(actor.getName());
                notification.setActorAvatar(actor.getProfilePicture());
            });
        }

        Notification savedNotification = notificationRepository.save(notification);
        
        // Send via WebSocket
        sendNotificationUpdate(recipientId, savedNotification);
        
        return savedNotification;
    }

    public void sendNotificationUpdate(Long userId, Notification notification) {
        messagingTemplate.convertAndSendToUser(
            userId.toString(),
            "/queue/notifications",
            notification
        );
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void clearAllNotifications(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }

    public void clearNotificationsByActor(Long actorId) {
        notificationRepository.deleteByActorId(actorId);
    }
}
