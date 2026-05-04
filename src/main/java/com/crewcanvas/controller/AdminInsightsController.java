package com.crewcanvas.controller;

import com.crewcanvas.model.User;
import com.crewcanvas.service.UserService;
import com.crewcanvas.repository.UserRepository;
import com.crewcanvas.repository.PostRepository;
import com.crewcanvas.repository.EventRepository;
import com.crewcanvas.repository.EventApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/insights")
@CrossOrigin(origins = "*")
public class AdminInsightsController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventApplicationRepository eventApplicationRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getInsights(@RequestParam Long adminId) {
        // Security check
        User admin = userRepository.findById(adminId).orElse(null);
        if (admin == null || !Boolean.TRUE.equals(admin.getIsAdmin())) {
            return ResponseEntity.status(403).body("Access denied. Admin only.");
        }

        LocalDateTime last24h = LocalDateTime.now().minusHours(24);
        java.time.Instant last24hInstant = java.time.Instant.now().minus(24, java.time.temporal.ChronoUnit.HOURS);

        long newRegistrations = userRepository.countByCreatedAtAfter(last24h);
        long totalUsers = userRepository.count();

        // Feed Engagement
        long newPosts = postRepository.countByCreatedAtAfter(last24hInstant);
        long newLikes = postRepository.sumLikesByCreatedAtAfter(last24hInstant);
        long newComments = postRepository.sumCommentsByCreatedAtAfter(last24hInstant);

        // Event Activity
        long newEvents = eventRepository.countByCreatedAtAfter(last24hInstant);
        long newApplications = eventApplicationRepository.countByAppliedAtAfter(last24h);

        // Profile Completion Distribution
        Map<String, Long> distribution = new HashMap<>();
        distribution.put("0-25", userRepository.countByProfileScoreBetween(0, 25));
        distribution.put("26-50", userRepository.countByProfileScoreBetween(26, 50));
        distribution.put("51-75", userRepository.countByProfileScoreBetween(51, 75));
        distribution.put("76-100", userRepository.countByProfileScoreBetween(76, 100));

        Map<String, Object> response = new HashMap<>();
        response.put("newRegistrations24h", newRegistrations);
        response.put("totalUsers", totalUsers);
        response.put("profileDistribution", distribution);
        response.put("recentSignups", userRepository.findRecentSignups(last24h));
        
        response.put("newPosts24h", newPosts);
        response.put("newLikes24h", newLikes);
        response.put("newComments24h", newComments);
        response.put("newEvents24h", newEvents);
        response.put("newApplications24h", newApplications);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/sync-follows")
    public ResponseEntity<?> syncFollows(@RequestParam Long adminId) {
        // Security check
        User admin = userRepository.findById(adminId).orElse(null);
        if (admin == null || (!Boolean.TRUE.equals(admin.getIsAdmin()) && !"crewcanvas2@gmail.com".equalsIgnoreCase(admin.getEmail()))) {
            return ResponseEntity.status(403).body("Access denied. Admin only.");
        }

        try {
            int count = userService.syncExistingUsersToFollowAdmin();
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Successfully synced follows.");
            response.put("newFollowersCount", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Sync failed: " + e.getMessage());
        }
    }
}
