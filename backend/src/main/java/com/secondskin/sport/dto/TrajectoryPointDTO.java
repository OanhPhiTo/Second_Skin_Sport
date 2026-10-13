package com.secondskin.sport.dto;

import java.time.LocalDateTime;

public class TrajectoryPointDTO {
    private LocalDateTime timestamp;
    private double accelerometerX; // m/s²
    private double accelerometerY; // m/s²
    private double accelerometerZ; // m/s²
    private double gyroscopeX;     // °/s
    private double gyroscopeY;     // °/s
    private double gyroscopeZ;     // °/s
    private double pitch;
    private double roll;
    private double yaw;
    private int movementIntensity; // 0-100%

    public TrajectoryPointDTO() {}

    public TrajectoryPointDTO(LocalDateTime timestamp, double accelerometerX, double accelerometerY,
                              double accelerometerZ, double gyroscopeX, double gyroscopeY,
                              double gyroscopeZ, double pitch, double roll, double yaw, int movementIntensity) {
        this.timestamp = timestamp;
        this.accelerometerX = accelerometerX;
        this.accelerometerY = accelerometerY;
        this.accelerometerZ = accelerometerZ;
        this.gyroscopeX = gyroscopeX;
        this.gyroscopeY = gyroscopeY;
        this.gyroscopeZ = gyroscopeZ;
        this.pitch = pitch;
        this.roll = roll;
        this.yaw = yaw;
        this.movementIntensity = movementIntensity;
    }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public double getAccelerometerX() { return accelerometerX; }
    public void setAccelerometerX(double accelerometerX) { this.accelerometerX = accelerometerX; }

    public double getAccelerometerY() { return accelerometerY; }
    public void setAccelerometerY(double accelerometerY) { this.accelerometerY = accelerometerY; }

    public double getAccelerometerZ() { return accelerometerZ; }
    public void setAccelerometerZ(double accelerometerZ) { this.accelerometerZ = accelerometerZ; }

    public double getGyroscopeX() { return gyroscopeX; }
    public void setGyroscopeX(double gyroscopeX) { this.gyroscopeX = gyroscopeX; }

    public double getGyroscopeY() { return gyroscopeY; }
    public void setGyroscopeY(double gyroscopeY) { this.gyroscopeY = gyroscopeY; }

    public double getGyroscopeZ() { return gyroscopeZ; }
    public void setGyroscopeZ(double gyroscopeZ) { this.gyroscopeZ = gyroscopeZ; }

    public double getPitch() { return pitch; }
    public void setPitch(double pitch) { this.pitch = pitch; }

    public double getRoll() { return roll; }
    public void setRoll(double roll) { this.roll = roll; }

    public double getYaw() { return yaw; }
    public void setYaw(double yaw) { this.yaw = yaw; }

    public int getMovementIntensity() { return movementIntensity; }
    public void setMovementIntensity(int movementIntensity) { this.movementIntensity = movementIntensity; }
}
