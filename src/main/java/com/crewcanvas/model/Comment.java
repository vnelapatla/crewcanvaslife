package com.crewcanvas.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "comments")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "post_id", nullable = false)
    private Long postId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "parent_id")
    private Long parentId; // For nested comments (replies)

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "comment_likes", joinColumns = @JoinColumn(name = "comment_id"))
    @Column(name = "user_id")
    private Set<Long> likedByUsers = new HashSet<>();

    @Column(name = "likes_count", nullable = false)
    private Integer likesCount = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Transient
    private java.util.Map<String, Object> userDetails;

    @Transient
    private java.util.List<Comment> replies = new java.util.ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (likesCount == null) likesCount = 0;
    }

    public Comment() {
    }

    public Comment(Long postId, Long userId, String content) {
        this.postId = postId;
        this.userId = userId;
        this.content = content;
    }

    public Comment(Long postId, Long userId, String content, Long parentId) {
        this.postId = postId;
        this.userId = userId;
        this.content = content;
        this.parentId = parentId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getPostId() {
        return postId;
    }

    public void setPostId(Long postId) {
        this.postId = postId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Set<Long> getLikedByUsers() {
        return likedByUsers;
    }

    public void setLikedByUsers(Set<Long> likedByUsers) {
        this.likedByUsers = likedByUsers;
    }

    public Integer getLikesCount() {
        return likesCount;
    }

    public void setLikesCount(Integer likesCount) {
        this.likesCount = likesCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.util.Map<String, Object> getUserDetails() {
        return userDetails;
    }

    public void setUserDetails(java.util.Map<String, Object> userDetails) {
        this.userDetails = userDetails;
    }

    public java.util.List<Comment> getReplies() {
        return replies;
    }

    public void setReplies(java.util.List<Comment> replies) {
        this.replies = replies;
    }
}
