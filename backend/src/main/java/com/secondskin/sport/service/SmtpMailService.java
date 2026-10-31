package com.secondskin.sport.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Gửi email xác thực qua Gmail SMTP (STARTTLS).
 * Thông tin đăng nhập chỉ được đọc từ biến môi trường MAIL_USERNAME và MAIL_APP_PASSWORD.
 */
@Slf4j
@Service
@Primary
public class SmtpMailService implements EmailService {

    private final JavaMailSender mailSender;
    private final String username;
    private final String fromEmail;

    public SmtpMailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String username,
            @Value("${mail.from-email:${spring.mail.username:}}") String fromEmail) {
        this.mailSender = mailSender;
        this.username = username;
        this.fromEmail = StringUtils.hasText(fromEmail) ? fromEmail : username;
    }

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        if (!StringUtils.hasText(username) || !StringUtils.hasText(fromEmail)) {
            logFallbackConsole(toEmail, otp, "Thiếu MAIL_USERNAME/MAIL_FROM_EMAIL");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("[Second Skin Sport] Mã OTP đặt lại mật khẩu");
            helper.setText(buildHtmlBody(otp), true);
            mailSender.send(message);
            log.info("[SmtpMailService] Đã gửi mã OTP tới: {}", toEmail);
        } catch (MailException | MessagingException ex) {
            log.warn("[SmtpMailService] Gửi SMTP thất bại ({}), fallback sang log an toàn.", ex.getMessage());
            logFallbackConsole(toEmail, otp, "Lỗi kết nối Gmail SMTP");
        }
    }

    private String buildHtmlBody(String otp) {
        return """
                <div style="font-family:Segoe UI,Tahoma,sans-serif;background:#07090e;color:#e2e8f0;padding:30px;border-radius:12px;max-width:520px;margin:auto;border:1px solid rgba(0,242,254,.2)">
                  <div style="text-align:center;margin-bottom:24px">
                    <h2 style="color:#00f2fe;margin:0;letter-spacing:1px">SECOND SKIN SPORT</h2>
                    <p style="color:#94a3b8;font-size:13px">Theo dõi chuyển động, Nâng tầm hiệu suất</p>
                  </div>
                  <div style="background:#0e121c;padding:24px;border-radius:10px">
                    <p>Xin chào,</p>
                    <p>Mã xác thực đặt lại mật khẩu của bạn là:</p>
                    <div style="text-align:center;margin:28px 0;font-size:32px;font-weight:700;letter-spacing:8px;color:#00ff87">%s</div>
                    <p style="font-size:13px;color:#ef4444">Mã có hiệu lực trong 5 phút. Không chia sẻ mã này với bất kỳ ai.</p>
                  </div>
                </div>
                """.formatted(otp);
    }

    private void logFallbackConsole(String toEmail, String otp, String reason) {
        log.info("[SMTP EMAIL FALLBACK] {} | To: {} | OTP: {}", reason, toEmail, otp);
    }
}
