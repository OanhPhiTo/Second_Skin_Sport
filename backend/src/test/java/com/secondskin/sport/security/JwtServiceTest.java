package com.secondskin.sport.security;

import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import io.jsonwebtoken.security.SignatureException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JwtService - Unit Tests (F01)")
class JwtServiceTest {

    private JwtService jwtService;
    private User testUser;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService("404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        testUser = new User("Athlete One", "athlete@secondskin.com", "pass123", Role.USER, "Running");
        testUser.setId(10L);
    }

    @Test
    @DisplayName("Generate token and extract valid username and role")
    void testGenerateTokenAndExtractClaims() {
        String token = jwtService.generateToken(testUser);
        assertNotNull(token);

        String username = jwtService.extractUsername(token);
        assertEquals("athlete@secondskin.com", username);

        String role = jwtService.extractRole(token);
        assertEquals("USER", role);

        assertTrue(jwtService.isTokenValid(token, testUser));
    }

    @Test
    @DisplayName("Token signed with different secret key must be rejected with SignatureException")
    void testTokenSignedWithDifferentSecret_IsRejected() {
        // Sign token with a different 256-bit secret
        JwtService rogueJwtService = new JwtService("504E635266556A586E3272357538782F413F4428472B4B6250645367566B5971");
        String forgedToken = rogueJwtService.generateToken(testUser);

        // Attempting to extract claims or validate with primary jwtService must fail
        assertThrows(SignatureException.class, () -> {
            jwtService.extractUsername(forgedToken);
        });
    }

    @Test
    @DisplayName("Generate refresh token extracts subject correctly")
    void testGenerateRefreshToken() {
        String refreshToken = jwtService.generateRefreshToken(testUser);
        assertNotNull(refreshToken);
        assertEquals("athlete@secondskin.com", jwtService.extractUsername(refreshToken));
    }
}
