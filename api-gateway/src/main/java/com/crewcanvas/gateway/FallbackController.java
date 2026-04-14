package com.crewcanvas.gateway;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/fallback")
public class FallbackController {

    @RequestMapping("/userServiceFallback")
    public Mono<ResponseEntity<String>> userServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("User Service is currently unavailable. Please try again later."));
    }

    @RequestMapping("/eventServiceFallback")
    public Mono<ResponseEntity<String>> eventServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Event Service is currently unavailable. Please try again later."));
    }

    @RequestMapping("/feedServiceFallback")
    public Mono<ResponseEntity<String>> feedServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Feed Service is currently unavailable. Please try again later."));
    }

    @RequestMapping("/chatServiceFallback")
    public Mono<ResponseEntity<String>> chatServiceFallback() {
        return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body("Chat Service is currently unavailable. Please try again later."));
    }
}
