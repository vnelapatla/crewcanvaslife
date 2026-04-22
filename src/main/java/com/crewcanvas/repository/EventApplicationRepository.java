package com.crewcanvas.repository;

import com.crewcanvas.model.EventApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {
    List<EventApplication> findByUserId(Long userId);
    @org.springframework.data.jpa.repository.Query("SELECT ea FROM EventApplication ea WHERE ea.eventId = :eventId")
    List<EventApplication> findByEventId(@org.springframework.data.repository.query.Param("eventId") Long eventId);
    Optional<EventApplication> findByEventIdAndUserId(Long eventId, Long userId);
    boolean existsByEventIdAndUserId(Long eventId, Long userId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);
}
