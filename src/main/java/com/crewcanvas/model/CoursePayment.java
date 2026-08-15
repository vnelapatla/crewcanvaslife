package com.crewcanvas.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoursePayment {

    @Id
    @Column(name = "payment_id", unique = true, nullable = false)
    private String paymentId;

    @Column(name = "payment_link_id", nullable = true)
    private String paymentLinkId;

    @Column(name = "downloaded", nullable = false)
    private boolean downloaded = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "downloaded_at", nullable = true)
    private LocalDateTime downloadedAt;

}
