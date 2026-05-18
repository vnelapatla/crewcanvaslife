package com.crewcanvas.controller;

import com.crewcanvas.model.User;
import com.crewcanvas.service.UserService;
import com.crewcanvas.repository.UserRepository;
import com.crewcanvas.repository.PostRepository;
import com.crewcanvas.repository.EventRepository;
import com.crewcanvas.repository.EventApplicationRepository;
import com.crewcanvas.repository.SiteMetricRepository;
import com.crewcanvas.model.SiteMetric;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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

    @Autowired
    private SiteMetricRepository metricRepository;

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
        
        // LIMIT signups to top 10 to save memory on busy servers
        response.put("recentSignups", userRepository.findTop10RecentSignups(last24h));
        
        response.put("newPosts24h", newPosts);
        response.put("newLikes24h", newLikes);
        response.put("newComments24h", newComments);
        response.put("newEvents24h", newEvents);
        response.put("newApplications24h", newApplications);

        // Traffic & Income
        long dailyHits = metricRepository.findById(LocalDate.now())
                .map(SiteMetric::getPageViews).orElse(0L);
                
        long lastWeekHits = metricRepository.sumPageViewsSince(LocalDate.now().minusDays(7));
        long last3MonthsHits = metricRepository.sumPageViewsSince(LocalDate.now().minusMonths(3));
        long lifetimeHits = metricRepository.sumTotalPageViews();
        
        // Assume avg session duration is ~3.5 minutes per hit for total hours calculation
        double totalHoursSpent = (lifetimeHits * 3.5) / 60.0;
        
        // Method 1: View-Based (CPM - ₹35/1000 views) based on 30-day avg
        long last30DaysHits = metricRepository.sumPageViewsSince(LocalDate.now().minusDays(30));
        double estMonthlyIncome = (last30DaysHits * 35.0) / 1000.0;
        
        // Method 2: Click-Based (CTR 1%, CPC ₹12)
        double estClickMonthlyIncome = (last30DaysHits * 0.01 * 12.0);

        response.put("dailyHits", dailyHits);
        response.put("lastWeekHits", lastWeekHits);
        response.put("last3MonthsHits", last3MonthsHits);
        response.put("lifetimeHits", lifetimeHits);
        response.put("totalHoursSpent", totalHoursSpent);
        response.put("estMonthlyIncome", estMonthlyIncome);
        response.put("estClickMonthlyIncome", estClickMonthlyIncome);

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
