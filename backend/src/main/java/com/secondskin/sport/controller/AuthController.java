package com.secondskin.sport.controller;

import com.secondskin.sport.dto.AuthMessageResponse;
import com.secondskin.sport.dto.AuthRequest;
import com.secondskin.sport.dto.AuthResponse;
import com.secondskin.sport.dto.ForgotPasswordRequest;
import com.secondskin.sport.dto.RegisterRequest;
import com.secondskin.sport.dto.ProfileUpdateRequest;
import com.secondskin.sport.dto.UserDTO;
import com.secondskin.sport.dto.ResetPasswordRequest;
import com.secondskin.sport.dto.VerifyOtpRequest;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CookieValue;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;
import org.springframework.beans.factory.annotation.Value;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService service;

    @Value("${auth.refresh-cookie-name:sss_refresh}")
    private String refreshCookieName;

    @Value("${auth.refresh-cookie-secure:false}")
    private boolean refreshCookieSecure;

    @Value("${application.security.jwt.refresh-token.expiration:604800000}")
    private long refreshTokenExpirationMs;

    @Value("${application.security.jwt.remembered-refresh-token.expiration:2592000000}")
    private long rememberedRefreshTokenExpirationMs;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = service.register(request);
        addRefreshCookie(response, authResponse.getRefreshToken(), false);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticate(
            @RequestBody AuthRequest request,
            HttpServletResponse response
    ) {
        AuthResponse authResponse = service.authenticate(request);
        addRefreshCookie(response, authResponse.getRefreshToken(), request.isRememberMe());
        return ResponseEntity.ok(authResponse);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDTO> updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(service.updateProfile(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(
            @RequestHeader(value = "Authorization", required = false) String authorizationHeader,
            @CookieValue(value = "${auth.refresh-cookie-name:sss_refresh}", required = false) String refreshCookie,
            @CookieValue(value = "sss_remember", required = false) String rememberCookie,
            HttpServletResponse response
    ) {
        String refreshToken = refreshCookie;
        if (refreshToken == null && authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            refreshToken = authorizationHeader.substring(7);
        }
        if (refreshToken != null && !refreshToken.isBlank()) {
            AuthResponse authResponse = service.refreshToken(refreshToken);
            addRefreshCookie(response, authResponse.getRefreshToken(), "1".equals(rememberCookie));
            return ResponseEntity.ok(authResponse);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        ResponseCookie expiredCookie = ResponseCookie.from(refreshCookieName, "")
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(0)
                .build();
        response.addHeader("Set-Cookie", expiredCookie.toString());
        response.addHeader("Set-Cookie", ResponseCookie.from("sss_remember", "")
                .httpOnly(true).secure(refreshCookieSecure).sameSite("Lax")
                .path("/api/auth").maxAge(0).build().toString());
        return ResponseEntity.noContent().build();
    }

    private void addRefreshCookie(HttpServletResponse response, String refreshToken, boolean rememberMe) {
        long maxAge = rememberMe ? rememberedRefreshTokenExpirationMs : -1;
        ResponseCookie cookie = ResponseCookie.from(refreshCookieName, refreshToken)
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite("Lax")
                .path("/api/auth")
                .maxAge(maxAge < 0 ? -1 : Math.max(1, maxAge / 1000))
                .build();
        response.addHeader("Set-Cookie", cookie.toString());
        response.addHeader("Set-Cookie", ResponseCookie.from("sss_remember", rememberMe ? "1" : "0")
                .httpOnly(true).secure(refreshCookieSecure).sameSite("Lax")
                .path("/api/auth").maxAge(maxAge < 0 ? -1 : Math.max(1, maxAge / 1000)).build().toString());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<AuthMessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        return ResponseEntity.ok(service.sendForgotPasswordOtp(request));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthMessageResponse> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request
    ) {
        return ResponseEntity.ok(service.verifyOtp(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthMessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        return ResponseEntity.ok(service.resetPassword(request));
    }

    @ExceptionHandler(org.springframework.security.authentication.DisabledException.class)
    public ResponseEntity<Map<String, Object>> handleDisabledException(org.springframework.security.authentication.DisabledException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                        "status", 403,
                        "error", "Forbidden",
                        "message", ex.getMessage() != null ? ex.getMessage() : "Tài khoản đã bị khóa hoặc vô hiệu hóa."
                ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "status", 404,
                        "error", "Not Found",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "status", 400,
                        "error", "Bad Request",
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage())
                .findFirst()
                .orElse("Dữ liệu gửi lên không hợp lệ.");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "status", 400,
                        "error", "Bad Request",
                        "message", errorMessage
                ));
    }
}
