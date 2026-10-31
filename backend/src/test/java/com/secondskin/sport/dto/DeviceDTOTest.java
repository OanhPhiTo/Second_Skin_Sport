package com.secondskin.sport.dto;

import com.secondskin.sport.entity.Device;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class DeviceDTOTest {

    @Test
    @DisplayName("DeviceDTO dual getters provide backward compatibility")
    void testDualGettersCompatibility() {
        DeviceDTO dto1 = DeviceDTO.builder()
                .name("Test Device")
                .deviceCode("DEV-99")
                .status("CONNECTED")
                .type("BLE")
                .build();

        assertEquals("Test Device", dto1.getName());
        assertEquals("Test Device", dto1.getDeviceName());
        assertEquals("DEV-99", dto1.getDeviceCode());
        assertEquals("DEV-99", dto1.getDeviceId());
        assertTrue(dto1.getConnected());
        assertEquals("CONNECTED", dto1.getStatus());
        assertEquals("BLE", dto1.getType());
        assertEquals("BLE", dto1.getConnectionType());

        DeviceDTO dto2 = DeviceDTO.builder()
                .deviceName("Legacy Device")
                .deviceId("DEV-LEGACY")
                .connected(false)
                .connectionType("WiFi")
                .build();

        assertEquals("Legacy Device", dto2.getName());
        assertEquals("Legacy Device", dto2.getDeviceName());
        assertEquals("DEV-LEGACY", dto2.getDeviceCode());
        assertEquals("DEV-LEGACY", dto2.getDeviceId());
        assertFalse(dto2.getConnected());
        assertEquals("DISCONNECTED", dto2.getStatus());
        assertEquals("WiFi", dto2.getType());
        assertEquals("WiFi", dto2.getConnectionType());
    }

    @Test
    @DisplayName("DeviceDTO fromEntity and toEntity map accurately")
    void testEntityMapping() {
        Device device = new Device("Foot Patch", "DEV-01", true, 95, "v2.0", "BLE");
        device.setId(10L);
        device.setLastSync(LocalDateTime.now());

        DeviceDTO dto = DeviceDTO.fromEntity(device);
        assertNotNull(dto);
        assertEquals(device.getId(), dto.getId());
        assertEquals("Foot Patch", dto.getName());
        assertEquals("Foot Patch", dto.getDeviceName());
        assertEquals("DEV-01", dto.getDeviceCode());
        assertEquals("DEV-01", dto.getDeviceId());
        assertTrue(dto.getConnected());
        assertEquals("CONNECTED", dto.getStatus());
        assertEquals(95, dto.getBatteryLevel());
        assertEquals(device.getLastSync(), dto.getLastSyncTime());

        Device mapped = dto.toEntity();
        assertNotNull(mapped);
        assertEquals(dto.getId(), mapped.getId());
        assertEquals("Foot Patch", mapped.getDeviceName());
        assertEquals("DEV-01", mapped.getDeviceId());
        assertTrue(mapped.isConnected());
        assertEquals(95, mapped.getBatteryLevel());
    }
}
