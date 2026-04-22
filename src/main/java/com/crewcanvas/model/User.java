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

    @Column(nullable = true) // Relaxed for BF-102 Simulation
    private String password;

    @Column(length = 500)
    private String bio;

    private String role; // Director, Actor, Cinematographer, etc.

    private String location;

    private String skills; // Comma-separated

    private String phone;
    
    @Column(name = "projects_count")
    private String projectsCount;
    
    @Column(name = "linkedin_profile")
    private String linkedinProfile;
    
    @Column(name = "personal_website")
    private String personalWebsite;
    
    private String instagram;
    
    private String youtube;
    private String tiktok;
    private String twitter;
    private String vimeo;
    private String behance;
    private String facebook;
    private String threads;

    private String experience;
    private String languages;
    private String availability;
    
    @Column(name = "contact_visible")
    private Boolean contactVisible = true;

    @Column(name = "profile_visibility")
    private String profileVisibility = "Everyone";

    @Column(name = "message_permissions")
    private String messagePermissions = "Everyone";

    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;

    @Column(name = "follower_notifications")
    private Boolean followerNotifications = true;

    @Column(name = "event_reminders")
    private Boolean eventReminders = true;

    private String budgetQuote;
    private String availableFrom;
    private String availableTo;

    private String gender;
    private String age;
    private String skinTone;
    private String height;

    // --- Dynamic Craft Fields ---
    
    // Director
    private String genres;
    private String projectsDirected;
    private String budgetHandled;
    private String teamSizeHandled;
    private String visionStatement;

    // Editor
    private String editingSoftware;
    private String editingStyle;
    private String portfolioVideos;
    private String turnaroundTime;

    // DOP
    private String cameraExpertise;
    private String lightingStyle;

    // Music Director
    private String daws;
    private String sampleTracks;
    private String instruments;

    // Colorist
    private String colorSoftware;
    private String colorPanel;
    private String colorMonitor;

    // Screenwriter
    private String writerGenre;
    private String writerSoftware;
    private String writerScripts;

    // VFX & Animator
    private String vfxSoftware;
    private String vfxSpecialty;

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

    @Column(name = "auth_provider")
    private String authProvider; // "local", "google"

    @Column(name = "provider_id")
    private String providerId;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Constructors
    public User() {
    }

    public User(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getSkills() {
        return skills;
    }

    public void setSkills(String skills) {
        this.skills = skills;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public Integer getFollowers() {
        return followers;
    }

    public void setFollowers(Integer followers) {
        this.followers = followers;
    }

    public Integer getFollowing() {
        return following;
    }

    public void setFollowing(Integer following) {
        this.following = following;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getProjectsCount() {
        return projectsCount;
    }

    public void setProjectsCount(String projectsCount) {
        this.projectsCount = projectsCount;
    }

    public String getLinkedinProfile() {
        return linkedinProfile;
    }

    public void setLinkedinProfile(String linkedinProfile) {
        this.linkedinProfile = linkedinProfile;
    }

    public String getPersonalWebsite() {
        return personalWebsite;
    }

    public void setPersonalWebsite(String personalWebsite) {
        this.personalWebsite = personalWebsite;
    }

    public String getInstagram() {
        return instagram;
    }

    public void setInstagram(String instagram) {
        this.instagram = instagram;
    }

    public String getAuthProvider() {
        return authProvider;
    }

    public void setAuthProvider(String authProvider) {
        this.authProvider = authProvider;
    }

    public String getProviderId() {
        return providerId;
    }

    public void setProviderId(String providerId) {
        this.providerId = providerId;
    }

    public String getYoutube() { return youtube; }
    public void setYoutube(String youtube) { this.youtube = youtube; }

    public String getTiktok() { return tiktok; }
    public void setTiktok(String tiktok) { this.tiktok = tiktok; }

    public String getTwitter() { return twitter; }
    public void setTwitter(String twitter) { this.twitter = twitter; }

    public String getVimeo() { return vimeo; }
    public void setVimeo(String vimeo) { this.vimeo = vimeo; }

    public String getBehance() { return behance; }
    public void setBehance(String behance) { this.behance = behance; }

    public String getFacebook() { return facebook; }
    public void setFacebook(String facebook) { this.facebook = facebook; }

    public String getThreads() { return threads; }
    public void setThreads(String threads) { this.threads = threads; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public Boolean getContactVisible() { return contactVisible; }
    public Boolean isContactVisible() { return contactVisible; }
    public void setContactVisible(Boolean contactVisible) { this.contactVisible = contactVisible; }

    public String getProfileVisibility() { return profileVisibility; }
    public void setProfileVisibility(String profileVisibility) { this.profileVisibility = profileVisibility; }

    public String getMessagePermissions() { return messagePermissions; }
    public void setMessagePermissions(String messagePermissions) { this.messagePermissions = messagePermissions; }

    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }

    public Boolean getFollowerNotifications() { return followerNotifications; }
    public void setFollowerNotifications(Boolean followerNotifications) { this.followerNotifications = followerNotifications; }

    public Boolean getEventReminders() { return eventReminders; }
    public void setEventReminders(Boolean eventReminders) { this.eventReminders = eventReminders; }

    public String getBudgetQuote() { return budgetQuote; }
    public void setBudgetQuote(String budgetQuote) { this.budgetQuote = budgetQuote; }

    public String getAvailableFrom() { return availableFrom; }
    public void setAvailableFrom(String availableFrom) { this.availableFrom = availableFrom; }

    public String getAvailableTo() { return availableTo; }
    public void setAvailableTo(String availableTo) { this.availableTo = availableTo; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getAge() { return age; }
    public void setAge(String age) { this.age = age; }

    public String getSkinTone() { return skinTone; }
    public void setSkinTone(String skinTone) { this.skinTone = skinTone; }

    public String getHeight() { return height; }
    public void setHeight(String height) { this.height = height; }

    public String getGenres() { return genres; }
    public void setGenres(String genres) { this.genres = genres; }

    public String getProjectsDirected() { return projectsDirected; }
    public void setProjectsDirected(String projectsDirected) { this.projectsDirected = projectsDirected; }

    public String getBudgetHandled() { return budgetHandled; }
    public void setBudgetHandled(String budgetHandled) { this.budgetHandled = budgetHandled; }

    public String getTeamSizeHandled() { return teamSizeHandled; }
    public void setTeamSizeHandled(String teamSizeHandled) { this.teamSizeHandled = teamSizeHandled; }

    public String getVisionStatement() { return visionStatement; }
    public void setVisionStatement(String visionStatement) { this.visionStatement = visionStatement; }

    public String getEditingSoftware() { return editingSoftware; }
    public void setEditingSoftware(String editingSoftware) { this.editingSoftware = editingSoftware; }

    public String getEditingStyle() { return editingStyle; }
    public void setEditingStyle(String editingStyle) { this.editingStyle = editingStyle; }

    public String getPortfolioVideos() { return portfolioVideos; }
    public void setPortfolioVideos(String portfolioVideos) { this.portfolioVideos = portfolioVideos; }

    public String getTurnaroundTime() { return turnaroundTime; }
    public void setTurnaroundTime(String turnaroundTime) { this.turnaroundTime = turnaroundTime; }

    public String getCameraExpertise() { return cameraExpertise; }
    public void setCameraExpertise(String cameraExpertise) { this.cameraExpertise = cameraExpertise; }

    public String getLightingStyle() { return lightingStyle; }
    public void setLightingStyle(String lightingStyle) { this.lightingStyle = lightingStyle; }

    public String getDaws() { return daws; }
    public void setDaws(String daws) { this.daws = daws; }

    public String getSampleTracks() { return sampleTracks; }
    public void setSampleTracks(String sampleTracks) { this.sampleTracks = sampleTracks; }

    public String getInstruments() { return instruments; }
    public void setInstruments(String instruments) { this.instruments = instruments; }

    public String getColorSoftware() { return colorSoftware; }
    public void setColorSoftware(String colorSoftware) { this.colorSoftware = colorSoftware; }

    public String getColorPanel() { return colorPanel; }
    public void setColorPanel(String colorPanel) { this.colorPanel = colorPanel; }

    public String getColorMonitor() { return colorMonitor; }
    public void setColorMonitor(String colorMonitor) { this.colorMonitor = colorMonitor; }

    public String getWriterGenre() { return writerGenre; }
    public void setWriterGenre(String writerGenre) { this.writerGenre = writerGenre; }

    public String getWriterSoftware() { return writerSoftware; }
    public void setWriterSoftware(String writerSoftware) { this.writerSoftware = writerSoftware; }

    public String getWriterScripts() { return writerScripts; }
    public void setWriterScripts(String writerScripts) { this.writerScripts = writerScripts; }

    public String getVfxSoftware() { return vfxSoftware; }
    public void setVfxSoftware(String vfxSoftware) { this.vfxSoftware = vfxSoftware; }

    public String getVfxSpecialty() { return vfxSpecialty; }
    public void setVfxSpecialty(String vfxSpecialty) { this.vfxSpecialty = vfxSpecialty; }

    @Override
    public String toString() {
        return "User{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                ", experience='" + experience + '\'' +
                ", availability='" + availability + '\'' +
                ", location='" + location + '\'' +
                ", createdAt=" + createdAt +
                '}';
    }
}
