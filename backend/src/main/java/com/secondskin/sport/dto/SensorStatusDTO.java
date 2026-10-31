package com.secondskin.sport.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SensorStatusDTO {
    private String deviceId;
    private String deviceName;
    private boolean connected;
    private int batteryLevel;
    private String lastSync;
    private SensorDataDTO currentData;
}
