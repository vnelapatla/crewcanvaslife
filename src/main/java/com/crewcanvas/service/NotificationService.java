package com.crewcanvas.service;

import com.crewcanvas.model.Notification;
import com.crewcanvas.model.User;
import com.crewcanvas.model.Post;
import com.crewcanvas.repository.NotificationRepository;
import com.crewcanvas.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
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

    @Autowired
    private EmailService emailService;

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

    @Async
    public void broadcastAdminPostNotification(Post post, User admin) {
        try {
            List<User> allUsers = userRepository.findAll();
            String postContent = post.getContent() != null ? post.getContent() : "New Requirement";
            String preview = postContent.length() > 50 ? postContent.substring(0, 50) + "..." : postContent;

            for (User targetUser : allUsers) {
                if (targetUser.getId().equals(admin.getId())) continue;

                // 1. Create In-App Notification
                createNotification(
                    targetUser.getId(),
                    admin.getId(),
                    "ADMIN_POST",
                    "posted a new requirement: " + preview,
                    post.getId().toString()
                );

                // 2. Send Email Notification
                if (targetUser.getEmailNotifications() == null || Boolean.TRUE.equals(targetUser.getEmailNotifications())) {
                    emailService.sendAdminPostNotificationEmail(targetUser.getEmail(), targetUser.getName(), postContent, post.getId());
                }
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting admin post notification: " + e.getMessage());
        }
    }
    @Async
    public void broadcastNewEventNotification(com.crewcanvas.model.Event event, User host) {
        try {
            List<User> allUsers = userRepository.findAll();
            String hostName = host != null ? host.getName() : "Someone";
            
            for (User targetUser : allUsers) {
                if (host != null && targetUser.getId().equals(host.getId())) continue;

                // 1. Create In-App Notification
                createNotification(
                    targetUser.getId(),
                    host != null ? host.getId() : null,
                    "NEW_EVENT",
                    "posted a new " + (event.getEventType() != null ? event.getEventType().toLowerCase() : "event") + ": " + event.getTitle(),
                    event.getId().toString()
                );

                // 2. Send Email Notification - ONLY for Managed/Admin events to avoid hitting Gmail limits
                if (Boolean.TRUE.equals(event.getIsManaged()) && (targetUser.getEmailNotifications() == null || Boolean.TRUE.equals(targetUser.getEmailNotifications()))) {
                    emailService.sendNewEventBroadcastEmail(
                        targetUser.getEmail(), 
                        targetUser.getName(), 
                        hostName, 
                        event.getTitle(), 
                        event.getEventType(), 
                        event.getId()
                    );
                }
            }
        } catch (Exception e) {
            System.err.println("Error broadcasting new event notification: " + e.getMessage());
        }
    }
}
