package com.crewcanvas.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "event_applications")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class EventApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false)
    private Long eventId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    private String status = "PENDING"; // PENDING, SHORTLISTED, REJECTED

    @Column(name = "applied_at")
    private LocalDateTime appliedAt;

    @Transient
    private Integer matchScore = 0;

    @Column(name = "applicant_name")
    private String applicantName;

    @Column(name = "applicant_email")
    private String applicantEmail;

    private String role;

    private String location;

    @Column(length = 1000)
    private String experience;

    @Column(name = "event_title")
    private String eventTitle;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "event_location")
    private String eventLocation;

    @Column(name = "event_date")
    private String eventDate;

    @Column(name = "pass_token")
    private String passToken;

    @Column(name = "is_scanned")
    private Boolean scanned = false;

    @Lob
    @Column(name = "portfolio_link", columnDefinition = "LONGTEXT")
    private String portfolioLink;

    @Column(name = "additional_note", length = 1000)
    private String additionalNote;

    private String age;
    private String height;

    @Column(name = "mobile_number")
    private String mobileNumber;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photo1;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photo2;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photo3;

    @Lob
    @Column(name = "resume_url", columnDefinition = "LONGTEXT")
    private String resumeUrl;

    @Column(name = "resume_file_name")
    private String resumeFileName;

    @Column(name = "short_film_title")
    private String shortFilmTitle;

    @Column(name = "team_name")
    private String teamName;

    @Lob
    @Column(name = "video_url", columnDefinition = "LONGTEXT")
    private String videoUrl;

    @Column(name = "video_file_name")
    private String videoFileName;

    @Lob
    @Column(name = "poster_url", columnDefinition = "LONGTEXT")
    private String posterUrl;

    @PrePersist
    protected void onCreate() {
        appliedAt = LocalDateTime.now();
        if (scanned == null) scanned = false;
    }

    public EventApplication() {}

    public EventApplication(Long eventId, Long userId) {
        this.eventId = eventId;
        this.userId = userId;
        this.status = "PENDING";
        this.scanned = false;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public String getApplicantName() { return applicantName; }
    public void setApplicantName(String applicantName) { this.applicantName = applicantName; }

    public String getApplicantEmail() { return applicantEmail; }
    public void setApplicantEmail(String applicantEmail) { this.applicantEmail = applicantEmail; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }

    public String getEventTitle() { return eventTitle; }
    public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventLocation() { return eventLocation; }
    public void setEventLocation(String eventLocation) { this.eventLocation = eventLocation; }

    public String getEventDate() { return eventDate; }
    public void setEventDate(String eventDate) { this.eventDate = eventDate; }

    public String getPassToken() { return passToken; }
    public void setPassToken(String passToken) { this.passToken = passToken; }

    public Boolean isScanned() { return scanned != null && scanned; }
    public void setScanned(Boolean scanned) { this.scanned = scanned; }

    public String getPortfolioLink() { return portfolioLink; }
    public void setPortfolioLink(String portfolioLink) { this.portfolioLink = portfolioLink; }

    public String getAdditionalNote() { return additionalNote; }
    public void setAdditionalNote(String additionalNote) { this.additionalNote = additionalNote; }

    public String getAge() { return age; }
    public void setAge(String age) { this.age = age; }

    public String getHeight() { return height; }
    public void setHeight(String height) { this.height = height; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getPhoto1() { return photo1; }
    public void setPhoto1(String photo1) { this.photo1 = photo1; }

    public String getPhoto2() { return photo2; }
    public void setPhoto2(String photo2) { this.photo2 = photo2; }

    public String getPhoto3() { return photo3; }
    public void setPhoto3(String photo3) { this.photo3 = photo3; }

    public String getResumeUrl() { return resumeUrl; }
    public void setResumeUrl(String resumeUrl) { this.resumeUrl = resumeUrl; }

    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }

    public String getShortFilmTitle() { return shortFilmTitle; }
    public void setShortFilmTitle(String shortFilmTitle) { this.shortFilmTitle = shortFilmTitle; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getVideoUrl() { return videoUrl; }
    public void setVideoUrl(String videoUrl) { this.videoUrl = videoUrl; }

    public String getVideoFileName() { return videoFileName; }
    public void setVideoFileName(String videoFileName) { this.videoFileName = videoFileName; }

    public String getPosterUrl() { return posterUrl; }
    public void setPosterUrl(String posterUrl) { this.posterUrl = posterUrl; }
}
