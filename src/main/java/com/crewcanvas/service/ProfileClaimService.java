package com.crewcanvas.service;

import com.crewcanvas.config.JwtTokenProvider;
import com.crewcanvas.model.ProfileClaimAuditLog;
import com.crewcanvas.model.ProfileClaimInvitation;
import com.crewcanvas.model.User;
import com.crewcanvas.repository.ProfileClaimAuditLogRepository;
import com.crewcanvas.repository.ProfileClaimInvitationRepository;
import com.crewcanvas.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ProfileClaimService {

    private static final Logger logger = LoggerFactory.getLogger(ProfileClaimService.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    @org.springframework.context.annotation.Lazy
    private UserService userService;

    @Autowired
    private ProfileClaimInvitationRepository invitationRepository;

    @Autowired
    private ProfileClaimAuditLogRepository auditLogRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private EmailService emailService;

    @Autowired
    private WhatsAppService whatsAppService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Value("${claim.invitation.expiration-hours:72}")
    private int expirationHours;

    @Value("${app.base-url:https://crewcanvas.in}")
    private String baseUrl;

    /**
     * Hashes a raw token string using SHA-256 for secure database storage.
     */
    public String hashToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    /**
     * Generates a cryptographically random single-use token.
     */
    private String generateSecureToken() {
        byte[] randomBytes = new byte[16];
        secureRandom.nextBytes(randomBytes);
        String randomHex = HexFormat.of().formatHex(randomBytes);
        return UUID.randomUUID().toString().replace("-", "") + randomHex;
    }

    /**
     * Admin creates an unclaimed professional actor profile.
     */
    @Transactional
    public Map<String, Object> createUnclaimedProfile(User profileData, Long adminId) {
        if (profileData.getName() == null || profileData.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Actor name is required to create a profile.");
        }

        // Handle email / placeholder email for unclaimed profile
        String email = profileData.getEmail();
        if (email == null || email.trim().isEmpty()) {
            email = "unclaimed_" + UUID.randomUUID().toString().substring(0, 8) + "@claim.crewcanvas.internal";
        } else {
            email = email.trim().toLowerCase();
            Optional<User> existingUser = userRepository.findByEmail(email);
            if (existingUser.isPresent() && "CLAIMED".equalsIgnoreCase(existingUser.get().getClaimStatus())) {
                throw new IllegalArgumentException("An active claimed account with email " + email + " already exists.");
            }
        }

        User user = new User();
        user.setName(profileData.getName().trim());
        user.setEmail(email);
        user.setPassword(null);
        user.setPhone(profileData.getPhone() != null ? profileData.getPhone().trim() : null);
        user.setRole(profileData.getRole() != null ? profileData.getRole().trim() : "Actor");
        user.setUserType(profileData.getUserType() != null ? profileData.getUserType().trim() : "Actor");
        user.setLocation(profileData.getLocation());
        user.setBio(profileData.getBio());
        user.setSkills(profileData.getSkills());
        user.setExperience(profileData.getExperience());
        user.setProfilePicture(profileData.getProfilePicture());
        user.setShowreel(profileData.getShowreel());
        user.setPortfolioVideos(profileData.getPortfolioVideos());
        user.setRecentPictures(profileData.getRecentPictures());
        user.setHeight(profileData.getHeight());
        user.setWeight(profileData.getWeight());
        user.setAgeRange(profileData.getAgeRange());
        user.setGender(profileData.getGender());
        user.setBodyType(profileData.getBodyType());
        user.setLanguages(profileData.getLanguages());
        user.setInstagram(profileData.getInstagram());
        user.setYoutube(profileData.getYoutube());
        user.setTiktok(profileData.getTiktok());
        user.setTwitter(profileData.getTwitter());
        user.setCameraExpertise(profileData.getCameraExpertise());
        user.setEditingSoftware(profileData.getEditingSoftware());
        user.setEditingStyle(profileData.getEditingStyle());
        user.setTurnaroundTime(profileData.getTurnaroundTime());
        user.setDaws(profileData.getDaws());
        user.setInstruments(profileData.getInstruments());
        user.setSampleTracks(profileData.getSampleTracks());
        user.setGenres(profileData.getGenres());
        user.setProjectsDirected(profileData.getProjectsDirected());
        user.setBudgetHandled(profileData.getBudgetHandled());
        user.setVisionStatement(profileData.getVisionStatement());
        user.setExpectedMovieRemuneration(profileData.getExpectedMovieRemuneration());
        user.setExpectedWebseriesRemuneration(profileData.getExpectedWebseriesRemuneration());
        user.setResume(profileData.getResume());
        user.setClaimStatus("UNCLAIMED");
        user.setIsVerifiedProfessional(Boolean.TRUE.equals(profileData.getIsVerifiedProfessional()));

        User savedUser = userRepository.save(user);

        // Record audit log
        auditLogRepository.save(new ProfileClaimAuditLog(
                savedUser.getId(), null, "PROFILE_CREATED",
                "Unclaimed profile created for " + savedUser.getName() + " by Admin (ID: " + adminId + ")", adminId));

        // Generate initial claim invitation token
        Map<String, Object> invitationResult = createClaimInvitation(savedUser.getId(), savedUser.getPhone(), savedUser.getEmail(), adminId);

        Map<String, Object> response = new HashMap<>();
        response.put("profile", savedUser);
        response.put("invitation", invitationResult.get("invitation"));
        response.put("claimLink", invitationResult.get("claimLink"));
        response.put("rawToken", invitationResult.get("rawToken"));
        return response;
    }

    /**
     * Generates a new secure single-use claim invitation for a profile.
     */
    @Transactional
    public Map<String, Object> createClaimInvitation(Long profileId, String phone, String email, Long adminId) {
        User profile = userRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found with ID: " + profileId));

        if ("CLAIMED".equalsIgnoreCase(profile.getClaimStatus())) {
            throw new IllegalStateException("Profile " + profileId + " is already claimed.");
        }

        // Expire any existing active invitations for this profile
        List<ProfileClaimInvitation> existing = invitationRepository.findByProfileId(profileId);
        for (ProfileClaimInvitation inv : existing) {
            if ("UNCLAIMED".equals(inv.getStatus()) || "INVITED".equals(inv.getStatus())) {
                inv.setStatus("CANCELLED");
                invitationRepository.save(inv);
            }
        }

        String rawToken = generateSecureToken();
        String tokenHash = hashToken(rawToken);

        ProfileClaimInvitation invitation = new ProfileClaimInvitation();
        invitation.setProfileId(profileId);
        invitation.setTokenHash(tokenHash);
        invitation.setPhone(phone != null ? phone.trim() : profile.getPhone());
        invitation.setEmail(email != null ? email.trim() : profile.getEmail());
        invitation.setStatus("INVITED");
        invitation.setCreatedByAdminId(adminId);
        invitation.setCreatedAt(LocalDateTime.now());
        invitation.setSentAt(LocalDateTime.now());
        invitation.setExpiresAt(LocalDateTime.now().plusHours(expirationHours));

        ProfileClaimInvitation savedInvitation = invitationRepository.save(invitation);

        auditLogRepository.save(new ProfileClaimAuditLog(
                profileId, savedInvitation.getId(), "INVITATION_CREATED",
                "Secure claim token generated. Valid for " + expirationHours + " hours.", adminId));

        String effectiveBaseUrl = (baseUrl != null) ? baseUrl.replaceAll("(?i)krewcanvas", "crewcanvas") : "https://crewcanvas.in";
        String claimLink = effectiveBaseUrl + "/claim.html?token=" + rawToken;

        Map<String, Object> result = new HashMap<>();
        result.put("invitation", savedInvitation);
        result.put("rawToken", rawToken);
        result.put("claimLink", claimLink);
        return result;
    }

    /**
     * Validates a public claim token without completing the claim (used for page landing preview).
     */
    @Transactional
    public Map<String, Object> validateClaimToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isEmpty()) {
            throw new IllegalArgumentException("Claim token is missing.");
        }

        String tokenHash = hashToken(rawToken.trim());
        ProfileClaimInvitation invitation = invitationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired claim link. Please contact CrewCanvas for a new link."));

        if (!"UNCLAIMED".equals(invitation.getStatus()) && !"INVITED".equals(invitation.getStatus())) {
            if ("CLAIMED".equals(invitation.getStatus())) {
                throw new IllegalStateException("This profile has already been claimed.");
            } else if ("EXPIRED".equals(invitation.getStatus())) {
                throw new IllegalStateException("This claim link has expired. Please contact CrewCanvas for a new claim link.");
            } else {
                throw new IllegalStateException("This claim link is no longer valid.");
            }
        }

        if (invitation.getExpiresAt() != null && LocalDateTime.now().isAfter(invitation.getExpiresAt())) {
            invitation.setStatus("EXPIRED");
            invitationRepository.save(invitation);
            auditLogRepository.save(new ProfileClaimAuditLog(
                    invitation.getProfileId(), invitation.getId(), "INVITATION_EXPIRED",
                    "Token expired at " + invitation.getExpiresAt(), null));
            throw new IllegalStateException("This claim link has expired. Please contact CrewCanvas for a new claim link.");
        }

        User profile = userRepository.findById(invitation.getProfileId())
                .orElseThrow(() -> new IllegalArgumentException("Associated profile no longer exists."));

        if ("CLAIMED".equalsIgnoreCase(profile.getClaimStatus())) {
            invitation.setStatus("CLAIMED");
            invitationRepository.save(invitation);
            throw new IllegalStateException("This profile has already been claimed.");
        }

        // Record opened timestamp if not previously recorded
        if (invitation.getOpenedAt() == null) {
            invitation.setOpenedAt(LocalDateTime.now());
            invitationRepository.save(invitation);
            auditLogRepository.save(new ProfileClaimAuditLog(
                    invitation.getProfileId(), invitation.getId(), "INVITATION_OPENED",
                    "Claim link opened by user.", null));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("valid", true);
        response.put("profileId", profile.getId());
        response.put("actorName", profile.getName());
        response.put("role", profile.getRole());
        response.put("location", profile.getLocation());
        response.put("profilePicture", profile.getProfilePicture());
        response.put("bio", profile.getBio());
        response.put("expiresAt", invitation.getExpiresAt());
        return response;
    }

    /**
     * Executes One-Click Claim transaction.
     * Validates token, links/creates actor account, marks profile as CLAIMED, invalidates token, and returns JWT session.
     */
    @Transactional
    public Map<String, Object> completeProfileClaim(String rawToken, String actorPhone, String actorEmail, String actorName) {
        return completeProfileClaim(rawToken, actorPhone, actorEmail, actorName, null);
    }

    @Transactional
    public Map<String, Object> completeProfileClaim(String rawToken, String actorPhone, String actorEmail, String actorName, String password) {
        String tokenHash = hashToken(rawToken);
        ProfileClaimInvitation invitation = invitationRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired claim link."));

        if (!"UNCLAIMED".equals(invitation.getStatus()) && !"INVITED".equals(invitation.getStatus())) {
            throw new IllegalStateException("This claim link has already been used or is no longer valid.");
        }

        if (invitation.getExpiresAt() != null && LocalDateTime.now().isAfter(invitation.getExpiresAt())) {
            invitation.setStatus("EXPIRED");
            invitationRepository.save(invitation);
            throw new IllegalStateException("This claim link has expired.");
        }

        User profile = userRepository.findById(invitation.getProfileId())
                .orElseThrow(() -> new IllegalArgumentException("Associated profile not found."));

        if ("CLAIMED".equalsIgnoreCase(profile.getClaimStatus())) {
            invitation.setStatus("CLAIMED");
            invitationRepository.save(invitation);
            throw new IllegalStateException("This profile has already been claimed.");
        }

        // Check duplicate account by phone/email if provided
        String finalEmail = (actorEmail != null && !actorEmail.trim().isEmpty()) ? actorEmail.trim().toLowerCase() : profile.getEmail();
        if (finalEmail != null && finalEmail.contains("@claim.crewcanvas.internal")) {
            finalEmail = "actor_" + profile.getId() + "_" + UUID.randomUUID().toString().substring(0, 6) + "@crewcanvas.in";
        }

        // Update profile fields to claimed state
        if (actorName != null && !actorName.trim().isEmpty()) {
            profile.setName(actorName.trim());
        }
        profile.setEmail(finalEmail);
        if (actorPhone != null && !actorPhone.trim().isEmpty()) {
            profile.setPhone(actorPhone.trim());
        }
        if (password != null && !password.trim().isEmpty()) {
            profile.setPassword(passwordEncoder.encode(password.trim()));
        }
        profile.setClaimStatus("CLAIMED");
        profile.setLastLogin(LocalDateTime.now());

        User claimedUser = userRepository.save(profile);

        // Mark invitation as claimed
        invitation.setStatus("CLAIMED");
        invitation.setClaimedAt(LocalDateTime.now());
        invitation.setClaimedByUserId(claimedUser.getId());
        invitationRepository.save(invitation);

        // Record audit log
        auditLogRepository.save(new ProfileClaimAuditLog(
                claimedUser.getId(), invitation.getId(), "CLAIM_SUCCESSFUL",
                "Profile successfully claimed by " + claimedUser.getName() + " (Email: " + claimedUser.getEmail() + ")", claimedUser.getId()));

        // Generate JWT session token
        String jwtToken = tokenProvider.generateToken(
                claimedUser.getEmail(),
                claimedUser.getId(),
                claimedUser.getName(),
                Boolean.TRUE.equals(claimedUser.getIsAdmin()));
        claimedUser.setToken(jwtToken);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Profile claimed successfully!");
        response.put("user", claimedUser);
        response.put("token", jwtToken);
        response.put("profileUrl", "/edit-profile.html");
        return response;
    }

    /**
     * Resends a claim invitation to an actor.
     */
    @Transactional
    public Map<String, Object> resendClaimInvitation(Long profileId, String channel, Long adminId) {
        User profile = userRepository.findById(profileId)
                .orElseThrow(() -> new IllegalArgumentException("Profile not found: " + profileId));

        if ("CLAIMED".equalsIgnoreCase(profile.getClaimStatus())) {
            throw new IllegalStateException("Profile is already claimed.");
        }

        Map<String, Object> newInvitationResult = createClaimInvitation(profileId, profile.getPhone(), profile.getEmail(), adminId);
        String claimLink = (String) newInvitationResult.get("claimLink");

        auditLogRepository.save(new ProfileClaimAuditLog(
                profileId, ((ProfileClaimInvitation) newInvitationResult.get("invitation")).getId(),
                "INVITATION_RESENT", "Claim link resent via " + (channel != null ? channel : "Direct Link") + ".", adminId));

        if ("WHATSAPP".equalsIgnoreCase(channel) && profile.getPhone() != null) {
            try {
                whatsAppService.sendWelcomeWhatsApp(profile.getPhone(), profile.getName());
            } catch (Exception e) {
                logger.warn("WhatsApp dispatch warning: {}", e.getMessage());
            }
        } else if ("EMAIL".equalsIgnoreCase(channel) && profile.getEmail() != null && !profile.getEmail().endsWith("@claim.crewcanvas.internal")) {
            try {
                emailService.sendWelcomeEmail(profile.getEmail(), profile.getName(), claimLink);
            } catch (Exception e) {
                logger.warn("Email dispatch warning: {}", e.getMessage());
            }
        }

        return newInvitationResult;
    }

    /**
     * Returns claim metrics & conversion statistics for admin portal.
     */
    public Map<String, Object> getClaimMetrics() {
        long totalProfiles = userRepository.count();
        long unclaimedCount = userRepository.countByClaimStatus("UNCLAIMED");
        long claimedCount = userRepository.countByClaimStatus("CLAIMED");
        long invitedCount = invitationRepository.countByStatus("INVITED");
        long expiredCount = invitationRepository.countByStatus("EXPIRED");

        double conversionRate = (invitedCount + claimedCount > 0) ? ((double) claimedCount / (invitedCount + claimedCount)) * 100.0 : 0.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalProfiles", totalProfiles);
        metrics.put("unclaimedCount", unclaimedCount);
        metrics.put("invitedCount", invitedCount);
        metrics.put("claimedCount", claimedCount);
        metrics.put("expiredCount", expiredCount);
        metrics.put("conversionRate", Math.round(conversionRate * 10.0) / 10.0);
        return metrics;
    }

    /**
     * Returns audit activity logs for a profile.
     */
    public List<ProfileClaimAuditLog> getAuditLogs(Long profileId) {
        return auditLogRepository.findByProfileIdOrderByCreatedAtDesc(profileId);
    }

    /**
     * Returns all unclaimed and invited profiles for admin list view.
     */
    public List<User> getUnclaimedProfiles(String statusFilter) {
        if (statusFilter != null && !statusFilter.trim().isEmpty() && !"ALL".equalsIgnoreCase(statusFilter)) {
            return userRepository.findByClaimStatus(statusFilter.toUpperCase());
        }
        List<User> unclaimed = userRepository.findByClaimStatus("UNCLAIMED");
        List<User> invited = userRepository.findByClaimStatus("INVITED");
        List<User> result = new ArrayList<>(unclaimed);
        result.addAll(invited);
        return result;
    }
}
