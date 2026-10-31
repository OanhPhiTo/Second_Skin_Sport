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
public class TeamDTO {
    private Long id;
    private String name;
    private String sport;
    private Long coachId;
    private String description;
    private int totalAthletes;
    private int onFieldCount;
    private int benchCount;
    private LocalDateTime createdAt;
}
