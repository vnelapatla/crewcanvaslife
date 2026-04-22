package com.crewcanvas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "connections", uniqueConstraints = @UniqueConstraint(columnNames = { "follower_id", "following_id" }))
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Connection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "follower_id", nullable = false)
    private Long followerId; // User who follows

    @Column(name = "following_id", nullable = false)
    private Long followingId; // User being followed

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", insertable = false, updatable = false)
    private User follower;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", insertable = false, updatable = false)
    private User following;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public Connection() {
    }

    public Connection(Long followerId, Long followingId) {
        this.followerId = followerId;
        this.followingId = followingId;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getFollowerId() {
        return followerId;
    }

    public void setFollowerId(Long followerId) {
        this.followerId = followerId;
    }

    public Long getFollowingId() {
        return followingId;
    }

    public void setFollowingId(Long followingId) {
        this.followingId = followingId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getFollower() {
        return follower;
    }

    public void setFollower(User follower) {
        this.follower = follower;
    }

    public User getFollowing() {
        return following;
    }

    public void setFollowing(User following) {
        this.following = following;
    }
}
