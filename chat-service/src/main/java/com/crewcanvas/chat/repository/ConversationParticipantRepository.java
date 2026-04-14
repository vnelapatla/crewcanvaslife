package com.crewcanvas.chat.repository;

import com.crewcanvas.chat.model.ConversationParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, Long> {

    @Query(value = "SELECT cp1.conversation_id FROM conversation_participants cp1 " +
            "JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id " +
            "WHERE cp1.user_id = :user1Id AND cp2.user_id = :user2Id", nativeQuery = true)
    Optional<Long> findConversationBetweenUsers(@Param("user1Id") Long user1Id, @Param("user2Id") Long user2Id);
}
