package com.crewcanvas.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import java.io.IOException;

@Component
public class SecurityHeaderFilter implements Filter {

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        // 1. ZAP: Missing Anti-clickjacking Header (X-Frame-Options)
        httpResponse.setHeader("X-Frame-Options", "SAMEORIGIN");

        // 2. ZAP: X-Content-Type-Options Header Missing (nosniff)
        httpResponse.setHeader("X-Content-Type-Options", "nosniff");

        // 3. ZAP: Strict-Transport-Security Header Not Set (HSTS)
        // Enforces HTTPS for 1 year (31,536,000 seconds) including subdomains
        httpResponse.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

        // 4. Referrer Policy
        httpResponse.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

        // 4.5. ZAP: Server Leaks Version Information via "Server" HTTP Response Header Field
        httpResponse.setHeader("Server", "CrewCanvas");

        // 5. ZAP: Content Security Policy (CSP) Header Not Set
        // Restricts resource loading to self, Google Fonts, and Cloudflare CDN assets.
        httpResponse.setHeader("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://accounts.google.com; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://accounts.google.com; " +
                "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
                "img-src 'self' data: https://lh3.googleusercontent.com https://via.placeholder.com https://placehold.co; " +
                "connect-src 'self' https://accounts.google.com https://cdnjs.cloudflare.com; " +
                "frame-src 'self' https://accounts.google.com;");

        chain.doFilter(request, response);
    }
}
