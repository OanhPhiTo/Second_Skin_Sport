package com.secondskin.sport.controller;

import com.secondskin.sport.dto.SensorStatusDTO;
import com.secondskin.sport.entity.Device;
import com.secondskin.sport.service.DeviceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {
    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @GetMapping
    public ResponseEntity<List<Device>> getAllDevices() {
        return ResponseEntity.ok(deviceService.getAllDevices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Device> getDeviceById(@PathVariable Long id) {
        return deviceService.getDeviceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status")
    public ResponseEntity<SensorStatusDTO> getSensorStatus() {
        return ResponseEntity.ok(deviceService.getSensorStatus());
    }

    @PostMapping("/{id}/connect")
    public ResponseEntity<Device> connectDevice(@PathVariable Long id) {
        return ResponseEntity.ok(deviceService.updateConnectionStatus(id, true));
    }

    @PostMapping("/{id}/disconnect")
    public ResponseEntity<Device> disconnectDevice(@PathVariable Long id) {
        return ResponseEntity.ok(deviceService.updateConnectionStatus(id, false));
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<Map<String, Object>> syncDevice(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Đồng bộ thiết bị thành công",
                "syncedAt", java.time.LocalDateTime.now()
        ));
    }

    @PutMapping("/{id}/battery")
    public ResponseEntity<Map<String, Object>> updateBattery(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        int battery = payload.getOrDefault("batteryLevel", 100);
        Device updated = deviceService.updateBatteryLevel(id, battery);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "deviceId", updated.getDeviceId(),
                "batteryLevel", updated.getBatteryLevel(),
                "updatedAt", java.time.LocalDateTime.now()
        ));
    }
}
