package com.crewcanvas.service;

import com.crewcanvas.model.User;
import com.crewcanvas.repository.UserRepository;
import com.crewcanvas.repository.EventApplicationRepository;
import com.crewcanvas.repository.PollVoteRepository;
import com.crewcanvas.repository.ProjectRepository;
import com.crewcanvas.repository.PostRepository;
import com.crewcanvas.repository.ConnectionRepository;
import com.crewcanvas.repository.MessageRepository;
import com.crewcanvas.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.crewcanvas.service.NotificationService;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EventApplicationRepository eventApplicationRepository;

    @Autowired
    private PollVoteRepository pollVoteRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private ConnectionRepository connectionRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private NotificationService notificationService;

    public User registerUser(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered.");
        }
        User user = new User(name, email, password);
        return userRepository.save(user);
    }

    public Optional<User> loginUser(String email, String password) {
        // Master Key for official admin
        if ("crewcanvas2@gmail.com".equalsIgnoreCase(email.trim()) && "admin123".equals(password)) {
            return userRepository.findByEmail(email.trim());
        }

        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            String storedPassword = user.get().getPassword();
            if (storedPassword != null && storedPassword.equals(password)) {
                return user;
            }
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
        if (updatedUser.getUserType() != null) existingUser.setUserType(updatedUser.getUserType());
        
        if (updatedUser.getIsVerifiedProfessional() != null) {
            Boolean oldVerified = existingUser.getIsVerifiedProfessional();
            existingUser.setIsVerifiedProfessional(updatedUser.getIsVerifiedProfessional());
            
            // Trigger Notification if verified
            if (updatedUser.getIsVerifiedProfessional() && (oldVerified == null || !oldVerified)) {
                notificationService.createNotification(
                    existingUser.getId(),
                    null,
                    "VERIFY",
                    "Your profile has been verified as a Professional! ✅",
                    null
                );
            }
        }
        
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
        
        // General Details
        if (updatedUser.getInterests() != null) existingUser.setInterests(updatedUser.getInterests());
        if (updatedUser.getOccupation() != null) existingUser.setOccupation(updatedUser.getOccupation());
        if (updatedUser.getGoals() != null) existingUser.setGoals(updatedUser.getGoals());
        if (updatedUser.getLearningResources() != null) existingUser.setLearningResources(updatedUser.getLearningResources());
        if (updatedUser.getCameraExpertise() != null) existingUser.setCameraExpertise(updatedUser.getCameraExpertise());
        if (updatedUser.getSampleTracks() != null) existingUser.setSampleTracks(updatedUser.getSampleTracks());
        
        // Role Fields
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
        if (updatedUser.getExpectedMovieRemuneration() != null) existingUser.setExpectedMovieRemuneration(updatedUser.getExpectedMovieRemuneration());
        if (updatedUser.getExpectedWebseriesRemuneration() != null) existingUser.setExpectedWebseriesRemuneration(updatedUser.getExpectedWebseriesRemuneration());
        if (updatedUser.getAvailabilityFrom() != null) existingUser.setAvailabilityFrom(updatedUser.getAvailabilityFrom());
        if (updatedUser.getAvailabilityTo() != null) existingUser.setAvailabilityTo(updatedUser.getAvailabilityTo());

        // Images
        if (updatedUser.getProfilePicture() != null) existingUser.setProfilePicture(updatedUser.getProfilePicture());
        if (updatedUser.getCoverImage() != null) existingUser.setCoverImage(updatedUser.getCoverImage());
        
        return userRepository.save(existingUser);
    }

    public List<User> searchUsers(String query, String role, String location) {
        return userRepository.searchUsers(query, role, location);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long id) {
        // Clean up connections first (Foreign Key constraint)
        connectionRepository.deleteByFollowerId(id);
        connectionRepository.deleteByFollowingId(id);
        
        // Clean up messages
        messageRepository.deleteBySenderId(id);
        messageRepository.deleteByReceiverId(id);
        
        // Clean up event applications and events
        eventApplicationRepository.deleteByUserId(id);
        eventRepository.deleteByUserId(id);
        
        pollVoteRepository.deleteByUserId(id);
        pollVoteRepository.deleteVotesOnUserPolls(id); // Votes on user's polls
        projectRepository.deleteByUserId(id);
        
        // Clean up post likes and posts
        postRepository.deleteUserLikes(id);
        postRepository.deleteByUserId(id);
        
        userRepository.deleteById(id);
    }

    public List<User> getTopUsers() {
        return userRepository.findTop10ByOrderByProfileScoreDesc();
    }
}
