package com.crewcanvas.service;

import com.crewcanvas.model.Event;
import com.crewcanvas.model.EventApplication;
import com.crewcanvas.repository.EventApplicationRepository;
import com.crewcanvas.repository.EventRepository;
import com.crewcanvas.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Collections;
import java.util.Comparator;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import com.crewcanvas.model.User;
import com.crewcanvas.model.Message;
import com.crewcanvas.repository.MessageRepository;
import com.crewcanvas.service.NotificationService;
import com.crewcanvas.service.EmailService;
import com.crewcanvas.service.UserService;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    @Autowired
    private MessageRepository messageRepository;

    public Event createEvent(Event event) {
        return eventRepository.save(event);
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByDateDesc();
    }

    public List<Event> getUserEvents(Long userId) {
        return eventRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Event> getEventsByType(String eventType) {
        return eventRepository.findByEventTypeOrderByDateDesc(eventType);
    }

    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    public Event updateEvent(Long id, Event updatedEvent) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isPresent()) {
            Event event = eventOpt.get();
            if (updatedEvent.getTitle() != null)
                event.setTitle(updatedEvent.getTitle());
            if (updatedEvent.getDescription() != null)
                event.setDescription(updatedEvent.getDescription());
            if (updatedEvent.getEventType() != null)
                event.setEventType(updatedEvent.getEventType());
            if (updatedEvent.getLocation() != null)
                event.setLocation(updatedEvent.getLocation());
            if (updatedEvent.getDate() != null)
                event.setDate(updatedEvent.getDate());
            if (updatedEvent.getTime() != null)
                event.setTime(updatedEvent.getTime());
            if (updatedEvent.getTimeDuration() != null)
                event.setTimeDuration(updatedEvent.getTimeDuration());
            if (updatedEvent.getRequirements() != null)
                event.setRequirements(updatedEvent.getRequirements());
            if (updatedEvent.getContactInfo() != null)
                event.setContactInfo(updatedEvent.getContactInfo());
            if (updatedEvent.getImageUrl() != null)
                event.setImageUrl(updatedEvent.getImageUrl());
            if (updatedEvent.getCapacity() != null)
                event.setCapacity(updatedEvent.getCapacity());
            if (updatedEvent.getPrice() != null)
                event.setPrice(updatedEvent.getPrice());
            if (updatedEvent.getOrgName() != null)
                event.setOrgName(updatedEvent.getOrgName());
            if (updatedEvent.getOrgPhone() != null)
                event.setOrgPhone(updatedEvent.getOrgPhone());
            if (updatedEvent.getOrgEmail() != null)
                event.setOrgEmail(updatedEvent.getOrgEmail());
            if (updatedEvent.getSkills() != null)
                event.setSkills(updatedEvent.getSkills());
            if (updatedEvent.getEndDate() != null)
                event.setEndDate(updatedEvent.getEndDate());
            if (updatedEvent.getStatus() != null)
                event.setStatus(updatedEvent.getStatus());
            return eventRepository.save(event);
        }
        throw new RuntimeException("Event not found");
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteEvent(Long id) {
        applicationRepository.deleteByEventId(id);
        eventRepository.deleteById(id);
    }

    public Event applyToEvent(Long id, Long userId) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isPresent()) {
            Event event = eventOpt.get();
            
            // Check if audition is closed
            if ("CLOSED".equalsIgnoreCase(event.getStatus())) {
                throw new RuntimeException("AUDITION_CLOSED");
            }
            
            // Check if already applied
            Optional<EventApplication> existing = applicationRepository.findByEventIdAndUserId(id, userId);
            if (existing.isPresent()) {
                return event;
            }

            // Create application
            EventApplication application = new EventApplication(id, userId);
            
            // Populate user details for management
            userRepository.findById(userId).ifPresent(user -> {
                application.setApplicantName(user.getName());
                application.setApplicantEmail(user.getEmail());
                application.setRole(user.getRole());
                application.setLocation(user.getLocation());
                application.setExperience(user.getBio()); // Using bio as experience summary
            });
            
            // Populate event details
            application.setEventTitle(event.getTitle());
            application.setEventType(event.getEventType());
            application.setEventLocation(event.getLocation());
            application.setEventDate(event.getDate() != null ? event.getDate().toString() : "");

            // AUTO-SHORTLIST FOR FILM EVENTS
            if ("Film Event".equalsIgnoreCase(event.getEventType())) {
                application.setStatus("SHORTLISTED");
                // Generate pass token immediately
                String token = "PASS-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + System.currentTimeMillis();
                application.setPassToken(token);
                
                // Trigger Message and Email for auto-shortlist
                triggerShortlistNotifications(application);
            }

            applicationRepository.save(application);

            // Increment count
            event.setApplicants(event.getApplicants() + 1);
            Event savedEvent = eventRepository.save(event);

            // Trigger Notification to Event Owner
            if (event.getUserId() != null && !event.getUserId().equals(userId)) {
                notificationService.createNotification(
                    event.getUserId(),
                    userId,
                    "APPLICATION",
                    "applied to your event: " + event.getTitle(),
                    event.getId().toString()
                );
            }

            // Trigger Notification to Applicant for Film Event (Instant Pass)
            if ("Film Event".equalsIgnoreCase(event.getEventType())) {
                notificationService.createNotification(
                    userId,
                    null,
                    "SHORTLIST",
                    "Registration successful! Your Entry Pass for " + event.getTitle() + " is now available.",
                    event.getId().toString()
                );
            }

            return savedEvent;
        }
        throw new RuntimeException("Event not found");
    }

    public List<EventApplication> getUserApplications(Long userId) {
        List<EventApplication> apps = applicationRepository.findByUserId(userId);
        // Fallback for old apps missing title/type or pass tokens
        for (EventApplication app : apps) {
            boolean needsUpdate = false;
            
            // Sync missing event details
            if (app.getEventTitle() == null || app.getEventType() == null) {
                Optional<Event> eOpt = eventRepository.findById(app.getEventId());
                if (eOpt.isPresent()) {
                    app.setEventTitle(eOpt.get().getTitle());
                    app.setEventType(eOpt.get().getEventType());
                    needsUpdate = true;
                }
            }
            
            // RETROACTIVE FIX: Auto-shortlist and generate token for ANY Film Event registration
            if ("Film Event".equalsIgnoreCase(app.getEventType()) && (app.getPassToken() == null || !"SHORTLISTED".equalsIgnoreCase(app.getStatus()))) {
                app.setStatus("SHORTLISTED");
                if (app.getPassToken() == null) {
                    app.setPassToken("PASS-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + app.getId());
                }
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                applicationRepository.save(app);
            }
        }
        return apps;
    }

    public List<EventApplication> getApplicantsForEvent(Long eventId) {
        List<EventApplication> applications = applicationRepository.findByEventId(eventId);
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        
        if (eventOpt.isEmpty()) return applications;
        Event event = eventOpt.get();
        
        // Populate and calculate match scores
        for (EventApplication app : applications) {
            userRepository.findById(app.getUserId()).ifPresent(user -> {
                // Ensure basic details are synced
                if (app.getApplicantName() == null) {
                    app.setApplicantName(user.getName());
                    app.setApplicantEmail(user.getEmail());
                    app.setRole(user.getRole());
                    app.setLocation(user.getLocation());
                    app.setExperience(user.getBio());
                    applicationRepository.save(app);
                }
                
                app.setMatchScore(calculateMatchScore(event, user));
            });
        }
        
        // Sort based on priority logic
        Collections.sort(applications, (a, b) -> {
            // Priority 1-3 are captured in matchScore
            int scoreCompare = b.getMatchScore().compareTo(a.getMatchScore());
            if (scoreCompare != 0) return scoreCompare;
            
            // Priority 4: Apply time (Earlier first if scores are equal)
            if (a.getAppliedAt() != null && b.getAppliedAt() != null) {
                return a.getAppliedAt().compareTo(b.getAppliedAt());
            }
            return 0;
        });
        
        return applications;
    }

    private int calculateMatchScore(Event event, User user) {
        int score = 0;
        
        // Priority 1: Skill match (Max 1000)
        if (event.getSkills() != null && user.getSkills() != null) {
            Set<String> eventSkills = new HashSet<>(Arrays.asList(event.getSkills().toLowerCase().split("\\s*,\\s*")));
            Set<String> userSkills = new HashSet<>(Arrays.asList(user.getSkills().toLowerCase().split("\\s*,\\s*")));
            
            long matchCount = userSkills.stream().filter(eventSkills::contains).count();
            if (eventSkills.size() > 0) {
                score += (int) ((matchCount * 1000) / eventSkills.size());
            }
        }
        
        // Priority 2: Portfolio strength (Max 500)
        if (user.getShowreel() != null && !user.getShowreel().isEmpty()) score += 200;
        if (user.getPortfolioVideos() != null && !user.getPortfolioVideos().isEmpty()) score += 150;
        if (user.getInstagram() != null || user.getYoutube() != null) score += 150;
        
        // Priority 3: Profile completeness (Max 250)
        int profileScore = user.getProfileScore();
        score += (profileScore * 250) / 100;
        
        // Additional Rule: Users with profile completeness < 70 put them in next order
        // We do this by heavily penalizing their score so they drop below others
        if (profileScore < 70) {
            score -= 5000; 
        }
        
        return score;
    }

    public EventApplication updateApplicationStatus(Long appId, String status) {
        Optional<EventApplication> appOpt = applicationRepository.findById(appId);
        if (appOpt.isPresent()) {
            EventApplication application = appOpt.get();
            String oldStatus = application.getStatus();
            application.setStatus(status);
            
            // Populate event details if missing (for legacy applications)
            if (application.getEventType() == null) {
                System.out.println("DEBUG: Retro-populating event details for application: " + appId);
                eventRepository.findById(application.getEventId()).ifPresent(event -> {
                    application.setEventType(event.getEventType());
                    application.setEventTitle(event.getTitle());
                    application.setEventLocation(event.getLocation());
                    application.setEventDate(event.getDate() != null ? event.getDate().toString() : "");
                });
            }

            System.out.println("DEBUG: Checking token generation for type: [" + application.getEventType() + "] and status: [" + status + "]");

            // Generate Pass Token if shortlisted and it's a Film Event
            if (status.equalsIgnoreCase("SHORTLISTED") && application.getPassToken() == null && "Film Event".equalsIgnoreCase(application.getEventType())) {
                application.setPassToken("PASS-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + application.getId());
                System.out.println("DEBUG: Generated Pass Token: " + application.getPassToken());
            }

            EventApplication savedApp = applicationRepository.save(application);

            // Trigger Notification to Applicant if status changed to Shortlisted or Rejected
            if (!status.equals(oldStatus)) {
                String type = status.equalsIgnoreCase("Shortlisted") ? "SHORTLIST" : 
                             status.equalsIgnoreCase("Rejected") ? "REJECT" : "UPDATE";
                
                String content = status.equalsIgnoreCase("Shortlisted") ? 
                                ("Film Event".equalsIgnoreCase(application.getEventType()) ? 
                                    "Congratulations! You've been shortlisted for: " + application.getEventTitle() + ". Your entry pass is now available!" :
                                    "Congratulations! You've been shortlisted for: " + application.getEventTitle()) :
                                status.equalsIgnoreCase("Rejected") ?
                                "Status update for " + application.getEventTitle() + ": " + status :
                                "Your application status for " + application.getEventTitle() + " was updated to " + status;

                notificationService.createNotification(
                    application.getUserId(),
                    null, // System or Admin usually
                    type,
                    content,
                    application.getEventId().toString()
                );

                // Send Message and Email if shortlisted
                if (status.equalsIgnoreCase("SHORTLISTED")) {
                    triggerShortlistNotifications(application);
                } else if (status.equalsIgnoreCase("SELECTED") || status.equalsIgnoreCase("NOT_SELECTED")) {
                    triggerPhase2Notifications(application, status);
                }
            }

            return savedApp;
        }
        throw new RuntimeException("Application not found");
    }

    private void triggerShortlistNotifications(EventApplication application) {
        try {
            User officialUser = userService.getOfficialUser();
            User applicant = userRepository.findById(application.getUserId()).orElse(null);
            
            if (applicant != null) {
                String messageContent = "Congratulations! You've been shortlisted for: " + (application.getEventTitle() != null ? application.getEventTitle() : "the event") + ". " +
                        "Soon you will receive further process updates like audition location, time and date. " +
                        "Stay tuned for more updates!";
                
                // 1. Send In-App Message from Official Account
                Message shortlistMsg = new Message(officialUser.getId(), applicant.getId(), messageContent);
                messageRepository.save(shortlistMsg);
                
                // 2. Send Email
                emailService.sendShortlistEmail(applicant.getEmail(), applicant.getName(), application.getEventTitle());
                System.out.println("DEBUG: Shortlist message and email sent to: " + applicant.getEmail());
            }
        } catch (Exception e) {
            System.err.println("ERROR: Failed to send shortlist notifications: " + e.getMessage());
        }
    }

    private void triggerPhase2Notifications(EventApplication application, String status) {
        try {
            User applicant = userRepository.findById(application.getUserId()).orElse(null);
            if (applicant == null) return;

            User officialUser = userService.getOfficialUser();
            String eventTitle = application.getEventTitle();

            if (status.equalsIgnoreCase("SELECTED")) {
                String messageContent = "Final Selection Update: Congratulations! You have been SELECTED for the role in '" + eventTitle + "'. The organizers will reach out to you manually for the next steps. Best of luck!";
                
                // 1. Send In-App Message from Official Account
                Message msg = new Message(officialUser.getId(), applicant.getId(), messageContent);
                messageRepository.save(msg);
                
                // 2. Send Email
                emailService.sendFinalSelectionEmail(applicant.getEmail(), applicant.getName(), eventTitle);
            } else if (status.equalsIgnoreCase("NOT_SELECTED")) {
                String messageContent = "Final Selection Update for '" + eventTitle + "': We appreciate your participation, but unfortunately, we've decided to proceed with other candidates. Keep trying, and more opportunities await you!";
                
                // 1. Send In-App Message from Official Account
                Message msg = new Message(officialUser.getId(), applicant.getId(), messageContent);
                messageRepository.save(msg);
                
                // 2. Send Email
                emailService.sendFinalRejectionEmail(applicant.getEmail(), applicant.getName(), eventTitle);
            }
        } catch (Exception e) {
            System.err.println("ERROR: Failed to send Phase 2 notifications: " + e.getMessage());
        }
    }

    public EventApplication validatePass(String token) {
        System.out.println("DEBUG: Looking for pass with token: " + token);
        return applicationRepository.findByPassToken(token)
            .map(app -> {
                System.out.println("DEBUG: Found application ID: " + app.getId() + " for user: " + app.getApplicantName());
                System.out.println("DEBUG: Current scanned status: " + app.isScanned());
                if (app.isScanned()) {
                    throw new RuntimeException("ALREADY_SCANNED");
                }
                app.setScanned(true);
                EventApplication saved = applicationRepository.save(app);
                System.out.println("DEBUG: Successfully marked as scanned.");
                return saved;
            })
            .orElseThrow(() -> {
                System.err.println("DEBUG: No application found for token: " + token);
                return new RuntimeException("INVALID_TOKEN");
            });
    }

    public Optional<EventApplication> getApplicationByToken(String token) {
        return applicationRepository.findByPassToken(token);
    }

    public List<EventApplication> getAllApplicantsForUser(Long userId) {
        List<Event> userEvents = eventRepository.findByUserIdOrderByCreatedAtDesc(userId);
        if (userEvents.isEmpty()) return new java.util.ArrayList<>();
        
        java.util.List<Long> eventIds = userEvents.stream()
            .map(Event::getId)
            .collect(java.util.stream.Collectors.toList());
            
        return applicationRepository.findByEventIdIn(eventIds);
    }

    public void broadcastEventDetails(Long eventId, String location, String time, String date) {
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isPresent()) {
            Event event = eventOpt.get();
            List<EventApplication> shortlistedApps = applicationRepository.findByEventIdAndStatus(eventId, "SHORTLISTED");
            
            User creator = userRepository.findById(event.getUserId()).orElse(null);
            
            // Run broadcast in a background thread to prevent blocking the UI
            new Thread(() -> {
                for (EventApplication app : shortlistedApps) {
                    try {
                        User applicant = userRepository.findById(app.getUserId()).orElse(null);
                        if (applicant != null) {
                            String detailsLabel = "Audition".equalsIgnoreCase(event.getEventType()) ? "Audition Details" : "Important Details";
                            String messageContent = detailsLabel + " for '" + event.getTitle() + "':\n\n" +
                                    "📍 Location: " + location + "\n" +
                                    "⏰ Time: " + time + "\n" +
                                    "📅 Date: " + date + "\n\n" +
                                    "Looking forward to seeing you!";
                            
                            // 1. Send In-App Message from Event Creator
                            if (creator != null) {
                                Message msg = new Message(creator.getId(), applicant.getId(), messageContent);
                                messageRepository.save(msg);
                            }
                            
                            // 2. Send Email (This is the slow part)
                            emailService.sendEventDetailsEmail(applicant.getEmail(), applicant.getName(), event.getTitle(), event.getEventType(), location, time, date);
                            
                            // 3. Send Notification
                            notificationService.createNotification(
                                applicant.getId(),
                                event.getUserId(),
                                "UPDATE",
                                "New details shared for " + event.getTitle(),
                                event.getId().toString()
                            );
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to send broadcast to user " + app.getUserId() + ": " + e.getMessage());
                    }
                }
            }).start();
        } else {
            throw new RuntimeException("Event not found");
        }
    }
}
