package com.secondskin.sport.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.secondskin.sport.entity.PerformanceStatistic;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PerformanceStatisticDTO {
    private Long id;
    private Long sessionId;
    private Long userId;
    private LocalDate date;
    private String sport;

    // Core kinematic & performance aggregate metrics
    private Double averageSpeed;          // km/h
    private Double averageAcceleration;   // m/s²
    private Double totalDistance;         // km
    private Integer totalJumps;
    private Integer directionChanges;
    private Integer movementIntensity;    // %
    private Integer performanceScore;     // %

    // Biomechanical & session analytics extensions
    private Double jumpHeightCm;
    private Integer landingSoftnessScore;
    private Double peakLandingImpactG;
    private Integer bilateralSymmetryPct;
    private String dominantSide;
    private Integer fatigueIndex;
    private Integer trunkStabilityScore;
    private Double trunkLeanAngleDegrees;
    private Integer explosivenessScore;

    public static PerformanceStatisticDTO fromEntity(PerformanceStatistic entity) {
        if (entity == null) {
            return null;
        }
        return PerformanceStatisticDTO.builder()
                .id(entity.getId())
                .sessionId(entity.getSessionId())
                .userId(entity.getUserId())
                .date(entity.getDate())
                .sport(entity.getSport())
                .averageSpeed(entity.getAverageSpeed())
                .averageAcceleration(entity.getAverageAcceleration())
                .totalDistance(entity.getTotalDistance())
                .totalJumps(entity.getTotalJumps())
                .directionChanges(entity.getDirectionChanges())
                .movementIntensity(entity.getMovementIntensity())
                .performanceScore(entity.getPerformanceScore())
                .build();
    }

    public static PerformanceStatisticDTO fromEntity(PerformanceStatistic entity, BiomechanicalMetricsDTO bio) {
        PerformanceStatisticDTO dto = fromEntity(entity);
        if (dto != null && bio != null) {
            dto.setLandingSoftnessScore(bio.getLandingSoftnessScore());
            dto.setPeakLandingImpactG(bio.getPeakLandingImpactG());
            dto.setBilateralSymmetryPct(bio.getBilateralSymmetryPct());
            dto.setDominantSide(bio.getDominantSide());
            dto.setTrunkStabilityScore(bio.getTrunkStabilityScore());
            dto.setTrunkLeanAngleDegrees(bio.getTrunkLeanAngleDegrees());
            dto.setExplosivenessScore(bio.getExplosivenessScore());
            dto.setFatigueIndex(bio.getFatigueIndex());
        }
        return dto;
    }

    public PerformanceStatistic toEntity() {
        PerformanceStatistic entity = new PerformanceStatistic();
        entity.setId(this.id);
        entity.setSessionId(this.sessionId);
        entity.setUserId(this.userId);
        entity.setDate(this.date != null ? this.date : LocalDate.now());
        entity.setSport(this.sport);
        entity.setAverageSpeed(this.averageSpeed != null ? this.averageSpeed : 0.0);
        entity.setAverageAcceleration(this.averageAcceleration != null ? this.averageAcceleration : 0.0);
        entity.setTotalDistance(this.totalDistance != null ? this.totalDistance : 0.0);
        entity.setTotalJumps(this.totalJumps != null ? this.totalJumps : 0);
        entity.setDirectionChanges(this.directionChanges != null ? this.directionChanges : 0);
        entity.setMovementIntensity(this.movementIntensity != null ? this.movementIntensity : 0);
        entity.setPerformanceScore(this.performanceScore != null ? this.performanceScore : 0);
        return entity;
    }
}
