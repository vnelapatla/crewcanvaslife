package com.crewcanvas.repository;

import com.crewcanvas.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.senderId = ?1 AND m.receiverId = ?2) OR (m.senderId = ?2 AND m.receiverId = ?1) ORDER BY m.createdAt ASC")
    List<Message> findConversation(Long userId1, Long userId2);

    @Query("SELECT m FROM Message m WHERE (m.senderId = ?1 AND m.receiverId = ?2) OR (m.senderId = ?2 AND m.receiverId = ?1) ORDER BY m.createdAt ASC")
    org.springframework.data.domain.Page<Message> findConversation(Long userId1, Long userId2, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.receiverId = ?1 AND m.isRead = false")
    List<Message> findUnreadMessages(Long userId);

    @Query("SELECT m FROM Message m WHERE m.senderId = ?1 OR m.receiverId = ?1 ORDER BY m.createdAt DESC")
    List<Message> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId);

    @Query("SELECT m FROM Message m WHERE m.senderId = ?1 OR m.receiverId = ?2 ORDER BY m.createdAt DESC")
    org.springframework.data.domain.Page<Message> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId, org.springframework.data.domain.Pageable pageable);
}

