package com.crewcanvas.repository;

import com.crewcanvas.model.SupportDonation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SupportDonationRepository extends JpaRepository<SupportDonation, Long> {
    List<SupportDonation> findByStatus(String status);
}
