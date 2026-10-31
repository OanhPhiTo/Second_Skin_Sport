package com.secondskin.sport.service;

import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.SportSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

public class SensorDataServiceTest {

    private SensorDataRepository sensorDataRepository;
    private AiCoachService aiCoachService;
    private SportSessionRepository sessionRepository;
    private SensorDataService sensorDataService;

    @BeforeEach
    void setUp() {
        sensorDataRepository = Mockito.mock(SensorDataRepository.class);
        aiCoachService = Mockito.mock(AiCoachService.class);
        sessionRepository = Mockito.mock(SportSessionRepository.class);
        sensorDataService = new SensorDataService(sensorDataRepository, aiCoachService, sessionRepository);
    }

    @Test
    @DisplayName("saveSensorDataDTO with null returns null safely without NPE")
    void testSaveSensorDataDTO_NullSafe() {
        assertNull(sensorDataService.saveSensorDataDTO(null));
    }

    @Test
    @DisplayName("saveSensorData with null returns null safely without NPE")
    void testSaveSensorData_NullSafe() {
        assertNull(sensorDataService.saveSensorData(null));
    }

    @Test
    @DisplayName("saveSensorDataDTO populates timestamp if null and saves successfully")
    void testSaveSensorDataDTO_PopulatesTimestamp() {
        SensorDataDTO input = SensorDataDTO.builder()
                .sessionId(1L)
                .deviceId("DEV-01")
                .ax(1.0)
                .ay(2.0)
                .az(9.81)
                .timestamp(null)
                .build();

        Mockito.when(sensorDataRepository.save(any(SensorData.class))).thenAnswer(i -> {
            SensorData saved = i.getArgument(0);
            saved.setId(100L);
            return saved;
        });

        SensorDataDTO result = sensorDataService.saveSensorDataDTO(input);
        assertNotNull(result);
        assertNotNull(result.getTimestamp());
        assertEquals(100L, result.getId());
        assertEquals(1.0, result.getAx());
    }

    @Test
    @DisplayName("getSensorDataDTOBySessionId throws ResourceNotFoundException when session does not exist")
    void testGetSensorDataDTOBySessionId_NotFound_ThrowsResourceNotFoundException() {
        Mockito.when(sessionRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> sensorDataService.getSensorDataDTOBySessionId(999L));
    }

    @Test
    @DisplayName("getRawSensorDataBySessionId throws ResourceNotFoundException when session does not exist")
    void testGetRawSensorDataBySessionId_NotFound_ThrowsResourceNotFoundException() {
        Mockito.when(sessionRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> sensorDataService.getRawSensorDataBySessionId(999L));
    }

    @Test
    @DisplayName("triggerAiAnalysisForSession throws ResourceNotFoundException when session does not exist")
    void testTriggerAiAnalysisForSession_NotFound_ThrowsResourceNotFoundException() {
        Mockito.when(sessionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sensorDataService.triggerAiAnalysisForSession(999L, "DEV-01"));
    }

    @Test
    @DisplayName("triggerAiAnalysisForSession executes analysis when session exists")
    void testTriggerAiAnalysisForSession_Success() {
        SportSession session = new SportSession(1L, "DEV-01", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 0, 10, 2.5, 12.0, 70, 80, "Completed");
        session.setId(10L);

        Mockito.when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(10L)).thenReturn(Collections.emptyList());
        AiInsightDTO expectedInsight = new AiInsightDTO();
        expectedInsight.setActivityType("Running");
        Mockito.when(aiCoachService.analyzeSession(eq(session), any())).thenReturn(expectedInsight);

        AiInsightDTO result = sensorDataService.triggerAiAnalysisForSession(10L, "DEV-01");
        assertNotNull(result);
        assertEquals("Running", result.getActivityType());
    }

    @Test
    @DisplayName("toEntity and toDTO handle null safely")
    void testNullConversions() {
        assertNull(sensorDataService.toEntity(null));
        assertNull(sensorDataService.toDTO(null));
    }
}
