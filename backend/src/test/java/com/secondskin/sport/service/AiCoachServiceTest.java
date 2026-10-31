package com.secondskin.sport.service;

import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.SportSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

public class AiCoachServiceTest {

    private AiCoachService aiCoachService;
    private SportSessionRepository sessionRepository;
    private SensorDataRepository sensorDataRepository;

    @BeforeEach
    void setUp() {
        BiomechanicalFeatureExtractor extractor = new BiomechanicalFeatureExtractor();
        sessionRepository = Mockito.mock(SportSessionRepository.class);
        sensorDataRepository = Mockito.mock(SensorDataRepository.class);
        aiCoachService = new AiCoachService(extractor, sessionRepository, sensorDataRepository);
    }

    @Test
    void testAnalyzeSession_Running_ProducesHumanFriendlyInsights() {
        SportSession runningSession = new SportSession(
                1L, "DEV-RUN-01", "Running",
                LocalDateTime.now().minusMinutes(35), LocalDateTime.now(),
                35, 0, 18, 2.7, 14.5, 82, 85, "Completed"
        );

        AiInsightDTO result = aiCoachService.analyzeSession(runningSession);

        assertNotNull(result);
        assertNotNull(result.getCurrentPerformance());
        assertFalse(result.getCurrentPerformance().isEmpty());

        // Check areas for improvement
        assertNotNull(result.getAreasForImprovement());
        assertFalse(result.getAreasForImprovement().isEmpty());

        // Check actionable drills
        assertNotNull(result.getActionableDrills());
        assertFalse(result.getActionableDrills().isEmpty());

        // Check biomechanical metrics
        assertNotNull(result.getBiomechanicalMetrics());
        assertTrue(result.getBiomechanicalMetrics().getLandingSoftnessScore() > 0);
        assertTrue(result.getBiomechanicalMetrics().getBilateralSymmetryPct() > 0);

        // Check recovery advice
        assertNotNull(result.getRecoveryAdvice());
        assertFalse(result.getRecoveryAdvice().isEmpty());
    }

    @Test
    void testAnalyzeSession_Basketball_ProducesExplosivenessAndJumpAnalysis() {
        SportSession basketballSession = new SportSession(
                1L, "DEV-BB-01", "Basketball",
                LocalDateTime.now().minusMinutes(45), LocalDateTime.now(),
                45, 48, 112, 3.2, 17.0, 86, 90, "Completed"
        );

        AiInsightDTO result = aiCoachService.analyzeSession(basketballSession);

        assertNotNull(result);
        assertTrue(result.getActivityType().contains("Bóng rổ") || result.getActivityType().contains("Basketball"));
        assertNotNull(result.getBiomechanicalMetrics());
        assertTrue(result.getBiomechanicalMetrics().getExplosivenessScore() > 60);

        // High jumps should trigger patellar tendon or knee focus
        assertNotNull(result.getInjuryRiskLevel());
        assertNotNull(result.getInjuryRiskExplanation());
    }

    @Test
    void testAnalyzeSession_HighFatigueOrImpact_FlagsInjuryRisk() {
        SportSession exhaustingSession = new SportSession(
                1L, "DEV-FATIGUE-01", "Running",
                LocalDateTime.now().minusMinutes(75), LocalDateTime.now(),
                75, 0, 40, 3.8, 16.0, 95, 80, "Completed"
        );

        AiInsightDTO result = aiCoachService.analyzeSession(exhaustingSession);
        assertNotNull(result);
        assertEquals("HIGH", result.getInjuryRiskLevel());
        assertTrue(result.getInjuryRiskExplanation().contains("Achilles") ||
                   result.getInjuryRiskExplanation().contains("cẳng chân") ||
                   result.getInjuryRiskExplanation().contains("quá tải"));
    }

    @Test
    void testAnalyzeSession_WithSportSessionDTO() {
        SportSessionDTO dto = new SportSessionDTO();
        dto.setId(1L);
        dto.setDeviceId("DEV-DTO-01");
        dto.setSport("Running");
        dto.setStartTime(LocalDateTime.now().minusMinutes(30));
        dto.setEndTime(LocalDateTime.now());
        dto.setDurationMinutes(30);
        dto.setTotalJumps(0);
        dto.setDirectionChanges(10);
        dto.setAverageAcceleration(2.5);
        dto.setAverageSpeed(12.0);
        dto.setMovementIntensity(70);
        dto.setPerformanceScore(80);
        dto.setStatus("Completed");

        AiInsightDTO result = aiCoachService.analyzeSession(dto);
        assertNotNull(result);
        assertNotNull(result.getCurrentPerformance());
        assertNotNull(result.getBiomechanicalMetrics());
    }

    @Test
    void testAnalyzeSessionById_FoundInRepository() {
        SportSession session = new SportSession(
                10L, "DEV-01", "Basketball",
                LocalDateTime.now().minusMinutes(40), LocalDateTime.now(),
                40, 35, 90, 3.1, 16.0, 85, 88, "Completed"
        );

        Mockito.when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(10L)).thenReturn(Collections.emptyList());

        AiInsightDTO result = aiCoachService.analyzeSessionById(10L);
        assertNotNull(result);
        assertTrue(result.getPerformanceScore() > 0);
    }

    @Test
    void testAnalyzeSessionById_NotFound_ThrowsResourceNotFoundException() {
        Mockito.when(sessionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(com.secondskin.sport.exception.ResourceNotFoundException.class,
                () -> aiCoachService.analyzeSessionById(999L));
    }
}
