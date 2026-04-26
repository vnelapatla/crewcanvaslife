
package com.crewcanvas.controller;

import com.crewcanvas.model.User;
import com.crewcanvas.service.UserService;
import com.crewcanvas.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.crewcanvas.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import java.util.Collections;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Value("${google.client.id}")
    private String googleClientId;

    @Autowired
    private EmailService emailService;

    @PostMapping({"/google", "/app/google"})
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> payload) {
        try {
            String idTokenString = payload.get("credential");
            
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken != null) {
                GoogleIdToken.Payload googlePayload = idToken.getPayload();

                // Get user information from payload
                String email = googlePayload.getEmail();
                String name = (String) googlePayload.get("name");
                String googleId = googlePayload.getSubject();
                String pictureUrl = (String) googlePayload.get("picture");

                // Find or create user
                Optional<User> existingUser = userService.findByEmail(email);
                User user;
                
                if (existingUser.isPresent()) {
                    user = existingUser.get();
                    // Update google ID if not set
                    if (user.getGoogleId() == null) {
                        user.setGoogleId(googleId);
                        userService.updateProfile(user);
                    }
                } else {
                    // Create new user for Google login
                    user = new User();
                    user.setEmail(email);
                    user.setName(name);
                    user.setGoogleId(googleId);
                    user.setProfilePicture(pictureUrl);
                    // Save directly via repository or a new service method
                    user = userRepository.save(user);
                }

                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid ID token.");
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error during Google authentication: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {


            Optional<User> user = userService.loginUser(request.getEmail(), request.getPassword());

            if (user.isPresent()) {
                return ResponseEntity.ok(user.get());
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Invalid email or password");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Login failed: " + e.getMessage());
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            User user = userService.registerUser(
                    request.getName(),
                    request.getEmail(),
                    request.getPassword());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(user);
        } catch (RuntimeException e) {
            // Specific handling for business logic errors like "Email Already Exists"
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        } catch (Exception e) {
            // Fallback for real system errors (DB down, etc.)
            System.err.println("[PRODUCTION_ERROR]: Unhandled exception during signup");
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Signup failed: Something went wrong on our end. Please try again later.");
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body("Email is required");
        }
        
        Optional<User> userOptional = userService.findByEmail(email);

        if (userOptional.isPresent()) {
            User user = userOptional.get();
            String token = java.util.UUID.randomUUID().toString();
            userService.createPasswordResetTokenForUser(user, token);
            
            // Link to the frontend reset page
            String resetLink = "https://crewcanvas.in/reset-password.html?token=" + token;
            try {
                emailService.sendResetPasswordEmail(user.getEmail(), resetLink);
            } catch (Exception e) {
                e.printStackTrace();
                // We still return 200 for security, but log the error
            }
        }

        // Always return OK to prevent email enumeration
        return ResponseEntity.ok(Map.of("message", "If an account with this email exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload) {
        String token = payload.get("token");
        String newPassword = payload.get("newPassword");

        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body("Token and new password are required");
        }

        Optional<User> userOptional = userService.getUserByPasswordResetToken(token);
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired token.");
        }

        userService.changeUserPassword(userOptional.get(), newPassword);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully."));
    }
}

// Request DTOs
class LoginRequest {
    private String email;
    private String password;

    // Getters and setters
    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

class SignupRequest {
    private String name;
    private String email;
    private String password;

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
