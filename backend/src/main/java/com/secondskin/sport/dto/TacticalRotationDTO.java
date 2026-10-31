package com.secondskin.sport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TacticalRotationDTO {
    private Long outAthleteId;
    private String outAthleteName;
    private Integer outJerseyNumber;
    private String outPosition;
    private Double outFatigueIndex;

    private Long inAthleteId;
    private String inAthleteName;
    private Integer inJerseyNumber;
    private String inPosition;
    private Double inFatigueIndex;

    private String reason;
    private String urgency; // "CRITICAL", "HIGH", "MODERATE"
    private String recommendedTactic;
}
