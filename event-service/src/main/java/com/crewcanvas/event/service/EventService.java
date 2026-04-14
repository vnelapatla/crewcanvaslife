package com.crewcanvas.event.service;

import com.crewcanvas.event.model.Event;
import com.crewcanvas.event.repository.EventRepository;
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
            if (updatedEvent.getEndDate() != null)
                event.setEndDate(updatedEvent.getEndDate());
            if (updatedEvent.getTimeDuration() != null)
                event.setTimeDuration(updatedEvent.getTimeDuration());
            if (updatedEvent.getOrgName() != null)
                event.setOrgName(updatedEvent.getOrgName());
            if (updatedEvent.getOrgPhone() != null)
                event.setOrgPhone(updatedEvent.getOrgPhone());
            if (updatedEvent.getOrgEmail() != null)
                event.setOrgEmail(updatedEvent.getOrgEmail());
            if (updatedEvent.getCapacity() != null)
                event.setCapacity(updatedEvent.getCapacity());
            if (updatedEvent.getPrice() != null)
                event.setPrice(updatedEvent.getPrice());
            return eventRepository.save(event);
        }
        throw new RuntimeException("Event not found");
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    public Event applyToEvent(Long id) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isPresent()) {
            Event event = eventOpt.get();
            event.setApplicants(event.getApplicants() + 1);
            return eventRepository.save(event);
        }
        throw new RuntimeException("Event not found");
    }

    public EventApplication applyToEventWithData(Long eventId, EventApplication application) {
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        if (eventOpt.isPresent()) {
            Event event = eventOpt.get();
            
            // Check if already applied
            if (applicationRepository.existsByEventIdAndUserId(eventId, application.getUserId())) {
                throw new RuntimeException("Already applied to this event");
            }

            application.setEventId(eventId);
            EventApplication savedApp = applicationRepository.save(application);
            
            // Update counter in main Event table
            event.setApplicants(event.getApplicants() + 1);
            eventRepository.save(event);
            
            return savedApp;
        }
        throw new RuntimeException("Event not found");
    }

    public List<EventApplication> getApplicantsForEvent(Long eventId) {
        return applicationRepository.findByEventId(eventId);
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
