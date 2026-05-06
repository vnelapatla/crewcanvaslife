package com.crewcanvas.controller;

import com.crewcanvas.model.SupportDonation;
import com.crewcanvas.repository.SupportDonationRepository;
import com.crewcanvas.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@CrossOrigin(origins = "*")
public class SupportController {

    @Autowired
    private SupportDonationRepository donationRepository;

    @Autowired
    private EmailService emailService;

    @GetMapping("/public/supporters")
    public ResponseEntity<List<java.util.Map<String, String>>> getPublicSupporters() {
        List<SupportDonation> allVerified = donationRepository.findByStatus("VERIFIED");
        
        // Find the highest amount to award the "SUPREME" badge
        double maxAmt = allVerified.stream()
            .mapToDouble(d -> {
                try { 
                    String clean = (d.getAmount() != null) ? d.getAmount().replaceAll("[^\\d.]", "") : "0";
                    return Double.parseDouble(clean); 
                } catch (Exception e) { return 0; }
            }).max().orElse(0);

        List<java.util.Map<String, String>> publicList = allVerified.stream()
            .sorted((a, b) -> {
                double amtA = 0, amtB = 0;
                try { amtA = Double.parseDouble(a.getAmount().replaceAll("[^\\d.]", "")); } catch (Exception e) {}
                try { amtB = Double.parseDouble(b.getAmount().replaceAll("[^\\d.]", "")); } catch (Exception e) {}
                
                if (amtA != amtB) return Double.compare(amtB, amtA); // Descending amount
                return b.getCreatedAt().compareTo(a.getCreatedAt()); // Descending time
            })
            .map(d -> {
                java.util.Map<String, String> map = new java.util.HashMap<>();
                
                double amt = 0;
                try { 
                    String clean = (d.getAmount() != null) ? d.getAmount().replaceAll("[^\\d.]", "") : "0";
                    amt = Double.parseDouble(clean); 
                } catch (Exception e) {}
            
            String badge = "FAN";
            if (amt >= 5000) badge = "PRODUCER";
            else if (amt >= 3500) badge = "EXECUTIVE";
            else if (amt >= 2000) badge = "LEGENDARY";
            else if (amt >= 1000) badge = "DIAMOND";
            else if (amt >= 500) badge = "GOLD";
            else if (amt >= 250) badge = "SILVER";
            else if (amt >= 100) badge = "BRONZE";

            // If this person is the #1 donor, they get the SUPREME badge instead
            if (amt > 0 && amt == maxAmt) {
                map.put("isTop", "true");
            }

            map.put("badge", badge);
            map.put("name", d.getDonorName());
            return map;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(publicList);
    }

    @PostMapping("/submit")
    public ResponseEntity<?> submitDonation(@RequestBody SupportDonation donation) {
        try {
            donation.setStatus("PENDING");
            SupportDonation saved = donationRepository.save(donation);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error submitting support record: " + e.getMessage());
        }
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<SupportDonation>> getAllDonations() {
        return ResponseEntity.ok(donationRepository.findAll());
    }

    @PostMapping("/admin/verify/{id}")
    public ResponseEntity<?> verifyDonation(@PathVariable Long id) {
        try {
            SupportDonation donation = donationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Donation not found"));
            
            donation.setStatus("VERIFIED");
            donationRepository.save(donation);

            // Send Thank You Email
            emailService.sendDonationThankYouEmail(donation.getEmail(), donation.getDonorName(), donation.getAmount());

            return ResponseEntity.ok("Verified and email sent!");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Verification failed: " + e.getMessage());
        }
    }
}
