package com.crewcanvas.controller;

import com.crewcanvas.config.UserPrincipal;
import com.crewcanvas.model.ProfileClaimAuditLog;
import com.crewcanvas.model.User;
import com.crewcanvas.service.ProfileClaimService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
public class ProfileClaimController {

    @Autowired
    private ProfileClaimService profileClaimService;

    /**
     * Admin: Create an unclaimed professional profile.
     */
    @PostMapping("/api/admin/profile-claims/create")
    public ResponseEntity<?> createUnclaimedProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody User profileData) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }
        if (!principal.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin privileges required.");
        }

        try {
            Map<String, Object> result = profileClaimService.createUnclaimedProfile(profileData, principal.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create unclaimed profile: " + e.getMessage());
        }
    }

    /**
     * Admin: List unclaimed / invited / claimed profiles.
     */
    @GetMapping("/api/admin/profile-claims")
    public ResponseEntity<?> listUnclaimedProfiles(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "status", required = false, defaultValue = "ALL") String status) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }
        if (!principal.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin privileges required.");
        }

        try {
            List<User> profiles = profileClaimService.getUnclaimedProfiles(status);
            return ResponseEntity.ok(profiles);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving profiles: " + e.getMessage());
        }
    }

    /**
     * Admin: Generate & send claim link.
     */
    @PostMapping("/api/admin/profile-claims/{profileId}/invite")
    public ResponseEntity<?> sendClaimInvitation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long profileId,
            @RequestBody(required = false) Map<String, String> payload) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }
        if (!principal.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin privileges required.");
        }

        try {
            String phone = payload != null ? payload.get("phone") : null;
            String email = payload != null ? payload.get("email") : null;
            Map<String, Object> result = profileClaimService.createClaimInvitation(profileId, phone, email, principal.getId());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to generate invitation: " + e.getMessage());
        }
    }

    /**
     * Admin: Resend claim link.
     */
    @PostMapping("/api/admin/profile-claims/{profileId}/resend")
    public ResponseEntity<?> resendClaimInvitation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long profileId,
            @RequestBody(required = false) Map<String, String> payload) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }
        if (!principal.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin privileges required.");
        }

        try {
            String channel = payload != null ? payload.get("channel") : "LINK";
            Map<String, Object> result = profileClaimService.resendClaimInvitation(profileId, channel, principal.getId());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to resend invitation: " + e.getMessage());
        }
    }

    /**
     * Admin: Get claim analytics metrics.
     */
    @GetMapping("/api/admin/profile-claims/metrics")
    public ResponseEntity<?> getClaimMetrics(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }
        if (!principal.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin privileges required.");
        }

        try {
            Map<String, Object> metrics = profileClaimService.getClaimMetrics();
            return ResponseEntity.ok(metrics);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error calculating metrics: " + e.getMessage());
        }
    }

    /**
     * Admin: Get audit logs for a profile.
     */
    @GetMapping("/api/admin/profile-claims/{profileId}/activity")
    public ResponseEntity<?> getProfileActivity(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long profileId) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication required.");
        }
        if (!principal.isAdmin()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Admin privileges required.");
        }

        try {
            List<ProfileClaimAuditLog> logs = profileClaimService.getAuditLogs(profileId);
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving audit logs: " + e.getMessage());
        }
    }

    /**
     * Public: Validate claim token & preview profile name/craft on landing page.
     */
    @GetMapping("/api/claim/{token}")
    public ResponseEntity<?> validateClaimToken(@PathVariable String token) {
        try {
            Map<String, Object> preview = profileClaimService.validateClaimToken(token);
            return ResponseEntity.ok(preview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.GONE).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error validating claim link."));
        }
    }

    /**
     * Public: Execute 1-Click Claim.
     */
    @PostMapping("/api/claim/{token}/complete")
    public ResponseEntity<?> completeClaim(
            @PathVariable String token,
            @RequestBody(required = false) Map<String, String> payload) {
        try {
            String phone = payload != null ? payload.get("phone") : null;
            String email = payload != null ? payload.get("email") : null;
            String name = payload != null ? payload.get("name") : null;
            String password = payload != null ? payload.get("password") : null;

            Map<String, Object> result = profileClaimService.completeProfileClaim(token, phone, email, name, password);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Claim failed: " + e.getMessage()));
        }
    }
}
