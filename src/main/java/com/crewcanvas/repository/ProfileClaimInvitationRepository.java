package com.crewcanvas.repository;

import com.crewcanvas.model.ProfileClaimInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileClaimInvitationRepository extends JpaRepository<ProfileClaimInvitation, Long> {
    Optional<ProfileClaimInvitation> findByTokenHash(String tokenHash);
    List<ProfileClaimInvitation> findByProfileId(Long profileId);
    Optional<ProfileClaimInvitation> findFirstByProfileIdOrderByCreatedAtDesc(Long profileId);
    List<ProfileClaimInvitation> findByStatus(String status);
    long countByStatus(String status);
}
