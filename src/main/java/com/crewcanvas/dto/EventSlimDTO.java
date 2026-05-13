package com.crewcanvas.dto;

import java.time.LocalDate;

public class EventSlimDTO {
    private Long id;
    private String title;
    private String eventType;
    private String location;
    private LocalDate date;
    private String status;
    private Integer applicants;
    private Boolean isManaged;
    private String shareKey;
    private String imageUrl;
    private java.time.Instant createdAt;

    public EventSlimDTO(com.crewcanvas.model.Event event) {
        this.id = event.getId();
        this.title = event.getTitle();
        this.eventType = event.getEventType();
        this.location = event.getLocation();
        this.date = event.getDate();
        this.status = event.getStatus();
        this.applicants = event.getApplicants();
        this.isManaged = event.getIsManaged();
        this.shareKey = event.getShareKey();
        this.imageUrl = event.getImageUrl();
        this.createdAt = event.getCreatedAt();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getEventType() { return eventType; }
    public String getLocation() { return location; }
    public LocalDate getDate() { return date; }
    public String getStatus() { return status; }
    public Integer getApplicants() { return applicants; }
    public Boolean getIsManaged() { return isManaged; }
    public String getShareKey() { return shareKey; }
    public String getImageUrl() { return imageUrl; }
    public java.time.Instant getCreatedAt() { return createdAt; }
}
