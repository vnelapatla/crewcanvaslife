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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

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

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");

    private void sendRealTimeMessage(Message msg) {
        try {
            Map<String, Object> map = new HashMap<>();
            map.put("id", msg.getId());
            map.put("senderId", msg.getSenderId());
            map.put("receiverId", msg.getReceiverId());
            map.put("content", msg.getContent());
            map.put("imageUrl", msg.getImageUrl());
            map.put("fileUrl", msg.getFileUrl());
            map.put("fileType", msg.getFileType());
            map.put("fileUrls", msg.getFileUrls());
            map.put("isRead", msg.getIsRead());
            map.put("isEdited", msg.getIsEdited());
            map.put("createdAt", msg.getCreatedAt() != null ? ZonedDateTime.ofInstant(msg.getCreatedAt(), ZoneId.of("UTC")).format(ISO_FORMATTER) : null);

            messagingTemplate.convertAndSend("/topic/messages/" + msg.getReceiverId(), map);
            messagingTemplate.convertAndSend("/topic/messages/" + msg.getSenderId(), map);
        } catch (Exception e) {
            System.err.println("Failed to send real-time message update: " + e.getMessage());
        }
    }

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

    public Optional<Event> getEventByShareKey(String shareKey) {
        return eventRepository.findByShareKey(shareKey);
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
            if (updatedEvent.getRoleType() != null)
                event.setRoleType(updatedEvent.getRoleType());
            if (updatedEvent.getAgeRange() != null)
                event.setAgeRange(updatedEvent.getAgeRange());
            if (updatedEvent.getGenderPreference() != null)
                event.setGenderPreference(updatedEvent.getGenderPreference());
            if (updatedEvent.getPrizePool() != null)
                event.setPrizePool(updatedEvent.getPrizePool());
            if (updatedEvent.getIsManaged() != null) {
                event.setIsManaged(updatedEvent.getIsManaged());
                if (event.getIsManaged() && (event.getShareKey() == null || event.getShareKey().isEmpty())) {
                    event.setShareKey("AUD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase() + "-" + (System.currentTimeMillis() % 10000));
                }
            }
            Event savedEvent = eventRepository.save(event);
            
            // Notify registered users of the update
            notifyApplicantsOfUpdate(savedEvent);
            
            return savedEvent;
        }
        throw new RuntimeException("Event not found");
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteEvent(Long id) {
        applicationRepository.deleteByEventId(id);
        eventRepository.deleteById(id);
    }

    public Event applyToEvent(Long id, Long userId, EventApplication applicationDetails) {
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
            
            // Populate user details from profile (as fallback/base)
            userRepository.findById(userId).ifPresent(user -> {
                application.setApplicantName(user.getName());
                application.setApplicantEmail(user.getEmail());
                application.setRole(user.getRole());
                application.setLocation(user.getLocation());
                application.setExperience(user.getBio()); // Default bio
                application.setPortfolioLink(user.getShowreel() != null ? user.getShowreel() : user.getPortfolioVideos());
                
                // New Audition Fields from Profile
                application.setAge(user.getAgeRange());
                application.setHeight(user.getHeight());
                application.setMobileNumber(user.getPhone());
                application.setResumeUrl(user.getResume());
                application.setResumeFileName(user.getResumeFileName());
                
                if (user.getRecentPictures() != null && !user.getRecentPictures().isEmpty()) {
                    try {
                        // Handle both JSON and comma-separated formats for backward compatibility
                        String[] pics;
                        if (user.getRecentPictures().startsWith("[")) {
                            // Basic JSON parse (since we don't have a full JSON library here, we use a robust string approach)
                            String clean = user.getRecentPictures().replace("[", "").replace("]", "").replace("\"", "");
                            pics = clean.split(",");
                        } else {
                            pics = user.getRecentPictures().split(",");
                        }
                        
                        if (pics.length > 0 && !pics[0].trim().isEmpty()) application.setPhoto1(pics[0].trim());
                        if (pics.length > 1 && !pics[1].trim().isEmpty()) application.setPhoto2(pics[1].trim());
                        if (pics.length > 2 && !pics[2].trim().isEmpty()) application.setPhoto3(pics[2].trim());
                    } catch (Exception e) {
                        System.err.println("Error parsing profile pictures: " + e.getMessage());
                    }
                }
            });

            // Override with application details if provided
            if (applicationDetails != null) {
                if (applicationDetails.getApplicantName() != null) application.setApplicantName(applicationDetails.getApplicantName());
                if (applicationDetails.getRole() != null) application.setRole(applicationDetails.getRole());
                if (applicationDetails.getLocation() != null) application.setLocation(applicationDetails.getLocation());
                if (applicationDetails.getExperience() != null) application.setExperience(applicationDetails.getExperience());
                if (applicationDetails.getPortfolioLink() != null) application.setPortfolioLink(applicationDetails.getPortfolioLink());
                if (applicationDetails.getAdditionalNote() != null) application.setAdditionalNote(applicationDetails.getAdditionalNote());
                
                // Audition specific overrides
                if (applicationDetails.getAge() != null) application.setAge(applicationDetails.getAge());
                if (applicationDetails.getHeight() != null) application.setHeight(applicationDetails.getHeight());
                if (applicationDetails.getMobileNumber() != null) application.setMobileNumber(applicationDetails.getMobileNumber());
                if (applicationDetails.getPhoto1() != null) application.setPhoto1(applicationDetails.getPhoto1());
                if (applicationDetails.getPhoto2() != null) application.setPhoto2(applicationDetails.getPhoto2());
                if (applicationDetails.getPhoto3() != null) application.setPhoto3(applicationDetails.getPhoto3());
                if (applicationDetails.getResumeUrl() != null) application.setResumeUrl(applicationDetails.getResumeUrl());
                if (applicationDetails.getResumeFileName() != null) application.setResumeFileName(applicationDetails.getResumeFileName());
                if (applicationDetails.getShortFilmTitle() != null) application.setShortFilmTitle(applicationDetails.getShortFilmTitle());
                if (applicationDetails.getTeamName() != null) application.setTeamName(applicationDetails.getTeamName());
                if (applicationDetails.getVideoUrl() != null) application.setVideoUrl(applicationDetails.getVideoUrl());
                if (applicationDetails.getVideoFileName() != null) application.setVideoFileName(applicationDetails.getVideoFileName());
                if (applicationDetails.getPosterUrl() != null) application.setPosterUrl(applicationDetails.getPosterUrl());
            }
            
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

                User officialUser = userService.getOfficialUser();
                notificationService.createNotification(
                    application.getUserId(),
                    officialUser.getId(),
                    type,
                    content,
                    application.getEventId().toString()
                );

                // Send Message and Email if shortlisted
                if (status.equalsIgnoreCase("SHORTLISTED")) {
                    triggerShortlistNotifications(application);
                } else if (status.equalsIgnoreCase("SELECTED") || status.equalsIgnoreCase("NOT_SELECTED") || status.equalsIgnoreCase("REJECTED")) {
                    triggerPhase2Notifications(application, status);
                }
            }

            return savedApp;
        }
        throw new RuntimeException("Application not found");
    }

    private void triggerShortlistNotifications(EventApplication application) {
        new Thread(() -> {
            try {
                User officialUser = userService.getOfficialUser();
                User applicant = userRepository.findById(application.getUserId()).orElse(null);
                
                if (applicant != null) {
                    boolean sendInApp = Boolean.TRUE.equals(applicant.getEventReminders());
                    boolean sendEmail = Boolean.TRUE.equals(applicant.getEmailNotifications());

                    if (sendInApp || sendEmail) {
                        String phase = getEventPhase(application.getEventType());
                        String messageContent = "Congratulations! You've been shortlisted for: " + (application.getEventTitle() != null ? application.getEventTitle() : "the event") + " (" + application.getEventType() + "). " +
                                "Soon you will receive further updates regarding the " + phase + " (location, time and date). " +
                                "Stay tuned for more updates!";
                        
                        // 1. Send In-App Message from Official Account if reminders enabled
                        if (sendInApp) {
                            Message shortlistMsg = new Message(officialUser.getId(), applicant.getId(), messageContent);
                            Message saved = messageRepository.save(shortlistMsg);
                            sendRealTimeMessage(saved);
                        }
                        
                        // 2. Send Email if email notifications enabled
                        if (sendEmail) {
                            emailService.sendShortlistEmail(applicant.getEmail(), applicant.getName(), application.getEventTitle(), application.getEventType());
                        }
                        System.out.println("DEBUG: Shortlist notifications processed for: " + applicant.getEmail());
                    }
                }
            } catch (Exception e) {
                System.err.println("ERROR: Failed to send shortlist notifications: " + e.getMessage());
            }
        }).start();
    }

    private void triggerPhase2Notifications(EventApplication application, String status) {
        new Thread(() -> {
            try {
                User applicant = userRepository.findById(application.getUserId()).orElse(null);
                if (applicant == null) return;

                boolean sendInApp = Boolean.TRUE.equals(applicant.getEventReminders());
                boolean sendEmail = Boolean.TRUE.equals(applicant.getEmailNotifications());

                if (!sendInApp && !sendEmail) return;

                User officialUser = userService.getOfficialUser();
                String eventTitle = application.getEventTitle();

                if (status.equalsIgnoreCase("SELECTED")) {
                    String context = getEventContext(application.getEventType());
                    String messageContent = "Final Selection Update: Congratulations! You have been SELECTED for the " + context + " in '" + eventTitle + "'. The organizers will reach out to you manually for the next steps. Best of luck!";
                    
                    // 1. Send In-App Message from Official Account
                    if (sendInApp) {
                        Message msg = new Message(officialUser.getId(), applicant.getId(), messageContent);
                        Message saved = messageRepository.save(msg);
                        sendRealTimeMessage(saved);
                    }
                    
                    // 2. Send Email
                    if (sendEmail) {
                        emailService.sendFinalSelectionEmail(applicant.getEmail(), applicant.getName(), eventTitle, application.getEventType());
                    }
                } else if (status.equalsIgnoreCase("NOT_SELECTED") || status.equalsIgnoreCase("REJECTED")) {
                    String messageContent = "Final Selection Update for '" + eventTitle + "': We appreciate your participation, but unfortunately, the organizers have decided to proceed with other candidates. Keep trying, and more opportunities await you!";
                    
                    // 1. Send In-App Message from Official Account
                    if (sendInApp) {
                        Message msg = new Message(officialUser.getId(), applicant.getId(), messageContent);
                        Message saved = messageRepository.save(msg);
                        sendRealTimeMessage(saved);
                    }
                    
                    // 2. Send Email
                    if (sendEmail) {
                        emailService.sendFinalRejectionEmail(applicant.getEmail(), applicant.getName(), eventTitle, application.getEventType());
                    }
                }
            } catch (Exception e) {
                System.err.println("ERROR: Failed to send Phase 2 notifications: " + e.getMessage());
            }
        }).start();
    }

    private String getEventContext(String eventType) {
        if (eventType == null) return "opportunity";
        switch (eventType.toLowerCase()) {
            case "audition": return "role";
            case "course": return "seat";
            case "workshop": return "spot";
            case "contest": return "entry";
            case "film event": return "registration";
            default: return "opportunity";
        }
    }

    private String getEventPhase(String eventType) {
        if (eventType == null) return "application phase";
        switch (eventType.toLowerCase()) {
            case "audition": return "audition phase";
            case "course": return "admission phase";
            case "workshop": return "selection phase";
            case "contest": return "participation phase";
            case "film event": return "registration phase";
            default: return "application phase";
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
                            boolean sendInApp = Boolean.TRUE.equals(applicant.getEventReminders());
                            boolean sendEmail = Boolean.TRUE.equals(applicant.getEmailNotifications());

                            if (sendInApp || sendEmail) {
                                String detailsLabel = emailService.getBroadcastSubject(event.getEventType());
                                String messageContent = detailsLabel + " for '" + event.getTitle() + "':\n\n" +
                                        "📍 Location: " + location + "\n" +
                                        "⏰ Time: " + time + "\n" +
                                        "📅 Date: " + date + "\n\n" +
                                        "Looking forward to seeing you!";
                                
                                // 1. Send In-App Message from Event Creator
                                if (sendInApp && creator != null) {
                                    Message msg = new Message(creator.getId(), applicant.getId(), messageContent);
                                    Message saved = messageRepository.save(msg);
                                    sendRealTimeMessage(saved);
                                }
                                
                                // 2. Send Email
                                if (sendEmail) {
                                    emailService.sendEventDetailsEmail(applicant.getEmail(), applicant.getName(), event.getTitle(), event.getEventType(), location, time, date);
                                }
                                
                                // 3. Send Notification if reminders enabled
                                if (sendInApp) {
                                    notificationService.createNotification(
                                        applicant.getId(),
                                        event.getUserId(),
                                        "UPDATE",
                                        "New details shared for " + event.getTitle(),
                                        event.getId().toString()
                                    );
                                }
                            }
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

    public Optional<EventApplication> getLatestApplicationForUser(Long userId) {
        List<EventApplication> apps = applicationRepository.findByUserIdOrderByAppliedAtDesc(userId);
        return apps.isEmpty() ? Optional.empty() : Optional.of(apps.get(0));
    }

    @org.springframework.transaction.annotation.Transactional
    public void syncApplicantsCount() {
        List<Event> events = eventRepository.findAll();
        for (Event event : events) {
            List<EventApplication> apps = applicationRepository.findByEventId(event.getId());
            if (event.getApplicants() != apps.size()) {
                System.out.println("Syncing Event [" + event.getTitle() + "]: " + event.getApplicants() + " -> " + apps.size());
                event.setApplicants(apps.size());
                eventRepository.save(event);
            }
        }
    }

    private void notifyApplicantsOfUpdate(Event event) {
        new Thread(() -> {
            try {
                List<EventApplication> applications = applicationRepository.findByEventId(event.getId());
                User creator = userRepository.findById(event.getUserId()).orElse(null);
                
                for (EventApplication app : applications) {
                    try {
                        User applicant = userRepository.findById(app.getUserId()).orElse(null);
                        if (applicant != null) {
                            boolean sendInApp = Boolean.TRUE.equals(applicant.getEventReminders());
                            boolean sendEmail = Boolean.TRUE.equals(applicant.getEmailNotifications());

                            if (sendInApp || sendEmail) {
                                String messageContent = "The organizers of '" + event.getTitle() + "' have updated the event details. Please check the event page for the latest information.";
                                
                                // 1. Send In-App Message from Event Creator
                                if (sendInApp && creator != null) {
                                    Message msg = new Message(creator.getId(), applicant.getId(), messageContent);
                                    Message saved = messageRepository.save(msg);
                                    sendRealTimeMessage(saved);
                                }
                                
                                // 2. Send Email
                                if (sendEmail) {
                                    emailService.sendEventUpdateEmail(applicant.getEmail(), applicant.getName(), event.getTitle(), event.getEventType(), event.getId());
                                }
                                
                                // 3. Send Notification
                                if (sendInApp) {
                                    notificationService.createNotification(
                                        applicant.getId(),
                                        event.getUserId(),
                                        "UPDATE",
                                        "Event details updated for " + event.getTitle(),
                                        event.getId().toString()
                                    );
                                }
                            }
                        }
                    } catch (Exception e) {
                        System.err.println("Failed to notify user " + app.getUserId() + " of event update: " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("Failed to process event update notifications: " + e.getMessage());
            }
        }).start();
    }
}
