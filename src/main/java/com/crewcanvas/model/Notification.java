package com.crewcanvas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId; // Recipient

    @Column(name = "actor_id")
    private Long actorId; // Who triggered it

    @Column(name = "actor_name")
    private String actorName;

    @Lob
    @Column(name = "actor_avatar", columnDefinition = "LONGTEXT")
    private String actorAvatar;

    @Column(nullable = false)
    private String type; // FOLLOW, LIKE, COMMENT, MESSAGE, SHORTLIST, REJECT, VERIFY

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "target_id")
    private String targetId; // Post ID, Event ID, etc.

    @Column(name = "is_read")
    private boolean isRead = false;

    @Column(name = "created_at")
    private java.time.Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.Instant.now();
    }

    public Notification() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getActorId() { return actorId; }
    public void setActorId(Long actorId) { this.actorId = actorId; }
    public String getActorName() { return actorName; }
    public void setActorName(String actorName) { this.actorName = actorName; }
    public String getActorAvatar() { return actorAvatar; }
    public void setActorAvatar(String actorAvatar) { this.actorAvatar = actorAvatar; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTargetId() { return targetId; }
    public void setTargetId(String targetId) { this.targetId = targetId; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
    public java.time.Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.time.Instant createdAt) { this.createdAt = createdAt; }
}
