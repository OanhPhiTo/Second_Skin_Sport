package com.secondskin.sport.service;

import com.secondskin.sport.dto.DeviceDTO;
import com.secondskin.sport.dto.SensorStatusDTO;
import com.secondskin.sport.entity.Device;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.repository.DeviceRepository;
import com.secondskin.sport.repository.SensorDataRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;

public class DeviceServiceTest {

    private DeviceRepository deviceRepository;
    private SensorDataRepository sensorDataRepository;
    private DeviceService deviceService;

    @BeforeEach
    void setUp() {
        deviceRepository = Mockito.mock(DeviceRepository.class);
        sensorDataRepository = Mockito.mock(SensorDataRepository.class);
        deviceService = new DeviceService(deviceRepository, sensorDataRepository);
    }

    @Test
    @DisplayName("getAllDevices returns List of DeviceDTO")
    void testGetAllDevices() {
        Device dev = new Device("Patch 1", "DEV-01", true, 90, "v1.0", "BLE");
        dev.setId(1L);
        Mockito.when(deviceRepository.findAll()).thenReturn(List.of(dev));

        List<DeviceDTO> result = deviceService.getAllDevices();
        assertEquals(1, result.size());
        assertEquals("Patch 1", result.get(0).getName());
        assertEquals("Patch 1", result.get(0).getDeviceName());
        assertEquals("DEV-01", result.get(0).getDeviceCode());
        assertEquals("DEV-01", result.get(0).getDeviceId());
        assertTrue(result.get(0).getConnected());
        assertEquals("CONNECTED", result.get(0).getStatus());
    }

    @Test
    @DisplayName("getDeviceById returns Optional of DeviceDTO")
    void testGetDeviceById() {
        Device dev = new Device("Patch 1", "DEV-01", true, 90, "v1.0", "BLE");
        dev.setId(1L);
        Mockito.when(deviceRepository.findById(1L)).thenReturn(Optional.of(dev));

        Optional<DeviceDTO> result = deviceService.getDeviceById(1L);
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getId());
    }

    @Test
    @DisplayName("updateConnectionStatus updates connected state and returns DeviceDTO")
    void testUpdateConnectionStatus() {
        Device dev = new Device("Patch 1", "DEV-01", false, 90, "v1.0", "BLE");
        dev.setId(1L);
        Mockito.when(deviceRepository.findById(1L)).thenReturn(Optional.of(dev));
        Mockito.when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        DeviceDTO result = deviceService.updateConnectionStatus(1L, true);
        assertTrue(result.getConnected());
        assertEquals("CONNECTED", result.getStatus());
    }

    @Test
    @DisplayName("updateBatteryLevel clamps percentage between 0 and 100")
    void testUpdateBatteryLevel_Clamping() {
        Device dev = new Device("Patch 1", "DEV-01", true, 50, "v1.0", "BLE");
        dev.setId(1L);
        Mockito.when(deviceRepository.findById(1L)).thenReturn(Optional.of(dev));
        Mockito.when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        DeviceDTO over = deviceService.updateBatteryLevel(1L, 150);
        assertEquals(100, over.getBatteryLevel());

        DeviceDTO under = deviceService.updateBatteryLevel(1L, -20);
        assertEquals(0, under.getBatteryLevel());
    }

    @Test
    @DisplayName("syncDevice updates lastSync timestamp")
    void testSyncDevice() {
        Device dev = new Device("Patch 1", "DEV-01", true, 50, "v1.0", "BLE");
        dev.setId(1L);
        Mockito.when(deviceRepository.findById(1L)).thenReturn(Optional.of(dev));
        Mockito.when(deviceRepository.save(any(Device.class))).thenAnswer(i -> i.getArgument(0));

        DeviceDTO result = deviceService.syncDevice(1L);
        assertNotNull(result.getLastSyncTime());
        assertNotNull(result.getLastSync());
    }

    @Test
    @DisplayName("getSensorStatus encapsulates SensorDataDTO")
    void testGetSensorStatus() {
        Device dev = new Device("Patch 1", "DEV-01", true, 80, "v1.0", "BLE");
        SensorData data = new SensorData(1L, "DEV-01", LocalDateTime.now(), 0.1, 0.2, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 10);

        Mockito.when(deviceRepository.findAll()).thenReturn(List.of(dev));
        Mockito.when(sensorDataRepository.findTop1ByOrderByTimestampDesc()).thenReturn(Optional.of(data));

        SensorStatusDTO status = deviceService.getSensorStatus();
        assertNotNull(status);
        assertEquals("DEV-01", status.getDeviceId());
        assertNotNull(status.getCurrentData());
        assertEquals(0.1, status.getCurrentData().getAx());
        assertEquals(0.1, status.getCurrentData().getAccelerometerX());
    }

    @Test
    @DisplayName("toDTO and toEntity convert bidirectionally without data loss")
    void testBidirectionalConversion() {
        Device dev = new Device("Patch 1", "DEV-01", true, 80, "v1.0", "BLE");
        dev.setId(10L);

        DeviceDTO dto = deviceService.toDTO(dev);
        assertEquals(dev.getId(), dto.getId());
        assertEquals(dev.getDeviceName(), dto.getName());
        assertEquals(dev.getDeviceId(), dto.getDeviceCode());

        Device reconverted = deviceService.toEntity(dto);
        assertEquals(dto.getId(), reconverted.getId());
        assertEquals(dto.getName(), reconverted.getDeviceName());
        assertEquals(dto.getDeviceCode(), reconverted.getDeviceId());
    }

    @Test
    @DisplayName("toEntity and toDTO handle null safely")
    void testNullConversions() {
        assertNull(deviceService.toEntity(null));
        assertNull(deviceService.toDTO(null));
    }
}
