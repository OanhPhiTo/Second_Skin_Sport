package com.secondskin.sport.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class DefaultEmailService implements EmailService {

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        log.info("================================================================================");
        log.info("[EMAIL SERVICE - SECOND SKIN SPORT] Gửi mã xác thực đặt lại mật khẩu");
        log.info("Người nhận (To): {}", toEmail);
        log.info("Mã xác thực OTP: {}", otp);
        log.info("Hiệu lực: 5 phút");
        log.info("Nội dung: Mã xác thực đặt lại mật khẩu tài khoản Second Skin Sport của bạn là: {}", otp);
        log.info("================================================================================");
    }
}

