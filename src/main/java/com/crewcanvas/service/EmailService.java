package com.crewcanvas.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    private void safeSend(SimpleMailMessage message) {
        try {
            mailSender.send(message);
        } catch (org.springframework.mail.MailSendException e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("550-5.4.5")) {
                System.err.println("[EMAIL LIMIT] Gmail daily limit exceeded. Skipping email to: " + message.getTo()[0]);
            } else {
                System.err.println("[EMAIL ERROR] Failed to send email to " + message.getTo()[0] + ": " + msg);
            }
        } catch (Exception e) {
            System.err.println("[EMAIL ERROR] Critical failure sending email: " + e.getMessage());
        }
    }

    @Async
    public void sendResetPasswordEmail(String to, String resetLink) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Reset Password to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Reset Your Password - CrewCanvas");
        message.setText("Click the link below to reset your password:\n\n" + resetLink + 
                        "\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.");
        
        safeSend(message);
    }

    @Async
    public void sendWelcomeEmail(String to, String name, String profileLink) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Welcome Email to: " + to);
            return;
        }
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
        safeSend(message);
    }

    @Async
    public void sendShortlistEmail(String to, String name, String eventTitle, String eventType) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Shortlist Notification to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        
        String phase = getEventPhase(eventType);
        message.setSubject("Congratulations! You're Shortlisted for " + eventTitle + " 🎉");

        String body = "Hi " + name + ",\n\n" +
                "Great news! You have been shortlisted for: " + eventTitle + " (" + eventType + ").\n\n" +
                "The organizers are impressed with your profile. " +
                "Soon you will receive further updates regarding the " + phase + " (location, time, and date) directly via the CrewCanvas platform and your email.\n\n" +
                "Keep an eye on your messages and notifications for the next steps.\n\n" +
                "Best of luck!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendEventDetailsEmail(String to, String name, String eventTitle, String eventType, String location, String time, String date) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Event Details to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        
        String subjectLabel = getBroadcastSubject(eventType);
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
        safeSend(message);
    }

    @Async
    public void sendFinalSelectionEmail(String to, String name, String eventTitle, String eventType) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Final Selection to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        
        String context = getEventContext(eventType);
        String phase = getEventPhase(eventType);
        String action = getEventAction(eventType);
        String details = getEventDetailsLabel(eventType);
        
        message.setSubject("Congratulations! You are SELECTED for " + eventTitle + " 🎉");

        String body = "Hi " + name + ",\n\n" +
                "We are thrilled to inform you that you have been SELECTED for the " + context + " you " + action + " in '" + eventTitle + "'.\n\n" +
                "The organizers were highly impressed with your performance during the " + phase + ". " +
                "They will connect with you manually soon to discuss the next steps and " + details + ".\n\n" +
                "Welcome to the team!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendFinalRejectionEmail(String to, String name, String eventTitle, String eventType) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Final Rejection to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        
        String phase = getEventPhase(eventType);
        message.setSubject("Update regarding your application for " + eventTitle);

        String body = "Hi " + name + ",\n\n" +
                "Thank you for participating in the " + phase + " for '" + eventTitle + "'.\n\n" +
                "While we were impressed with your profile, we regret to inform you that the organizers have decided to move forward with other candidates for this specific opportunity.\n\n" +
                "We truly appreciate the effort you put in. Please don't be discouraged, as many more opportunities will be coming up on CrewCanvas soon.\n\n" +
                "We wish you the very best in your future endeavors.\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendFollowNotificationEmail(String to, String followerName, String profileLink) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Follow Notification to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(followerName + " is now following you on CrewCanvas! 🚀");

        String body = "Hi,\n\n" +
                "Great news! " + followerName + " has just started following you on CrewCanvas. 🎬\n\n" +
                "Check out their profile here: " + profileLink + "\n\n" +
                "Building connections is a great way to grow your professional network in the creative industry.\n\n" +
                "Keep creating and connecting!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendMessageNotificationEmail(String to, String senderName, String messagePreview) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Message Notification to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("New message from " + senderName + " on CrewCanvas ✉️");

        String body = "Hi,\n\n" +
                "You have received a new message from " + senderName + ":\n\n" +
                "\"" + messagePreview + "\"\n\n" +
                "Reply to this message on the CrewCanvas platform here: https://crewcanvas.in/messages.html\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendLikeNotificationEmail(String to, String likerName, Long postId) {
        if (!emailEnabled) {
            System.err.println("[EMAIL SKIPPED] Like Notification to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(likerName + " liked your post! ❤️");

        String body = "Hi,\n\n" +
                "Great news! " + likerName + " liked your post on CrewCanvas. 🎬\n\n" +
                "View your post and see who else is interacting here: https://crewcanvas.in/feed.html\n\n" +
                "Keep sharing your creative journey!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendVerificationEmail(String to, String name) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Verification Email to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Congratulations! You are now a Verified Professional on CrewCanvas! ✅");

        String body = "Hi " + name + ",\n\n" +
                "We are excited to inform you that your profile has been officially verified by the CrewCanvas Admin Team! ✅\n\n" +
                "As a Verified Professional, you now have a verification badge on your profile and posts, which helps you stand out to productions and collaborators.\n\n" +
                "Keep up the great work and continue building your professional presence in the industry.\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendAdminPostNotificationEmail(String to, String name, String postContent, Long postId) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Admin Post Broadcast to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("New Requirement Posted by CrewCanvas Official 🎬");

        String postLink = "https://crewcanvas.in/feed.html?postId=" + postId;

        String body = "Hi " + name + ",\n\n" +
                "A new requirement has been posted by CrewCanvas Official:\n\n" +
                "\"" + postContent + "\"\n\n" +
                "For more details and to interact with this post, check this link:\n" + postLink + "\n\n" +
                "Stay tuned for more opportunities!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendProfileReminderEmail(String to, String name, String profileLink) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Profile Reminder to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Complete Your Profile for Better Opportunities! 🚀");
        
        String body = "Hi " + name + ",\n\n" +
                "We noticed your profile is not yet complete! 🎬\n\n" +
                "To get the most out of CrewCanvas and find better opportunities, please make sure to fill out your bio, role, and portfolio link. " +
                "A complete profile makes it much easier for productions and recruiters to find and recommend you.\n\n" +
                "Update your profile here: " + profileLink + "\n\n" +
                "More opportunities are waiting for you!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";
        
        message.setText(body);
        safeSend(message);
    }

    public String getBroadcastSubject(String eventType) {
        if (eventType == null) return "Event Details";
        switch (eventType.toLowerCase()) {
            case "audition": return "Audition Details";
            case "course": return "Course Schedule";
            case "workshop": return "Workshop Details";
            case "contest": return "Contest Venue & Time";
            case "film event": return "Event Logistics";
            default: return "Important Details";
        }
    }

    public String getEventAction(String eventType) {
        if (eventType == null) return "applied for";
        switch (eventType.toLowerCase()) {
            case "audition": return "auditioned for";
            case "course": return "applied for";
            case "workshop": return "applied for";
            case "contest": return "participated";
            case "film event": return "registered";
            default: return "applied for";
        }
    }

    public String getEventDetailsLabel(String eventType) {
        if (eventType == null) return "further details";
        switch (eventType.toLowerCase()) {
            case "audition": return "contract details";
            case "course": return "enrollment details";
            case "workshop": return "participation details";
            case "contest": return "prize details";
            case "film event": return "entry details";
            default: return "further details";
        }
    }

    public String getEventContext(String eventType) {
        if (eventType == null) return "opportunity";
        switch (eventType.toLowerCase()) {
            case "audition": return "role";
            case "course": return "seat";
            case "workshop": return "spot";
            case "contest": return "entry";
            case "film event": return "registration";
            default: return "opportunity";
        }
    }

    public String getEventPhase(String eventType) {
        if (eventType == null) return "application phase";
        switch (eventType.toLowerCase()) {
            case "audition": return "audition phase";
            case "course": return "admission phase";
            case "workshop": return "selection phase";
            case "contest": return "participation phase";
            case "film event": return "registration phase";
            default: return "application phase";
        }
    }
    @Async
    public void sendEventUpdateEmail(String to, String name, String eventTitle, String eventType, Long eventId) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Event Update to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Important Update: " + eventTitle + " 🎬");

        String body = "Hi " + name + ",\n\n" +
                "The organizers of '" + eventTitle + "' (" + eventType + ") have updated the event details.\n\n" +
                "Please review the changes to the location, date, or timing to ensure you have the most current information.\n\n" +
                "View the updated event here: https://crewcanvas.in/event.html?eventId=" + eventId + "\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendDonationThankYouEmail(String to, String name, String amount) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] Donation Thank You to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("A Heartfelt Thank You from CrewCanvas! ❤️");

        String body = "Hi " + name + ",\n\n" +
                "We have successfully verified your support of ₹" + amount + ". Thank you so much for your contribution! ❤️\n\n" +
                "Your support helps us keep CrewCanvas running and allows us to continue building features that help the creative community thrive.\n\n" +
                "We are truly grateful to have you as part of our journey.\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }

    @Async
    public void sendNewEventBroadcastEmail(String to, String name, String hostName, String eventTitle, String eventType, Long eventId) {
        if (!emailEnabled) {
            System.out.println("[EMAIL SKIPPED] New Event Broadcast to: " + to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("New Opportunity: " + eventTitle + " by " + hostName + " 🎬");

        String eventLink = "https://crewcanvas.in/event.html?id=" + eventId;

        String body = "Hi " + name + ",\n\n" +
                "A new opportunity has been posted on CrewCanvas by " + hostName + ":\n\n" +
                "✨ " + eventTitle + " (" + eventType + ")\n\n" +
                "Check out the details and apply here:\n" + eventLink + "\n\n" +
                "Don't miss out on this opportunity!\n\n" +
                "Best regards,\n" +
                "The CrewCanvas Team";

        message.setText(body);
        safeSend(message);
    }
}
