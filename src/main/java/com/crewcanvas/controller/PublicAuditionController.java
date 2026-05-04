package com.crewcanvas.controller;

import com.crewcanvas.model.Event;
import com.crewcanvas.model.EventApplication;
import com.crewcanvas.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/audition")
public class PublicAuditionController {

    @Autowired
    private EventService eventService;

    @GetMapping("/{shareKey}")
    public ResponseEntity<?> getPublicAuditionData(@PathVariable String shareKey) {
        Optional<Event> eventOpt = eventService.getEventByShareKey(shareKey);
        
        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Event event = eventOpt.get();
        if (!Boolean.TRUE.equals(event.getIsManaged())) {
            return ResponseEntity.badRequest().body("This event is not a managed audition.");
        }
        
        // Fetch all applicants for this managed event
        List<EventApplication> applicants = eventService.getApplicantsForEvent(event.getId());
        
        // Mask sensitive data for public view (e.g. precise email or phone if needed, 
        // but for a casting deck, the poster usually needs to see the talent)
        // For now, we'll provide the data as requested for the curated experience.
        
        Map<String, Object> response = new HashMap<>();
        response.put("event", event);
        response.put("applicants", applicants);
        
        return ResponseEntity.ok(response);
    }
}
