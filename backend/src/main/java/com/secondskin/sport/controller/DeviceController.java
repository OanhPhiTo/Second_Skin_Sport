package com.secondskin.sport.controller;

import com.secondskin.sport.dto.DeviceDTO;
import com.secondskin.sport.dto.SensorStatusDTO;
import com.secondskin.sport.service.DeviceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
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
    public ResponseEntity<List<DeviceDTO>> getAllDevices() {
        return ResponseEntity.ok(deviceService.getAllDevices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeviceDTO> getDeviceById(@PathVariable Long id) {
        return deviceService.getDeviceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status")
    public ResponseEntity<SensorStatusDTO> getSensorStatus() {
        return ResponseEntity.ok(deviceService.getSensorStatus());
    }

    @PostMapping("/{id}/connect")
    public ResponseEntity<DeviceDTO> connectDevice(@PathVariable Long id) {
        return ResponseEntity.ok(deviceService.updateConnectionStatus(id, true));
    }

    @PostMapping("/{id}/disconnect")
    public ResponseEntity<DeviceDTO> disconnectDevice(@PathVariable Long id) {
        return ResponseEntity.ok(deviceService.updateConnectionStatus(id, false));
    }

    @PostMapping("/{id}/sync")
    public ResponseEntity<Map<String, Object>> syncDevice(@PathVariable Long id) {
        DeviceDTO synced = deviceService.syncDevice(id);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "message", "Đồng bộ thiết bị thành công",
                "deviceId", synced.getDeviceId() != null ? synced.getDeviceId() : "",
                "syncedAt", synced.getLastSyncTime() != null ? synced.getLastSyncTime() : LocalDateTime.now()
        ));
    }

    @PutMapping("/{id}/battery")
    public ResponseEntity<Map<String, Object>> updateBattery(@PathVariable Long id, @RequestBody(required = false) Map<String, Integer> payload) {
        Integer val = (payload != null) ? payload.get("batteryLevel") : null;
        int battery = (val != null) ? val : 100;
        DeviceDTO updated = deviceService.updateBatteryLevel(id, battery);
        return ResponseEntity.ok(Map.of(
                "status", "success",
                "deviceId", updated.getDeviceId() != null ? updated.getDeviceId() : "",
                "batteryLevel", updated.getBatteryLevel(),
                "updatedAt", LocalDateTime.now()
        ));
    }
}
