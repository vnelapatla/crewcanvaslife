package com.crewcanvas.controller;

import com.crewcanvas.model.MovieQuizQuestion;
import com.crewcanvas.model.MovieQuizResult;
import com.crewcanvas.service.MovieQuizService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/movie-quiz")
@CrossOrigin(origins = "*")
public class MovieQuizController {

    @Autowired
    private MovieQuizService quizService;

    // --- User Endpoints ---

    @GetMapping("/questions")
    public ResponseEntity<List<MovieQuizQuestion>> getQuestions() {
        return ResponseEntity.ok(quizService.getAllQuestions());
    }

    @PostMapping("/results")
    public ResponseEntity<MovieQuizResult> submitResult(@RequestBody MovieQuizResult result) {
        return ResponseEntity.ok(quizService.saveResult(result));
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<MovieQuizResult>> getLeaderboard() {
        return ResponseEntity.ok(quizService.getLeaderboard());
    }

    @GetMapping("/attempts/{userId}")
    public ResponseEntity<Long> getAttemptCount(@PathVariable Long userId) {
        return ResponseEntity.ok(quizService.getAttemptCount(userId));
    }

    // --- Admin Endpoints ---

    @PostMapping("/admin/questions")
    public ResponseEntity<MovieQuizQuestion> addQuestion(@RequestBody MovieQuizQuestion question) {
        // In a real app, you'd check auth here. The frontend will handle visibility.
        return ResponseEntity.ok(quizService.addQuestion(question));
    }

    @PostMapping("/admin/load-defaults")
    public ResponseEntity<List<MovieQuizQuestion>> loadDefaults() {
        // Logic will be handled in service
        return ResponseEntity.ok(quizService.initializeDefaultQuestions());
    }

    @DeleteMapping("/admin/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long id) {
        quizService.deleteQuestion(id);
        return ResponseEntity.ok().build();
    }
}
