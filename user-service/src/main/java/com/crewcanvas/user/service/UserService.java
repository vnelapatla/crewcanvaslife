package com.crewcanvas.user.service;

import com.crewcanvas.user.model.User;
import com.crewcanvas.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User registerUser(String name, String email, String password) {
        // FIXED Incident BF-001: Added safety check to prevent 500 errors on duplicate email
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("Email already registered. Please use a different email or login.");
        }
        
        User user = new User(name, email, password);
        user.setStatus("PENDING");
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (id != null) {
            userRepository.deleteById(id);
        }
    }

    public void updateStatus(Long id, String status) {
        if (id != null) {
            userRepository.findById(id).ifPresent(user -> {
                user.setStatus(status);
                userRepository.save(user);
            });
        }
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

    public User updateProfile(User updatedUser) {
        if (updatedUser.getId() == null) {
            throw new RuntimeException("User ID is required for profile update");
        }

        return userRepository.findById(updatedUser.getId()).map(existingUser -> {
            // Update only the fields that can be changed via edit profile
            if (updatedUser.getName() != null && !updatedUser.getName().isEmpty()) existingUser.setName(updatedUser.getName());
            if (updatedUser.getEmail() != null && !updatedUser.getEmail().isEmpty()) existingUser.setEmail(updatedUser.getEmail());
            if (updatedUser.getPhone() != null && !updatedUser.getPhone().isEmpty()) existingUser.setPhone(updatedUser.getPhone());
            if (updatedUser.getLocation() != null && !updatedUser.getLocation().isEmpty()) existingUser.setLocation(updatedUser.getLocation());
            if (updatedUser.getRole() != null && !updatedUser.getRole().isEmpty()) existingUser.setRole(updatedUser.getRole());
            if (updatedUser.getProjectsCount() != null && !updatedUser.getProjectsCount().isEmpty()) existingUser.setProjectsCount(updatedUser.getProjectsCount());
            if (updatedUser.getBio() != null && !updatedUser.getBio().isEmpty()) existingUser.setBio(updatedUser.getBio());
            if (updatedUser.getSkills() != null && !updatedUser.getSkills().isEmpty()) existingUser.setSkills(updatedUser.getSkills());
            if (updatedUser.getLinkedinProfile() != null && !updatedUser.getLinkedinProfile().isEmpty()) existingUser.setLinkedinProfile(updatedUser.getLinkedinProfile());
            if (updatedUser.getPersonalWebsite() != null && !updatedUser.getPersonalWebsite().isEmpty()) existingUser.setPersonalWebsite(updatedUser.getPersonalWebsite());
            if (updatedUser.getInstagram() != null && !updatedUser.getInstagram().isEmpty()) existingUser.setInstagram(updatedUser.getInstagram());
            if (updatedUser.getProfilePicture() != null && !updatedUser.getProfilePicture().isEmpty()) existingUser.setProfilePicture(updatedUser.getProfilePicture());
            if (updatedUser.getCoverImage() != null && !updatedUser.getCoverImage().isEmpty()) existingUser.setCoverImage(updatedUser.getCoverImage());
            
            return userRepository.save(existingUser);
        }).orElseThrow(() -> new RuntimeException("User not found with ID: " + updatedUser.getId()));
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
                                (user.getSkills() != null
                                        && user.getSkills().toLowerCase().contains(query.toLowerCase()));
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
}
