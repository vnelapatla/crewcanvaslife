package com.crewcanvas.repository;

import com.crewcanvas.model.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PollVoteRepository extends JpaRepository<PollVote, Long> {
    List<PollVote> findByPollId(Long pollId);
    Optional<PollVote> findByPollIdAndUserId(Long pollId, Long userId);
    
    @org.springframework.transaction.annotation.Transactional
    void deleteByUserId(Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM poll_votes WHERE poll_id IN (SELECT p.id FROM polls p JOIN posts ps ON p.post_id = ps.id WHERE ps.user_id = ?1)", nativeQuery = true)
    void deleteVotesOnUserPolls(Long userId);
}
