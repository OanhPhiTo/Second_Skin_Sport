package com.secondskin.sport.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "team_athletes")
public class TeamAthlete {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "team_id", nullable = false)
    private Long teamId;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String name;

    @Column(name = "jersey_number")
    private Integer jerseyNumber;

    private String position;

    @Column(name = "device_id")
    private String deviceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AthleteStatus status = AthleteStatus.BENCH;

    @Column(name = "minutes_played")
    private Integer minutesPlayed = 0;

    @Column(name = "fatigue_index")
    private Double fatigueIndex = 0.0;

    @Column(name = "current_intensity")
    private Double currentIntensity = 0.0;

    @Column(name = "jump_count")
    private Integer jumpCount = 0;

    @Column(name = "high_impact_landings")
    private Integer highImpactLandings = 0;

    @Column(name = "heart_rate")
    private Integer heartRate = 75;

    @Column(name = "last_telemetry_time")
    private LocalDateTime lastTelemetryTime;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public TeamAthlete() {
        this.updatedAt = LocalDateTime.now();
    }

    public TeamAthlete(Long teamId, Long userId, String name, Integer jerseyNumber, String position, String deviceId, AthleteStatus status) {
        this.teamId = teamId;
        this.userId = userId;
        this.name = name;
        this.jerseyNumber = jerseyNumber;
        this.position = position;
        this.deviceId = deviceId;
        this.status = status != null ? status : AthleteStatus.BENCH;
        this.minutesPlayed = 0;
        this.fatigueIndex = 0.0;
        this.currentIntensity = 0.0;
        this.jumpCount = 0;
        this.highImpactLandings = 0;
        this.heartRate = 75;
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getJerseyNumber() { return jerseyNumber; }
    public void setJerseyNumber(Integer jerseyNumber) { this.jerseyNumber = jerseyNumber; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public AthleteStatus getStatus() { return status; }
    public void setStatus(AthleteStatus status) { this.status = status; }

    public Integer getMinutesPlayed() { return minutesPlayed; }
    public void setMinutesPlayed(Integer minutesPlayed) { this.minutesPlayed = minutesPlayed; }

    public Double getFatigueIndex() { return fatigueIndex; }
    public void setFatigueIndex(Double fatigueIndex) { this.fatigueIndex = fatigueIndex; }

    public Double getCurrentIntensity() { return currentIntensity; }
    public void setCurrentIntensity(Double currentIntensity) { this.currentIntensity = currentIntensity; }

    public Integer getJumpCount() { return jumpCount; }
    public void setJumpCount(Integer jumpCount) { this.jumpCount = jumpCount; }

    public Integer getHighImpactLandings() { return highImpactLandings; }
    public void setHighImpactLandings(Integer highImpactLandings) { this.highImpactLandings = highImpactLandings; }

    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }

    public LocalDateTime getLastTelemetryTime() { return lastTelemetryTime; }
    public void setLastTelemetryTime(LocalDateTime lastTelemetryTime) { this.lastTelemetryTime = lastTelemetryTime; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
