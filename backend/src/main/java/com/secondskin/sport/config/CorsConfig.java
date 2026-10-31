package com.secondskin.sport.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS is centralized in {@link com.secondskin.sport.security.SecurityConfig#corsConfigurationSource()}
 * to ensure strict Spring Security filter chain enforcement and prevent duplicate CORS headers.
 */
@Configuration
public class CorsConfig {
    // Redundant WebMvcConfigurer bean removed to prevent duplicate Access-Control-Allow-Origin headers.
}
