package com.secondskin.sport.service;

import com.secondskin.sport.dto.BatchProcessResponseDTO;
import com.secondskin.sport.dto.JumpEventDTO;
import com.secondskin.sport.dto.SensorBatchDTO;
import com.secondskin.sport.dto.SensorReadingDTO;
import com.secondskin.sport.entity.Device;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.repository.DeviceRepository;
import com.secondskin.sport.repository.SensorDataRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SensorBatchService {

    private static final Logger log = LoggerFactory.getLogger(SensorBatchService.class);

    private final SensorDataRepository sensorDataRepository;
    private final DeviceRepository deviceRepository;
    private final JumpDetectionService jumpDetectionService;
    private final SimpMessagingTemplate messagingTemplate;

    public SensorBatchService(SensorDataRepository sensorDataRepository,
                              DeviceRepository deviceRepository,
                              JumpDetectionService jumpDetectionService,
                              @Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.sensorDataRepository = sensorDataRepository;
        this.deviceRepository = deviceRepository;
        this.jumpDetectionService = jumpDetectionService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public BatchProcessResponseDTO processBatch(SensorBatchDTO batchDTO) {
        if (batchDTO == null || batchDTO.getReadings() == null || batchDTO.getReadings().isEmpty()) {
            return new BatchProcessResponseDTO("EMPTY", 0, "No sensor readings in batch");
        }

        String deviceId = batchDTO.getDeviceId() != null ? batchDTO.getDeviceId() : "ESP32-SUPERMINI-01";
        Long sessionId = batchDTO.getSessionId();

        List<SensorData> entities = new ArrayList<>();
        for (SensorReadingDTO r : batchDTO.getReadings()) {
            SensorData data = new SensorData(
                    sessionId,
                    deviceId,
                    r.getTimestamp() != null ? r.getTimestamp() : LocalDateTime.now(),
                    r.getAccelerometerX(),
                    r.getAccelerometerY(),
                    r.getAccelerometerZ(),
                    r.getGyroscopeX(),
                    r.getGyroscopeY(),
                    r.getGyroscopeZ(),
                    r.getPitch(),
                    r.getRoll(),
                    r.getYaw(),
                    r.getMovementIntensity()
            );
            entities.add(data);
        }

        sensorDataRepository.saveAll(entities);

        // Update device lastSync timestamp and battery if registered
        Optional<Device> deviceOpt = deviceRepository.findByDeviceId(deviceId);
        deviceOpt.ifPresent(device -> {
            device.setLastSync(LocalDateTime.now());
            device.setConnected(true);
            if (batchDTO.getBatteryLevel() != null && batchDTO.getBatteryLevel() > 0) {
                device.setBatteryLevel(Math.min(100, Math.max(0, batchDTO.getBatteryLevel())));
            }
            deviceRepository.save(device);
        });

        // 3. Phân tích Động học & Phát hiện Cú nhảy (FSM Jump Detection)
        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(deviceId, batchDTO.getReadings());
        JumpDetectionService.DeviceState devState = jumpDetectionService.getDeviceState(deviceId);

        // 4. Phát dữ liệu thời gian thực qua WebSocket (nếu có kết nối)
        if (messagingTemplate != null && !batchDTO.getReadings().isEmpty()) {
            try {
                SensorReadingDTO latest = batchDTO.getReadings().get(batchDTO.getReadings().size() - 1);
                messagingTemplate.convertAndSend("/topic/sensor-telemetry", latest);
                messagingTemplate.convertAndSend("/topic/devices/" + deviceId + "/telemetry", latest);
            } catch (Exception e) {
                log.warn("WebSocket publish telemetry failed: {}", e.getMessage());
            }
        }

        String msg = String.format("Processed %d readings from %s (Jumps: %d, Steps: %d, Activity: %s)",
                entities.size(), deviceId, jumps.size(), devState.totalSteps, devState.currentActivity);

        return new BatchProcessResponseDTO(
                "SUCCESS",
                entities.size(),
                msg,
                jumps.size(),
                devState.totalSteps,
                devState.currentActivity,
                jumps
        );
    }
}
