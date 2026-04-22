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

@Service
public class ConnectionService {

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private UserRepository userRepository;

    public Connection followUser(Long followerId, Long followingId) {
        // Check if already following
        if (connectionRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new RuntimeException("Already following this user");
        }

        // Create connection
        Connection connection = new Connection(followerId, followingId);
        connectionRepository.save(connection);

        // Update follower/following counts
        updateFollowerCounts(followerId, followingId, true);

        return connection;
    }

    public void unfollowUser(Long followerId, Long followingId) {
        Optional<Connection> connection = connectionRepository.findByFollowerIdAndFollowingId(followerId, followingId);
        if (connection.isPresent()) {
            connectionRepository.delete(connection.get());

            // Update follower/following counts
            updateFollowerCounts(followerId, followingId, false);
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

    public boolean isFollowing(Long followerId, Long followingId) {
        return connectionRepository.existsByFollowerIdAndFollowingId(followerId, followingId);
    }

    private void updateFollowerCounts(Long followerId, Long followingId, boolean increment) {
        int delta = increment ? 1 : -1;

        // Follower's "Following" count changes
        Optional<User> followerUser = userRepository.findById(followerId);
        if (followerUser.isPresent()) {
            User user = followerUser.get();
            int currentFollowing = user.getFollowing() != null ? user.getFollowing() : 0;
            user.setFollowing(Math.max(0, currentFollowing + delta));
            userRepository.save(user);
        }

        // Following's "Follower" count changes
        Optional<User> followingUser = userRepository.findById(followingId);
        if (followingUser.isPresent()) {
            User user = followingUser.get();
            int currentFollowers = user.getFollowers() != null ? user.getFollowers() : 0;
            user.setFollowers(Math.max(0, currentFollowers + delta));
            userRepository.save(user);
        }
    }
}
