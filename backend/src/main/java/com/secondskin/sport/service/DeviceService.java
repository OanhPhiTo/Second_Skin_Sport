package com.secondskin.sport.service;

import com.secondskin.sport.dto.DeviceDTO;
import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.dto.SensorStatusDTO;
import com.secondskin.sport.entity.Device;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.repository.DeviceRepository;
import com.secondskin.sport.repository.SensorDataRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class DeviceService {
    private final DeviceRepository deviceRepository;
    private final SensorDataRepository sensorDataRepository;

    public DeviceService(DeviceRepository deviceRepository, SensorDataRepository sensorDataRepository) {
        this.deviceRepository = deviceRepository;
        this.sensorDataRepository = sensorDataRepository;
    }

    public List<DeviceDTO> getAllDevices() {
        return deviceRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public Optional<DeviceDTO> getDeviceById(Long id) {
        return deviceRepository.findById(id).map(this::toDTO);
    }

    public DeviceDTO updateConnectionStatus(Long id, boolean connected) {
        return deviceRepository.findById(id).map(device -> {
            device.setConnected(connected);
            device.setLastSync(LocalDateTime.now());
            Device saved = deviceRepository.save(device);
            return toDTO(saved);
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy thiết bị"));
    }

    public DeviceDTO updateBatteryLevel(Long id, int batteryLevel) {
        return deviceRepository.findById(id).map(device -> {
            device.setBatteryLevel(Math.max(0, Math.min(100, batteryLevel)));
            device.setLastSync(LocalDateTime.now());
            Device saved = deviceRepository.save(device);
            return toDTO(saved);
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy thiết bị"));
    }

    public DeviceDTO syncDevice(Long id) {
        return deviceRepository.findById(id).map(device -> {
            device.setLastSync(LocalDateTime.now());
            Device saved = deviceRepository.save(device);
            return toDTO(saved);
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy thiết bị"));
    }

    public SensorStatusDTO getSensorStatus() {
        Optional<Device> deviceOpt = deviceRepository.findAll().stream().findFirst();
        Optional<SensorData> latestDataOpt = sensorDataRepository.findTop1ByOrderByTimestampDesc();

        String deviceId = deviceOpt.map(Device::getDeviceId).orElse("SSS-PATCH-001");
        String deviceName = deviceOpt.map(Device::getDeviceName).orElse("Second Skin Patch #001");
        boolean isConnected = deviceOpt.map(Device::isConnected).orElse(false);
        int batteryLevel = deviceOpt.map(Device::getBatteryLevel).orElse(100);

        String lastSync = deviceOpt.map(d -> {
            if (d.getLastSync() == null) return "Chưa đồng bộ";
            long seconds = java.time.Duration.between(d.getLastSync(), LocalDateTime.now()).getSeconds();
            if (seconds < 15) return "Vừa xong";
            if (seconds < 60) return seconds + " giây trước";
            long minutes = seconds / 60;
            if (minutes < 60) return minutes + " phút trước";
            long hours = minutes / 60;
            return hours + " giờ trước";
        }).orElse("Sẵn sàng kết nối");

        SensorDataDTO currentDataDTO = latestDataOpt
                .map(this::toSensorDataDTO)
                .orElseGet(() -> SensorDataDTO.builder()
                        .ax(0.0)
                        .ay(0.0)
                        .az(9.81)
                        .accelerometerX(0.0)
                        .accelerometerY(0.0)
                        .accelerometerZ(9.81)
                        .gx(0.0)
                        .gy(0.0)
                        .gz(0.0)
                        .gyroscopeX(0.0)
                        .gyroscopeY(0.0)
                        .gyroscopeZ(0.0)
                        .pitch(0.0)
                        .roll(0.0)
                        .yaw(0.0)
                        .movementIntensity(0)
                        .build());

        return new SensorStatusDTO(deviceId, deviceName, isConnected, batteryLevel, lastSync, currentDataDTO);
    }

    public DeviceDTO toDTO(Device entity) {
        return DeviceDTO.fromEntity(entity);
    }

    public Device toEntity(DeviceDTO dto) {
        if (dto == null) return null;
        return dto.toEntity();
    }

    public SensorDataDTO toSensorDataDTO(SensorData data) {
        return SensorDataDTO.fromEntity(data);
    }
}
