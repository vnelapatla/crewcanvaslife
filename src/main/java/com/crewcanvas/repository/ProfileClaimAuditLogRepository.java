package com.crewcanvas.repository;

import com.crewcanvas.model.ProfileClaimAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProfileClaimAuditLogRepository extends JpaRepository<ProfileClaimAuditLog, Long> {
    List<ProfileClaimAuditLog> findByProfileIdOrderByCreatedAtDesc(Long profileId);
    @org.springframework.transaction.annotation.Transactional
    void deleteByProfileId(Long profileId);
}
