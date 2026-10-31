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
public class TelemetryDataPointDTO {
    private LocalDateTime timestamp;
    private Double accX;      // m/s^2
    private Double accY;      // m/s^2
    private Double accZ;      // m/s^2
    private Double gyroX;     // deg/s
    private Double gyroY;     // deg/s
    private Double gyroZ;     // deg/s
    private Integer heartRate;
    private Double intensity;
}
