package com.secondskin.sport.service;

public interface EmailService {
    void sendPasswordResetOtp(String toEmail, String otp);
}

