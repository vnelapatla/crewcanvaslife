package com.crewcanvas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "author_id", nullable = true) // Redundant field for compatibility
    private Long authorId;

    @Column(length = 1000)
    private String content;

    @Column(name = "description")
    private String description = "";

    @Lob
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(name = "external_link", length = 500)
    private String externalLink;

    @Column(nullable = false)
    private Integer likes = 0;

    @Column(nullable = false)
    private Integer comments = 0;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "post_likes_users", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "user_id")
    private java.util.Set<Long> likedByUsers = new java.util.HashSet<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "post_actual_comments", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "comment_text", columnDefinition = "TEXT")
    private java.util.List<String> actualComments = new java.util.ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "post_images", joinColumns = @JoinColumn(name = "post_id"))
    @Lob
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private java.util.List<String> imageUrls = new java.util.ArrayList<>();

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "post_links", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "link", length = 500)
    private java.util.List<String> externalLinks = new java.util.ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    @OneToOne(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private Poll poll;

    public Poll getPoll() {
        return poll;
    }

    public void setPoll(Poll poll) {
        this.poll = poll;
        if (poll != null) {
            poll.setPost(this);
        }
    }

    @com.fasterxml.jackson.annotation.JsonProperty("isPoll")
    public boolean isPoll() {
        return poll != null;
    }

    // Proxy methods for frontend compatibility
    @com.fasterxml.jackson.annotation.JsonProperty("pollQuestion")
    public String getPollQuestion() {
        return poll != null ? poll.getQuestion() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("pollOptions")
    public List<String> getPollOptions() {
        if (poll == null) return null;
        List<String> options = new ArrayList<>();
        for (PollOption opt : poll.getOptions()) {
            options.add(opt.getOptionText());
        }
        return options;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("pollVotes")
    public java.util.Map<Long, Integer> getPollVotes() {
        return poll != null ? poll.getPollVotes() : null;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Constructors
    public Post() {
    }

    public Post(Long userId, String content) {
        this.userId = userId;
        this.authorId = userId;
        this.content = content;
    }

    public Post(Long userId, String content, java.util.List<String> imageUrls, java.util.List<String> externalLinks) {
        this.userId = userId;
        this.authorId = userId;
        this.content = content;
        this.imageUrls = imageUrls != null ? imageUrls : new java.util.ArrayList<>();
        this.externalLinks = externalLinks != null ? externalLinks : new java.util.ArrayList<>();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
        this.authorId = userId;
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public java.util.List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(java.util.List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public java.util.List<String> getExternalLinks() {
        return externalLinks;
    }

    public void setExternalLinks(java.util.List<String> externalLinks) {
        this.externalLinks = externalLinks;
    }

    public Integer getLikes() {
        return likes;
    }

    public void setLikes(Integer likes) {
        this.likes = likes;
    }

    public java.util.Set<Long> getLikedByUsers() {
        return likedByUsers;
    }

    public void setLikedByUsers(java.util.Set<Long> likedByUsers) {
        this.likedByUsers = likedByUsers;
    }

    public Integer getComments() {
        return comments;
    }

    public void setComments(Integer comments) {
        this.comments = comments;
    }

    public java.util.List<String> getActualComments() {
        return actualComments;
    }

    public void setActualComments(java.util.List<String> actualComments) {
        this.actualComments = actualComments;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

}
