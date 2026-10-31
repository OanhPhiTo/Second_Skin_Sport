package com.secondskin.sport.controller;

import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.service.SensorDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sensor-data")
public class SensorDataController {
    private final SensorDataService sensorDataService;

    public SensorDataController(SensorDataService sensorDataService) {
        this.sensorDataService = sensorDataService;
    }

    @PostMapping
    public ResponseEntity<SensorDataDTO> postSensorData(@RequestBody SensorDataDTO sensorDataDTO) {
        return ResponseEntity.ok(sensorDataService.saveSensorDataDTO(sensorDataDTO));
    }

    @GetMapping("/latest")
    public ResponseEntity<SensorDataDTO> getLatestSensorData() {
        return sensorDataService.getLatestSensorDataDTO()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<SensorDataDTO>> getRecentDataPoints(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sensorDataService.getSensorDataDTOBySessionId(sessionId));
    }
}
