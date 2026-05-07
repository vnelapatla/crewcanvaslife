package com.crewcanvas.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
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
        this.matchScore = 0;
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
        this.matchScore = app.getMatchScore();
    }
}
