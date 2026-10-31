package com.secondskin.sport.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

class OAuth2MailServiceTest {

    @Test
    void testSendPasswordResetOtp_FallbackWhenDisabled() {
        OAuth2MailService service = new OAuth2MailService(
                RestClient.builder().requestFactory(new SimpleClientHttpRequestFactory()).build(),
                false,
                "",
                "",
                "",
                "https://oauth2.googleapis.com/token",
                "noreply@secondskin.com"
        );

        // Fallback ghi log và không gây gián đoạn luồng
        assertDoesNotThrow(() -> service.sendPasswordResetOtp("athlete@secondskin.io", "654321"));
    }

    @Test
    void testSendPasswordResetOtp_FallbackOnError() {
        OAuth2MailService service = new OAuth2MailService(
                RestClient.builder().requestFactory(new SimpleClientHttpRequestFactory()).build(),
                true,
                "mock-client-id",
                "mock-secret",
                "mock-refresh-token",
                "http://localhost:19999/invalid-token-endpoint",
                "noreply@secondskin.com"
        );

        // Khi kết nối OAuth2 server bị lỗi, service tự bắt lỗi và fallback an toàn sang console log
        assertDoesNotThrow(() -> service.sendPasswordResetOtp("athlete@secondskin.io", "654321"));
    }
}
