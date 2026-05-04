package com.crewcanvas.service;

import com.crewcanvas.model.Event;
import com.crewcanvas.repository.EventRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class StartupSeeder {

    @Autowired
    private EventRepository eventRepository;

    @PostConstruct
    public void init() {
        if (eventRepository.count() == 0) {
            seedEvents();
        }
    }

    private void seedEvents() {
        // Admin User ID (typically 1 or a known system ID)
        Long adminId = 1L;

        // 1. Auditions
        eventRepository.save(new Event(adminId, "Feature Film Casting - Lead Roles", "Audition", "Mumbai", LocalDate.now().plusDays(10)));
        eventRepository.save(new Event(adminId, "TV Commercial - Character Actors", "Audition", "Hyderabad", LocalDate.now().plusDays(5)));
        eventRepository.save(new Event(adminId, "Web Series - Supporting Cast", "Audition", "Bangalore", LocalDate.now().plusDays(15)));

        // 2. Workshops
        eventRepository.save(new Event(adminId, "Advanced Cinematography Workshop", "Workshop", "Chennai", LocalDate.now().plusDays(20)));
        eventRepository.save(new Event(adminId, "Screenwriting Masterclass", "Workshop", "Online", LocalDate.now().plusDays(12)));

        // 3. Film Events
        eventRepository.save(new Event(adminId, "International Film Festival 2026", "Film Event", "Goa", LocalDate.now().plusDays(30)));
        eventRepository.save(new Event(adminId, "Indie Filmmakers Meetup", "Film Event", "Delhi", LocalDate.now().plusDays(7)));

        // 4. Courses
        eventRepository.save(new Event(adminId, "Diploma in Film Direction", "Course", "Mumbai", LocalDate.now().plusDays(45)));
        eventRepository.save(new Event(adminId, "Digital Editing Bootcamp", "Course", "Online", LocalDate.now().plusDays(25)));
        
        System.out.println("✅ Database seeded with initial baseline events.");
    }
}
