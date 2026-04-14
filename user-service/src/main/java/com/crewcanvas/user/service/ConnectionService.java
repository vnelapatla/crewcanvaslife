package com.crewcanvas.user.service;

import com.crewcanvas.user.model.Connection;
import com.crewcanvas.user.model.User;
import com.crewcanvas.user.repository.ConnectionRepository;
import com.crewcanvas.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ConnectionService {

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.crewcanvas.user.messaging.UserEventProducer userEventProducer;

    public Connection followUser(Long followerId, Long followingId) {
        if (connectionRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new RuntimeException("Already following this user");
        }
        Connection connection = new Connection(followerId, followingId);
        connectionRepository.save(connection);
        updateFollowerCounts(followerId, followingId);

        // Fetch names for Kafka event
        String followerName = userRepository.findById(followerId).map(User::getName).orElse("Someone");
        String followingName = userRepository.findById(followingId).map(User::getName).orElse("User");

        // Send Kafka event
        userEventProducer.sendUserFollowEvent(followerId, followingId, followerName, followingName);

        return connection;
    }

    public void unfollowUser(Long followerId, Long followingId) {
        Optional<Connection> connection = connectionRepository.findByFollowerIdAndFollowingId(followerId, followingId);
        if (connection.isPresent()) {
            connectionRepository.delete(connection.get());
            updateFollowerCounts(followerId, followingId);
        } else {
            throw new RuntimeException("Not following this user");
        }
    }

    public List<User> getFollowers(Long userId) {
        List<Connection> connections = connectionRepository.findByFollowingId(userId);
        return connections.stream()
                .map(c -> userRepository.findById(c.getFollowerId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    public List<User> getFollowing(Long userId) {
        List<Connection> connections = connectionRepository.findByFollowerId(userId);
        return connections.stream()
                .map(c -> userRepository.findById(c.getFollowingId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    private void updateFollowerCounts(Long followerId, Long followingId) {
        Long followerCount = connectionRepository.countFollowers(followingId);
        Optional<User> followingUser = userRepository.findById(followingId);
        if (followingUser.isPresent()) {
            User user = followingUser.get();
            user.setFollowers(followerCount.intValue());
            userRepository.save(user);
        }

        Long followingCount = connectionRepository.countFollowing(followerId);
        Optional<User> followerUser = userRepository.findById(followerId);
        if (followerUser.isPresent()) {
            User user = followerUser.get();
            user.setFollowing(followingCount.intValue());
            userRepository.save(user);
        }
    }
}
