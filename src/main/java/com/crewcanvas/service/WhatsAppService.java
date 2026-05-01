package com.crewcanvas.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.client.RestTemplate;
import java.util.HashMap;
import java.util.Map;

@Service
public class WhatsAppService {
    private static final Logger logger = LoggerFactory.getLogger(WhatsAppService.class);
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Sends a welcome message via WhatsApp.
     * Currently implemented as a placeholder. Connect to your preferred WhatsApp API provider here.
     */
    public void sendWelcomeWhatsApp(String phoneNumber, String name) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            logger.warn("Skipping WhatsApp welcome message for {}: Phone number not provided.", name);
            return;
        }

        // Clean phone number (remove +, spaces, etc.)
        String cleanPhone = phoneNumber.replaceAll("[^0-9]", "");
        
        // Ensure it has country code (assuming India +91 if not specified, or just leave as is if already has it)
        if (cleanPhone.length() == 10) {
            cleanPhone = "91" + cleanPhone;
        }

        String content = "Welcome to CrewCanvas! 🎬 We're thrilled to have you here. " +
                "To get the most out of this platform and catch up with upcoming openings, " +
                "please make sure to fill your profile to 100%. " +
                "Productions and recruiters will look into your profile for recommendations and casting. " +
                "Let's build something great together!";

        logger.info("Triggering WhatsApp Welcome Message to: {}", cleanPhone);

        try {
            // TODO: Replace with actual WhatsApp API Provider (e.g., Twilio, Interakt, UltraMsg)
            // Example for UltraMsg:
            /*
            String instanceId = "YOUR_INSTANCE_ID";
            String token = "YOUR_TOKEN";
            String url = "https://api.ultramsg.com/" + instanceId + "/messages/chat";
            
            Map<String, String> params = new HashMap<>();
            params.put("token", token);
            params.put("to", cleanPhone);
            params.put("body", content);
            
            restTemplate.postForEntity(url, params, String.class);
            */
            
            logger.info("WhatsApp Welcome Message logic executed for {}", cleanPhone);
        } catch (Exception e) {
            logger.error("Error sending WhatsApp message to {}: {}", cleanPhone, e.getMessage());
        }
    }
}
