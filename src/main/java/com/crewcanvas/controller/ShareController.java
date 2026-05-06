package com.crewcanvas.controller;

import com.crewcanvas.model.Event;
import com.crewcanvas.model.Post;
import com.crewcanvas.service.EventService;
import com.crewcanvas.service.PostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.Optional;

@Controller
@RequestMapping("/share")
public class ShareController {

    @Autowired
    private PostService postService;

    @Autowired
    private EventService eventService;

    @Autowired
    private com.crewcanvas.service.UserService userService;

    @GetMapping("/post/{id}")
    public ResponseEntity<String> sharePost(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        Optional<Post> postOpt = postService.getPostById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Post post = postOpt.get();
        String content = post.getContent() != null ? post.getContent() : "";
        String title = content.length() > 40 ? content.substring(0, 37) + "..." : (content.isEmpty() ? "New Post on CrewCanvas" : content);
        String truncatedDescription = truncateContent(content, 0.70);
        
        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String baseUrl = scheme + "://" + serverName + (serverPort == 80 || serverPort == 443 ? "" : ":" + serverPort);

        String imageUrl = baseUrl + "/share/image/post/" + id;

        String html = generateShareHtml(title, truncatedDescription, imageUrl, baseUrl + "/feed.html?postId=" + id, baseUrl);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    @GetMapping("/event/{id}")
    public ResponseEntity<String> shareEvent(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        Optional<Event> eventOpt = eventService.getEventById(id);
        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event event = eventOpt.get();
        String title = event.getTitle();
        String content = event.getDescription() != null ? event.getDescription() : "";
        String truncatedDescription = truncateContent(content, 0.70);
        
        // Hide contact info in the share preview
        truncatedDescription += "\n\n[Contact details hidden. Click to view on website]";

        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String baseUrl = scheme + "://" + serverName + (serverPort == 80 || serverPort == 443 ? "" : ":" + serverPort);

        String imageUrl = baseUrl + "/share/image/event/" + id;

        String html = generateShareHtml(title, truncatedDescription, imageUrl, baseUrl + "/event.html?eventId=" + id, baseUrl);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    @GetMapping("/deck/{id}")
    public ResponseEntity<String> shareProfile(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        Optional<com.crewcanvas.model.User> userOpt = userService.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        com.crewcanvas.model.User user = userOpt.get();
        String title = user.getName() + (user.getRole() != null ? " | " + user.getRole() : " | CrewCanvas Professional");
        
        StringBuilder desc = new StringBuilder();
        if (user.getRole() != null) desc.append("Role: ").append(user.getRole()).append(" | ");
        if (user.getLocation() != null) desc.append("📍 ").append(user.getLocation()).append(" | ");
        if (user.getSkills() != null) desc.append("Skills: ").append(user.getSkills());
        
        String finalDesc = desc.toString().isEmpty() ? "Check out my profile on CrewCanvas" : desc.toString();

        String scheme = request.getScheme();
        String serverName = request.getServerName();
        int serverPort = request.getServerPort();
        String baseUrl = scheme + "://" + serverName + (serverPort == 80 || serverPort == 443 ? "" : ":" + serverPort);

        String imageUrl = baseUrl + "/share/image/deck/" + id;

        String html = generateShareHtml(title, finalDesc, imageUrl, baseUrl + "/casting-deck.html?userId=" + id, baseUrl);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    @GetMapping("/image/post/{id}")
    public ResponseEntity<byte[]> getPostImage(@PathVariable Long id) {
        Optional<Post> postOpt = postService.getPostById(id);
        if (postOpt.isPresent() && postOpt.get().getImageUrls() != null && !postOpt.get().getImageUrls().isEmpty()) {
            return serveBase64Image(postOpt.get().getImageUrls().get(0));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/image/event/{id}")
    public ResponseEntity<byte[]> getEventImage(@PathVariable Long id) {
        Optional<Event> eventOpt = eventService.getEventById(id);
        if (eventOpt.isPresent() && eventOpt.get().getImageUrl() != null) {
            return serveBase64Image(eventOpt.get().getImageUrl());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/image/deck/{id}")
    public ResponseEntity<byte[]> getProfileImage(@PathVariable Long id) {
        Optional<com.crewcanvas.model.User> userOpt = userService.findById(id);
        if (userOpt.isPresent() && userOpt.get().getProfilePicture() != null) {
            return serveBase64Image(userOpt.get().getProfilePicture());
        }
        return ResponseEntity.notFound().build();
    }

    private ResponseEntity<byte[]> serveBase64Image(String base64) {
        try {
            if (base64.startsWith("data:image")) {
                String[] parts = base64.split(",");
                String contentType = parts[0].split(":")[1].split(";")[0];
                byte[] imageBytes = java.util.Base64.getDecoder().decode(parts[1]);

                // Load image to crop
                java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(imageBytes);
                java.awt.image.BufferedImage originalImage = javax.imageio.ImageIO.read(bais);

                if (originalImage != null) {
                    int width = originalImage.getWidth();
                    int height = originalImage.getHeight();
                    
                    // Crop top 70% (hides bottom 30% where contact details usually are)
                    int cropHeight = (int) (height * 0.70);
                    if (cropHeight > 0) {
                        java.awt.image.BufferedImage croppedImage = originalImage.getSubimage(0, 0, width, cropHeight);
                        
                        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                        String format = contentType.contains("/") ? contentType.split("/")[1] : "png";
                        javax.imageio.ImageIO.write(croppedImage, format, baos);
                        return ResponseEntity.ok()
                                .contentType(MediaType.parseMediaType(contentType))
                                .body(baos.toByteArray());
                    }
                }
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .body(imageBytes);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ResponseEntity.notFound().build();
    }

    private String truncateContent(String content, double percentage) {
        if (content == null || content.isEmpty()) return "";
        int length = (int) (content.length() * percentage);
        if (length < 20 && content.length() > 20) length = 20; // Minimum preview
        if (length >= content.length()) return content;
        return content.substring(0, length) + "...";
    }

    private String generateShareHtml(String title, String description, String imageUrl, String redirectUrl, String baseUrl) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"en\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>" + title + " | CrewCanvas</title>\n" +
                "    <meta property=\"og:site_name\" content=\"CrewCanvas\" />\n" +
                "    <meta property=\"og:title\" content=\"" + title + "\" />\n" +
                "    <meta property=\"og:description\" content=\"" + description.replace("\"", "&quot;") + "\" />\n" +
                "    <meta property=\"og:image\" content=\"" + imageUrl + "\" />\n" +
                "    <meta property=\"og:url\" content=\"" + redirectUrl + "\" />\n" +
                "    <meta property=\"og:type\" content=\"website\" />\n" +
                "    <meta name=\"twitter:card\" content=\"summary_large_image\" />\n" +
                "    <meta name=\"twitter:title\" content=\"" + title + "\" />\n" +
                "    <meta name=\"twitter:description\" content=\"" + description.replace("\"", "&quot;") + "\" />\n" +
                "    <meta name=\"twitter:image\" content=\"" + imageUrl + "\" />\n" +
                "    <link href=\"https://fonts.googleapis.com/css2?family=Outfit:wght@800;900&family=Inter:wght@400;600&display=swap\" rel=\"stylesheet\">\n" +
                "    <style>\n" +
                "        body { font-family: 'Inter', sans-serif; background: #020617; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }\n" +
                "        .teaser-card { text-align: center; max-width: 500px; width: 100%; }\n" +
                "        .logo { font-family: 'Outfit'; font-weight: 900; color: #ff8c00; font-size: 32px; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 10px; display: block; }\n" +
                "        .loader { width: 40px; height: 40px; border: 3px solid rgba(255,140,0,0.1); border-top-color: #ff8c00; border-radius: 50%; margin: 30px auto; animation: spin 1s linear infinite; }\n" +
                "        @keyframes spin { to { transform: rotate(360deg); } }\n" +
                "        h1 { font-family: 'Outfit'; font-size: 20px; color: #94a3b8; letter-spacing: 1px; font-weight: 600; }\n" +
                "    </style>\n" +
                "    <script>\n" +
                "        window.location.href = '" + redirectUrl + "';\n" +
                "    </script>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"teaser-card\">\n" +
                "        <div class=\"logo\">CrewCanvas</div>\n" +
                "        <div class=\"loader\"></div>\n" +
                "        <h1>Accessing Professional Casting Deck...</h1>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
