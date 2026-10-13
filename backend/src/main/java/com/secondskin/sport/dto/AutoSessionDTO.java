package com.secondskin.sport.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class AutoSessionDTO {
    private Long userId;
    private String deviceId;
    private String sport; // "Running" or "Basketball" (or auto-detected)
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;

    private Integer totalJumps;
    private Integer directionChanges;
    private Double averageAcceleration; // m/s²
    private Double averageSpeed;        // km/h
    private Integer movementIntensity;  // 0-100%
    private Integer performanceScore;   // 0-100%
    private String status;              // "Completed"

    private List<TrajectoryPointDTO> trajectoryPoints = new ArrayList<>();

    public AutoSessionDTO() {}

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

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public Integer getTotalJumps() { return totalJumps; }
    public void setTotalJumps(Integer totalJumps) { this.totalJumps = totalJumps; }

    public Integer getDirectionChanges() { return directionChanges; }
    public void setDirectionChanges(Integer directionChanges) { this.directionChanges = directionChanges; }

    public Double getAverageAcceleration() { return averageAcceleration; }
    public void setAverageAcceleration(Double averageAcceleration) { this.averageAcceleration = averageAcceleration; }

    public Double getAverageSpeed() { return averageSpeed; }
    public void setAverageSpeed(Double averageSpeed) { this.averageSpeed = averageSpeed; }

    public Integer getMovementIntensity() { return movementIntensity; }
    public void setMovementIntensity(Integer movementIntensity) { this.movementIntensity = movementIntensity; }

    public Integer getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(Integer performanceScore) { this.performanceScore = performanceScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<TrajectoryPointDTO> getTrajectoryPoints() { return trajectoryPoints; }
    public void setTrajectoryPoints(List<TrajectoryPointDTO> trajectoryPoints) { this.trajectoryPoints = trajectoryPoints; }
}
