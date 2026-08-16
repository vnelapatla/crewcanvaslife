package com.crewcanvas.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "profile_claim_audit_logs", indexes = {
    @Index(name = "idx_audit_profile_id", columnList = "profile_id"),
    @Index(name = "idx_audit_event_type", columnList = "event_type")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ProfileClaimAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "profile_id", nullable = false)
    private Long profileId;

    @Column(name = "invitation_id")
    private Long invitationId;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType; // PROFILE_CREATED, INVITATION_CREATED, INVITATION_SENT, INVITATION_OPENED, CLAIM_SUCCESSFUL, CLAIM_FAILED, INVITATION_EXPIRED, INVITATION_RESENT

    @Column(name = "event_details", length = 1000)
    private String eventDetails;

    @Column(name = "actor_user_id")
    private Long actorUserId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ProfileClaimAuditLog() {}

    public ProfileClaimAuditLog(Long profileId, Long invitationId, String eventType, String eventDetails, Long actorUserId) {
        this.profileId = profileId;
        this.invitationId = invitationId;
        this.eventType = eventType;
        this.eventDetails = eventDetails;
        this.actorUserId = actorUserId;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProfileId() { return profileId; }
    public void setProfileId(Long profileId) { this.profileId = profileId; }

    public Long getInvitationId() { return invitationId; }
    public void setInvitationId(Long invitationId) { this.invitationId = invitationId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getEventDetails() { return eventDetails; }
    public void setEventDetails(String eventDetails) { this.eventDetails = eventDetails; }

    public Long getActorUserId() { return actorUserId; }
    public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
