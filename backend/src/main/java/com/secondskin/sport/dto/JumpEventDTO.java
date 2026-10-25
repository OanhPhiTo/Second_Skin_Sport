package com.secondskin.sport.dto;

import java.time.LocalDateTime;

public class JumpEventDTO {

    private String deviceId;
    private LocalDateTime timestamp;
    private double airtimeSeconds;
    private double jumpHeightCm;
    private double landingImpactMs2;
    private double landingImpactG;
    private int jumpIndex;
    private String activityType;

    public JumpEventDTO() {}

    public JumpEventDTO(String deviceId, LocalDateTime timestamp, double airtimeSeconds,
                        double jumpHeightCm, double landingImpactMs2, double landingImpactG,
                        int jumpIndex, String activityType) {
        this.deviceId = deviceId;
        this.timestamp = timestamp;
        this.airtimeSeconds = airtimeSeconds;
        this.jumpHeightCm = jumpHeightCm;
        this.landingImpactMs2 = landingImpactMs2;
        this.landingImpactG = landingImpactG;
        this.jumpIndex = jumpIndex;
        this.activityType = activityType;
    }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public double getAirtimeSeconds() { return airtimeSeconds; }
    public void setAirtimeSeconds(double airtimeSeconds) { this.airtimeSeconds = airtimeSeconds; }

    public double getJumpHeightCm() { return jumpHeightCm; }
    public void setJumpHeightCm(double jumpHeightCm) { this.jumpHeightCm = jumpHeightCm; }

    public double getLandingImpactMs2() { return landingImpactMs2; }
    public void setLandingImpactMs2(double landingImpactMs2) { this.landingImpactMs2 = landingImpactMs2; }

    public double getLandingImpactG() { return landingImpactG; }
    public void setLandingImpactG(double landingImpactG) { this.landingImpactG = landingImpactG; }

    public int getJumpIndex() { return jumpIndex; }
    public void setJumpIndex(int jumpIndex) { this.jumpIndex = jumpIndex; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }
}
