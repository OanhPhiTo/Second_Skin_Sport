package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll(); // Clean DB before each test
    }

    @Test
    public void testUnauthorizedAccessToProtectedEndpoint_ShouldReturn403() throws Exception {
        // Trying to access /api/sessions without a token should fail
        mockMvc.perform(get("/api/sessions"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUserRegistrationAndLogin_ShouldReturnToken() throws Exception {
        // 1. Register a new user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setName("Test User");
        registerRequest.setEmail("testuser@example.com");
        registerRequest.setPassword("securePassword123");
        registerRequest.setPreferredSport("Running");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());

        // 2. Login with the registered user
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setEmail("testuser@example.com");
        loginRequest.setPassword("securePassword123");

        String responseContent = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn().getResponse().getContentAsString();

        // 3. Extract token
        String token = objectMapper.readTree(responseContent).get("token").asText();

        // 4. Access protected endpoint with token
        mockMvc.perform(get("/api/sessions")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()); // Assuming it returns 200 OK (empty list)
    }

    @Test
    public void testLoginWithWrongPassword_ShouldFail() throws Exception {
        // 1. Register a user
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setName("John Doe");
        registerRequest.setEmail("john@example.com");
        registerRequest.setPassword("correctPassword");
        registerRequest.setPreferredSport("Basketball");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)));

        // 2. Try to login with wrong password
        AuthRequest loginRequest = new AuthRequest();
        loginRequest.setEmail("john@example.com");
        loginRequest.setPassword("wrongPassword");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isForbidden()); // Spring Security standard for bad credentials is 401 or 403
    }

    // F02 Tests: Hardened Endpoint Authorization
    @Test
    public void testUnauthorizedAccessToSensorData_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/sensor-data/latest"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUnauthorizedAccessToSessionSensorData_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/sensor-data/session/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUnauthorizedAccessToAutoSession_ShouldReturn403() throws Exception {
        mockMvc.perform(post("/api/sessions/auto")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUnauthorizedAccessToAiSession_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/ai/session/1"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testUnauthorizedAccessToAiQuickAnalysis_ShouldReturn403() throws Exception {
        mockMvc.perform(post("/api/ai/quick-analysis")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testPublicEndpointsRemainAccessibleWithoutToken() throws Exception {
        // Public endpoint allowed through security filter (returns 404 when OpenAPI dependency is not bundled, rather than 403 Forbidden)
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(result -> org.junit.jupiter.api.Assertions.assertNotEquals(403, result.getResponse().getStatus()));
    }

    // F04 Tests: User Account Status Enforcement
    @Test
    public void testBannedUserCannotAccessProtectedEndpointWithExistingToken_Returns403() throws Exception {
        // 1. Register and login
        RegisterRequest registerRequest = new RegisterRequest("Active User", "active@secondskin.io", "Pass1234!", "Running");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        AuthRequest loginRequest = new AuthRequest("active@secondskin.io", "Pass1234!");
        String loginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(loginRes).get("token").asText();

        // 2. Token works initially
        mockMvc.perform(get("/api/sessions")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 3. Admin bans user
        com.secondskin.sport.entity.User user = userRepository.findByEmail("active@secondskin.io").orElseThrow();
        user.setEnabled(false);
        userRepository.save(user);

        // 4. Request with existing unexpired token must be immediately rejected with 403 Forbidden
        mockMvc.perform(get("/api/sessions")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testBannedUserCannotRefreshToken_Returns403() throws Exception {
        // 1. Register and login
        RegisterRequest registerRequest = new RegisterRequest("Active User 2", "active2@secondskin.io", "Pass1234!", "Running");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isOk());

        AuthRequest loginRequest = new AuthRequest("active2@secondskin.io", "Pass1234!");
        String loginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String refreshToken = objectMapper.readTree(loginRes).get("refreshToken").asText();

        // 2. Ban user
        com.secondskin.sport.entity.User user = userRepository.findByEmail("active2@secondskin.io").orElseThrow();
        user.setEnabled(false);
        userRepository.save(user);

        // 3. Attempt to refresh token must fail with 403 Forbidden
        mockMvc.perform(post("/api/auth/refresh")
                .header("Authorization", "Bearer " + refreshToken))
                .andExpect(status().isForbidden());
    }
}
