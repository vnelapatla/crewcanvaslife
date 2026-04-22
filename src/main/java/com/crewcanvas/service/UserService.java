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
        // Check if user already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered. Please use a different email or login.");
        }

        // Create new user
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

        // Basic Info
        if (updatedUser.getName() != null) existingUser.setName(updatedUser.getName());
        if (updatedUser.getEmail() != null) existingUser.setEmail(updatedUser.getEmail());
        if (updatedUser.getBio() != null) existingUser.setBio(updatedUser.getBio());
        if (updatedUser.getRole() != null) existingUser.setRole(updatedUser.getRole());
        if (updatedUser.getLocation() != null) existingUser.setLocation(updatedUser.getLocation());
        if (updatedUser.getSkills() != null) existingUser.setSkills(updatedUser.getSkills());
        if (updatedUser.getExperience() != null) existingUser.setExperience(updatedUser.getExperience());
        if (updatedUser.getPhone() != null) existingUser.setPhone(updatedUser.getPhone());
        
        // Images
        if (updatedUser.getProfilePicture() != null) existingUser.setProfilePicture(updatedUser.getProfilePicture());
        if (updatedUser.getCoverImage() != null) existingUser.setCoverImage(updatedUser.getCoverImage());
        
        // Social Links
        if (updatedUser.getPersonalWebsite() != null) existingUser.setPersonalWebsite(updatedUser.getPersonalWebsite());
        if (updatedUser.getInstagram() != null) existingUser.setInstagram(updatedUser.getInstagram());
        if (updatedUser.getYoutube() != null) existingUser.setYoutube(updatedUser.getYoutube());
        if (updatedUser.getTiktok() != null) existingUser.setTiktok(updatedUser.getTiktok());
        if (updatedUser.getTwitter() != null) existingUser.setTwitter(updatedUser.getTwitter());
        if (updatedUser.getVimeo() != null) existingUser.setVimeo(updatedUser.getVimeo());
        if (updatedUser.getBehance() != null) existingUser.setBehance(updatedUser.getBehance());
        if (updatedUser.getFacebook() != null) existingUser.setFacebook(updatedUser.getFacebook());
        if (updatedUser.getThreads() != null) existingUser.setThreads(updatedUser.getThreads());
        if (updatedUser.getLinkedinProfile() != null) existingUser.setLinkedinProfile(updatedUser.getLinkedinProfile());
        
        // Settings & Privacy
        if (updatedUser.getProfileVisibility() != null) existingUser.setProfileVisibility(updatedUser.getProfileVisibility());
        if (updatedUser.getMessagePermissions() != null) existingUser.setMessagePermissions(updatedUser.getMessagePermissions());
        if (updatedUser.getEmailNotifications() != null) existingUser.setEmailNotifications(updatedUser.getEmailNotifications());
        if (updatedUser.getFollowerNotifications() != null) existingUser.setFollowerNotifications(updatedUser.getFollowerNotifications());
        if (updatedUser.getEventReminders() != null) existingUser.setEventReminders(updatedUser.getEventReminders());

        // New Profile Fields
        if (updatedUser.getLanguages() != null) existingUser.setLanguages(updatedUser.getLanguages());
        if (updatedUser.getAvailability() != null) existingUser.setAvailability(updatedUser.getAvailability());
        if (updatedUser.getBudgetQuote() != null) existingUser.setBudgetQuote(updatedUser.getBudgetQuote());
        if (updatedUser.getAvailableFrom() != null) existingUser.setAvailableFrom(updatedUser.getAvailableFrom());
        if (updatedUser.getAvailableTo() != null) existingUser.setAvailableTo(updatedUser.getAvailableTo());
        if (updatedUser.getGender() != null) existingUser.setGender(updatedUser.getGender());
        if (updatedUser.getAge() != null) existingUser.setAge(updatedUser.getAge());
        if (updatedUser.getSkinTone() != null) existingUser.setSkinTone(updatedUser.getSkinTone());
        if (updatedUser.getHeight() != null) existingUser.setHeight(updatedUser.getHeight());
        existingUser.setContactVisible(updatedUser.isContactVisible());

        // Director Fields
        if (updatedUser.getGenres() != null) existingUser.setGenres(updatedUser.getGenres());
        if (updatedUser.getProjectsDirected() != null) existingUser.setProjectsDirected(updatedUser.getProjectsDirected());
        if (updatedUser.getBudgetHandled() != null) existingUser.setBudgetHandled(updatedUser.getBudgetHandled());
        if (updatedUser.getTeamSizeHandled() != null) existingUser.setTeamSizeHandled(updatedUser.getTeamSizeHandled());
        if (updatedUser.getVisionStatement() != null) existingUser.setVisionStatement(updatedUser.getVisionStatement());

        // Editor Fields
        if (updatedUser.getEditingSoftware() != null) existingUser.setEditingSoftware(updatedUser.getEditingSoftware());
        if (updatedUser.getEditingStyle() != null) existingUser.setEditingStyle(updatedUser.getEditingStyle());
        if (updatedUser.getPortfolioVideos() != null) existingUser.setPortfolioVideos(updatedUser.getPortfolioVideos());
        if (updatedUser.getTurnaroundTime() != null) existingUser.setTurnaroundTime(updatedUser.getTurnaroundTime());

        // DOP Fields
        if (updatedUser.getCameraExpertise() != null) existingUser.setCameraExpertise(updatedUser.getCameraExpertise());
        if (updatedUser.getLightingStyle() != null) existingUser.setLightingStyle(updatedUser.getLightingStyle());

        // Music Fields
        if (updatedUser.getDaws() != null) existingUser.setDaws(updatedUser.getDaws());
        if (updatedUser.getSampleTracks() != null) existingUser.setSampleTracks(updatedUser.getSampleTracks());
        if (updatedUser.getInstruments() != null) existingUser.setInstruments(updatedUser.getInstruments());

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

    public void updatePassword(Long id, String newPassword) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(newPassword);
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        // Delete records from tables without direct JPA relationships first
        eventApplicationRepository.deleteByUserId(id);
        pollVoteRepository.deleteByUserId(id);
        
        // Now delete the user (JPA will handle cascade for Messages, Events, Posts, Projects, Connections)
        userRepository.deleteById(id);
    }
}
