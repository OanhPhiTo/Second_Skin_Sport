package com.secondskin.sport.service;

import com.secondskin.sport.dto.BatchProcessResponseDTO;
import com.secondskin.sport.dto.SensorBatchDTO;
import com.secondskin.sport.dto.SensorReadingDTO;
import com.secondskin.sport.entity.Device;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.repository.DeviceRepository;
import com.secondskin.sport.repository.SensorDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SensorBatchService {

    private final SensorDataRepository sensorDataRepository;
    private final DeviceRepository deviceRepository;

    public SensorBatchService(SensorDataRepository sensorDataRepository, DeviceRepository deviceRepository) {
        this.sensorDataRepository = sensorDataRepository;
        this.deviceRepository = deviceRepository;
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

        return new BatchProcessResponseDTO("SUCCESS", entities.size(), "Processed " + entities.size() + " sensor readings from " + deviceId);
    }
}
