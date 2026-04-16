package com.crewcanvas.service;

import com.crewcanvas.model.Connection;
import com.crewcanvas.model.User;
import com.crewcanvas.repository.ConnectionRepository;
import com.crewcanvas.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class ConnectionService {

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private UserRepository userRepository;

    public Connection followUser(Long followerId, Long followingId) {
        // Prevent self-follow
        if (followerId.equals(followingId)) {
            throw new RuntimeException("Self-following is not allowed");
        }

        // Check if already following
        if (connectionRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new RuntimeException("Already following this user");
        }

        // Create connection
        Connection connection = new Connection(followerId, followingId);
        connectionRepository.save(connection);

        // Update follower/following counts
        updateFollowerCounts(followerId, followingId);

        return connection;
    }

    public void unfollowUser(Long followerId, Long followingId) {
        Optional<Connection> connection = connectionRepository.findByFollowerIdAndFollowingId(followerId, followingId);
        if (connection.isPresent()) {
            connectionRepository.delete(connection.get());

            // Update follower/following counts
            updateFollowerCounts(followerId, followingId);
        } else {
            throw new RuntimeException("Not following this user");
        }
    }

    public List<User> getFollowers(Long userId) {
        List<Connection> connections = connectionRepository.findByFollowingId(userId);
        return connections.stream()
                .map(c -> userRepository.findById(c.getFollowerId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .collect(Collectors.toList());
    }

    public List<User> getFollowing(Long userId) {
        List<Connection> connections = connectionRepository.findByFollowerId(userId);
        return connections.stream()
                .map(c -> userRepository.findById(c.getFollowingId()))
                .filter(opt -> opt.isPresent())
                .map(opt -> opt.get())
                .collect(Collectors.toList());
    }

    public boolean isFollowing(Long followerId, Long followingId) {
        return connectionRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    private void updateFollowerCounts(Long followerId, Long followingId) {
        // FIXED Incident BF-505: Switched to robust repository counting instead of manual increment/decrement.
        // This ensures the counts are always accurate relative to the actual connections in the database.
        
        // Update Following User's Follower Count
        Long followersCount = connectionRepository.countFollowers(followingId);
        userRepository.findById(followingId).ifPresent(user -> {
            user.setFollowers(followersCount.intValue());
            userRepository.save(user);
        });

        // Update Follower User's Following Count
        Long followingCount = connectionRepository.countFollowing(followerId);
        userRepository.findById(followerId).ifPresent(user -> {
            user.setFollowing(followingCount.intValue());
            userRepository.save(user);
        });
    }
}
