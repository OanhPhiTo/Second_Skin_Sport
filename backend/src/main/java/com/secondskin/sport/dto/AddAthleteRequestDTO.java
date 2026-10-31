package com.secondskin.sport.dto;

import com.secondskin.sport.entity.AthleteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddAthleteRequestDTO {
    private String name;
    private Integer jerseyNumber;
    private String position;
    private String deviceId;
    private AthleteStatus status;
    private Long userId;
}
