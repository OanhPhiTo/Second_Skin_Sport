package com.secondskin.sport.controller;

import com.secondskin.sport.dto.BatchProcessResponseDTO;
import com.secondskin.sport.dto.SensorBatchDTO;
import com.secondskin.sport.service.SensorBatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/sensor")
public class SensorBatchController {

    private final SensorBatchService sensorBatchService;

    public SensorBatchController(SensorBatchService sensorBatchService) {
        this.sensorBatchService = sensorBatchService;
    }

    @PostMapping("/batches")
    public ResponseEntity<BatchProcessResponseDTO> receiveSensorBatch(@RequestBody SensorBatchDTO batchDTO) {
        BatchProcessResponseDTO response = sensorBatchService.processBatch(batchDTO);
        return ResponseEntity.ok(response);
    }
}
