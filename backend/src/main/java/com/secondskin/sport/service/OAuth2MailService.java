package com.secondskin.sport.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;

/**
 * Dịch vụ gửi email xác thực qua cơ chế bảo mật cao OAuth2 (Google Gmail API / OAuth2 Authorization Server).
 * Tự động trao đổi Refresh Token lấy Access Token động, không cần lưu mật khẩu cố định.
 * Khi chưa cấu hình OAuth2 credentials hoặc ở môi trường dev, tự động fallback ghi log an toàn.
 */
@Slf4j
@Service
public class OAuth2MailService implements EmailService {

    @Value("${mail.oauth2.enabled:false}")
    private boolean enabled;

    @Value("${mail.oauth2.client-id:}")
    private String clientId;

    @Value("${mail.oauth2.client-secret:}")
    private String clientSecret;

    @Value("${mail.oauth2.refresh-token:}")
    private String refreshToken;

    @Value("${mail.oauth2.token-url:https://oauth2.googleapis.com/token}")
    private String tokenUrl;

    @Value("${mail.oauth2.from-email:noreply@secondskin.com}")
    private String fromEmail;

    private final RestClient restClient;
    private String cachedAccessToken;
    private Instant tokenExpiryTime;

    public OAuth2MailService() {
        this.restClient = RestClient.builder()
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory())
                .build();
    }

    // Constructor dành cho Unit Test injection
    public OAuth2MailService(RestClient restClient, boolean enabled, String clientId, String clientSecret, String refreshToken, String tokenUrl, String fromEmail) {
        this.restClient = restClient;
        this.enabled = enabled;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.tokenUrl = tokenUrl;
        this.fromEmail = fromEmail;
    }

    @Override
    public void sendPasswordResetOtp(String toEmail, String otp) {
        if (!enabled || clientId.isBlank() || refreshToken.isBlank()) {
            logFallbackConsole(toEmail, otp, "OAuth2 chưa kích hoạt hoặc thiếu credentials. Chạy chế độ Dev/Test Logger.");
            return;
        }

        try {
            String accessToken = getOrRefreshAccessToken();
            sendEmailViaGmailApi(accessToken, toEmail, otp);
            log.info("[OAuth2MailService] Đã gửi mã OTP thành công qua OAuth2 Gmail API tới: {}", toEmail);
        } catch (Exception ex) {
            log.warn("[OAuth2MailService] Gửi mail qua OAuth2 thất bại ({}), fallback sang log an toàn.", ex.getMessage());
            logFallbackConsole(toEmail, otp, "Lỗi kết nối OAuth2 Provider: " + ex.getMessage());
        }
    }

    /**
     * Trao đổi Refresh Token lấy Access Token mới theo chuẩn OAuth2 RFC 6749.
     */
    public synchronized String getOrRefreshAccessToken() {
        if (cachedAccessToken != null && tokenExpiryTime != null && Instant.now().isBefore(tokenExpiryTime.minusSeconds(60))) {
            return cachedAccessToken;
        }

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("refresh_token", refreshToken);
        form.add("grant_type", "refresh_token");

        @SuppressWarnings("unchecked")
        Map<String, Object> tokenResponse = restClient.post()
                .uri(tokenUrl)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        if (tokenResponse != null && tokenResponse.containsKey("access_token")) {
            this.cachedAccessToken = (String) tokenResponse.get("access_token");
            Number expiresIn = (Number) tokenResponse.getOrDefault("expires_in", 3600);
            this.tokenExpiryTime = Instant.now().plusSeconds(expiresIn.longValue());
            return this.cachedAccessToken;
        }

        throw new IllegalStateException("Không nhận được access_token từ OAuth2 Authorization Server");
    }

    /**
     * Gửi email theo chuẩn RFC 2822 qua Gmail API REST v1.
     */
    private void sendEmailViaGmailApi(String accessToken, String toEmail, String otp) {
        String emailContent = createRfc2822Email(toEmail, otp);
        String encodedRaw = Base64.getUrlEncoder().withoutPadding().encodeToString(emailContent.getBytes(StandardCharsets.UTF_8));

        Map<String, String> requestBody = Map.of("raw", encodedRaw);

        restClient.post()
                .uri("https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .toBodilessEntity();
    }

    /**
     * Tạo MIME message định dạng RFC 2822 với template Second Skin Sport.
     */
    private String createRfc2822Email(String toEmail, String otp) {
        String subject = "=?UTF-8?B?" + Base64.getEncoder().encodeToString("[Second Skin Sport] Mã OTP đặt lại mật khẩu".getBytes(StandardCharsets.UTF_8)) + "?=";

        String htmlBody = """
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #07090e; color: #e2e8f0; padding: 30px; border-radius: 12px; max-width: 520px; margin: auto; border: 1px solid rgba(0, 242, 254, 0.2);">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h2 style="color: #00f2fe; margin: 0; font-size: 24px; letter-spacing: 1px;">SECOND SKIN SPORT</h2>
                    <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Theo dõi chuyển động, Nâng tầm hiệu suất</p>
                </div>
                <div style="background: rgba(14, 18, 28, 0.9); padding: 24px; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.08);">
                    <p style="margin-top: 0; font-size: 15px;">Xin chào,</p>
                    <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản Second Skin Sport của bạn. Dưới đây là mã xác thực một lần (OTP) của bạn:</p>
                    <div style="text-align: center; margin: 28px 0;">
                        <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #00ff87; background: rgba(0, 255, 135, 0.1); padding: 12px 28px; border-radius: 8px; border: 1px dashed #00ff87;">%s</span>
                    </div>
                    <p style="font-size: 13px; color: #ef4444; margin-bottom: 0;">⏱️ Mã xác thực này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai khác.</p>
                </div>
                <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 24px;">Nếu bạn không yêu cầu hành động này, vui lòng bỏ qua email này.</p>
            </div>
            """.formatted(otp);

        return "From: " + fromEmail + "\r\n" +
               "To: " + toEmail + "\r\n" +
               "Subject: " + subject + "\r\n" +
               "MIME-Version: 1.0\r\n" +
               "Content-Type: text/html; charset=UTF-8\r\n" +
               "Content-Transfer-Encoding: base64\r\n\r\n" +
               Base64.getEncoder().encodeToString(htmlBody.getBytes(StandardCharsets.UTF_8));
    }

    private void logFallbackConsole(String toEmail, String otp, String reason) {
        log.info("================================================================================");
        log.info("[OAUTH2 EMAIL SERVICE - SECOND SKIN SPORT]");
        log.info("Trạng thái: {}", reason);
        log.info("Người nhận (To): {}", toEmail);
        log.info("Mã xác thực OTP: {}", otp);
        log.info("Hiệu lực: 5 phút");
        log.info("================================================================================");
    }
}
