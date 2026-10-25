package com.secondskin.sport.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class SensorBatchDTO {
    private String deviceId;
    private Long sessionId;
    private LocalDateTime batchTimestamp;
    private Integer batteryLevel;
    private List<SensorReadingDTO> readings = new ArrayList<>();

    public SensorBatchDTO() {
        this.batchTimestamp = LocalDateTime.now();
    }

    public SensorBatchDTO(String deviceId, Long sessionId, Integer batteryLevel, List<SensorReadingDTO> readings) {
        this.deviceId = deviceId;
        this.sessionId = sessionId;
        this.batteryLevel = batteryLevel;
        this.readings = readings != null ? readings : new ArrayList<>();
        this.batchTimestamp = LocalDateTime.now();
    }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public LocalDateTime getBatchTimestamp() { return batchTimestamp; }
    public void setBatchTimestamp(LocalDateTime batchTimestamp) { this.batchTimestamp = batchTimestamp; }

    public Integer getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(Integer batteryLevel) { this.batteryLevel = batteryLevel; }

    public List<SensorReadingDTO> getReadings() { return readings; }
    public void setReadings(List<SensorReadingDTO> readings) { this.readings = readings; }
}
