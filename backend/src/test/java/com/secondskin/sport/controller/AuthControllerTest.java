package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.security.CustomUserDetailsService;
import com.secondskin.sport.service.AuthService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@WebMvcTest(
    value = AuthController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for unit testing controller layer
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;
    
    @MockBean
    private JwtService jwtService;
    
    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testRegister() throws Exception {
        RegisterRequest request = new RegisterRequest("Test", "test@example.com", "pass", "Gym");
        AuthResponse response = AuthResponse.builder()
                .token("mockJwtToken")
                .refreshToken("mockRefreshToken")
                .build();

        Mockito.when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockJwtToken"));
    }

    @Test
    void testAuthenticate() throws Exception {
        AuthRequest request = new AuthRequest("test@example.com", "pass");
        AuthResponse response = AuthResponse.builder()
                .token("mockJwtToken")
                .refreshToken("mockRefreshToken")
                .build();

        Mockito.when(authService.authenticate(any(AuthRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockJwtToken"));
    }
}
