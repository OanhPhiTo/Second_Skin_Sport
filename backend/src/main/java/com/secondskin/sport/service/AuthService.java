package com.secondskin.sport.service;

import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.UserRepository;
import com.secondskin.sport.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if(repository.existsByEmail(request.getEmail())){
             throw new RuntimeException("Thông tin đăng ký không hợp lệ hoặc tài khoản đã tồn tại.");
        }
        var user = new User(
                request.getName(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                Role.USER,
                request.getPreferredSport()
        );
        repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .role(user.getRole().name())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse authenticate(AuthRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (Exception e) {
            throw new org.springframework.security.authentication.BadCredentialsException("Tài khoản hoặc mật khẩu không chính xác.");
        }
        
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Tài khoản hoặc mật khẩu không chính xác."));
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        return AuthResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken)
                .role(user.getRole().name())
                .name(user.getName())
                .email(user.getEmail())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail != null) {
            var user = repository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại."));
            if (jwtService.isTokenValid(refreshToken, user)) {
                var accessToken = jwtService.generateToken(user);
                return AuthResponse.builder()
                        .token(accessToken)
                        .refreshToken(refreshToken)
                        .role(user.getRole().name())
                        .name(user.getName())
                        .email(user.getEmail())
                        .build();
            }
        }
        throw new RuntimeException("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
    }
}
