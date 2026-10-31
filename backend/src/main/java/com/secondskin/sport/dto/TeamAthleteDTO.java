package com.secondskin.sport.dto;

import com.secondskin.sport.entity.AthleteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamAthleteDTO {
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
    private String injuryRiskLevel; // "LOW", "MODERATE", "HIGH", "CRITICAL"
    private LocalDateTime updatedAt;
}
