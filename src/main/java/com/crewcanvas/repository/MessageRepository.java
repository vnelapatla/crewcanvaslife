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

    @Query("SELECT m FROM Message m WHERE (m.senderId = ?1 AND m.receiverId = ?2) OR (m.senderId = ?2 AND m.receiverId = ?1) ORDER BY m.createdAt DESC")
    org.springframework.data.domain.Page<Message> findConversation(Long userId1, Long userId2, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.receiverId = ?1 AND m.isRead = false")
    List<Message> findUnreadMessages(Long userId);

    @Query("SELECT m FROM Message m WHERE m.senderId = ?1 OR m.receiverId = ?1 ORDER BY m.createdAt DESC")
    List<Message> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId);

    @Query("SELECT m FROM Message m WHERE m.senderId = ?1 OR m.receiverId = ?2 ORDER BY m.createdAt DESC")
    org.springframework.data.domain.Page<Message> findBySenderIdOrReceiverIdOrderByCreatedAtDesc(Long senderId, Long receiverId, org.springframework.data.domain.Pageable pageable);

    @org.springframework.transaction.annotation.Transactional
    void deleteBySenderId(Long senderId);

    @org.springframework.transaction.annotation.Transactional
    void deleteByReceiverId(Long receiverId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM conversations WHERE user1_id = ?1 OR user2_id = ?1", nativeQuery = true)
    void deleteFromConversationsTable(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Message m SET m.isRead = true WHERE m.senderId = ?1 AND m.receiverId = ?2 AND m.isRead = false")
    void markConversationAsRead(Long senderId, Long receiverId);

    boolean existsBySenderIdAndReceiverId(Long senderId, Long receiverId);
    
    @Query(value = "SELECT " +
            "CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END as otherUserId, " +
            "u.name as otherUserName, " +
            "u.profile_picture as otherUserProfilePicture, " +
            "u.role as otherUserRole, " +
            "m.content as lastMessage, " +
            "m.created_at as lastMessageAt, " +
            "m.is_read as isRead " +
            "FROM messages m " +
            "JOIN users u ON u.id = (CASE WHEN m.sender_id = :userId THEN m.receiver_id ELSE m.sender_id END) " +
            "WHERE m.id IN ( " +
            "    SELECT MAX(id) " +
            "    FROM messages " +
            "    WHERE sender_id = :userId OR receiver_id = :userId " +
            "    GROUP BY CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END " +
            ") " +
            "ORDER BY m.created_at DESC", nativeQuery = true)
    List<com.crewcanvas.dto.ConversationSummary> findConversationsSummary(@org.springframework.data.repository.query.Param("userId") Long userId);
}
