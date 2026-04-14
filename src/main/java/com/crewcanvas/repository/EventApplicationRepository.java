package com.crewcanvas.repository;

import com.crewcanvas.model.EventApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {
    List<EventApplication> findByUserId(Long userId);
    List<EventApplication> findByEventId(Long eventId);
    Optional<EventApplication> findByEventIdAndUserId(Long eventId, Long userId);
}
