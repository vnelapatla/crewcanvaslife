package com.crewcanvas.event.repository;

import com.crewcanvas.event.model.EventApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {
    List<EventApplication> findByEventId(Long eventId);
    List<EventApplication> findByUserId(Long userId);
    boolean existsByEventIdAndUserId(Long eventId, Long userId);
}
