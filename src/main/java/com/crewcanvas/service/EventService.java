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
import com.crewcanvas.service.NotificationService;

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
            return eventRepository.save(event);
        }
        throw new RuntimeException("Event not found");
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    public Event applyToEvent(Long id, Long userId) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isPresent()) {
            Event event = eventOpt.get();
            
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

            return savedEvent;
        }
        throw new RuntimeException("Event not found");
    }

    public List<EventApplication> getUserApplications(Long userId) {
        List<EventApplication> apps = applicationRepository.findByUserId(userId);
        // Fallback for old apps missing title/type
        for (EventApplication app : apps) {
            if (app.getEventTitle() == null) {
                eventRepository.findById(app.getEventId()).ifPresent(e -> {
                    app.setEventTitle(e.getTitle());
                    app.setEventType(e.getEventType());
                    applicationRepository.save(app);
                });
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
            EventApplication savedApp = applicationRepository.save(application);

            // Trigger Notification to Applicant if status changed to Shortlisted or Rejected
            if (!status.equals(oldStatus)) {
                String type = status.equalsIgnoreCase("Shortlisted") ? "SHORTLIST" : 
                             status.equalsIgnoreCase("Rejected") ? "REJECT" : "UPDATE";
                
                String content = status.equalsIgnoreCase("Shortlisted") ? 
                                "Congratulations! You've been shortlisted for: " + application.getEventTitle() :
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
            }

            return savedApp;
        }
        throw new RuntimeException("Application not found");
    }
}
