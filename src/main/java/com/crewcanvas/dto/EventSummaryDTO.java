package com.crewcanvas.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
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
    }
}
