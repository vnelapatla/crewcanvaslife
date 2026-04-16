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

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventApplicationRepository applicationRepository;

    @Autowired
    private UserRepository userRepository;

    public Event createEvent(Event event) {
        return eventRepository.save(event);
    }

    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByStartDateDesc();
    }

    public List<Event> getUserEvents(Long userId) {
        return eventRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Event> getEventsByType(String eventType) {
        return eventRepository.findByEventTypeOrderByStartDateDesc(eventType);
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
            if (updatedEvent.getStartDate() != null)
                event.setStartDate(updatedEvent.getStartDate());
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

            applicationRepository.save(application);

            // Increment count
            event.setApplicants(event.getApplicants() + 1);
            return eventRepository.save(event);
        }
        throw new RuntimeException("Event not found");
    }

    public List<EventApplication> getUserApplications(Long userId) {
        return applicationRepository.findByUserId(userId);
    }

    public List<EventApplication> getApplicantsForEvent(Long eventId) {
        List<EventApplication> applications = applicationRepository.findByEventId(eventId);
        
        // Populate missing details if any (for existing records)
        for (EventApplication app : applications) {
            if (app.getApplicantName() == null) {
                userRepository.findById(app.getUserId()).ifPresent(u -> {
                    app.setApplicantName(u.getName());
                    app.setApplicantEmail(u.getEmail());
                    app.setRole(u.getRole());
                    app.setLocation(u.getLocation());
                    app.setExperience(u.getBio());
                    applicationRepository.save(app); // Persist the fix
                });
            }
        }
        
        return applications;
    }

    public EventApplication updateApplicationStatus(Long appId, String status) {
        Optional<EventApplication> appOpt = applicationRepository.findById(appId);
        if (appOpt.isPresent()) {
            EventApplication application = appOpt.get();
            application.setStatus(status);
            return applicationRepository.save(application);
        }
        throw new RuntimeException("Application not found");
    }
}
