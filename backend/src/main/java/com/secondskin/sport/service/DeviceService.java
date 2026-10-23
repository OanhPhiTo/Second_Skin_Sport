package com.secondskin.sport.service;

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

    public List<Device> getAllDevices() {
        return deviceRepository.findAll();
    }

    public Optional<Device> getDeviceById(Long id) {
        return deviceRepository.findById(id);
    }

    public Device updateConnectionStatus(Long id, boolean connected) {
        return deviceRepository.findById(id).map(device -> {
            device.setConnected(connected);
            device.setLastSync(LocalDateTime.now());
            return deviceRepository.save(device);
        }).orElseThrow(() -> new RuntimeException("Không tìm thấy thiết bị"));
    }

    public Device updateBatteryLevel(Long id, int batteryLevel) {
        return deviceRepository.findById(id).map(device -> {
            device.setBatteryLevel(Math.max(0, Math.min(100, batteryLevel)));
            device.setLastSync(LocalDateTime.now());
            return deviceRepository.save(device);
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

        SensorData latestData = latestDataOpt.orElseGet(() -> {
            SensorData standby = new SensorData();
            standby.setAccelerometerX(0.0);
            standby.setAccelerometerY(0.0);
            standby.setAccelerometerZ(9.81);
            standby.setGyroscopeX(0.0);
            standby.setGyroscopeY(0.0);
            standby.setGyroscopeZ(0.0);
            standby.setPitch(0.0);
            standby.setRoll(0.0);
            standby.setYaw(0.0);
            standby.setMovementIntensity(0);
            return standby;
        });

        return new SensorStatusDTO(deviceId, deviceName, isConnected, batteryLevel, lastSync, latestData);
    }
}
