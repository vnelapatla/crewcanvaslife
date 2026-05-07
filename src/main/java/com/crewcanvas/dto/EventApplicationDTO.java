package com.crewcanvas.dto;

import java.time.LocalDateTime;

public class EventApplicationDTO {
    private Long id;
    private Long eventId;
    private Long userId;
    private String status;
    private LocalDateTime appliedAt;
    private String applicantName;
    private String applicantEmail;
    private String role;
    private String location;
    private String mobileNumber;
    private String eventTitle;
    private String eventType;
    private Integer matchScore;

    public EventApplicationDTO() {}

    public EventApplicationDTO(com.crewcanvas.dto.EventApplicationSummary summary) {
        this.id = summary.getId();
        this.eventId = summary.getEventId();
        this.userId = summary.getUserId();
        this.status = summary.getStatus();
        this.appliedAt = summary.getAppliedAt();
        this.applicantName = summary.getApplicantName();
        this.applicantEmail = summary.getApplicantEmail();
        this.role = summary.getRole();
        this.location = summary.getLocation();
        this.mobileNumber = summary.getMobileNumber();
        this.eventTitle = summary.getEventTitle();
        this.eventType = summary.getEventType();
        this.matchScore = summary.getMatchScore() != null ? summary.getMatchScore() : 0;
    }

    public EventApplicationDTO(com.crewcanvas.model.EventApplication app) {
        this.id = app.getId();
        this.eventId = app.getEventId();
        this.userId = app.getUserId();
        this.status = app.getStatus();
        this.appliedAt = app.getAppliedAt();
        this.applicantName = app.getApplicantName();
        this.applicantEmail = app.getApplicantEmail();
        this.role = app.getRole();
        this.location = app.getLocation();
        this.mobileNumber = app.getMobileNumber();
        this.eventTitle = app.getEventTitle();
        this.eventType = app.getEventType();
        this.matchScore = app.getMatchScore() != null ? app.getMatchScore() : 0;
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
    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }
    public String getEventTitle() { return eventTitle; }
    public void setEventTitle(String eventTitle) { this.eventTitle = eventTitle; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }
}
