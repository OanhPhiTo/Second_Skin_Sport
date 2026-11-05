package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AuthMessageResponse;
import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.ForgotPasswordRequest;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.dto.ResetPasswordRequest;
import com.secondskin.sport.dto.VerifyOtpRequest;
import com.secondskin.sport.exception.GlobalExceptionHandler;
import com.secondskin.sport.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("AuthController - REST Endpoints Tests (Standalone Setup)")
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private boolean throwDuplicateEmail;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        throwDuplicateEmail = false;

        // Subclass stub avoiding Mockito dynamic agent overhead on Java 21
        AuthService stubAuthService = new AuthService(null, null, null, null, null, null) {
            @Override
            public AuthResponse register(RegisterRequest request) {
                if (throwDuplicateEmail) {
                    throw new IllegalArgumentException("Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.");
                }
                return AuthResponse.builder()
                        .token("mockJwtToken")
                        .refreshToken("mockRefreshToken")
                        .name(request.getName())
                        .email(request.getEmail())
                        .role("USER")
                        .build();
            }

            @Override
            public AuthResponse authenticate(AuthRequest request) {
                return AuthResponse.builder()
                        .token("mockJwtToken")
                        .refreshToken("mockRefreshToken")
                        .email(request.getEmail())
                        .role("USER")
                        .build();
            }

            @Override
            public AuthMessageResponse sendForgotPasswordOtp(ForgotPasswordRequest request) {
                return AuthMessageResponse.builder()
                        .success(true)
                        .message("OTP đã gửi thành công")
                        .debugOtp("123456")
                        .build();
            }

            @Override
            public AuthMessageResponse verifyOtp(VerifyOtpRequest request) {
                return AuthMessageResponse.builder()
                        .success(true)
                        .message("Xác thực OTP thành công")
                        .build();
            }

            @Override
            public AuthMessageResponse resetPassword(ResetPasswordRequest request) {
                return AuthMessageResponse.builder()
                        .success(true)
                        .message("Đặt lại mật khẩu thành công")
                        .build();
            }
        };

        AuthController controller = new AuthController(stubAuthService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void testRegister_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "Password123", "Running");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockJwtToken"));
    }

    @Test
    void testRegister_InvalidPassword_ReturnsBadRequest() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest("Test User", "test@example.com", "short1", "Running");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mật khẩu phải có ít nhất 8 ký tự."));
    }

    @Test
    void testRegister_PasswordWithoutNumbers_ReturnsBadRequest() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest("Test User", "test@example.com", "passwordOnly", "Running");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mật khẩu phải chứa ít nhất một chữ cái và một chữ số."));
    }

    @Test
    void testRegister_DuplicateEmail_ReturnsBadRequest() throws Exception {
        throwDuplicateEmail = true;
        RegisterRequest request = new RegisterRequest("Test User", "dup@example.com", "Password123", "Running");

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập."));
    }

    @Test
    void testAuthenticate() throws Exception {
        AuthRequest request = new AuthRequest("test@example.com", "pass");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mockJwtToken"));
    }

    @Test
    void testForgotPassword() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("user@example.com");

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

        mockMvc.perform(post("/api/auth/verify-otp")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void testResetPassword() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("user@example.com", "123456", "newPassword123");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
