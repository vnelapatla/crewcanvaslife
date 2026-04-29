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

    @GetMapping("/post/{id}")
    public ResponseEntity<String> sharePost(@PathVariable Long id, jakarta.servlet.http.HttpServletRequest request) {
        Optional<Post> postOpt = postService.getPostById(id);
        if (postOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Post post = postOpt.get();
        String title = "New Post on CrewCanvas";
        String content = post.getContent() != null ? post.getContent() : "";
        String truncatedDescription = truncateContent(content, 0.55);
        
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
        String truncatedDescription = truncateContent(content, 0.55);
        
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

    private ResponseEntity<byte[]> serveBase64Image(String base64) {
        try {
            if (base64.startsWith("data:image")) {
                String[] parts = base64.split(",");
                String contentType = parts[0].split(":")[1].split(";")[0];
                byte[] imageBytes = java.util.Base64.getDecoder().decode(parts[1]);
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
                "    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap\" rel=\"stylesheet\">\n" +
                "    <style>\n" +
                "        body { font-family: 'Inter', sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }\n" +
                "        .teaser-card { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }\n" +
                "        .teaser-img { width: 100%; height: 250px; object-fit: cover; border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.05); }\n" +
                "        h1 { font-size: 24px; margin-bottom: 16px; color: #f8fafc; }\n" +
                "        p { font-size: 16px; line-height: 1.6; color: #94a3b8; margin-bottom: 32px; white-space: pre-wrap; }\n" +
                "        .btn { background: linear-gradient(135deg, #ff8c00, #ff5f00); color: white; text-decoration: none; padding: 16px 32px; border-radius: 14px; font-weight: 700; display: inline-block; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 10px 15px -3px rgba(255, 140, 0, 0.3); }\n" +
                "        .btn:hover { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(255, 140, 0, 0.4); }\n" +
                "        .logo { font-weight: 800; color: #ff8c00; margin-bottom: 40px; font-size: 28px; display: block; text-decoration: none; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"teaser-card\">\n" +
                "        <a href=\"" + baseUrl + "\" class=\"logo\">CrewCanvas</a>\n" +
                "        " + (imageUrl != null ? "<img src=\"" + imageUrl + "\" class=\"teaser-img\">" : "") + "\n" +
                "        <h1>" + title + "</h1>\n" +
                "        <p>" + description + "</p>\n" +
                "        <a href=\"" + redirectUrl + "\" class=\"btn\">View Full Post Details</a>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
