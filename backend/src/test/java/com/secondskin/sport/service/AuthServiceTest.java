package com.secondskin.sport.service;

import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.UserRepository;
import com.secondskin.sport.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegister_Success() {
        // Arrange
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123", "Running");
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(new User());
        when(jwtService.generateToken(any(User.class))).thenReturn("mockJwtToken");

        // Act
        AuthResponse response = authService.register(request);

        // Assert
        assertNotNull(response);
        assertEquals("mockJwtToken", response.getToken());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegister_EmailAlreadyExists() {
        // Arrange
        RegisterRequest request = new RegisterRequest("Test User", "test@example.com", "password123", "Running");
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        // Act & Assert
        Exception exception = assertThrows(RuntimeException.class, () -> authService.register(request));
        assertEquals("Thông tin đăng ký không hợp lệ hoặc tài khoản đã tồn tại.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testAuthenticate_Success() {
        // Arrange
        AuthRequest request = new AuthRequest("test@example.com", "password123");
        User user = new User("Test User", "test@example.com", "encodedPassword", Role.USER, "Running");
        
        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.generateToken(any(User.class))).thenReturn("mockJwtToken");

        // Act
        AuthResponse response = authService.authenticate(request);

        // Assert
        assertNotNull(response);
        assertEquals("mockJwtToken", response.getToken());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
