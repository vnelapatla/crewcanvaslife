package com.crewcanvas.dto;

import java.time.LocalDate;

public class EventSlimDTO {
    private Long id;
    private Long userId;
    private String title;
    private String eventType;
    private String location;
    private LocalDate date;
    private String status;
    private Integer applicants;
    private Boolean isManaged;
    private String shareKey;
    private String imageUrl;
    private String externalLink;
    private String adminNote;
    private String orgPhone;
    private java.time.Instant createdAt;

    public EventSlimDTO(com.crewcanvas.model.Event event) {
        this.id = event.getId();
        this.userId = event.getUserId();
        this.title = event.getTitle();
        this.eventType = event.getEventType();
        this.location = event.getLocation();
        this.date = event.getDate();
        this.status = event.getStatus();
        this.applicants = event.getApplicants();
        this.isManaged = event.getIsManaged();
        this.shareKey = event.getShareKey();
        this.imageUrl = event.getImageUrl();
        this.externalLink = event.getExternalLink();
        this.adminNote = event.getAdminNote();
        this.orgPhone = event.getOrgPhone();
        this.createdAt = event.getCreatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public String getTitle() { return title; }
    public String getEventType() { return eventType; }
    public String getLocation() { return location; }
    public LocalDate getDate() { return date; }
    public String getStatus() { return status; }
    public Integer getApplicants() { return applicants; }
    public Boolean getIsManaged() { return isManaged; }
    public String getShareKey() { return shareKey; }
    public String getImageUrl() { return imageUrl; }
    public String getExternalLink() { return externalLink; }
    public String getAdminNote() { return adminNote; }
    public String getOrgPhone() { return orgPhone; }
    public java.time.Instant getCreatedAt() { return createdAt; }
}
