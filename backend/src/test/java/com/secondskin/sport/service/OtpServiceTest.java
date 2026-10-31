package com.secondskin.sport.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OtpServiceTest {

    private OtpService otpService;

    @BeforeEach
    void setUp() {
        otpService = new OtpService();
    }

    @Test
    void testGenerateAndStoreOtp_ValidFormat() {
        String email = "athlete@secondskin.io";
        String otp = otpService.generateAndStoreOtp(email);

        assertNotNull(otp);
        assertEquals(6, otp.length());
        assertTrue(otp.matches("^\\d{6}$"));
    }

    @Test
    void testVerifyOtp_Success() {
        String email = "athlete@secondskin.io";
        String otp = otpService.generateAndStoreOtp(email);

        boolean verified = otpService.verifyOtp(email, otp);
        assertTrue(verified);
        assertTrue(otpService.isOtpVerified(email, otp));
    }

    @Test
    void testVerifyOtp_IncorrectCode_ThrowsException() {
        String email = "athlete@secondskin.io";
        otpService.generateAndStoreOtp(email);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> {
            otpService.verifyOtp(email, "000000");
        });
        assertTrue(ex.getMessage().contains("không chính xác"));
    }

    @Test
    void testVerifyOtp_ExceedMaxAttempts_Blocks() {
        String email = "athlete@secondskin.io";
        otpService.generateAndStoreOtp(email);

        for (int i = 0; i < 5; i++) {
            assertThrows(IllegalArgumentException.class, () -> {
                otpService.verifyOtp(email, "000000");
            });
        }

        // Lần thứ 6 sẽ báo đã vượt quá số lần thử hoặc không tồn tại
        assertThrows(IllegalArgumentException.class, () -> {
            otpService.verifyOtp(email, "000000");
        });
    }

    @Test
    void testClearOtp() {
        String email = "athlete@secondskin.io";
        String otp = otpService.generateAndStoreOtp(email);
        otpService.clearOtp(email);

        assertThrows(IllegalArgumentException.class, () -> {
            otpService.verifyOtp(email, otp);
        });
    }
}

