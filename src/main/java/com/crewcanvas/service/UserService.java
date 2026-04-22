package com.crewcanvas.service;

import com.crewcanvas.model.User;
import com.crewcanvas.repository.UserRepository;
import com.crewcanvas.repository.EventApplicationRepository;
import com.crewcanvas.repository.PollVoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventApplicationRepository eventApplicationRepository;

    @Autowired
    private PollVoteRepository pollVoteRepository;

    public User registerUser(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered. Please use a different email or login.");
        }
        User user = new User(name, email, password);
        return userRepository.save(user);
    }

    public Optional<User> loginUser(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent() && user.get().getPassword().equals(password)) {
            return user;
        }
        return Optional.empty();
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    @Transactional
    public User updateProfile(User updatedUser) {
        if (updatedUser.getId() == null) {
            throw new RuntimeException("User ID is required for update");
        }
        
        User existingUser = userRepository.findById(updatedUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Basic Info Only
        if (updatedUser.getName() != null) existingUser.setName(updatedUser.getName());
        if (updatedUser.getEmail() != null) existingUser.setEmail(updatedUser.getEmail());
        if (updatedUser.getBio() != null) existingUser.setBio(updatedUser.getBio());
        if (updatedUser.getRole() != null) existingUser.setRole(updatedUser.getRole());
        if (updatedUser.getLocation() != null) existingUser.setLocation(updatedUser.getLocation());
        if (updatedUser.getSkills() != null) existingUser.setSkills(updatedUser.getSkills());
        if (updatedUser.getExperience() != null) existingUser.setExperience(updatedUser.getExperience());
        
        // Images
        if (updatedUser.getProfilePicture() != null) existingUser.setProfilePicture(updatedUser.getProfilePicture());
        if (updatedUser.getCoverImage() != null) existingUser.setCoverImage(updatedUser.getCoverImage());
        
        return userRepository.save(existingUser);
    }

    public List<User> searchUsers(String query, String role, String location) {
        List<User> allUsers = userRepository.findAll();
        return allUsers.stream()
                .filter(user -> {
                    boolean matches = true;
                    if (query != null && !query.isEmpty()) {
                        matches = user.getName().toLowerCase().contains(query.toLowerCase()) ||
                                (user.getEmail() != null && user.getEmail().toLowerCase().contains(query.toLowerCase()))
                                ||
                                (user.getSkills() != null && user.getSkills().toLowerCase().contains(query.toLowerCase()));
                    }
                    if (role != null && !role.isEmpty() && user.getRole() != null) {
                        matches = matches && user.getRole().equalsIgnoreCase(role);
                    }
                    if (location != null && !location.isEmpty() && user.getLocation() != null) {
                        matches = matches && user.getLocation().toLowerCase().contains(location.toLowerCase());
                    }
                    return matches;
                })
                .collect(Collectors.toList());
    }

    public List<User> getTopUsers() {
        return userRepository.findTop3ByOrderByFollowersDesc();
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public void updatePassword(Long id, String newPassword) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(newPassword);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        eventApplicationRepository.deleteByUserId(id);
        pollVoteRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }
}
