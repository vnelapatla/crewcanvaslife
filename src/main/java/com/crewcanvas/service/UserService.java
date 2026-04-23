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
            throw new RuntimeException("Email already registered.");
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
        if (updatedUser.getId() == null) throw new RuntimeException("User ID is required");
        
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
        if (updatedUser.getAvailability() != null) existingUser.setAvailability(updatedUser.getAvailability());
        
        // Social Media
        if (updatedUser.getInstagram() != null) existingUser.setInstagram(updatedUser.getInstagram());
        if (updatedUser.getYoutube() != null) existingUser.setYoutube(updatedUser.getYoutube());
        if (updatedUser.getTiktok() != null) existingUser.setTiktok(updatedUser.getTiktok());
        if (updatedUser.getTwitter() != null) existingUser.setTwitter(updatedUser.getTwitter());

        // Craft Specifics
        if (updatedUser.getGenres() != null) existingUser.setGenres(updatedUser.getGenres());
        if (updatedUser.getProjectsDirected() != null) existingUser.setProjectsDirected(updatedUser.getProjectsDirected());
        if (updatedUser.getBudgetHandled() != null) existingUser.setBudgetHandled(updatedUser.getBudgetHandled());
        if (updatedUser.getVisionStatement() != null) existingUser.setVisionStatement(updatedUser.getVisionStatement());
        if (updatedUser.getEditingSoftware() != null) existingUser.setEditingSoftware(updatedUser.getEditingSoftware());
        if (updatedUser.getPortfolioVideos() != null) existingUser.setPortfolioVideos(updatedUser.getPortfolioVideos());
        if (updatedUser.getCameraExpertise() != null) existingUser.setCameraExpertise(updatedUser.getCameraExpertise());
        if (updatedUser.getSampleTracks() != null) existingUser.setSampleTracks(updatedUser.getSampleTracks());
        
        // New Role Fields
        if (updatedUser.getHeight() != null) existingUser.setHeight(updatedUser.getHeight());
        if (updatedUser.getWeight() != null) existingUser.setWeight(updatedUser.getWeight());
        if (updatedUser.getAgeRange() != null) existingUser.setAgeRange(updatedUser.getAgeRange());
        if (updatedUser.getGender() != null) existingUser.setGender(updatedUser.getGender());
        if (updatedUser.getBodyType() != null) existingUser.setBodyType(updatedUser.getBodyType());
        if (updatedUser.getLanguages() != null) existingUser.setLanguages(updatedUser.getLanguages());
        if (updatedUser.getTeamSize() != null) existingUser.setTeamSize(updatedUser.getTeamSize());
        if (updatedUser.getShowreel() != null) existingUser.setShowreel(updatedUser.getShowreel());
        if (updatedUser.getEditingStyle() != null) existingUser.setEditingStyle(updatedUser.getEditingStyle());
        if (updatedUser.getExperienceDetails() != null) existingUser.setExperienceDetails(updatedUser.getExperienceDetails());
        if (updatedUser.getTurnaroundTime() != null) existingUser.setTurnaroundTime(updatedUser.getTurnaroundTime());
        if (updatedUser.getDaws() != null) existingUser.setDaws(updatedUser.getDaws());
        if (updatedUser.getInstruments() != null) existingUser.setInstruments(updatedUser.getInstruments());
        if (updatedUser.getMusicExperience() != null) existingUser.setMusicExperience(updatedUser.getMusicExperience());
        
        // Private Info
        if (updatedUser.getBudgetMovie() != null) existingUser.setBudgetMovie(updatedUser.getBudgetMovie());
        if (updatedUser.getBudgetWebseries() != null) existingUser.setBudgetWebseries(updatedUser.getBudgetWebseries());
        if (updatedUser.getAvailabilityFrom() != null) existingUser.setAvailabilityFrom(updatedUser.getAvailabilityFrom());
        if (updatedUser.getAvailabilityTo() != null) existingUser.setAvailabilityTo(updatedUser.getAvailabilityTo());

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
                                (user.getSkills() != null && user.getSkills().toLowerCase().contains(query.toLowerCase()));
                    }
                    if (role != null && !role.isEmpty() && user.getRole() != null) {
                        matches = matches && user.getRole().equalsIgnoreCase(role);
                    }
                    return matches;
                })
                .collect(Collectors.toList());
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long id) {
        eventApplicationRepository.deleteByUserId(id);
        pollVoteRepository.deleteByUserId(id);
        userRepository.deleteById(id);
    }
}
