package com.secondskin.sport.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TacticalSwapRequestDTO {
    private Long teamId;
    private Long outAthleteId;
    private Long inAthleteId;

    public TacticalSwapRequestDTO(Long outAthleteId, Long inAthleteId) {
        this.outAthleteId = outAthleteId;
        this.inAthleteId = inAthleteId;
    }
}
