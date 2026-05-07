package com.crewcanvas.dto;

import java.time.LocalDateTime;

public interface EventApplicationSummary {
    Long getId();
    Long getEventId();
    Long getUserId();
    String getStatus();
    LocalDateTime getAppliedAt();
    String getApplicantName();
    String getApplicantEmail();
    String getRole();
    String getLocation();
    String getMobileNumber();
    String getEventTitle();
    String getEventType();
    
    // We don't include the large LOB/LONGTEXT fields here:
    // photo1, photo2, photo3, resumeUrl, videoUrl, posterUrl
}
