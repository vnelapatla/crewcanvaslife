package com.crewcanvas.chat.repository;

import com.crewcanvas.chat.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    @Query(value = "SELECT c.id as conversation_id, u.id as user_id, u.name as other_user_name, u.profile_image, m.message_text as last_message, m.timestamp as last_message_time " +
            "FROM conversations c " +
            "JOIN conversation_participants cp1 ON c.id = cp1.conversation_id " +
            "JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp1.user_id != cp2.user_id " +
            "JOIN users u ON cp2.user_id = u.id " +
            "LEFT JOIN messages m ON m.id = ( " +
            "    SELECT m2.id FROM messages m2 WHERE m2.conversation_id = c.id ORDER BY m2.timestamp DESC LIMIT 1 " +
            ") " +
            "WHERE cp1.user_id = :userId", nativeQuery = true)
    List<Map<String, Object>> findUserConversations(@Param("userId") Long userId);
}
