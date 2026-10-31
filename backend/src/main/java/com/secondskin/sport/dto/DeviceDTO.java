package com.secondskin.sport.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.secondskin.sport.entity.Device;
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
public class DeviceDTO {
    private Long id;
    private String name;
    private String deviceCode;
    private String type;
    private String status;
    private Integer batteryLevel;
    private LocalDateTime lastSyncTime;
    private Long userId;

    // Backward compatibility aliases
    private String deviceName;
    private String deviceId;
    private Boolean connected;
    private LocalDateTime lastSync;
    private String firmwareVersion;
    private String connectionType;

    public String getName() {
        return name != null ? name : deviceName;
    }

    public String getDeviceName() {
        return deviceName != null ? deviceName : name;
    }

    public String getDeviceCode() {
        return deviceCode != null ? deviceCode : deviceId;
    }

    public String getDeviceId() {
        return deviceId != null ? deviceId : deviceCode;
    }

    public String getType() {
        return type != null ? type : connectionType;
    }

    public String getConnectionType() {
        return connectionType != null ? connectionType : type;
    }

    public Boolean getConnected() {
        if (connected != null) return connected;
        return status != null && "CONNECTED".equalsIgnoreCase(status);
    }

    public String getStatus() {
        if (status != null) return status;
        return Boolean.TRUE.equals(connected) ? "CONNECTED" : "DISCONNECTED";
    }

    public LocalDateTime getLastSyncTime() {
        return lastSyncTime != null ? lastSyncTime : lastSync;
    }

    public LocalDateTime getLastSync() {
        return lastSync != null ? lastSync : lastSyncTime;
    }

    public static DeviceDTO fromEntity(Device entity) {
        if (entity == null) return null;
        boolean isConn = entity.isConnected();
        return DeviceDTO.builder()
                .id(entity.getId())
                .name(entity.getDeviceName())
                .deviceName(entity.getDeviceName())
                .deviceCode(entity.getDeviceId())
                .deviceId(entity.getDeviceId())
                .type(entity.getConnectionType())
                .connectionType(entity.getConnectionType())
                .status(isConn ? "CONNECTED" : "DISCONNECTED")
                .connected(isConn)
                .batteryLevel(entity.getBatteryLevel())
                .lastSyncTime(entity.getLastSync())
                .lastSync(entity.getLastSync())
                .firmwareVersion(entity.getFirmwareVersion())
                .userId(null)
                .build();
    }

    public Device toEntity() {
        Device device = new Device();
        device.setId(this.id);
        device.setDeviceName(this.deviceName != null ? this.deviceName : this.name);
        device.setDeviceId(this.deviceId != null ? this.deviceId : this.deviceCode);
        device.setConnected(this.connected != null ? this.connected : "CONNECTED".equalsIgnoreCase(this.status));
        device.setBatteryLevel(this.batteryLevel != null ? this.batteryLevel : 100);
        device.setLastSync(this.lastSync != null ? this.lastSync : (this.lastSyncTime != null ? this.lastSyncTime : LocalDateTime.now()));
        device.setFirmwareVersion(this.firmwareVersion != null ? this.firmwareVersion : "v2.4.1");
        device.setConnectionType(this.connectionType != null ? this.connectionType : (this.type != null ? this.type : "BLE 5.2"));
        return device;
    }
}
