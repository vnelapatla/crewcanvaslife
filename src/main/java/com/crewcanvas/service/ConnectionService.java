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

        // Update counts
        userRepository.findById(followerId).ifPresent(user -> {
            user.setFollowing((user.getFollowing() == null ? 0 : user.getFollowing()) + 1);
            userRepository.save(user);
        });

        userRepository.findById(followingId).ifPresent(user -> {
            user.setFollowers((user.getFollowers() == null ? 0 : user.getFollowers()) + 1);
            userRepository.save(user);
        });
    }

    @Transactional
    public void unfollowUser(Long followerId, Long followingId) {
        Connection connection = connectionRepository.findByFollowerIdAndFollowingId(followerId, followingId)
                .orElseThrow(() -> new RuntimeException("Connection not found"));

        connectionRepository.delete(connection);

        // Update counts
        userRepository.findById(followerId).ifPresent(user -> {
            int current = user.getFollowing() == null ? 0 : user.getFollowing();
            user.setFollowing(Math.max(0, current - 1));
            userRepository.save(user);
        });

        userRepository.findById(followingId).ifPresent(user -> {
            int current = user.getFollowers() == null ? 0 : user.getFollowers();
            user.setFollowers(Math.max(0, current - 1));
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
