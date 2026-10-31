package com.secondskin.sport.challenger;

import com.secondskin.sport.dto.ActivityAnalysisDTO;
import com.secondskin.sport.dto.BiomechanicalMetricsDTO;
import com.secondskin.sport.dto.OverviewStatsDTO;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.repository.PerformanceStatisticRepository;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.SportSessionRepository;
import com.secondskin.sport.service.AiCoachService;
import com.secondskin.sport.service.BiomechanicalFeatureExtractor;
import com.secondskin.sport.service.SensorDataService;
import com.secondskin.sport.service.StatisticsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Challenger M3-2 Empirical Stress Test: Kinematics DSP, Zero-Telemetry Baseline & 404 Responses")
public class EmpiricalKinematicsAnd404StressTest {

    private SportSessionRepository sessionRepository;
    private SensorDataRepository sensorDataRepository;
    private PerformanceStatisticRepository statisticRepository;
    private BiomechanicalFeatureExtractor featureExtractor;

    private AiCoachService aiCoachService;
    private SensorDataService sensorDataService;
    private StatisticsService statisticsService;

    private User athleteUser;

    @BeforeEach
    void setUp() {
        sessionRepository = Mockito.mock(SportSessionRepository.class);
        sensorDataRepository = Mockito.mock(SensorDataRepository.class);
        statisticRepository = Mockito.mock(PerformanceStatisticRepository.class);
        featureExtractor = new BiomechanicalFeatureExtractor(); // Use REAL extractor, not mock!

        aiCoachService = new AiCoachService(featureExtractor, sessionRepository, sensorDataRepository);
        sensorDataService = new SensorDataService(sensorDataRepository, aiCoachService, sessionRepository);
        statisticsService = new StatisticsService(statisticRepository, sessionRepository, sensorDataRepository, featureExtractor);

        athleteUser = new User("Athlete", "athlete@secondskin.io", "pass", Role.USER, "Basketball");
        athleteUser.setId(100L);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(athleteUser, null, athleteUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // =========================================================================
    // Challenge 1: 404 Responses & Zero Mock Generation
    // =========================================================================

    @Test
    @DisplayName("Challenge 1.1: AiCoachService.analyzeSessionById(999999L) throws ResourceNotFoundException with HTTP 404")
    void testAiCoachService_AnalyzeSessionById_Throws404_NoMockGeneration() {
        Mockito.when(sessionRepository.findById(999999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> {
            aiCoachService.analyzeSessionById(999999L);
        });

        assertTrue(ex.getMessage().contains("999999"), "Exception message should reference non-existent session ID");

        // Verify HTTP 404 mapping annotation
        ResponseStatus statusAnnotation = ResourceNotFoundException.class.getAnnotation(ResponseStatus.class);
        assertNotNull(statusAnnotation, "ResourceNotFoundException must have @ResponseStatus");
        assertEquals(HttpStatus.NOT_FOUND, statusAnnotation.value(), "Response status must be 404 NOT_FOUND");

        // Verify zero mock session generation occurred
        Mockito.verify(sessionRepository, Mockito.never()).save(Mockito.any(SportSession.class));
    }

    @Test
    @DisplayName("Challenge 1.2: SensorDataService.triggerAiAnalysisForSession(999999L, 'DEV-01') throws ResourceNotFoundException with HTTP 404")
    void testSensorDataService_TriggerAiAnalysisForSession_Throws404_NoMockGeneration() {
        Mockito.when(sessionRepository.findById(999999L)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class, () -> {
            sensorDataService.triggerAiAnalysisForSession(999999L, "DEV-01");
        });

        assertTrue(ex.getMessage().contains("999999"), "Exception message should reference non-existent session ID");

        ResponseStatus statusAnnotation = ResourceNotFoundException.class.getAnnotation(ResponseStatus.class);
        assertNotNull(statusAnnotation);
        assertEquals(HttpStatus.NOT_FOUND, statusAnnotation.value());

        // Verify zero mock session saved
        Mockito.verify(sessionRepository, Mockito.never()).save(Mockito.any(SportSession.class));
    }

    @Test
    @DisplayName("Challenge 1.3: SensorDataService getSensorDataDTOBySessionId throws 404 on non-existent session")
    void testSensorDataService_GetSensorDataDTOBySessionId_Throws404() {
        Mockito.when(sessionRepository.existsById(999999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            sensorDataService.getSensorDataDTOBySessionId(999999L);
        });
    }

    // =========================================================================
    // Challenge 2: Real Kinematic DSP Integration & Metric Variation
    // =========================================================================

    @Test
    @DisplayName("Challenge 2.1: Variations in impact telemetry produce corresponding variations in peakLandingImpactG & landingSoftnessScore")
    void testKinematics_ImpactTelemetryVariation() {
        SportSession sessionLowImpact = createMockSession(10L, "Running", 2.0);
        SportSession sessionHighImpact = createMockSession(20L, "Running", 2.0);

        LocalDateTime now = LocalDateTime.now();

        // Telemetry Low Impact: az ~ 10-12 m/s^2 (~ 1.0 - 1.2 G)
        List<SensorData> lowImpactData = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            lowImpactData.add(new SensorData(10L, "DEV-01", now.plusSeconds(i), 0.5, 0.2, 10.5, 5.0, 2.0, 1.0, 4.0, 1.0, 0.0, 70));
        }

        // Telemetry High Impact: az spike to 38.0 m/s^2 (~ 3.9 G)
        List<SensorData> highImpactData = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            double az = (i % 6 == 0) ? 38.0 : 11.0;
            highImpactData.add(new SensorData(20L, "DEV-01", now.plusSeconds(i), 1.0, 0.5, az, 15.0, 6.0, 3.0, 8.0, 2.0, 0.0, 85));
        }

        // Test Low Impact
        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(sessionLowImpact));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(10L)).thenReturn(lowImpactData);

        ActivityAnalysisDTO resultLow = statisticsService.getActivityAnalysis();

        // Test High Impact
        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(sessionHighImpact));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(20L)).thenReturn(highImpactData);

        ActivityAnalysisDTO resultHigh = statisticsService.getActivityAnalysis();

        // Assertions: High impact should have strictly higher peak impact G and strictly lower landing softness
        assertTrue(resultHigh.getPeakLandingImpactG() > resultLow.getPeakLandingImpactG(),
                "High impact telemetry must yield higher peakLandingImpactG than low impact");
        assertTrue(resultHigh.getLandingSoftnessScore() < resultLow.getLandingSoftnessScore(),
                "High impact telemetry must yield lower landingSoftnessScore (hard landing)");

        System.out.printf("Impact Test: Low [Impact=%.1fG, Softness=%d] vs High [Impact=%.1fG, Softness=%d]%n",
                resultLow.getPeakLandingImpactG(), resultLow.getLandingSoftnessScore(),
                resultHigh.getPeakLandingImpactG(), resultHigh.getLandingSoftnessScore());
    }

    @Test
    @DisplayName("Challenge 2.2: Variations in lateral acceleration and roll produce corresponding variations in bilateral symmetry and dominant side")
    void testKinematics_BilateralSymmetryVariation() {
        SportSession sessionBalanced = createMockSession(11L, "Running", 2.5);
        SportSession sessionLeftBiased = createMockSession(12L, "Running", 2.5);
        SportSession sessionRightBiased = createMockSession(13L, "Running", 2.5);

        LocalDateTime now = LocalDateTime.now();

        // Balanced: ay centered around 0, roll centered around 0
        List<SensorData> balancedData = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            double ay = (i % 2 == 0) ? -0.8 : 0.8;
            double roll = (i % 2 == 0) ? -3.0 : 3.0;
            balancedData.add(new SensorData(11L, "DEV-01", now.plusSeconds(i), 0.5, ay, 11.0, 5.0, 2.0, 1.0, 5.0, roll, 0.0, 75));
        }

        // Heavy Left Bias: negative ay and negative roll
        List<SensorData> leftData = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            leftData.add(new SensorData(12L, "DEV-01", now.plusSeconds(i), 0.5, -3.5, 11.0, 5.0, 2.0, 1.0, 5.0, -9.0, 0.0, 75));
        }

        // Heavy Right Bias: positive ay and positive roll
        List<SensorData> rightData = new ArrayList<>();
        for (int i = 0; i < 40; i++) {
            rightData.add(new SensorData(13L, "DEV-01", now.plusSeconds(i), 0.5, 3.5, 11.0, 5.0, 2.0, 1.0, 5.0, 9.0, 0.0, 75));
        }

        // Assert Balanced
        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(sessionBalanced));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(11L)).thenReturn(balancedData);
        ActivityAnalysisDTO resultBalanced = statisticsService.getActivityAnalysis();
        assertEquals("BALANCED", resultBalanced.getDominantSide());
        assertTrue(resultBalanced.getBilateralSymmetryPct() >= 90, "Balanced symmetry should be >= 90%");

        // Assert Left
        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(sessionLeftBiased));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(12L)).thenReturn(leftData);
        ActivityAnalysisDTO resultLeft = statisticsService.getActivityAnalysis();
        assertEquals("LEFT", resultLeft.getDominantSide(), "Heavy left tilt must identify dominantSide as LEFT");
        assertTrue(resultLeft.getBilateralSymmetryPct() < resultBalanced.getBilateralSymmetryPct(),
                "Asymmetrical gait must reduce bilateral symmetry percentage");

        // Assert Right
        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(sessionRightBiased));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(13L)).thenReturn(rightData);
        ActivityAnalysisDTO resultRight = statisticsService.getActivityAnalysis();
        assertEquals("RIGHT", resultRight.getDominantSide(), "Heavy right tilt must identify dominantSide as RIGHT");
        assertTrue(resultRight.getBilateralSymmetryPct() < resultBalanced.getBilateralSymmetryPct());
    }

    @Test
    @DisplayName("Challenge 2.3: Variations in pitch/roll variance produce corresponding variations in trunk stability & lean angle")
    void testKinematics_TrunkStabilityVariation() {
        SportSession sessionStable = createMockSession(21L, "Running", 2.5);
        SportSession sessionUnstable = createMockSession(22L, "Running", 2.5);

        LocalDateTime now = LocalDateTime.now();

        // Stable trunk: pitch consistently ~6.0, roll consistently ~1.0 (low variance)
        List<SensorData> stableData = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            stableData.add(new SensorData(21L, "DEV-01", now.plusSeconds(i), 0.5, 0.1, 10.0, 2.0, 1.0, 0.5, 6.0, 1.0, 0.0, 70));
        }

        // Unstable trunk: pitch swinging from -15 to +25, roll swinging from -20 to +20 (high variance)
        List<SensorData> unstableData = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            double pitch = 6.0 + 18.0 * Math.sin(i);
            double roll = 1.0 + 15.0 * Math.cos(i);
            unstableData.add(new SensorData(22L, "DEV-01", now.plusSeconds(i), 0.5, 0.1, 10.0, 2.0, 1.0, 0.5, pitch, roll, 0.0, 70));
        }

        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(sessionStable));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(21L)).thenReturn(stableData);
        ActivityAnalysisDTO resultStable = statisticsService.getActivityAnalysis();

        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(sessionUnstable));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(22L)).thenReturn(unstableData);
        ActivityAnalysisDTO resultUnstable = statisticsService.getActivityAnalysis();

        assertTrue(resultStable.getTrunkStabilityScore() > resultUnstable.getTrunkStabilityScore(),
                "High angular variance must yield lower trunkStabilityScore");
        assertEquals(6.0, resultStable.getTrunkLeanAngleDegrees(), 0.5, "Trunk lean angle should reflect mean pitch");
    }

    // =========================================================================
    // Challenge 3: Zero Telemetry Edge Cases
    // =========================================================================

    @Test
    @DisplayName("Challenge 3.1: Session with zero telemetry points and active metadata returns safe finite values without NaN")
    void testZeroTelemetry_ActiveSessionMetadata_ReturnsSafeBaselines() {
        SportSession activeSession = new SportSession(
                100L, "DEV-01", "Basketball",
                LocalDateTime.now().minusMinutes(30), LocalDateTime.now(),
                30, 15, 25, 2.8, 14.0, 75, 80, "Completed"
        );
        activeSession.setId(50L);

        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(activeSession));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(50L)).thenReturn(Collections.emptyList());

        ActivityAnalysisDTO result = statisticsService.getActivityAnalysis();

        assertNotNull(result);
        assertFalse(Double.isNaN(result.getPeakLandingImpactG()), "peakLandingImpactG must not be NaN");
        assertFalse(Double.isInfinite(result.getPeakLandingImpactG()), "peakLandingImpactG must be finite");
        assertFalse(Double.isNaN(result.getAverageJumpHeightCm()), "jumpHeight must not be NaN");
        assertFalse(Double.isInfinite(result.getAverageJumpHeightCm()), "jumpHeight must be finite");
        assertFalse(Double.isNaN(result.getAverageAirtimeSeconds()), "airtime must not be NaN");
        assertFalse(Double.isInfinite(result.getAverageAirtimeSeconds()), "airtime must be finite");
        assertFalse(Double.isNaN(result.getTrunkLeanAngleDegrees()), "trunkLeanAngle must not be NaN");

        assertTrue(result.getLandingSoftnessScore() >= 0 && result.getLandingSoftnessScore() <= 100);
        assertTrue(result.getBilateralSymmetryPct() >= 0 && result.getBilateralSymmetryPct() <= 100);
        assertTrue(result.getTrunkStabilityScore() >= 0 && result.getTrunkStabilityScore() <= 100);
        assertEquals("BALANCED", result.getDominantSide());
    }

    @Test
    @DisplayName("Challenge 3.2: Completely inactive session baseline (0 jumps, 0 intensity, 0 accel) returns safe physical baselines without NaN or exceptions")
    void testZeroTelemetry_CompletelyInactiveSession_ReturnsSafePhysicalBaselines() {
        SportSession inactiveSession = new SportSession(
                100L, "DEV-01", "Basketball",
                LocalDateTime.now().minusMinutes(5), LocalDateTime.now(),
                5, 0, 0, 0.0, 0.0, 0, 0, "Created"
        );
        inactiveSession.setId(60L);

        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(inactiveSession));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(60L)).thenReturn(Collections.emptyList());

        ActivityAnalysisDTO result = statisticsService.getActivityAnalysis();

        assertNotNull(result);
        assertEquals(0, result.getJumps());
        assertEquals(0.0, result.getAverageJumpHeightCm(), "Jump height must be 0 when jumps = 0");
        assertEquals("BALANCED", result.getDominantSide());

        // Safe physical baseline ranges
        assertTrue(result.getLandingSoftnessScore() >= 0 && result.getLandingSoftnessScore() <= 100);
        assertTrue(result.getPeakLandingImpactG() >= 0.0 && result.getPeakLandingImpactG() <= 5.0);
        assertTrue(result.getTrunkStabilityScore() >= 0 && result.getTrunkStabilityScore() <= 100);
        assertTrue(result.getBilateralSymmetryPct() >= 0 && result.getBilateralSymmetryPct() <= 100);

        // Zero exceptions, zero NaNs, zero infinites
        assertFalse(Double.isNaN(result.getPeakLandingImpactG()), "peakLandingImpactG must not be NaN");
        assertFalse(Double.isInfinite(result.getPeakLandingImpactG()), "peakLandingImpactG must be finite");
        assertFalse(Double.isNaN(result.getAverageJumpHeightCm()), "jumpHeight must not be NaN");
        assertFalse(Double.isInfinite(result.getAverageJumpHeightCm()), "jumpHeight must be finite");
        assertFalse(Double.isNaN(result.getAverageAirtimeSeconds()), "airtime must not be NaN");
        assertFalse(Double.isInfinite(result.getAverageAirtimeSeconds()), "airtime must be finite");
        assertFalse(Double.isNaN(result.getTrunkLeanAngleDegrees()), "trunkLeanAngle must not be NaN");
    }

    @Test
    @DisplayName("Challenge 3.3: User with zero sessions returns safe zero baseline DTO")
    void testZeroTelemetry_ZeroSessions_ReturnsSafeZeroBaseline() {
        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(Collections.emptyList());

        ActivityAnalysisDTO result = statisticsService.getActivityAnalysis();

        assertNotNull(result);
        assertEquals(0, result.getJumps());
        assertEquals(0.0, result.getAverageJumpHeightCm());
        assertEquals(0, result.getBilateralSymmetryPct());
        assertEquals("BALANCED", result.getDominantSide());
        assertFalse(Double.isNaN(result.getAverageJumpHeightCm()));
    }

    // =========================================================================
    // Challenge 4: Dynamic Weekly Acceleration Change
    // =========================================================================

    @Test
    @DisplayName("Challenge 4.1: Positive weekly acceleration change is computed dynamically from real session timestamps")
    void testDynamicWeeklyAccelChange_PositiveIncrease() {
        LocalDateTime now = LocalDateTime.now();
        // Session in last 7 days: avgAccel = 5.0
        SportSession recent = new SportSession(100L, "DEV-01", "Running", now.minusDays(2), now.minusDays(2).plusMinutes(30),
                30, 0, 10, 5.0, 15.0, 80, 85, "Completed");
        // Session in 7-14 days window: avgAccel = 2.5
        SportSession prior = new SportSession(100L, "DEV-01", "Running", now.minusDays(9), now.minusDays(9).plusMinutes(30),
                30, 0, 10, 2.5, 10.0, 70, 75, "Completed");

        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(recent, prior));

        OverviewStatsDTO overview = statisticsService.getOverviewStats();

        assertNotNull(overview);
        // ((5.0 - 2.5) / 2.5) * 100% = +100.0%
        assertEquals("+100.0%", overview.getAverageAccelerationChange());
        assertNotEquals("+3.2%", overview.getAverageAccelerationChange(), "Must NOT be hardcoded +3.2%");
    }

    @Test
    @DisplayName("Challenge 4.2: Negative weekly acceleration change is computed dynamically from real session timestamps")
    void testDynamicWeeklyAccelChange_NegativeDecrease() {
        LocalDateTime now = LocalDateTime.now();
        // Session in last 7 days: avgAccel = 1.8
        SportSession recent = new SportSession(100L, "DEV-01", "Running", now.minusDays(3), now.minusDays(3).plusMinutes(30),
                30, 0, 10, 1.8, 12.0, 75, 80, "Completed");
        // Session in 7-14 days window: avgAccel = 3.6
        SportSession prior = new SportSession(100L, "DEV-01", "Running", now.minusDays(11), now.minusDays(11).plusMinutes(30),
                30, 0, 10, 3.6, 14.0, 85, 90, "Completed");

        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(recent, prior));

        OverviewStatsDTO overview = statisticsService.getOverviewStats();

        assertNotNull(overview);
        // ((1.8 - 3.6) / 3.6) * 100% = -50.0%
        assertEquals("-50.0%", overview.getAverageAccelerationChange());
        assertNotEquals("+3.2%", overview.getAverageAccelerationChange(), "Must NOT be hardcoded +3.2%");
    }

    @Test
    @DisplayName("Challenge 4.3: When prior window has zero sessions, returns +0.0% without divide-by-zero crash")
    void testDynamicWeeklyAccelChange_ZeroPriorSessions_ReturnsZeroSafely() {
        LocalDateTime now = LocalDateTime.now();
        // Only recent session in last 7 days, none in prior window
        SportSession recent = new SportSession(100L, "DEV-01", "Running", now.minusDays(1), now.minusDays(1).plusMinutes(30),
                30, 0, 10, 3.5, 12.0, 75, 80, "Completed");

        Mockito.when(sessionRepository.findByUserId(100L)).thenReturn(List.of(recent));

        OverviewStatsDTO overview = statisticsService.getOverviewStats();

        assertNotNull(overview);
        assertEquals("+0.0%", overview.getAverageAccelerationChange());
        assertNotEquals("+3.2%", overview.getAverageAccelerationChange());
    }

    private SportSession createMockSession(Long id, String sport, double avgAccel) {
        SportSession session = new SportSession(
                100L, "DEV-01", sport,
                LocalDateTime.now().minusMinutes(30), LocalDateTime.now(),
                30, 10, 20, avgAccel, 12.0, 75, 80, "Completed"
        );
        session.setId(id);
        return session;
    }
}
