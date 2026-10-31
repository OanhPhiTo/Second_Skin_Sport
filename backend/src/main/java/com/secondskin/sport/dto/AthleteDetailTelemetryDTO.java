package com.secondskin.sport.dto;

import com.secondskin.sport.entity.AthleteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AthleteDetailTelemetryDTO {
    private Long id;
    private Long teamId;
    private Long userId;
    private String name;
    private Integer jerseyNumber;
    private String position;
    private String deviceId;
    private AthleteStatus status;

    private Integer minutesPlayed;
    private Double fatigueIndex;
    private Double currentIntensity;
    private Integer jumpCount;
    private Integer highImpactLandings;
    private Integer heartRate;

    private String injuryRiskLevel; // LOW, MODERATE, HIGH, CRITICAL
    private String recoveryAdvice;
    private String tacticalActionHint;
    private LocalDateTime lastTelemetryTime;

    private List<TelemetryDataPointDTO> recentTelemetry;
}
