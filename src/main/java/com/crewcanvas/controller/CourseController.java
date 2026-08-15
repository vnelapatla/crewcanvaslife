package com.crewcanvas.controller;

import com.crewcanvas.service.CourseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;

import java.io.File;
import java.util.Map;

@RestController
@RequestMapping("/api/course")
public class CourseController {

    @Autowired
    private CourseService courseService;

    @Value("${course.script.file.path}")
    private String scriptFilePath;

    @GetMapping("/verify-payment")
    public RedirectView verifyPayment(@RequestParam Map<String, String> allParams) {
        boolean isValid = courseService.verifyAndRecordPayment(allParams);

        if (isValid) {
            String paymentId = allParams.get("razorpay_payment_id");
            return new RedirectView("/course-success.html?paymentId=" + paymentId);
        } else {
            return new RedirectView("/course.html?error=payment_failed");
        }
    }

    @GetMapping("/download/{paymentId}")
    public ResponseEntity<org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody> downloadScript(@PathVariable String paymentId) {
        // Verify payment ID exists and hasn't been downloaded
        boolean canDownload = courseService.markAsDownloaded(paymentId);

        if (!canDownload) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(null); // Or return a custom error message/page
        }

        try {
            File file = new File(scriptFilePath);
            if (!file.exists()) {
                // If the user hasn't configured the real file, we return a 404 or a placeholder text
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");

            org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody responseBody = outputStream -> {
                try (java.io.InputStream inputStream = new java.io.FileInputStream(file)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                }
            };

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(file.length())
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(responseBody);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
