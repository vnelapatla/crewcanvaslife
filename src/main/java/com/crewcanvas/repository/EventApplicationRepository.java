package com.crewcanvas.repository;

import com.crewcanvas.model.EventApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventApplicationRepository extends JpaRepository<EventApplication, Long> {
    List<EventApplication> findByUserId(Long userId);
    List<EventApplication> findByUserIdOrderByAppliedAtDesc(Long userId);
    @org.springframework.data.jpa.repository.Query("SELECT ea FROM EventApplication ea WHERE ea.eventId = :eventId")
    List<EventApplication> findByEventId(@org.springframework.data.repository.query.Param("eventId") Long eventId);
    List<EventApplication> findByEventIdAndStatus(Long eventId, String status);
    Optional<EventApplication> findByEventIdAndUserId(Long eventId, Long userId);
    Optional<EventApplication> findByPassToken(String passToken);
    boolean existsByEventIdAndUserId(Long eventId, Long userId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByEventId(Long eventId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByEventIdIn(List<Long> eventIds);

    List<EventApplication> findByEventIdIn(List<Long> eventIds);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(ea) > 0 FROM EventApplication ea WHERE ea.userId = :applicantId AND ea.eventId IN (SELECT e.id FROM Event e WHERE e.userId = :creatorId)")
    boolean isApplicantToCreatorsEvent(@org.springframework.data.repository.query.Param("creatorId") Long creatorId, @org.springframework.data.repository.query.Param("applicantId") Long applicantId);

    long countByAppliedAtAfter(java.time.LocalDateTime dateTime);
}
