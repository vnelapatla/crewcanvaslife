package com.crewcanvas.service;

import com.crewcanvas.model.User;
import com.crewcanvas.model.Message;
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
import com.crewcanvas.model.PasswordResetToken;
import com.crewcanvas.repository.PasswordResetTokenRepository;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);

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

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private WhatsAppService whatsappService;

    public User getOfficialUser() {
        String officialEmail = "crewcanvas2@gmail.com";
        Optional<User> officialUserOpt = userRepository.findByEmail(officialEmail);
        User officialUser;

        if (officialUserOpt.isEmpty()) {
            logger.info("Official account not found. Creating default official account...");
            officialUser = new User("CrewCanvas Official", officialEmail, "admin123");
            officialUser.setIsAdmin(true);
            officialUser.setUserType("Admin");
            officialUser = userRepository.save(officialUser);
        } else {
            officialUser = officialUserOpt.get();
            // Ensure the name is professional
            if (!"CrewCanvas Official".equals(officialUser.getName())) {
                officialUser.setName("CrewCanvas Official");
                userRepository.save(officialUser);
            }
        }
        return officialUser;
    }

    public void sendWelcomeMessage(User user) {
        if (user == null || user.getId() == null) return;

        User officialUser = getOfficialUser();
        Long senderId = officialUser.getId();
        Long receiverId = user.getId();

        // Don't send welcome message to the official account itself
        if (senderId.equals(receiverId)) return;

        // Check if welcome message already sent in-app
        if (messageRepository.existsBySenderIdAndReceiverId(senderId, receiverId)) {
            return;
        }

        String profileLink = "https://crewcanvas.in/profile.html?userId=" + receiverId;

        String content = "Welcome to CrewCanvas! 🎬 We're thrilled to have you here. " +
                "To get the most out of this platform and catch up with upcoming openings, " +
                "please make sure to fill your profile to 100%. " +
                "Productions and recruiters will look into your profile for recommendations and casting. " +
                "You can view and complete your profile here: " + profileLink + " " +
                "Let's build something great together!";

        // 1. Send In-App Message
        Message welcomeMsg = new Message(senderId, receiverId, content);
        messageRepository.save(welcomeMsg);

        // 2. Trigger Notification
        notificationService.createNotification(
                receiverId,
                senderId,
                "MESSAGE",
                "Welcome to CrewCanvas! Check your messages for a quick guide.",
                senderId.toString()
        );

        // 3. Send Email
        try {
            String profileLinkEmail = "https://crewcanvas.in/profile.html?userId=" + user.getId();
            emailService.sendWelcomeEmail(user.getEmail(), user.getName(), profileLinkEmail);
            logger.info("Welcome email sent to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send welcome email to {}: {}", user.getEmail(), e.getMessage());
        }

        // 4. Send WhatsApp (Disabled for now - requires paid API)
        /*
        try {
            whatsappService.sendWelcomeWhatsApp(user.getPhone(), user.getName());
        } catch (Exception e) {
            logger.error("Failed to send welcome WhatsApp to {}: {}", user.getPhone(), e.getMessage());
        }
        */
        
        logger.info("Welcome package (Message, Email) initiated for user: {}", user.getEmail());
    }

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
        if (updatedUser.getRecentPictures() != null) existingUser.setRecentPictures(updatedUser.getRecentPictures());
        if (updatedUser.getResume() != null) existingUser.setResume(updatedUser.getResume());
        if (updatedUser.getResumeFileName() != null) existingUser.setResumeFileName(updatedUser.getResumeFileName());
        if (updatedUser.getResumeContentType() != null) existingUser.setResumeContentType(updatedUser.getResumeContentType());
        
        return userRepository.save(existingUser);
    }

    public org.springframework.data.domain.Page<User> searchUsers(String query, String role, String location, int page, int size) {
        return userRepository.searchUsers(query, role, location, org.springframework.data.domain.PageRequest.of(page, size));
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Transactional
    public void deleteUser(Long id) {
        try {
            logger.info("Starting deletion process for user ID: {}", id);
            User user = userRepository.findById(id).orElse(null);
            if (user == null) {
                logger.warn("User not found for ID: {}", id);
                return;
            }

            // Clean up Password Reset Tokens
            logger.debug("Deleting password reset tokens for user: {}", id);
            tokenRepository.deleteByUser(user);

            // Clean up Notifications
            logger.debug("Clearing notifications for user: {}", id);
            notificationService.clearAllNotifications(id);
            notificationService.clearNotificationsByActor(id);
            // Clean up connections
            logger.debug("Deleting connections for user: {}", id);
            connectionRepository.deleteByFollowerId(id);
            connectionRepository.deleteByFollowingId(id);
            
            // Fix for "ghost" followers table that might exist in some DB environments
            try {
                connectionRepository.deleteFromFollowersTable(id);
            } catch (Exception e) {
                logger.warn("Ghost followers table cleanup skipped or failed (likely table doesn't exist): {}", e.getMessage());
            }
            // Clean up messages
            logger.debug("Deleting messages for user: {}", id);
            messageRepository.deleteBySenderId(id);
            messageRepository.deleteByReceiverId(id);
            
            // Fix for "ghost" conversations table
            try {
                messageRepository.deleteFromConversationsTable(id);
            } catch (Exception e) {
                logger.warn("Ghost conversations table cleanup skipped or failed: {}", e.getMessage());
            }
            
            // Clean up event applications and events
            logger.debug("Deleting event data for user: {}", id);
            eventApplicationRepository.deleteByUserId(id);
            
            // Fix: Delete applications TO the user's events before deleting the events
            List<Long> userEventIds = eventRepository.findIdsByUserId(id);
            if (!userEventIds.isEmpty()) {
                logger.debug("Deleting applications for user's events: {}", userEventIds);
                eventApplicationRepository.deleteByEventIdIn(userEventIds);
            }
            eventRepository.deleteByUserId(id);
            
            logger.debug("Deleting poll votes for user: {}", id);
            pollVoteRepository.deleteByUserId(id);
            pollVoteRepository.deleteVotesOnUserPolls(id);
            
            logger.debug("Deleting projects for user: {}", id);
            projectRepository.deleteByUserId(id);
            
            // Clean up post likes and posts
            logger.debug("Deleting post data for user: {}", id);
            postRepository.deleteUserLikes(id); // Likes MADE BY user
            
            // Fix: Delete all collection data FOR the user's posts before deleting the posts themselves
            postRepository.deleteLikesOnUserPosts(id);
            postRepository.deleteCommentsOnUserPosts(id);
            postRepository.deleteImagesOnUserPosts(id);
            postRepository.deleteLinksOnUserPosts(id);
            
            postRepository.deleteByUserId(id);
            
            logger.info("Final step: Deleting user record for ID: {}", id);
            userRepository.deleteById(id);
            logger.info("User ID: {} deleted successfully", id);
        } catch (Exception e) {
            logger.error("CRITICAL ERROR during user deletion (ID: {}): {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete user account due to data constraints: " + e.getMessage(), e);
        }
    }

    public List<User> getTopUsers() {
        return userRepository.findTop10ByOrderByProfileScoreDesc();
    }

    @Transactional
    public void createPasswordResetTokenForUser(User user, String token) {
        // Delete any existing token for this user
        tokenRepository.deleteByUser(user);
        
        PasswordResetToken myToken = new PasswordResetToken(token, user);
        tokenRepository.save(myToken);
    }

    public Optional<User> getUserByPasswordResetToken(String token) {
        Optional<PasswordResetToken> resetToken = tokenRepository.findByToken(token);
        if (resetToken.isPresent() && !resetToken.get().isExpired()) {
            return Optional.of(resetToken.get().getUser());
        }
        return Optional.empty();
    }

    @Transactional
    public void changeUserPassword(User user, String newPassword) {
        if (user.getPassword() != null && user.getPassword().equals(newPassword)) {
            throw new RuntimeException("New password cannot be the same as the old password");
        }
        user.setPassword(newPassword);
        userRepository.save(user);
        tokenRepository.deleteByUser(user); // Invalidate token after use
    }
}
