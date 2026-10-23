package com.secondskin.sport.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_data")
public class SensorData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long sessionId;
    private String deviceId;
    private LocalDateTime timestamp;

    // Accelerometer (m/s²)
    private double accelerometerX;
    private double accelerometerY;
    private double accelerometerZ;

    // Gyroscope (°/s)
    private double gyroscopeX;
    private double gyroscopeY;
    private double gyroscopeZ;

    // Orientation (degrees)
    private double pitch;
    private double roll;
    private double yaw;

    // Movement Metrics
    private int movementIntensity; // % (0-100)

    public SensorData() {
        this.timestamp = LocalDateTime.now();
    }

    public SensorData(Long sessionId, String deviceId, LocalDateTime timestamp, 
                      double accelerometerX, double accelerometerY, double accelerometerZ, 
                      double gyroscopeX, double gyroscopeY, double gyroscopeZ, 
                      double pitch, double roll, double yaw, int movementIntensity) {
        this.sessionId = sessionId;
        this.deviceId = deviceId;
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

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
