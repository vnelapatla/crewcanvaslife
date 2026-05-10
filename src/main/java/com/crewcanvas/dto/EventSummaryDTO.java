package com.crewcanvas.dto;

import java.time.LocalDate;

public class EventSummaryDTO {
    private Long id;
    private Long userId;
    private String title;
    private String eventType;
    private String location;
    private LocalDate date;
    private LocalDate endDate;
    private String timeDuration;
    private String imageUrl;
    private Integer applicants;
    private Integer capacity;
    private Double price;
    private String status;
    private Boolean isManaged;
    private String externalLink;
    private String adminNote;

    public EventSummaryDTO() {}

    public EventSummaryDTO(com.crewcanvas.model.Event event) {
        this.id = event.getId();
        this.userId = event.getUserId();
        this.title = event.getTitle();
        this.eventType = event.getEventType();
        this.location = event.getLocation();
        this.date = event.getDate();
        this.endDate = event.getEndDate();
        this.timeDuration = event.getTimeDuration();
        this.imageUrl = event.getImageUrl();
        this.applicants = event.getApplicants();
        this.capacity = event.getCapacity();
        this.price = event.getPrice();
        this.status = event.getStatus();
        this.isManaged = event.getIsManaged();
        this.externalLink = event.getExternalLink();
        this.adminNote = event.getAdminNote();
        // Removed description to optimize payload size
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getTimeDuration() { return timeDuration; }
    public void setTimeDuration(String timeDuration) { this.timeDuration = timeDuration; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Integer getApplicants() { return applicants; }
    public void setApplicants(Integer applicants) { this.applicants = applicants; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Boolean getIsManaged() { return isManaged; }
    public void setIsManaged(Boolean isManaged) { this.isManaged = isManaged; }
    public String getExternalLink() { return externalLink; }
    public void setExternalLink(String externalLink) { this.externalLink = externalLink; }
    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }
}
