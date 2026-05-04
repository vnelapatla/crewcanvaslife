package com.crewcanvas.controller;

import com.crewcanvas.model.User;
import com.crewcanvas.service.ConnectionService;
import com.crewcanvas.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import jakarta.persistence.PersistenceContext;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    @Autowired
    private UserService userService;

    @Autowired
    private ConnectionService connectionService;

    @PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private void maskSensitiveData(User user, Long viewerId) {
        if (user == null) return;
        
        boolean isOwner = viewerId != null && viewerId.equals(user.getId());
        boolean isAdmin = viewerId != null && userService.findById(viewerId).map(User::getIsAdmin).orElse(false);
        
        if (!isOwner && !isAdmin) {
            // Detach to prevent persistence of masked data
            entityManager.detach(user);
            
            // Mask Phone: Only last 2 digits
            String phone = user.getPhone();
            if (phone != null && phone.length() > 2) {
                user.setPhone("X".repeat(phone.length() - 2) + phone.substring(phone.length() - 2));
            } else if (phone != null) {
                user.setPhone("XX");
            }
        }
    }

    @GetMapping("/onboarding-data/{id}")
    public ResponseEntity<?> getOnboardingData(@PathVariable Long id, @RequestParam(required = false) Long viewerId) {
        try {
            Optional<User> userOpt = userService.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String visibility = user.getProfileVisibility();
                
                boolean allowed = false;
                if (visibility == null || visibility.equals("Everyone")) {
                    allowed = true;
                } else if (visibility.equals("Private")) {
                    allowed = viewerId != null && (viewerId.equals(id) || userService.findById(viewerId).map(User::getIsAdmin).orElse(false));
                } else if (visibility.equals("Connections Only")) {
                    if (viewerId != null) {
                        if (viewerId.equals(id) || userService.findById(viewerId).map(User::getIsAdmin).orElse(false)) {
                            allowed = true;
                        } else {
                            allowed = connectionService.getFollowing(id).stream().anyMatch(u -> u.getId().equals(viewerId)) ||
                                      connectionService.getFollowers(id).stream().anyMatch(u -> u.getId().equals(viewerId));
                        }
                    }
                }
                
                if (!allowed) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This profile is not visible to you.");
                }

                Map<String, Object> data = new java.util.HashMap<>();
                maskSensitiveData(user, viewerId);
                data.put("user", user);
                data.put("following", connectionService.getFollowing(id));
                data.put("followers", connectionService.getFollowers(id));
                return ResponseEntity.ok(data);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Long id, @RequestParam(required = false) Long viewerId) {
        try {
            Optional<User> userOpt = userService.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                String visibility = user.getProfileVisibility();
                
                // If visibility is Everyone, anyone can view
                if (visibility == null || visibility.equals("Everyone")) {
                    maskSensitiveData(user, viewerId);
                    return ResponseEntity.ok(user);
                }
                
                // If visibility is Private, only the user themselves or an admin can view
                if (visibility.equals("Private")) {
                    if (viewerId != null && (viewerId.equals(id) || userService.findById(viewerId).map(User::getIsAdmin).orElse(false))) {
                        maskSensitiveData(user, viewerId);
                        return ResponseEntity.ok(user);
                    }
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This profile is private.");
                }
                
                // If visibility is Connections Only
                if (visibility.equals("Connections Only")) {
                    if (viewerId != null) {
                        if (viewerId.equals(id) || userService.findById(viewerId).map(User::getIsAdmin).orElse(false)) {
                            maskSensitiveData(user, viewerId);
                            return ResponseEntity.ok(user);
                        }
                        // Check connection
                        boolean isConnected = connectionService.getFollowing(id).stream().anyMatch(u -> u.getId().equals(viewerId)) ||
                                            connectionService.getFollowers(id).stream().anyMatch(u -> u.getId().equals(viewerId));
                        if (isConnected) {
                            maskSensitiveData(user, viewerId);
                            return ResponseEntity.ok(user);
                        }
                    }
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body("This profile is only visible to connections.");
                }
                
                return ResponseEntity.ok(user); // Fallback
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("User not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to load profile. Please try again later.");
        }
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody User updatedUser) {
        try {
            User user = userService.updateProfile(updatedUser);
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("We couldn't update your profile. Please check your connection and try again.");
        }
    }
    
    @PostMapping("/{id}/password")
    public ResponseEntity<?> updatePassword(@PathVariable("id") Long id, @RequestBody Map<String, String> payload) {
        try {
            String newPassword = payload.get("newPassword");
            if (newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body("New password is required");
            }
            
            Optional<User> userOptional = userService.findById(id);
            if (userOptional.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
            }
            
            userService.changeUserPassword(userOptional.get(), newPassword);
            return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to update password.");
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchUsers(@RequestParam(required = false) String query,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Long currentUserId,
            @RequestParam(defaultValue = "false") boolean excludeFollowed,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        try {
            org.springframework.data.domain.Page<User> userPage = userService.searchUsers(query, role, location, currentUserId, excludeFollowed, page, size);
            
            // SECURITY: Only admins see profile completion percentage
            boolean isAdmin = currentUserId != null && userService.findById(currentUserId).map(User::getIsAdmin).orElse(false);
            if (!isAdmin) {
                // Clear profile score for non-admins to prevent them from seeing it in API response
                userPage.getContent().forEach(u -> u.setProfileScore(null));
            }
            
            // Mask sensitive data for search results
            userPage.getContent().forEach(u -> maskSensitiveData(u, currentUserId));
            
            return ResponseEntity.ok(userPage);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Search service is temporarily unavailable.");
        }
    }

    @GetMapping("/top")
    public ResponseEntity<?> getTopUsers(@RequestParam(required = false) Long viewerId) {
        try {
            List<User> users = userService.getTopUsers();
            users.forEach(u -> maskSensitiveData(u, viewerId));
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/phone")
    public ResponseEntity<?> getFullPhoneNumber(@PathVariable("id") Long id, @RequestParam("code") String code) {
        try {
            System.out.println("Phone Unlock Attempt: ProfileID=" + id + ", Code=" + code);
            if ("FREE".equalsIgnoreCase(code)) {
                Optional<User> userOpt = userService.findById(id);
                if (userOpt.isPresent()) {
                    String phone = userOpt.get().getPhone();
                    System.out.println("Phone Unlock Success: Returning " + (phone != null ? (phone.length() > 4 ? "..." + phone.substring(phone.length()-4) : phone) : "null"));
                    java.util.Map<String, String> response = new java.util.HashMap<>();
                    response.put("phone", phone != null && !phone.trim().isEmpty() ? phone : "Data Not Available");
                    return ResponseEntity.ok(response);
                } else {
                    System.out.println("Phone Unlock Failed: User " + id + " not found");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
                }
            }
            System.out.println("Phone Unlock Failed: Invalid Code " + code);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Invalid access code");
        } catch (Exception e) {
            System.err.println("Phone Unlock Critical Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/sync-all")
    public ResponseEntity<?> syncAllCounts() {
        try {
            connectionService.syncAllUserCounts();
            return ResponseEntity.ok("All follower/following counts synchronized successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Sync failed: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<?> followUser(@PathVariable Long id, @RequestParam Long followerId) {
        try {
            connectionService.followUser(followerId, id);
            return ResponseEntity.ok("Successfully followed user");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to follow user at this time.");
        }
    }

    @DeleteMapping("/{id}/unfollow")
    public ResponseEntity<?> unfollowUser(@PathVariable Long id, @RequestParam Long followerId) {
        try {
            connectionService.unfollowUser(followerId, id);
            return ResponseEntity.ok("Successfully unfollowed user");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to unfollow user at this time.");
        }
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<?> getFollowers(@PathVariable Long id) {
        try {
            List<User> followers = connectionService.getFollowers(id);
            return ResponseEntity.ok(followers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<?> getFollowing(@PathVariable Long id) {
        try {
            List<User> following = connectionService.getFollowing(id);
            return ResponseEntity.ok(following);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok("Account deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting account: " + e.getMessage());
        }
    }
}
