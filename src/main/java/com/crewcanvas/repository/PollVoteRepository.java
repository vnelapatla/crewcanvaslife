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
}
