package com.crewcanvas.dto;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class PostDTO {
    private Long id;
    private Long userId;
    private String content;
    private List<String> imageUrls;
    private List<String> externalLinks;
    private Integer likes;
    private Integer comments;
    private Boolean isPoll;
    private String pollQuestion;
    private List<String> pollOptions;
    private Map<Long, Integer> pollVotes;
    private Instant createdAt;
    private UserListDTO user;

    public PostDTO() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public List<String> getImageUrls() { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public List<String> getExternalLinks() { return externalLinks; }
    public void setExternalLinks(List<String> externalLinks) { this.externalLinks = externalLinks; }
    public Integer getLikes() { return likes; }
    public void setLikes(Integer likes) { this.likes = likes; }
    public Integer getComments() { return comments; }
    public void setComments(Integer comments) { this.comments = comments; }
    public Boolean getIsPoll() { return isPoll; }
    public void setIsPoll(Boolean isPoll) { this.isPoll = isPoll; }
    public String getPollQuestion() { return pollQuestion; }
    public void setPollQuestion(String pollQuestion) { this.pollQuestion = pollQuestion; }
    public List<String> getPollOptions() { return pollOptions; }
    public void setPollOptions(List<String> pollOptions) { this.pollOptions = pollOptions; }
    public Map<Long, Integer> getPollVotes() { return pollVotes; }
    public void setPollVotes(Map<Long, Integer> pollVotes) { this.pollVotes = pollVotes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public UserListDTO getUser() { return user; }
    public void setUser(UserListDTO user) { this.user = user; }
}
