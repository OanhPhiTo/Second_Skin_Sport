package com.secondskin.sport.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.secondskin.sport.entity.SensorData;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SensorDataDTO {
    private Long id;
    private Long sessionId;
    private String deviceId;
    private LocalDateTime timestamp;

    // Full property names (matches entity & frontend SensorCard.jsx)
    private Double accelerometerX;
    private Double accelerometerY;
    private Double accelerometerZ;
    private Double gyroscopeX;
    private Double gyroscopeY;
    private Double gyroscopeZ;

    // Standard Shorthand Aliases (matches DISPATCH / PROJECT Invariant)
    private Double ax;
    private Double ay;
    private Double az;
    private Double gx;
    private Double gy;
    private Double gz;

    // Spatial orientation (degrees) & intensity (%)
    private Double pitch;
    private Double roll;
    private Double yaw;
    private Integer movementIntensity;

    // Biomechanical & physiological extensions
    private Double heartRate;
    private Double muscleLoad;
    private Double speedKmh;

    public Double getAx() {
        return ax != null ? ax : accelerometerX;
    }

    public Double getAccelerometerX() {
        return accelerometerX != null ? accelerometerX : ax;
    }

    public Double getAy() {
        return ay != null ? ay : accelerometerY;
    }

    public Double getAccelerometerY() {
        return accelerometerY != null ? accelerometerY : ay;
    }

    public Double getAz() {
        return az != null ? az : accelerometerZ;
    }

    public Double getAccelerometerZ() {
        return accelerometerZ != null ? accelerometerZ : az;
    }

    public Double getGx() {
        return gx != null ? gx : gyroscopeX;
    }

    public Double getGyroscopeX() {
        return gyroscopeX != null ? gyroscopeX : gx;
    }

    public Double getGy() {
        return gy != null ? gy : gyroscopeY;
    }

    public Double getGyroscopeY() {
        return gyroscopeY != null ? gyroscopeY : gy;
    }

    public Double getGz() {
        return gz != null ? gz : gyroscopeZ;
    }

    public Double getGyroscopeZ() {
        return gyroscopeZ != null ? gyroscopeZ : gz;
    }

    public static SensorDataDTO fromEntity(SensorData entity) {
        if (entity == null) {
            return null;
        }
        return SensorDataDTO.builder()
                .id(entity.getId())
                .sessionId(entity.getSessionId())
                .deviceId(entity.getDeviceId())
                .timestamp(entity.getTimestamp())
                .accelerometerX(entity.getAccelerometerX())
                .accelerometerY(entity.getAccelerometerY())
                .accelerometerZ(entity.getAccelerometerZ())
                .gyroscopeX(entity.getGyroscopeX())
                .gyroscopeY(entity.getGyroscopeY())
                .gyroscopeZ(entity.getGyroscopeZ())
                .ax(entity.getAccelerometerX())
                .ay(entity.getAccelerometerY())
                .az(entity.getAccelerometerZ())
                .gx(entity.getGyroscopeX())
                .gy(entity.getGyroscopeY())
                .gz(entity.getGyroscopeZ())
                .pitch(entity.getPitch())
                .roll(entity.getRoll())
                .yaw(entity.getYaw())
                .movementIntensity(entity.getMovementIntensity())
                .build();
    }

    public SensorData toEntity() {
        SensorData entity = new SensorData();
        entity.setId(this.id);
        entity.setSessionId(this.sessionId);
        entity.setDeviceId(this.deviceId);
        entity.setTimestamp(this.timestamp != null ? this.timestamp : LocalDateTime.now());

        double finalAx = this.accelerometerX != null ? this.accelerometerX : (this.ax != null ? this.ax : 0.0);
        double finalAy = this.accelerometerY != null ? this.accelerometerY : (this.ay != null ? this.ay : 0.0);
        double finalAz = this.accelerometerZ != null ? this.accelerometerZ : (this.az != null ? this.az : 9.81);
        double finalGx = this.gyroscopeX != null ? this.gyroscopeX : (this.gx != null ? this.gx : 0.0);
        double finalGy = this.gyroscopeY != null ? this.gyroscopeY : (this.gy != null ? this.gy : 0.0);
        double finalGz = this.gyroscopeZ != null ? this.gyroscopeZ : (this.gz != null ? this.gz : 0.0);

        entity.setAccelerometerX(finalAx);
        entity.setAccelerometerY(finalAy);
        entity.setAccelerometerZ(finalAz);
        entity.setGyroscopeX(finalGx);
        entity.setGyroscopeY(finalGy);
        entity.setGyroscopeZ(finalGz);

        entity.setPitch(this.pitch != null ? this.pitch : 0.0);
        entity.setRoll(this.roll != null ? this.roll : 0.0);
        entity.setYaw(this.yaw != null ? this.yaw : 0.0);
        entity.setMovementIntensity(this.movementIntensity != null ? this.movementIntensity : 0);

        return entity;
    }
}
