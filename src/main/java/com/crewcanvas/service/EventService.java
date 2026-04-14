package com.crewcanvas.service;

import com.crewcanvas.model.Event;
import com.crewcanvas.model.EventApplication;
import com.crewcanvas.repository.EventApplicationRepository;
import com.crewcanvas.repository.EventRepository;
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
}
