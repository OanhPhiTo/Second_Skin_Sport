package com.secondskin.sport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private String id;
    private Long userId;
    private String title;
    private String message;
    private String type; // SESSION_COMPLETED, FATIGUE_ALERT, SYSTEM
    private Long sessionId;
    private String sport;
    private Integer durationMinutes;
    private Integer performanceScore;
    private Integer totalJumps;
    private Double averageAcceleration;
    private boolean read;
    private LocalDateTime createdAt;
}

