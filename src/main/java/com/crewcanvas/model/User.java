package com.crewcanvas.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonFormat;
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

    @Column(name = "google_id", unique = true, length = 191)
    private String googleId;

    @Column(name = "user_type", columnDefinition = "TEXT")
    private String userType = "Explorer";

    @Column(name = "is_verified_professional")
    private Boolean isVerifiedProfessional = false;

    @Column(name = "is_admin")
    private Boolean isAdmin = false;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String role; 
    @Column(columnDefinition = "TEXT")
    private String location;
    
    @Column(columnDefinition = "TEXT")
    private String skills; 
    
    @Column(columnDefinition = "TEXT")
    private String experience;
    @Column(columnDefinition = "TEXT")
    private String phone;
    @Column(columnDefinition = "TEXT")
    private String availability;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private java.time.LocalDate availabilityFrom;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private java.time.LocalDate availabilityTo;

    @Column(name = "expected_movie_remuneration", columnDefinition = "TEXT")
    @JsonProperty("expectedMovieRemuneration")
    private String expectedMovieRemuneration;

    @Column(name = "expected_webseries_remuneration", columnDefinition = "TEXT")
    @JsonProperty("expectedWebseriesRemuneration")
    private String expectedWebseriesRemuneration;

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

    // --- New Role-Specific Fields (Stored as TEXT to avoid row size limits) ---
    @Column(columnDefinition = "TEXT")
    private String height;
    @Column(columnDefinition = "TEXT")
    private String weight;
    @Column(columnDefinition = "TEXT")
    private String ageRange;
    @Column(columnDefinition = "TEXT")
    private String gender;
    @Column(columnDefinition = "TEXT")
    private String bodyType;

    @Column(columnDefinition = "TEXT")
    private String languages;
    
    @Column(columnDefinition = "TEXT")
    private String teamSize;

    @Column(columnDefinition = "TEXT")
    private String showreel;

    @Column(columnDefinition = "TEXT")
    private String editingStyle;

    @Column(columnDefinition = "TEXT")
    private String experienceDetails;

    @Column(columnDefinition = "TEXT")
    private String turnaroundTime;

    @Column(columnDefinition = "TEXT")
    private String daws;

    @Column(columnDefinition = "TEXT")
    private String instruments;

    @Column(columnDefinition = "TEXT")
    private String musicExperience;

    @Column(columnDefinition = "TEXT")
    private String interests;

    @Column(columnDefinition = "TEXT")
    private String occupation;

    @Column(columnDefinition = "TEXT")
    private String goals;

    @Column(columnDefinition = "TEXT")
    private String learningResources;

    // --- Social Links ---
    @Column(columnDefinition = "TEXT")
    private String instagram;
    @Column(columnDefinition = "TEXT")
    private String youtube;
    @Column(columnDefinition = "TEXT")
    private String tiktok;
    @Column(columnDefinition = "TEXT")
    private String twitter;

    @Lob
    @Column(name = "profile_picture", columnDefinition = "LONGTEXT")
    private String profilePicture;

    @Lob
    @Column(name = "cover_image", columnDefinition = "LONGTEXT")
    private String coverImage;
    
    @Lob
    @Column(name = "resume", columnDefinition = "LONGBLOB")
    private String resume;

    @Column(name = "resume_file_name")
    private String resumeFileName;

    @Column(name = "resume_content_type")
    private String resumeContentType;

    @Column(nullable = false)
    private Integer followers = 0;

    @Column(nullable = false)
    private Integer following = 0;

    @Column(name = "profile_score", nullable = false)
    private Integer profileScore = 0;

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
        this.profileScore = calculateProfileScore();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        this.profileScore = calculateProfileScore();
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
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
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
    public java.time.LocalDate getAvailabilityFrom() { return availabilityFrom; }
    public void setAvailabilityFrom(java.time.LocalDate availabilityFrom) { this.availabilityFrom = availabilityFrom; }
    public java.time.LocalDate getAvailabilityTo() { return availabilityTo; }
    public void setAvailabilityTo(java.time.LocalDate availabilityTo) { this.availabilityTo = availabilityTo; }
    public String getExpectedMovieRemuneration() { return expectedMovieRemuneration; }
    public void setExpectedMovieRemuneration(String expectedMovieRemuneration) { this.expectedMovieRemuneration = expectedMovieRemuneration; }
    public String getExpectedWebseriesRemuneration() { return expectedWebseriesRemuneration; }
    public void setExpectedWebseriesRemuneration(String expectedWebseriesRemuneration) { this.expectedWebseriesRemuneration = expectedWebseriesRemuneration; }
    
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

    public String getHeight() { return height; }
    public void setHeight(String height) { this.height = height; }
    public String getWeight() { return weight; }
    public void setWeight(String weight) { this.weight = weight; }
    public String getAgeRange() { return ageRange; }
    public void setAgeRange(String ageRange) { this.ageRange = ageRange; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getBodyType() { return bodyType; }
    public void setBodyType(String bodyType) { this.bodyType = bodyType; }
    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }
    
    public String getTeamSize() { return teamSize; }
    public void setTeamSize(String teamSize) { this.teamSize = teamSize; }
    public String getShowreel() { return showreel; }
    public void setShowreel(String showreel) { this.showreel = showreel; }
    
    public String getEditingStyle() { return editingStyle; }
    public void setEditingStyle(String editingStyle) { this.editingStyle = editingStyle; }
    public String getExperienceDetails() { return experienceDetails; }
    public void setExperienceDetails(String experienceDetails) { this.experienceDetails = experienceDetails; }
    public String getTurnaroundTime() { return turnaroundTime; }
    public void setTurnaroundTime(String turnaroundTime) { this.turnaroundTime = turnaroundTime; }
    
    public String getDaws() { return daws; }
    public void setDaws(String daws) { this.daws = daws; }
    public String getInstruments() { return instruments; }
    public void setInstruments(String instruments) { this.instruments = instruments; }
    public String getMusicExperience() { return musicExperience; }
    public void setMusicExperience(String musicExperience) { this.musicExperience = musicExperience; }

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
    public String getResume() { return resume; }
    public void setResume(String resume) { this.resume = resume; }
    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }
    public String getResumeContentType() { return resumeContentType; }
    public void setResumeContentType(String resumeContentType) { this.resumeContentType = resumeContentType; }
    public Integer getFollowers() { return followers; }
    public void setFollowers(Integer followers) { this.followers = followers; }
    public Integer getFollowing() { return following; }
    public void setFollowing(Integer following) { this.following = following; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getInterests() { return interests; }
    public void setInterests(String interests) { this.interests = interests; }
    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }
    public String getGoals() { return goals; }
    public void setGoals(String goals) { this.goals = goals; }
    public String getLearningResources() { return learningResources; }
    public void setLearningResources(String learningResources) { this.learningResources = learningResources; }

    public String getUserType() { return userType; }
    public void setUserType(String userType) { this.userType = userType; }

    public Boolean getIsVerifiedProfessional() { return isVerifiedProfessional; }
    public void setIsVerifiedProfessional(Boolean isVerifiedProfessional) { this.isVerifiedProfessional = isVerifiedProfessional; }

    public Boolean getIsAdmin() { return isAdmin; }
    public void setIsAdmin(Boolean isAdmin) { this.isAdmin = isAdmin; }

    public Integer getProfileScore() {
        return profileScore;
    }

    public void setProfileScore(Integer profileScore) {
        this.profileScore = profileScore;
    }

    private int calculateProfileScore() {
        int score = 0;
        
        // Identity (Max 25)
        if (name != null && !name.isEmpty()) score += 10;
        if (phone != null && !phone.isEmpty()) score += 5;
        if (location != null && !location.isEmpty()) score += 5;
        if (bio != null && !bio.isEmpty()) score += 5;
        
        // Visuals (Max 20)
        if (profilePicture != null && !profilePicture.isEmpty()) score += 10;
        if (coverImage != null && !coverImage.isEmpty()) score += 10;
        
        // Professional (Max 30)
        if (role != null && !role.isEmpty()) score += 10;
        if (skills != null && !skills.isEmpty()) score += 10;
        if (experience != null && !experience.isEmpty()) score += 10;
        
        // Portfolio & Social (Max 25)
        if (showreel != null && !showreel.isEmpty() || portfolioVideos != null && !portfolioVideos.isEmpty()) score += 15;
        if (instagram != null || youtube != null || twitter != null || tiktok != null) score += 10;
        
        return Math.min(score, 100);
    }
}
