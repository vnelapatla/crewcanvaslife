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
        if (followerId.equals(followingId)) {
            throw new RuntimeException("You cannot follow yourself");
        }

        if (connectionRepository.findByFollowerIdAndFollowingId(followerId, followingId).isPresent()) {
            throw new RuntimeException("Already following this user");
        }

        Connection connection = new Connection();
        connection.setFollowerId(followerId);
        connection.setFollowingId(followingId);
        connectionRepository.save(connection);

        // Sort IDs to ensure consistent locking order (Prevents Deadlocks)
        Long firstId = Math.min(followerId, followingId);
        Long secondId = Math.max(followerId, followingId);
        syncUserCounts(firstId);
        syncUserCounts(secondId);

        // Notify the user being followed
        userRepository.findById(followingId).ifPresent(user -> {
            userRepository.findById(followerId).ifPresent(follower -> {
                // 1. In-App Notification
                notificationService.createNotification(
                    followingId,
                    followerId,
                    "FOLLOW",
                    follower.getName() + " started following you!",
                    followerId.toString()
                );

                // 2. Email Notification
                try {
                    String profileLink = "https://crewcanvas.in/profile.html?userId=" + followerId;
                    emailService.sendFollowNotificationEmail(user.getEmail(), follower.getName(), profileLink);
                } catch (Exception e) {
                    System.err.println("Failed to send follow email: " + e.getMessage());
                }
            });
        });
    }

    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        Connection connection = connectionRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        connectionRepository.delete(connection);

        // Sort IDs to ensure consistent locking order (Prevents Deadlocks)
        Long firstId = Math.min(followerId, followingId);
        Long secondId = Math.max(followerId, followingId);
        syncUserCounts(firstId);
        syncUserCounts(secondId);
    }

    public void syncUserCounts(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            int followers = (int) connectionRepository.countByFollowingId(userId);
            int following = (int) connectionRepository.countByFollowerId(userId);
            user.setFollowers(followers);
            user.setFollowing(following);
            userRepository.save(user);
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
