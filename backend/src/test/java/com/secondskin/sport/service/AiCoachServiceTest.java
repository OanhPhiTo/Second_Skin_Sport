package com.secondskin.sport.service;

import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.entity.SportSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

public class AiCoachServiceTest {

    private AiCoachService aiCoachService;

    @BeforeEach
    void setUp() {
        BiomechanicalFeatureExtractor extractor = new BiomechanicalFeatureExtractor();
        aiCoachService = new AiCoachService(extractor);
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
}
