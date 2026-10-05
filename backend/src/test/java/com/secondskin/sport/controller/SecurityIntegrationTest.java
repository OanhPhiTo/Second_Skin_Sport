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
        registerRequest.setPreferredSport("Cycling");

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
}
