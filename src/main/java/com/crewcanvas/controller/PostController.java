package com.crewcanvas.controller;

import com.crewcanvas.model.Comment;
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
    // CC-S1-103: Media Processing [Nelpatla Venkatesh] - Implement multi-image upload support and video processing logic.
    public ResponseEntity<?> createPost(@RequestBody PostRequest request) {
        try {
            System.out.println("Creating post. isPoll: " + request.isPoll());
            Post post;
            if (request.isPoll()) {
                System.out.println("Poll question: " + request.getPollQuestion());
                post = postService.createPoll(request.getUserId(), request.getPollQuestion(), request.getPollOptions());
            } else {
                post = postService.createPost(request.getUserId(), request.getContent(), request.getImageUrls(), request.getExternalLinks(), request.getAspectRatio());
            }
            return ResponseEntity.status(HttpStatus.CREATED).body(post);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("We couldn't share your post. Please try again.");
        }
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchPosts(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "all") String t,
            @RequestParam(defaultValue = "latest") String sortBy,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        try {
            if (q == null || q.trim().isEmpty()) {
                // If keywords are empty, we still apply filters if present
                if ((type != null && !type.equals("all")) || !sortBy.equals("latest") || !t.equals("all")) {
                    org.springframework.data.domain.Page<Post> posts = postService.searchAdvanced("", t, type, sortBy, page, size);
                    return ResponseEntity.ok(posts);
                }
                // fallback: return paginated all posts
                org.springframework.data.domain.Page<Post> posts = postService.getAllPosts(page, size);
                return ResponseEntity.ok(posts);
            }
            org.springframework.data.domain.Page<Post> posts = postService.searchAdvanced(q.trim(), t, type, sortBy, page, size);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Search failed.");
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllPosts(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        try {
            org.springframework.data.domain.Page<Post> posts = postService.getAllPosts(page, size);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to load the feed.");
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
                    .body("Something went wrong while fetching the post.");
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserPosts(@PathVariable Long userId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        try {
            org.springframework.data.domain.Page<Post> posts = postService.getUserPosts(userId, page, size);
            return ResponseEntity.ok(posts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Couldn't load user posts.");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable Long id, @RequestBody PostRequest request) {
        try {
            Post post = postService.updatePost(id, request.getContent(), request.getImageUrls(), request.getExternalLinks(), request.getAspectRatio());
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    // CC-S1-101: Secure Post Deletion [Nelpatla Venkatesh] - Implement ownership validation to ensure only the author can delete a post.
    public ResponseEntity<?> deletePost(@PathVariable Long id, @RequestParam Long userId) {
        try {
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
                    .body("Failed to like the post.");
        }
    }

    @PostMapping("/{id}/comment")
    public ResponseEntity<?> addComment(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, Object> payload) {
        try {
            String text = payload != null ? (String) payload.get("text") : "";
            Long userId = payload != null && payload.get("userId") != null ? Long.valueOf(payload.get("userId").toString()) : null;
            Long parentId = payload != null && payload.get("parentId") != null ? Long.valueOf(payload.get("parentId").toString()) : null;
            Comment comment = postService.addComment(id, userId, text, parentId);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to post your comment.");
        }
    }

    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<?> likeComment(@PathVariable Long commentId, @RequestBody java.util.Map<String, Long> payload) {
        try {
            Long userId = payload != null && payload.get("userId") != null ? payload.get("userId") : -1L;
            Comment comment = postService.likeComment(commentId, userId);
            return ResponseEntity.ok(comment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to like the comment.");
        }
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> getPostComments(@PathVariable Long id) {
        try {
            List<Comment> comments = postService.getCommentsForPost(id);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Couldn't load comments.");
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, @RequestParam Long userId) {
        try {
            postService.deleteComment(commentId, userId);
            return ResponseEntity.ok("Comment deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete comment.");
        }
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> votePoll(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        try {
            Long userId = payload.get("userId") != null ? Long.valueOf(payload.get("userId").toString()) : -1L;
            Integer optionIndex = payload.get("optionIndex") != null ? Integer.valueOf(payload.get("optionIndex").toString()) : -1;
            Post post = postService.votePoll(id, userId, optionIndex);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to cast your vote.");
        }
    }

    @PostMapping("/{id}/repost")
    public ResponseEntity<?> repostPost(@PathVariable Long id, @RequestBody(required = false) java.util.Map<String, Object> payload) {
        try {
            Long userId = payload != null && payload.get("userId") != null ? Long.valueOf(payload.get("userId").toString()) : null;
            String content = payload != null ? (String) payload.get("content") : "";
            Post repost = postService.repostPost(id, userId, content);
            return ResponseEntity.ok(repost);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to repost: " + e.getMessage());
        }
    }
}

class PostRequest {
    private Long userId;
    private String content;
    private List<String> imageUrls;
    private List<String> externalLinks;
    private boolean isPoll;
    private String pollQuestion;
    private List<String> pollOptions;

    private String aspectRatio = "original";

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

    @com.fasterxml.jackson.annotation.JsonProperty("isPoll")
    public boolean isPoll() {
        return isPoll;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isPoll")
    public void setPoll(boolean poll) {
        isPoll = poll;
    }

    public String getPollQuestion() {
        return pollQuestion;
    }

    public void setPollQuestion(String pollQuestion) {
        this.pollQuestion = pollQuestion;
    }

    public List<String> getPollOptions() {
        return pollOptions;
    }

    public void setPollOptions(List<String> pollOptions) {
        this.pollOptions = pollOptions;
    }

    public String getAspectRatio() {
        return aspectRatio;
    }

    public void setAspectRatio(String aspectRatio) {
        this.aspectRatio = aspectRatio;
    }
}
