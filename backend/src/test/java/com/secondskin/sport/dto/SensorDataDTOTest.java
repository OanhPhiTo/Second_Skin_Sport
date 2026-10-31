package com.secondskin.sport.dto;

import com.secondskin.sport.entity.SensorData;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class SensorDataDTOTest {

    @Test
    @DisplayName("SensorDataDTO dual getters provide shorthand and longhand compatibility")
    void testDualGettersCompatibility() {
        SensorDataDTO dtoShort = SensorDataDTO.builder()
                .ax(1.23)
                .ay(2.34)
                .az(9.81)
                .gx(10.5)
                .gy(20.5)
                .gz(30.5)
                .build();

        assertEquals(1.23, dtoShort.getAx());
        assertEquals(1.23, dtoShort.getAccelerometerX());
        assertEquals(2.34, dtoShort.getAy());
        assertEquals(2.34, dtoShort.getAccelerometerY());
        assertEquals(9.81, dtoShort.getAz());
        assertEquals(9.81, dtoShort.getAccelerometerZ());
        assertEquals(10.5, dtoShort.getGx());
        assertEquals(10.5, dtoShort.getGyroscopeX());
        assertEquals(20.5, dtoShort.getGy());
        assertEquals(20.5, dtoShort.getGyroscopeY());
        assertEquals(30.5, dtoShort.getGz());
        assertEquals(30.5, dtoShort.getGyroscopeZ());

        SensorDataDTO dtoLong = SensorDataDTO.builder()
                .accelerometerX(0.5)
                .accelerometerY(0.6)
                .accelerometerZ(9.80)
                .gyroscopeX(1.0)
                .gyroscopeY(2.0)
                .gyroscopeZ(3.0)
                .build();

        assertEquals(0.5, dtoLong.getAx());
        assertEquals(0.5, dtoLong.getAccelerometerX());
        assertEquals(0.6, dtoLong.getAy());
        assertEquals(0.6, dtoLong.getAccelerometerY());
        assertEquals(9.80, dtoLong.getAz());
        assertEquals(9.80, dtoLong.getAccelerometerZ());
        assertEquals(1.0, dtoLong.getGx());
        assertEquals(1.0, dtoLong.getGyroscopeX());
        assertEquals(2.0, dtoLong.getGy());
        assertEquals(2.0, dtoLong.getGyroscopeY());
        assertEquals(3.0, dtoLong.getGz());
        assertEquals(3.0, dtoLong.getGyroscopeZ());
    }

    @Test
    @DisplayName("SensorDataDTO fromEntity and toEntity map accurately")
    void testEntityMapping() {
        LocalDateTime now = LocalDateTime.now();
        SensorData entity = new SensorData(
                1L, "DEV-01", now,
                1.5, 2.5, 9.8,
                5.0, 6.0, 7.0,
                15.0, 25.0, 35.0, 80
        );
        entity.setId(42L);

        SensorDataDTO dto = SensorDataDTO.fromEntity(entity);
        assertNotNull(dto);
        assertEquals(42L, dto.getId());
        assertEquals(1L, dto.getSessionId());
        assertEquals("DEV-01", dto.getDeviceId());
        assertEquals(now, dto.getTimestamp());
        assertEquals(1.5, dto.getAx());
        assertEquals(1.5, dto.getAccelerometerX());
        assertEquals(5.0, dto.getGx());
        assertEquals(5.0, dto.getGyroscopeX());
        assertEquals(15.0, dto.getPitch());
        assertEquals(80, dto.getMovementIntensity());

        SensorData mapped = dto.toEntity();
        assertNotNull(mapped);
        assertEquals(42L, mapped.getId());
        assertEquals(1L, mapped.getSessionId());
        assertEquals(1.5, mapped.getAccelerometerX());
        assertEquals(5.0, mapped.getGyroscopeX());
        assertEquals(15.0, mapped.getPitch());
        assertEquals(80, mapped.getMovementIntensity());
    }
}
