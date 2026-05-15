package com.crewcanvas.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "movie_quiz_results")
@Data
@NoArgsConstructor
public class MovieQuizResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String userName;

    @Column(nullable = false)
    private Integer score;

    @Column(name = "time_taken", nullable = false)
    private Long timeTaken; // Total seconds for all questions

    @Column(name = "played_at")
    private LocalDateTime playedAt = LocalDateTime.now();
}
