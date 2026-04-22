package com.crewcanvas.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = true)
    private String password;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String role; 
    private String location;
    
    @Column(columnDefinition = "TEXT")
    private String skills; 
    
    private String experience;
    private String phone;
    private String availability;

    // --- Craft Specific Fields (Safe TEXT storage) ---
    @Column(columnDefinition = "TEXT")
    private String genres;
    
    @Column(columnDefinition = "TEXT")
    private String projectsDirected;
    
    @Column(columnDefinition = "TEXT")
    private String budgetHandled;
    
    @Column(columnDefinition = "TEXT")
    private String visionStatement;
    
    @Column(columnDefinition = "TEXT")
    private String editingSoftware;
    
    @Column(columnDefinition = "TEXT")
    private String portfolioVideos;
    
    @Column(columnDefinition = "TEXT")
    private String cameraExpertise;
    
    @Column(columnDefinition = "TEXT")
    private String sampleTracks;

    // --- Social Links ---
    private String instagram;
    private String youtube;
    private String tiktok;
    private String twitter;

    @Lob
    @Column(name = "profile_picture", columnDefinition = "LONGTEXT")
    private String profilePicture;

    @Lob
    @Column(name = "cover_image", columnDefinition = "LONGTEXT")
    private String coverImage;

    @Column(nullable = false)
    private Integer followers = 0;

    @Column(nullable = false)
    private Integer following = 0;

    @Column(name = "created_at")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public User() {}

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }
    
    // Craft Getters/Setters
    public String getGenres() { return genres; }
    public void setGenres(String genres) { this.genres = genres; }
    public String getProjectsDirected() { return projectsDirected; }
    public void setProjectsDirected(String projectsDirected) { this.projectsDirected = projectsDirected; }
    public String getBudgetHandled() { return budgetHandled; }
    public void setBudgetHandled(String budgetHandled) { this.budgetHandled = budgetHandled; }
    public String getVisionStatement() { return visionStatement; }
    public void setVisionStatement(String visionStatement) { this.visionStatement = visionStatement; }
    public String getEditingSoftware() { return editingSoftware; }
    public void setEditingSoftware(String editingSoftware) { this.editingSoftware = editingSoftware; }
    public String getPortfolioVideos() { return portfolioVideos; }
    public void setPortfolioVideos(String portfolioVideos) { this.portfolioVideos = portfolioVideos; }
    public String getCameraExpertise() { return cameraExpertise; }
    public void setCameraExpertise(String cameraExpertise) { this.cameraExpertise = cameraExpertise; }
    public String getSampleTracks() { return sampleTracks; }
    public void setSampleTracks(String sampleTracks) { this.sampleTracks = sampleTracks; }

    // Social Getters/Setters
    public String getInstagram() { return instagram; }
    public void setInstagram(String instagram) { this.instagram = instagram; }
    public String getYoutube() { return youtube; }
    public void setYoutube(String youtube) { this.youtube = youtube; }
    public String getTiktok() { return tiktok; }
    public void setTiktok(String tiktok) { this.tiktok = tiktok; }
    public String getTwitter() { return twitter; }
    public void setTwitter(String twitter) { this.twitter = twitter; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    public String getCoverImage() { return coverImage; }
    public void setCoverImage(String coverImage) { this.coverImage = coverImage; }
    public Integer getFollowers() { return followers; }
    public void setFollowers(Integer followers) { this.followers = followers; }
    public Integer getFollowing() { return following; }
    public void setFollowing(Integer following) { this.following = following; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
