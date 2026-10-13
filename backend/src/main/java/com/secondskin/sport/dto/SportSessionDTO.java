package com.secondskin.sport.dto;

import java.time.LocalDateTime;

public class SportSessionDTO {
    private Long id;
    private Long userId;
    private String deviceId;
    private String sport; // Running, Basketball
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int durationMinutes;

    private int totalJumps;
    private int directionChanges;
    private double averageAcceleration; // m/s²
    private double averageSpeed;        // km/h
    private int movementIntensity;      // % (0-100)
    private int performanceScore;       // % (0-100)
    private String status;              // Completed, In Progress, Paused
    private AiInsightDTO aiInsight;

    public SportSessionDTO() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getSport() { return sport; }
    public void setSport(String sport) { this.sport = sport; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }

    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }

    public int getTotalJumps() { return totalJumps; }
    public void setTotalJumps(int totalJumps) { this.totalJumps = totalJumps; }

    public int getDirectionChanges() { return directionChanges; }
    public void setDirectionChanges(int directionChanges) { this.directionChanges = directionChanges; }

    public double getAverageAcceleration() { return averageAcceleration; }
    public void setAverageAcceleration(double averageAcceleration) { this.averageAcceleration = averageAcceleration; }

    public double getAverageSpeed() { return averageSpeed; }
    public void setAverageSpeed(double averageSpeed) { this.averageSpeed = averageSpeed; }

    public int getMovementIntensity() { return movementIntensity; }
    public void setMovementIntensity(int movementIntensity) { this.movementIntensity = movementIntensity; }

    public int getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(int performanceScore) { this.performanceScore = performanceScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public AiInsightDTO getAiInsight() { return aiInsight; }
    public void setAiInsight(AiInsightDTO aiInsight) { this.aiInsight = aiInsight; }
}
