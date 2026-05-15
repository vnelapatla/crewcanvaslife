package com.crewcanvas.repository;

import com.crewcanvas.model.MovieQuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieQuizQuestionRepository extends JpaRepository<MovieQuizQuestion, Long> {
}
