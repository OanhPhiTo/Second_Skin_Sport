package com.secondskin.sport.service;

import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private final SecureRandom secureRandom = new SecureRandom();

    private final Map<String, OtpData> otpStorage = new ConcurrentHashMap<>();

    public static class OtpData {
        private final String otp;
        private final Instant expiresAt;
        private int failedAttempts;
        private boolean verified;

        public OtpData(String otp, Instant expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
            this.failedAttempts = 0;
            this.verified = false;
        }

        public String getOtp() {
            return otp;
        }

        public Instant getExpiresAt() {
            return expiresAt;
        }

        public int getFailedAttempts() {
            return failedAttempts;
        }

        public void incrementFailedAttempts() {
            this.failedAttempts++;
        }

        public boolean isVerified() {
            return verified;
        }

        public void setVerified(boolean verified) {
            this.verified = verified;
        }

        public boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }
    }

    public String generateAndStoreOtp(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email không được để trống");
        }
        String normalizedEmail = email.trim().toLowerCase();
        
        // Sinh 6 chữ số ngẫu nhiên an toàn: 100000 - 999999
        int code = 100_000 + secureRandom.nextInt(900_000);
        String otp = String.valueOf(code);
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(OTP_EXPIRY_MINUTES));

        otpStorage.put(normalizedEmail, new OtpData(otp, expiresAt));
        return otp;
    }

    public boolean verifyOtp(String email, String inputOtp) {
        if (email == null || inputOtp == null) {
            throw new IllegalArgumentException("Email và mã OTP không được để trống");
        }
        String normalizedEmail = email.trim().toLowerCase();
        OtpData data = otpStorage.get(normalizedEmail);

        if (data == null) {
            throw new IllegalArgumentException("Yêu cầu đặt lại mật khẩu không tồn tại hoặc đã hết hạn. Vui lòng gửi lại mã OTP.");
        }

        if (data.isExpired()) {
            otpStorage.remove(normalizedEmail);
            throw new IllegalArgumentException("Mã OTP đã hết hiệu lực (quá 5 phút). Vui lòng yêu cầu mã mới.");
        }

        if (data.getFailedAttempts() >= MAX_FAILED_ATTEMPTS) {
            otpStorage.remove(normalizedEmail);
            throw new IllegalArgumentException("Bạn đã nhập sai mã OTP quá " + MAX_FAILED_ATTEMPTS + " lần. Vui lòng yêu cầu mã mới để bảo mật tài khoản.");
        }

        if (!data.getOtp().equals(inputOtp.trim())) {
            data.incrementFailedAttempts();
            int remaining = MAX_FAILED_ATTEMPTS - data.getFailedAttempts();
            throw new IllegalArgumentException("Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.");
        }

        data.setVerified(true);
        return true;
    }

    public boolean isOtpVerified(String email, String inputOtp) {
        if (email == null || inputOtp == null) {
            return false;
        }
        String normalizedEmail = email.trim().toLowerCase();
        OtpData data = otpStorage.get(normalizedEmail);
        if (data == null || data.isExpired()) {
            return false;
        }
        return data.isVerified() && data.getOtp().equals(inputOtp.trim());
    }

    public void clearOtp(String email) {
        if (email != null) {
            otpStorage.remove(email.trim().toLowerCase());
        }
    }
}

