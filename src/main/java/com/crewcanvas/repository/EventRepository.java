package com.crewcanvas.repository;

import com.crewcanvas.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Event> findByEventTypeOrderByStartDateDesc(String eventType);

    List<Event> findAllByOrderByStartDateDesc();
}
