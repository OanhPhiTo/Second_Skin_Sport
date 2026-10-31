package com.secondskin.sport.service;

import com.secondskin.sport.dto.AuthMessageResponse;
import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.ForgotPasswordRequest;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.dto.ProfileUpdateRequest;
import com.secondskin.sport.dto.UserDTO;
import com.secondskin.sport.dto.ResetPasswordRequest;
import com.secondskin.sport.dto.VerifyOtpRequest;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.repository.UserRepository;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
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
    private final OtpService otpService;
    private final EmailService emailService;

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
        } catch (org.springframework.security.authentication.DisabledException e) {
            throw e;
        } catch (Exception e) {
            throw new org.springframework.security.authentication.BadCredentialsException("Tài khoản hoặc mật khẩu không chính xác.");
        }
        
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new org.springframework.security.authentication.BadCredentialsException("Tài khoản hoặc mật khẩu không chính xác."));
        
        if (!user.isEnabled()) {
            throw new org.springframework.security.authentication.DisabledException("Tài khoản đã bị khóa hoặc vô hiệu hóa.");
        }

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

    public UserDTO updateProfile(ProfileUpdateRequest request) {
        User user = SecurityUtils.getRequiredCurrentUser();
        user.setName(request.getName().trim());
        user.setPreferredSport(request.getPreferredSport().trim());
        User saved = repository.save(user);
        return UserDTO.builder()
                .id(saved.getId())
                .name(saved.getName())
                .email(saved.getEmail())
                .role(saved.getRole())
                .preferredSport(saved.getPreferredSport())
                .createdAt(saved.getCreatedAt())
                .enabled(saved.isEnabled())
                .build();
    }

    public AuthResponse refreshToken(String refreshToken) {
        String userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail != null) {
            var user = repository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại."));
            
            // F04: Immediately reject refresh if account is disabled/banned
            if (!user.isEnabled()) {
                throw new org.springframework.security.authentication.DisabledException("Tài khoản đã bị khóa hoặc vô hiệu hóa.");
            }

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

    public AuthMessageResponse sendForgotPasswordOtp(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = repository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + request.getEmail()));

        if (!user.isEnabled()) {
            throw new DisabledException("Tài khoản đã bị khóa hoặc vô hiệu hóa. Vui lòng liên hệ quản trị viên.");
        }

        String otp = otpService.generateAndStoreOtp(normalizedEmail);
        emailService.sendPasswordResetOtp(user.getEmail(), otp);

        return AuthMessageResponse.builder()
                .success(true)
                .message("Mã xác thực OTP đã được gửi đến email " + user.getEmail() + ". Mã có hiệu lực trong vòng 5 phút.")
                .debugOtp(otp)
                .build();
    }

    public AuthMessageResponse verifyOtp(VerifyOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        otpService.verifyOtp(normalizedEmail, request.getOtp());
        return AuthMessageResponse.builder()
                .success(true)
                .message("Xác thực mã OTP thành công. Vui lòng nhập mật khẩu mới.")
                .build();
    }

    public AuthMessageResponse resetPassword(ResetPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (!otpService.isOtpVerified(normalizedEmail, request.getOtp())) {
            throw new IllegalArgumentException("Mã OTP chưa được xác thực hoặc đã hết hiệu lực. Vui lòng xác thực lại.");
        }

        User user = repository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản với email: " + request.getEmail()));

        if (!user.isEnabled()) {
            throw new DisabledException("Tài khoản đã bị khóa hoặc vô hiệu hóa.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        repository.save(user);

        otpService.clearOtp(normalizedEmail);

        return AuthMessageResponse.builder()
                .success(true)
                .message("Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.")
                .build();
    }
}
