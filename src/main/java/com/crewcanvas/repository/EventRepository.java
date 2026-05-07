package com.crewcanvas.repository;

import com.crewcanvas.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByUserIdOrderByCreatedAtDesc(Long userId);
    org.springframework.data.domain.Page<Event> findByUserId(Long userId, org.springframework.data.domain.Pageable pageable);

    List<Event> findByEventTypeOrderByDateDesc(String eventType);
    org.springframework.data.domain.Page<Event> findByEventType(String eventType, org.springframework.data.domain.Pageable pageable);

    List<Event> findAllByOrderByDateDesc();
    org.springframework.data.domain.Page<Event> findAll(org.springframework.data.domain.Pageable pageable);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT e.id FROM Event e WHERE e.userId = ?1")
    List<Long> findIdsByUserId(Long userId);

    java.util.Optional<Event> findByShareKey(String shareKey);

    long countByCreatedAtAfter(java.time.Instant instant);
}
