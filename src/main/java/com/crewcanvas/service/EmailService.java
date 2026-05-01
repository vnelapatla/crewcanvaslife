package com.crewcanvas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendResetPasswordEmail(String to, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Reset Your Password - CrewCanvas");
        message.setText("Click the link below to reset your password:\n\n" + resetLink + 
                        "\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.");
        
        mailSender.send(message);
    }

    public void sendWelcomeEmail(String to, String name, String profileLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Welcome to CrewCanvas! 🎬");
        
        String body = "Hi " + name + ",\n\n" +
                "Welcome to CrewCanvas! 🎬 We're thrilled to have you here.\n\n" +
                "To get the most out of this platform and catch up with upcoming openings, " +
                "please make sure to fill your profile to 100%. " +
                "Productions and recruiters will look into your profile for recommendations and casting.\n\n" +
                "View and complete your profile here: " + profileLink + "\n\n" +
                "Let's build something great together!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";
        
        message.setText(body);
        mailSender.send(message);
    }

    public void sendShortlistEmail(String to, String name, String eventTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Congratulations! You're Shortlisted for " + eventTitle + " 🎉");

        String body = "Hi " + name + ",\n\n" +
                "Great news! You have been shortlisted for the event: " + eventTitle + ".\n\n" +
                "We wanted to let you know that the organizers are impressed with your profile. " +
                "Soon you will receive further process updates like audition location, time, and date directly via the CrewCanvas platform and your email.\n\n" +
                "Keep an eye on your messages and notifications for the next steps.\n\n" +
                "Best of luck!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        mailSender.send(message);
    }

    public void sendEventDetailsEmail(String to, String name, String eventTitle, String eventType, String location, String time, String date) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        
        String subjectLabel = "Audition".equalsIgnoreCase(eventType) ? "Audition Details" : "Important Details";
        message.setSubject(subjectLabel + ": " + eventTitle + " 🎬");

        String body = "Hi " + name + ",\n\n" +
                "The organizers of '" + eventTitle + "' have shared the details for the upcoming " + (eventType != null ? eventType.toLowerCase() : "event") + ":\n\n" +
                "📍 Location: " + location + "\n" +
                "⏰ Time: " + time + "\n" +
                "📅 Date: " + date + "\n\n" +
                "Please make sure to reach the venue on time. If you have any questions, you can contact the organizers through the CrewCanvas platform.\n\n" +
                "Looking forward to seeing you there!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        mailSender.send(message);
    }

    public void sendFinalSelectionEmail(String to, String name, String eventTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Congratulations! You are SELECTED for " + eventTitle + " 🎉");

        String body = "Hi " + name + ",\n\n" +
                "We are thrilled to inform you that you have been SELECTED for the role you auditioned for in '" + eventTitle + "'.\n\n" +
                "The organizers were highly impressed with your performance during the audition phase. " +
                "They will connect with you manually soon to discuss the next steps and contract details.\n\n" +
                "Welcome to the team!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        mailSender.send(message);
    }

    public void sendFinalRejectionEmail(String to, String name, String eventTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Update regarding your audition for " + eventTitle);

        String body = "Hi " + name + ",\n\n" +
                "Thank you for participating in the auditions for '" + eventTitle + "'.\n\n" +
                "While we were impressed with your talent, we regret to inform you that we have decided to move forward with other candidates for this specific role.\n\n" +
                "We truly appreciate the effort you put into your audition. Please don't be discouraged, as many more opportunities will be coming up on CrewCanvas soon.\n\n" +
                "We wish you the very best in your future endeavors.\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        mailSender.send(message);
    }
}
