package com.secondskin.sport.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.secondskin.sport.entity.SportSession;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SportSessionDTO {
    private Long id;
    private Long userId;
    private String deviceId;
    private String sport; // Running, Basketball
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int durationMinutes;

    private int totalJumps;
    private int directionChanges;
    private double averageAcceleration; // m/s²
    private double averageSpeed;        // km/h
    private int movementIntensity;      // % (0-100)
    private int performanceScore;       // % (0-100)
    private String status;              // Completed, In Progress, Paused
    private AiInsightDTO aiInsight;

    public SportSession toEntity() {
        SportSession entity = new SportSession();
        entity.setId(this.id);
        entity.setUserId(this.userId);
        entity.setDeviceId(this.deviceId);
        entity.setSport(this.sport);
        entity.setStartTime(this.startTime);
        entity.setEndTime(this.endTime);
        entity.setDurationMinutes(this.durationMinutes);
        entity.setTotalJumps(this.totalJumps);
        entity.setDirectionChanges(this.directionChanges);
        entity.setAverageAcceleration(this.averageAcceleration);
        entity.setAverageSpeed(this.averageSpeed);
        entity.setMovementIntensity(this.movementIntensity);
        entity.setPerformanceScore(this.performanceScore);
        entity.setStatus(this.status);
        return entity;
    }

    public static SportSessionDTO fromEntity(SportSession session) {
        return fromEntity(session, null);
    }

    public static SportSessionDTO fromEntity(SportSession session, AiInsightDTO aiInsight) {
        if (session == null) return null;
        SportSessionDTO dto = new SportSessionDTO();
        dto.setId(session.getId());
        dto.setUserId(session.getUserId());
        dto.setDeviceId(session.getDeviceId());
        dto.setSport(session.getSport());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setTotalJumps(session.getTotalJumps());
        dto.setDirectionChanges(session.getDirectionChanges());
        dto.setAverageAcceleration(session.getAverageAcceleration());
        dto.setAverageSpeed(session.getAverageSpeed());
        dto.setMovementIntensity(session.getMovementIntensity());
        dto.setPerformanceScore(session.getPerformanceScore());
        dto.setStatus(session.getStatus());
        dto.setAiInsight(aiInsight);
        return dto;
    }
}
