package com.secondskin.sport.service;

import com.secondskin.sport.dto.AuthMessageResponse;
import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.ForgotPasswordRequest;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.dto.ResetPasswordRequest;
import com.secondskin.sport.dto.VerifyOtpRequest;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.repository.UserRepository;
import com.secondskin.sport.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.lang.reflect.Proxy;
import java.util.*;
import java.util.concurrent.atomic.AtomicLong;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("AuthService - Pure Business Logic Unit Tests")
class AuthServiceTest {

    private final Map<String, User> userDatabase = new HashMap<>();
    private final AtomicLong idSequence = new AtomicLong(1L);

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private JwtService jwtService;
    private AuthenticationManager authenticationManager;
    private OtpService otpService;
    private EmailService emailService;
    private AuthService authService;

    private String lastSentEmail;
    private String lastSentOtp;

    @BeforeEach
    void setUp() {
        userDatabase.clear();
        lastSentEmail = null;
        lastSentOtp = null;

        // JVM Native Dynamic Proxy for UserRepository
        userRepository = (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();
                    if ("existsByEmail".equals(methodName)) {
                        String email = (String) args[0];
                        return userDatabase.containsKey(email.toLowerCase());
                    }
                    if ("findByEmail".equals(methodName)) {
                        String email = (String) args[0];
                        return Optional.ofNullable(userDatabase.get(email.toLowerCase()));
                    }
                    if ("save".equals(methodName)) {
                        User u = (User) args[0];
                        if (u.getId() == null) {
                            u.setId(idSequence.incrementAndGet());
                        }
                        userDatabase.put(u.getEmail().toLowerCase(), u);
                        return u;
                    }
                    return null;
                }
        );

        // Native PasswordEncoder
        passwordEncoder = new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return "encoded_" + rawPassword;
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                return encodedPassword.equals("encoded_" + rawPassword);
            }
        };

        // Native JwtService anonymous subclass
        jwtService = new JwtService() {
            @Override
            public String generateToken(org.springframework.security.core.userdetails.UserDetails userDetails) {
                return "mock-jwt-token";
            }

            @Override
            public String generateRefreshToken(org.springframework.security.core.userdetails.UserDetails userDetails) {
                return "mock-refresh-token";
            }

            @Override
            public String extractUsername(String token) {
                return "athlete@secondskin.io";
            }

            @Override
            public boolean isTokenValid(String token, org.springframework.security.core.userdetails.UserDetails userDetails) {
                return true;
            }
        };

        // Native AuthenticationManager
        authenticationManager = authentication -> {
            String email = (String) authentication.getPrincipal();
            User user = userDatabase.get(email.toLowerCase());
            if (user == null) {
                throw new BadCredentialsException("Tài khoản hoặc mật khẩu không chính xác.");
            }
            if (!user.isEnabled()) {
                throw new DisabledException("Tài khoản đã bị khóa hoặc vô hiệu hóa.");
            }
            return new UsernamePasswordAuthenticationToken(email, authentication.getCredentials());
        };

        otpService = new OtpService();
        emailService = (toEmail, otp) -> {
            lastSentEmail = toEmail;
            lastSentOtp = otp;
        };

        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                otpService,
                emailService
        );
    }

    @Test
    void testRegister_Success() {
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123", "Running");
        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
        assertTrue(userDatabase.containsKey("test@example.com"));
    }

    @Test
    void testRegister_EmailAlreadyExists() {
        User existing = new User("Old User", "test@example.com", "pass", Role.USER, "Running");
        userDatabase.put("test@example.com", existing);

        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123", "Running");
        Exception ex = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertEquals("Thông tin đăng ký không hợp lệ hoặc tài khoản đã tồn tại.", ex.getMessage());
    }

    @Test
    void testAuthenticate_Success() {
        User user = new User("Test User", "athlete@secondskin.io", "encoded_password123", Role.USER, "Running");
        userDatabase.put("athlete@secondskin.io", user);

        AuthRequest request = new AuthRequest("athlete@secondskin.io", "password123");
        AuthResponse response = authService.authenticate(request);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.getToken());
    }

    @Test
    void testAuthenticate_DisabledUser_ThrowsDisabledException() {
        User user = new User("Banned User", "banned@example.com", "encoded_pass", Role.USER, "Running");
        user.setEnabled(false);
        userDatabase.put("banned@example.com", user);

        AuthRequest req = new AuthRequest("banned@example.com", "pass");
        assertThrows(DisabledException.class, () -> authService.authenticate(req));
    }

    @Test
    void testSendForgotPasswordOtp_Success() {
        User user = new User("Athlete", "athlete@secondskin.io", "pass", Role.USER, "Basketball");
        userDatabase.put("athlete@secondskin.io", user);

        ForgotPasswordRequest request = new ForgotPasswordRequest("athlete@secondskin.io");
        AuthMessageResponse response = authService.sendForgotPasswordOtp(request);

        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertNotNull(response.getDebugOtp());
        assertEquals("athlete@secondskin.io", lastSentEmail);
        assertEquals(response.getDebugOtp(), lastSentOtp);
    }

    @Test
    void testSendForgotPasswordOtp_UserNotFound() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("notfound@example.com");
        assertThrows(ResourceNotFoundException.class, () -> authService.sendForgotPasswordOtp(request));
    }

    @Test
    void testSendForgotPasswordOtp_DisabledUser() {
        User user = new User("Disabled", "disabled@example.com", "pass", Role.USER, "Basketball");
        user.setEnabled(false);
        userDatabase.put("disabled@example.com", user);

        ForgotPasswordRequest request = new ForgotPasswordRequest("disabled@example.com");
        assertThrows(DisabledException.class, () -> authService.sendForgotPasswordOtp(request));
    }

    @Test
    void testVerifyOtp_Success() {
        User user = new User("Athlete", "athlete@secondskin.io", "pass", Role.USER, "Basketball");
        userDatabase.put("athlete@secondskin.io", user);

        ForgotPasswordRequest forgotReq = new ForgotPasswordRequest("athlete@secondskin.io");
        AuthMessageResponse forgotRes = authService.sendForgotPasswordOtp(forgotReq);

        VerifyOtpRequest verifyReq = new VerifyOtpRequest("athlete@secondskin.io", forgotRes.getDebugOtp());
        AuthMessageResponse verifyRes = authService.verifyOtp(verifyReq);

        assertNotNull(verifyRes);
        assertTrue(verifyRes.isSuccess());
    }

    @Test
    void testResetPassword_Success() {
        User user = new User("Athlete", "athlete@secondskin.io", "old_pass", Role.USER, "Basketball");
        userDatabase.put("athlete@secondskin.io", user);

        // Step 1: Send OTP
        AuthMessageResponse forgotRes = authService.sendForgotPasswordOtp(new ForgotPasswordRequest("athlete@secondskin.io"));
        String otp = forgotRes.getDebugOtp();

        // Step 2: Verify OTP
        authService.verifyOtp(new VerifyOtpRequest("athlete@secondskin.io", otp));

        // Step 3: Reset Password
        ResetPasswordRequest resetReq = new ResetPasswordRequest("athlete@secondskin.io", otp, "NewSecurePass999");
        AuthMessageResponse resetRes = authService.resetPassword(resetReq);

        assertNotNull(resetRes);
        assertTrue(resetRes.isSuccess());
        assertEquals("encoded_NewSecurePass999", user.getPassword());
    }

    @Test
    void testResetPassword_UnverifiedOtp_ThrowsException() {
        User user = new User("Athlete", "athlete@secondskin.io", "old_pass", Role.USER, "Basketball");
        userDatabase.put("athlete@secondskin.io", user);

        // Send OTP but do not verify
        AuthMessageResponse forgotRes = authService.sendForgotPasswordOtp(new ForgotPasswordRequest("athlete@secondskin.io"));
        String otp = forgotRes.getDebugOtp();

        ResetPasswordRequest resetReq = new ResetPasswordRequest("athlete@secondskin.io", otp, "NewSecurePass999");
        assertThrows(IllegalArgumentException.class, () -> authService.resetPassword(resetReq));
    }
}
