package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AuthMessageResponse;
import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.ForgotPasswordRequest;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.dto.ResetPasswordRequest;
import com.secondskin.sport.dto.VerifyOtpRequest;
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
        RegisterRequest request = new RegisterRequest("Test", "test@example.com", "pass", "Running");
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

    @Test
    void testForgotPassword() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("user@example.com");
        AuthMessageResponse response = AuthMessageResponse.builder()
                .success(true)
                .message("OTP đã gửi thành công")
                .debugOtp("123456")
                .build();

        Mockito.when(authService.sendForgotPasswordOtp(any(ForgotPasswordRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("OTP đã gửi thành công"));
    }

    @Test
    void testVerifyOtp() throws Exception {
        VerifyOtpRequest request = new VerifyOtpRequest("user@example.com", "123456");
        AuthMessageResponse response = AuthMessageResponse.builder()
                .success(true)
                .message("Xác thực OTP thành công")
                .build();

        Mockito.when(authService.verifyOtp(any(VerifyOtpRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testResetPassword() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("user@example.com", "123456", "newPassword123");
        AuthMessageResponse response = AuthMessageResponse.builder()
                .success(true)
                .message("Đặt lại mật khẩu thành công")
                .build();

        Mockito.when(authService.resetPassword(any(ResetPasswordRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
