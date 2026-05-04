package com.crewcanvas.service;

import com.crewcanvas.model.Connection;
import com.crewcanvas.model.User;
import com.crewcanvas.repository.ConnectionRepository;
import com.crewcanvas.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
public class ConnectionService {
    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Transactional
    public void followUser(Long followerId, Long followingId) {
        if (followerId.equals(followingId)) return;
        System.out.println("Follow request: " + followerId + " -> " + followingId);

        try {
            // Ensure we don't have duplicate connections
            if (connectionRepository.findByFollowerIdAndFollowingId(followerId, followingId).isPresent()) {
                System.out.println("Already following, skipping.");
                return; 
            }

            Connection connection = new Connection();
            connection.setFollowerId(followerId);
            connection.setFollowingId(followingId);
            connection.setCreatedAt(LocalDateTime.now());
            connectionRepository.save(connection);
            connectionRepository.flush(); // Flush here to catch duplicate entry errors early

            // ALWAYS sync in sorted ID order to prevent Deadlocks
            Long firstId = Math.min(followerId, followingId);
            Long secondId = Math.max(followerId, followingId);
            syncUserCounts(firstId);
            syncUserCounts(secondId);

            // Notify the user being followed
            sendFollowNotifications(followerId, followingId);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            System.out.println("Duplicate follow request detected and ignored.");
        } catch (Exception e) {
            System.err.println("CRITICAL FOLLOW ERROR: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void sendFollowNotifications(Long followerId, Long followingId) {
        userRepository.findById(followingId).ifPresent(user -> {
            // Suppress follow notifications for the official admin account to avoid spam
            if ("crewcanvas2@gmail.com".equalsIgnoreCase(user.getEmail())) {
                return;
            }

            userRepository.findById(followerId).ifPresent(follower -> {
                // In-app notification if enabled
                if (Boolean.TRUE.equals(user.getFollowerNotifications())) {
                    notificationService.createNotification(
                        followingId, followerId, "FOLLOW",
                        follower.getName() + " started following you!",
                        followerId.toString()
                    );
                }
                
                // Email notification if enabled
                if (Boolean.TRUE.equals(user.getEmailNotifications())) {
                    try {
                        String profileLink = "https://crewcanvas.in/profile.html?userId=" + followerId;
                        emailService.sendFollowNotificationEmail(user.getEmail(), follower.getName(), profileLink);
                    } catch (Exception e) {
                        System.err.println("Email fail: " + e.getMessage());
                    }
                }
            });
        });
    }

    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        Long firstId = Math.min(followerId, followingId);
        Long secondId = Math.max(followerId, followingId);

        // Consistent locking order
        userRepository.findById(firstId);
        userRepository.findById(secondId);

        connectionRepository.findByFollowerIdAndFollowingId(followerId, followingId).ifPresent(connection -> {
            connectionRepository.delete(connection);
            syncUserCounts(followerId);
            syncUserCounts(followingId);
        });
    }

    public void syncUserCounts(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            int followers = (int) connectionRepository.countByFollowingId(userId);
            int following = (int) connectionRepository.countByFollowerId(userId);
            user.setFollowers(followers);
            user.setFollowing(following);
            userRepository.saveAndFlush(user); // Force immediate flush to hold lock briefly
        });
    }

    @Transactional
    public void syncAllUserCounts() {
        userRepository.findAll().forEach(user -> {
            int followers = (int) connectionRepository.countByFollowingId(user.getId());
            int following = (int) connectionRepository.countByFollowerId(user.getId());
            user.setFollowers(followers);
            user.setFollowing(following);
            userRepository.save(user);
        });
    }

    public List<User> getFollowers(Long userId) {
        return connectionRepository.findByFollowingId(userId).stream()
                .map(conn -> userRepository.findById(conn.getFollowerId()).orElse(null))
                .filter(user -> user != null)
                .collect(Collectors.toList());
    }

    public List<User> getFollowing(Long userId) {
        return connectionRepository.findByFollowerId(userId).stream()
                .map(conn -> userRepository.findById(conn.getFollowingId()).orElse(null))
                .filter(user -> user != null)
                .collect(Collectors.toList());
    }
}
