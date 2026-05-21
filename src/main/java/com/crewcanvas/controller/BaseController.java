package com.crewcanvas.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public abstract class BaseController {

    protected ResponseEntity<?> buildErrorResponse(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error: " + e.getMessage());
    }

    protected ResponseEntity<?> buildErrorResponse(String prefix, Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(prefix + ": " + e.getMessage());
    }

    protected ResponseEntity<?> buildNotFoundErrorResponse(String message) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(message);
    }
}
