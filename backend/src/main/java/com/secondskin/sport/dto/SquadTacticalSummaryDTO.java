package com.secondskin.sport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SquadTacticalSummaryDTO {
    private Long teamId;
    private String teamName;
    private String sport;
    private List<TeamAthleteDTO> activeOnField;
    private List<TeamAthleteDTO> benchSubstitutes;
    /** Combined roster retained for dashboard and E2E consumers. */
    private List<TeamAthleteDTO> roster;
    private Double averageFatigue;
    private Integer highFatigueCount;
    private List<TacticalRotationDTO> activeTacticalAlerts;
    private String recommendedPaceAdjustment;
    private String lastEvaluated;
}
