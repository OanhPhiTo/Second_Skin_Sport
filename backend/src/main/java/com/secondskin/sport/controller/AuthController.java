package com.secondskin.sport.controller;

import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(service.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(
            @RequestBody AuthRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            String refreshToken = authorizationHeader.substring(7);
            return ResponseEntity.ok(service.refreshToken(refreshToken));
        }
        return ResponseEntity.badRequest().build();
    }
}
