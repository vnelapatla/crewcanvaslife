package com.crewcanvas.controller;

import com.crewcanvas.model.Event;
import com.crewcanvas.model.EventApplication;
import com.crewcanvas.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import jakarta.persistence.PersistenceContext;
import com.crewcanvas.model.User;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "*")
public class EventController {

    @Autowired
    private EventService eventService;

    @Autowired
    private com.crewcanvas.service.UserService userService;

    @PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    private void maskSensitiveData(EventApplication app, Long viewerId, Long eventOwnerId, boolean isAdmin) {
        if (app == null) return;
        
        // Authorization check: If viewer is the applicant, the event creator, or a global admin, do NOT mask.
        boolean isOwner = viewerId != null && viewerId.equals(app.getUserId());
        boolean isEventCreator = viewerId != null && viewerId.equals(eventOwnerId);
        
        if (isOwner || isEventCreator || isAdmin) {
            return; // Authorized - show full data
        }

        // Unauthorized view - apply masking
        // Detach to prevent persistence of masked data back to the database
        if (entityManager.contains(app)) {
            entityManager.detach(app);
        }
        
        // Mask Phone: Only show last 2 digits
        String phone = app.getMobileNumber();
        if (phone != null && phone.length() > 2) {
            app.setMobileNumber("X".repeat(phone.length() - 2) + phone.substring(phone.length() - 2));
        } else if (phone != null) {
            app.setMobileNumber("XX");
        }
    }

    @PostMapping
    public ResponseEntity<?> createEvent(@RequestBody Event event) {
        try {
            Event createdEvent = eventService.createEvent(event);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdEvent);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating event: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllEvents(@RequestParam(required = false) String type) {
        try {
            List<Event> events;
            if (type != null && !type.isEmpty()) {
                events = eventService.getEventsByType(type);
            } else {
                events = eventService.getAllEvents();
            }
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEvent(@PathVariable Long id) {
        try {
            Optional<Event> event = eventService.getEventById(id);
            if (event.isPresent()) {
                return ResponseEntity.ok(event.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Event not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserEvents(@PathVariable Long userId) {
        try {
            List<Event> events = eventService.getUserEvents(userId);
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(@PathVariable Long id, @RequestBody Event event) {
        try {
            Event updatedEvent = eventService.updateEvent(id, event);
            return ResponseEntity.ok(updatedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        try {
            eventService.deleteEvent(id);
            return ResponseEntity.ok("Event deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/apply")
    public ResponseEntity<?> applyToEvent(@PathVariable Long id, @RequestParam Long userId, @RequestBody(required = false) EventApplication applicationDetails) {
        try {
            Event event = eventService.applyToEvent(id, userId, applicationDetails);
            return ResponseEntity.ok(event);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/applications/user/{userId}")
    public ResponseEntity<?> getUserApplications(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(eventService.getUserApplications(userId));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/applicants")
    public ResponseEntity<?> getEventApplicants(@PathVariable("id") Long id, @RequestParam(required = false) Long viewerId) {
        try {
            List<com.crewcanvas.model.EventApplication> applicants = eventService.getApplicantsForEvent(id);
            
            // Fetch event info once to identify creator
            Long eventOwnerId = eventService.getEventById(id).map(Event::getUserId).orElse(null);
            
            // Check if viewer is a global admin once
            boolean isGlobalAdmin = viewerId != null && userService.findById(viewerId)
                .map(u -> Boolean.TRUE.equals(u.getIsAdmin()) || "crewcanvas2@gmail.com".equalsIgnoreCase(u.getEmail()))
                .orElse(false);
            
            applicants.forEach(app -> maskSensitiveData(app, viewerId, eventOwnerId, isGlobalAdmin));
            return ResponseEntity.ok(applicants);
        } catch (Exception e) {
            System.err.println("Error fetching applicants for event " + id + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PatchMapping("/applications/{applicationId}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long applicationId, @RequestParam String status) {
        try {
            return ResponseEntity.ok(eventService.updateApplicationStatus(applicationId, status));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/pass/{token}")
    public ResponseEntity<?> getPassDetails(@PathVariable String token) {
        return eventService.getApplicationByToken(token)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping("/pass/validate")
    public ResponseEntity<?> validatePass(@RequestParam String token) {
        try {
            System.out.println("Attempting to validate pass token: " + token);
            EventApplication app = eventService.validatePass(token);
            return ResponseEntity.ok(app);
        } catch (RuntimeException e) {
            System.err.println("Validation Business Error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR validating pass: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Internal Server Error: " + e.getMessage());
        }
    }

    @GetMapping("/all-applicants")
    public ResponseEntity<?> getAllApplicantsForUser(@RequestParam Long userId) {
        try {
            List<EventApplication> applicants = eventService.getAllApplicantsForUser(userId);
            // In this endpoint, the viewer is the event owner (userId)
            // We can assume isGlobalAdmin is not needed if the viewer is already verified as the owner of these events
            // But to be safe, let's fetch it once
            boolean isGlobalAdmin = userId != null && userService.findById(userId)
                .map(u -> Boolean.TRUE.equals(u.getIsAdmin()) || "crewcanvas2@gmail.com".equalsIgnoreCase(u.getEmail()))
                .orElse(false);
                
            applicants.forEach(app -> maskSensitiveData(app, userId, userId, isGlobalAdmin));
            return ResponseEntity.ok(applicants);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/broadcast")
    public ResponseEntity<?> broadcastUpdate(@PathVariable Long id, @RequestBody java.util.Map<String, String> details) {
        try {
            eventService.broadcastEventDetails(id, details.get("location"), details.get("time"), details.get("date"));
            return ResponseEntity.ok("Broadcast sent successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
    @GetMapping("/user-applications/latest")
    public ResponseEntity<?> getLatestApplicationForUser(@RequestParam Long userId, @RequestParam(required = false) Long viewerId) {
        try {
            Optional<EventApplication> appOpt = eventService.getLatestApplicationForUser(userId);
            if (appOpt.isPresent()) {
                EventApplication app = appOpt.get();
                // For this specific app, fetch its event info once
                Long eventOwnerId = eventService.getEventById(app.getEventId()).map(Event::getUserId).orElse(null);
                boolean isGlobalAdmin = viewerId != null && userService.findById(viewerId)
                    .map(u -> Boolean.TRUE.equals(u.getIsAdmin()) || "crewcanvas2@gmail.com".equalsIgnoreCase(u.getEmail()))
                    .orElse(false);
                
                maskSensitiveData(app, viewerId, eventOwnerId, isGlobalAdmin);
                return ResponseEntity.ok(app);
            }
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
    @PostMapping("/sync-counts")
    public ResponseEntity<?> syncCounts() {
        try {
            eventService.syncApplicantsCount();
            return ResponseEntity.ok("Applicant counts synchronized successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error syncing counts: " + e.getMessage());
        }
    }
}
