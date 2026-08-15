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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

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

    @Autowired
    private ConnectionService connectionService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public User getOfficialUser() {
        String officialEmail = "crewcanvas2@gmail.com";
        Optional<User> officialUserOpt = userRepository.findByEmail(officialEmail);
        User officialUser;

        if (officialUserOpt.isEmpty()) {
            logger.info("Official account not found. Creating default official account...");
            officialUser = new User("KrewCanvas Official", officialEmail, passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
            officialUser.setIsAdmin(true);
            officialUser.setUserType("Admin");
            officialUser = userRepository.save(officialUser);
        } else {
            officialUser = officialUserOpt.get();
            // Ensure the name is professional
            if (!"KrewCanvas Official".equals(officialUser.getName())) {
                officialUser.setName("KrewCanvas Official");
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

        // Check if welcome message already sent
        if (Boolean.TRUE.equals(user.getWelcomeSent())) {
            return;
        }

        // Secondary fallback check for existing messages
        if (messageRepository.existsBySenderIdAndReceiverId(senderId, receiverId)) {
            user.setWelcomeSent(true);
            userRepository.save(user);
            return;
        }

        String profileLink = "https://krewcanvas.in/profile.html?userId=" + receiverId;

        String content = "Welcome to KrewCanvas! 🎬 We're thrilled to have you here. " +
                "To get the most out of this platform and catch up with upcoming openings, " +
                "please make sure to fill your profile to 100%. " +
                "Productions and recruiters prioritize completed profiles for recommendations and casting. \n\n" +
                "🚀 You can complete your profile in the 'My Profile' section or by clicking here: " + profileLink + " \n\n" +
                "Let's build something great together!";

        // 1. Send In-App Message
        Message welcomeMsg = new Message(senderId, receiverId, content);
        messageRepository.save(welcomeMsg);

        // 2. Trigger Notification
        notificationService.createNotification(
                receiverId,
                senderId,
                "MESSAGE",
                "Welcome to KrewCanvas! Check your messages for a quick guide.",
                senderId.toString()
        );

        // 3. Send Email
        try {
            String profileLinkEmail = "https://krewcanvas.in/profile.html?userId=" + user.getId();
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

        // 5. Auto-follow Official Account
        try {
            connectionService.followUser(receiverId, senderId);
            logger.info("User {} auto-followed official account {}", receiverId, senderId);
        } catch (Exception e) {
            logger.error("Auto-follow failed for user {}: {}", receiverId, e.getMessage());
        }
        
        user.setWelcomeSent(true);
        userRepository.save(user);
        
        logger.info("Welcome package (Message, Email) initiated for user: {}", user.getEmail());
    }

    public void sendVerificationPackage(User user) {
        if (user == null || user.getId() == null) return;

        User officialUser = getOfficialUser();
        Long senderId = officialUser.getId();
        Long receiverId = user.getId();

        // Don't send to self
        if (senderId.equals(receiverId)) return;

        String content = "Congratulations! 🎬 Your profile has been officially verified by KrewCanvas. " +
                "You are now a Verified Professional! ✅ " +
                "This badge will help you gain more visibility and trust within the community. " +
                "Keep showcasing your best work. Cheers!";

        // 1. Send In-App Message
        Message verifyMsg = new Message(senderId, receiverId, content);
        messageRepository.save(verifyMsg);

        // 2. Trigger Notification (Already handled in updateProfile, but we can add a message notification too)
        notificationService.createNotification(
                receiverId,
                senderId,
                "MESSAGE",
                "You have a new message from KrewCanvas Official regarding your verification.",
                senderId.toString()
        );

        // 3. Send Email
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getName());
            logger.info("Verification email sent to: {}", user.getEmail());
        } catch (Exception e) {
            logger.error("Failed to send verification email to {}: {}", user.getEmail(), e.getMessage());
        }
    }

    public User registerUser(String name, String email, String password) {
        // Normalize email
        String cleanEmail = email.trim().toLowerCase();
        
        Optional<User> existing = userRepository.findByEmail(cleanEmail);
        if (existing.isPresent()) {
            User user = existing.get();
            if (user.getGoogleId() != null && user.getPassword() == null) {
                throw new RuntimeException("This email is already linked to a Google account. Please use 'Sign in with Google' to log in.");
            }
            throw new RuntimeException("This email is already registered. Please log in instead.");
        }
        
        try {
            User user = new User(name, cleanEmail, passwordEncoder.encode(password));
            if ("crewcanvas2@gmail.com".equalsIgnoreCase(cleanEmail)) {
                user.setIsAdmin(true);
                user.setUserType("Admin");
            }
            return userRepository.save(user);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            // Catch race conditions where another registration with same email happened between check and save
            throw new RuntimeException("This email is already registered. Please log in instead.");
        }
    }

    public Optional<User> loginUser(String email, String password) {
        Optional<User> user = userRepository.findByEmail(email);
        if (user.isPresent()) {
            User u = user.get();
            if ("crewcanvas2@gmail.com".equalsIgnoreCase(u.getEmail()) && !Boolean.TRUE.equals(u.getIsAdmin())) {
                u.setIsAdmin(true);
                u.setUserType("Admin");
                userRepository.save(u);
            }
            String storedPassword = u.getPassword();
            if (storedPassword != null) {
                if (passwordEncoder.matches(password, storedPassword) || storedPassword.equals(password)) {
                    // Auto-upgrade legacy plaintext passwords to BCrypt
                    if (!storedPassword.startsWith("$2a$") && !storedPassword.startsWith("$2b$") && !storedPassword.startsWith("$2y$")) {
                        u.setPassword(passwordEncoder.encode(password));
                        userRepository.save(u);
                    }
                    return user;
                }
            }
            
            // If password doesn't match or is null, check if it's a Google account
            if (u.getGoogleId() != null && u.getPassword() == null) {
                throw new RuntimeException("This account is linked to Google. Please 'Sign in with Google'.");
            }
        }
        return Optional.empty();
    }

    public void checkAndSendProfileReminder(User user) {
        if (user == null || user.getId() == null) return;
        
        // Skip for Admin
        if (Boolean.TRUE.equals(user.getIsAdmin()) || "crewcanvas2@gmail.com".equalsIgnoreCase(user.getEmail())) {
            return;
        }

        // Only send if profile is incomplete (Score < 70)
        if (user.getProfileScore() < 70) {
            try {
                String profileLink = "https://krewcanvas.in/profile.html?userId=" + user.getId();
                emailService.sendProfileReminderEmail(user.getEmail(), user.getName(), profileLink);
                logger.info("Profile reminder email sent to: {}", user.getEmail());
            } catch (Exception e) {
                logger.error("Failed to send profile reminder email to {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    public Optional<com.crewcanvas.dto.UserDTO> findByIdDTO(Long id) {
        return userRepository.findSummaryById(id).map(summary -> {
            com.crewcanvas.dto.UserDTO dto = new com.crewcanvas.dto.UserDTO(summary);
            userRepository.findById(id).ifPresent(u -> dto.setProfilePicture(u.getProfilePicture()));
            return dto;
        });
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
                
                // Send Email and In-App Message
                sendVerificationPackage(existingUser);
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
        
        // Settings
        if (updatedUser.getProfileVisibility() != null) existingUser.setProfileVisibility(updatedUser.getProfileVisibility());
        if (updatedUser.getMessagePermissions() != null) existingUser.setMessagePermissions(updatedUser.getMessagePermissions());
        if (updatedUser.getEmailNotifications() != null) existingUser.setEmailNotifications(updatedUser.getEmailNotifications());
        if (updatedUser.getFollowerNotifications() != null) existingUser.setFollowerNotifications(updatedUser.getFollowerNotifications());
        if (updatedUser.getEventReminders() != null) existingUser.setEventReminders(updatedUser.getEventReminders());

        return userRepository.save(existingUser);
    }

    public org.springframework.data.domain.Page<User> searchUsers(String query, String role, String location, Long currentUserId, boolean excludeFollowed, int page, int size) {
        String viewerRole = null;
        String viewerAgeRange = null;
        
        if (currentUserId != null) {
            Optional<User> viewer = userRepository.findById(currentUserId);
            if (viewer.isPresent()) {
                viewerRole = viewer.get().getRole();
                viewerAgeRange = viewer.get().getAgeRange();
            }
        }
        
        return userRepository.searchUsers(query, role, location, currentUserId, viewerRole, viewerAgeRange, excludeFollowed, org.springframework.data.domain.PageRequest.of(page, size));
    }

    public org.springframework.data.domain.Page<com.crewcanvas.dto.UserDTO> searchUsersSummary(String query, String role, String location, Long currentUserId, boolean excludeFollowed, int page, int size) {
        String viewerRole = null;
        String viewerAgeRange = null;
        
        if (currentUserId != null) {
            Optional<User> viewer = userRepository.findById(currentUserId);
            if (viewer.isPresent()) {
                viewerRole = viewer.get().getRole();
                viewerAgeRange = viewer.get().getAgeRange();
            }
        }

        org.springframework.data.domain.Page<com.crewcanvas.dto.UserSummary> summaryPage = userRepository.searchUsersSummary(
            query, role, location, currentUserId, viewerRole, viewerAgeRange, excludeFollowed, 
            org.springframework.data.domain.PageRequest.of(page, size));
        
        return summaryPage.map(summary -> {
            return new com.crewcanvas.dto.UserDTO(summary);
        });
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
                Boolean tableExists = jdbcTemplate.execute((java.sql.Connection conn) -> {
                    java.sql.DatabaseMetaData meta = conn.getMetaData();
                    try (java.sql.ResultSet rs = meta.getTables(null, null, "CONVERSATIONS", null)) {
                        if (rs.next()) return true;
                    }
                    try (java.sql.ResultSet rs = meta.getTables(null, null, "conversations", null)) {
                        if (rs.next()) return true;
                    }
                    return false;
                });
                
                if (Boolean.TRUE.equals(tableExists)) {
                    logger.debug("Ghost conversations table exists. Deleting user references.");
                    jdbcTemplate.update("DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?", id, id);
                } else {
                    logger.debug("Ghost conversations table does not exist, skipping.");
                }
            } catch (Exception e) {
                logger.warn("Ghost conversations table cleanup skipped: {}", e.getMessage());
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
        return userRepository.findTop10Users(org.springframework.data.domain.PageRequest.of(0, 10));
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
        String trimmedNewPassword = newPassword != null ? newPassword.trim() : null;
        String currentPassword = user.getPassword() != null ? user.getPassword().trim() : null;

        if (trimmedNewPassword != null && currentPassword != null && 
            (passwordEncoder.matches(trimmedNewPassword, currentPassword) || trimmedNewPassword.equals(currentPassword))) {
            throw new RuntimeException("New password cannot be the same as the old password");
        }
        
        user.setPassword(trimmedNewPassword != null ? passwordEncoder.encode(trimmedNewPassword) : null);
        userRepository.save(user);
        tokenRepository.deleteByUser(user); // Invalidate token after use
    }

    public List<User> getAllUsersSortedByLogin() {
        return userRepository.findAllByOrderByLastLoginDesc();
    }

    @Transactional
    public int syncExistingUsersToFollowAdmin() {
        User officialAdmin = getOfficialUser();
        List<User> allUsers = userRepository.findAll();
        int count = 0;
        for (User user : allUsers) {
            if (user.getId().equals(officialAdmin.getId())) continue;
            
            // Check if already following to avoid unnecessary sync calls
            if (connectionRepository.findByFollowerIdAndFollowingId(user.getId(), officialAdmin.getId()).isEmpty()) {
                connectionService.followUser(user.getId(), officialAdmin.getId());
                count++;
            }
        }
        return count;
    }
}
