package com.crewcanvas.repository;

import com.crewcanvas.model.MovieQuizResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MovieQuizResultRepository extends JpaRepository<MovieQuizResult, Long> {

    @Query("SELECT r FROM MovieQuizResult r ORDER BY r.score DESC, r.timeTaken ASC, r.playedAt ASC")
    List<MovieQuizResult> findTopRankedResults();

    long countByUserId(Long userId);
}
