package com.crewcanvas.controller;

import com.crewcanvas.model.Post;
import com.crewcanvas.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "*")
public class PostController {

    @Autowired
    private PostService postService;

    @PostMapping
    public ResponseEntity<?> createPost(@RequestBody PostRequest request) {
        try {
            Post post = postService.createPost(request.getUserId(), request.getContent(), request.getImageUrls(), request.getExternalLinks());
            return ResponseEntity.status(HttpStatus.CREATED).body(post);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating post: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "50") int size) {
        try {
            org.springframework.data.domain.Page<Post> posts = postService.getAllPosts(page, size);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getPost(@PathVariable Long id) {
        try {
            Optional<Post> post = postService.getPostById(id);
            if (post.isPresent()) {
                return ResponseEntity.ok(post.get());
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Post not found");
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPosts(@PathVariable Long userId) {
        try {
            List<Post> posts = postService.getUserPosts(userId);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody PostRequest request) {
        try {
            // FIXED Incident BF-303: Added ownership validation for updates
            Post post = postService.updatePost(id, request.getUserId(), request.getContent(), request.getImageUrls(), request.getExternalLinks());
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable Long id, @RequestParam Long userId) {
        try {
            // FIXED Incident BF-303: Passed userId to service for ownership validation
            postService.deletePost(id, userId);
            return ResponseEntity.ok("Post deleted successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, Long> payload) {
        try {
            Long userId = payload != null && payload.get("userId") != null ? payload.get("userId") : -1L;
            Post post = postService.likePost(id, userId);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, String> payload) {
        try {
            String text = payload != null ? payload.get("text") : "";
            Post post = postService.addComment(id, text);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}

class PostRequest {
    private Long userId;
    private String content;
    private List<String> imageUrls;
    private List<String> externalLinks;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public List<String> getExternalLinks() {
        return externalLinks;
    }

    public void setExternalLinks(List<String> externalLinks) {
        this.externalLinks = externalLinks;
    }
}
