package com.secondskin.sport.service;

import com.secondskin.sport.dto.ActivityAnalysisDTO;
import com.secondskin.sport.dto.BiomechanicalMetricsDTO;
import com.secondskin.sport.dto.OverviewStatsDTO;
import com.secondskin.sport.dto.PerformanceStatisticDTO;
import com.secondskin.sport.entity.PerformanceStatistic;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.PerformanceStatisticRepository;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.SportSessionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@DisplayName("StatisticsService Unit & DSP Kinematics Tests")
public class StatisticsServiceTest {

    private PerformanceStatisticRepository statisticRepository;
    private SportSessionRepository sessionRepository;
    private SensorDataRepository sensorDataRepository;
    private BiomechanicalFeatureExtractor featureExtractor;
    private StatisticsService statisticsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        statisticRepository = Mockito.mock(PerformanceStatisticRepository.class);
        sessionRepository = Mockito.mock(SportSessionRepository.class);
        sensorDataRepository = Mockito.mock(SensorDataRepository.class);
        featureExtractor = Mockito.mock(BiomechanicalFeatureExtractor.class);

        statisticsService = new StatisticsService(
                statisticRepository,
                sessionRepository,
                sensorDataRepository,
                featureExtractor
        );

        testUser = new User("Athlete", "athlete@secondskin.io", "pass", Role.USER, "Basketball");
        testUser.setId(1L);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("getOverviewStats computes dynamic acceleration change from weekly historical windows")
    void testGetOverviewStats_CalculatesDynamicAccelChange() {
        LocalDateTime now = LocalDateTime.now();
        // Recent session in last 7 days: avgAccel = 4.0
        SportSession recent = new SportSession(1L, "DEV-01", "Running", now.minusDays(2), now.minusDays(2).plusMinutes(30),
                30, 0, 10, 4.0, 15.0, 80, 85, "Completed");
        // Prior session in 7-14 days window: avgAccel = 2.0
        SportSession prior = new SportSession(1L, "DEV-01", "Running", now.minusDays(10), now.minusDays(10).plusMinutes(30),
                30, 0, 10, 2.0, 10.0, 70, 75, "Completed");

        Mockito.when(sessionRepository.findByUserId(1L)).thenReturn(List.of(recent, prior));

        OverviewStatsDTO stats = statisticsService.getOverviewStats();

        assertNotNull(stats);
        assertEquals(2, stats.getTotalSessions());
        // Dynamic acceleration change: ((4.0 - 2.0) / 2.0) * 100% = +100.0%
        assertEquals("+100.0%", stats.getAverageAccelerationChange());
    }

    @Test
    @DisplayName("getOverviewStats returns baseline zeroes when user has no sessions")
    void testGetOverviewStats_EmptySessions_ReturnsBaselineZeroes() {
        Mockito.when(sessionRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

        OverviewStatsDTO stats = statisticsService.getOverviewStats();

        assertNotNull(stats);
        assertEquals(0, stats.getTotalSessions());
        assertEquals("0 tuần này", stats.getTotalSessionsChange());
        assertEquals(0.0, stats.getAverageAcceleration());
        assertEquals("0%", stats.getAverageAccelerationChange());
    }

    @Test
    @DisplayName("getActivityAnalysis invokes BiomechanicalFeatureExtractor on raw telemetry for real DSP metrics")
    void testGetActivityAnalysis_RealSensorData_ExtractsBiomechanicalFeatures() {
        SportSession latest = new SportSession(1L, "DEV-01", "Basketball",
                LocalDateTime.now().minusMinutes(40), LocalDateTime.now(),
                40, 20, 50, 3.2, 16.0, 85, 90, "Completed");
        latest.setId(10L);

        SensorData data1 = new SensorData(10L, "DEV-01", LocalDateTime.now(), 1.0, 2.0, 9.8, 10.0, 5.0, 2.0, 0.0, 0.0, 0.0, 80);
        List<SensorData> rawTelemetry = List.of(data1);

        BiomechanicalMetricsDTO mockMetrics = new BiomechanicalMetricsDTO(
                82, 2.4, 86, "LEFT", 165, 90, 91, 9.5, 88, 0.45, 35
        );

        Mockito.when(sessionRepository.findByUserId(1L)).thenReturn(List.of(latest));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(10L)).thenReturn(rawTelemetry);
        Mockito.when(featureExtractor.extractFeatures(rawTelemetry, "Basketball")).thenReturn(mockMetrics);

        ActivityAnalysisDTO result = statisticsService.getActivityAnalysis();

        assertNotNull(result);
        assertEquals(20, result.getJumps());
        assertEquals(20, result.getTotalJumps());
        assertEquals(82, result.getLandingSoftnessScore());
        assertEquals(2.4, result.getPeakLandingImpactG());
        assertEquals(2.4, result.getPeakImpactG());
        assertEquals(88, result.getExplosivenessScore());
        assertEquals(86, result.getBilateralSymmetryPct());
        assertEquals(86, result.getBilateralSymmetryPercentage());
        assertEquals("LEFT", result.getDominantSide());
        assertEquals(91, result.getTrunkStabilityScore());
        assertEquals(9.5, result.getTrunkLeanAngleDegrees());
        assertEquals(35, result.getFatigueIndex());
        // Physics jump height: h = (1/8) * 9.80665 * 0.45^2 * 100 = ~24.8 cm
        assertTrue(result.getAverageJumpHeightCm() > 20.0);
    }

    @Test
    @DisplayName("getActivityAnalysis provides graceful fallback when raw sensor data is empty")
    void testGetActivityAnalysis_ZeroSensorPoints_GracefulFallback() {
        SportSession latest = new SportSession(1L, "DEV-01", "Basketball",
                LocalDateTime.now().minusMinutes(30), LocalDateTime.now(),
                30, 15, 30, 2.8, 14.0, 75, 80, "Completed");
        latest.setId(20L);

        Mockito.when(sessionRepository.findByUserId(1L)).thenReturn(List.of(latest));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(20L)).thenReturn(Collections.emptyList());

        ActivityAnalysisDTO result = statisticsService.getActivityAnalysis();

        assertNotNull(result);
        assertEquals(15, result.getJumps());
        assertTrue(result.getLandingSoftnessScore() > 0);
        assertTrue(result.getPeakLandingImpactG() > 0.0);
        assertTrue(result.getAverageJumpHeightCm() > 0.0);
        assertEquals("BALANCED", result.getDominantSide());
    }

    @Test
    @DisplayName("getStatisticBySessionId succeeds for resource owner")
    void testGetStatisticBySessionId_Owner_Succeeds() {
        PerformanceStatistic stat = new PerformanceStatistic(10L, 1L, LocalDate.now(), "Basketball",
                15.0, 3.0, 5.0, 20, 40, 80, 85);
        stat.setId(100L);

        Mockito.when(statisticRepository.findBySessionId(10L)).thenReturn(Optional.of(stat));

        Optional<PerformanceStatisticDTO> result = statisticsService.getStatisticDTOBySessionId(10L);

        assertTrue(result.isPresent());
        assertEquals(10L, result.get().getSessionId());
        assertEquals("Basketball", result.get().getSport());
    }

    @Test
    @DisplayName("getStatisticBySessionId throws AccessDeniedException when caller is unauthorized non-owner")
    void testGetStatisticBySessionId_UnauthorizedUser_ThrowsAccessDenied() {
        // Statistic belongs to User 2
        PerformanceStatistic stat = new PerformanceStatistic(20L, 2L, LocalDate.now(), "Basketball",
                15.0, 3.0, 5.0, 20, 40, 80, 85);

        Mockito.when(statisticRepository.findBySessionId(20L)).thenReturn(Optional.of(stat));

        // Caller is User 1 (role USER)
        assertThrows(AccessDeniedException.class, () -> statisticsService.getStatisticBySessionId(20L));
    }

    @Test
    @DisplayName("getStatisticBySessionId succeeds when caller is COACH or ADMIN")
    void testGetStatisticBySessionId_CoachOrAdmin_Succeeds() {
        PerformanceStatistic stat = new PerformanceStatistic(30L, 2L, LocalDate.now(), "Basketball",
                15.0, 3.0, 5.0, 20, 40, 80, 85);

        Mockito.when(statisticRepository.findBySessionId(30L)).thenReturn(Optional.of(stat));

        // Caller is Coach (id=5L)
        User coachUser = new User("Coach", "coach@secondskin.io", "pass", Role.COACH, "Basketball");
        coachUser.setId(5L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(coachUser, null, coachUser.getAuthorities())
        );

        Optional<PerformanceStatistic> result = statisticsService.getStatisticBySessionId(30L);
        assertTrue(result.isPresent());
    }

    @Test
    @DisplayName("getStatisticBySessionId returns empty when session ID does not exist")
    void testGetStatisticBySessionId_NotFound_ReturnsEmpty() {
        Mockito.when(statisticRepository.findBySessionId(9999L)).thenReturn(Optional.empty());

        Optional<PerformanceStatistic> result = statisticsService.getStatisticBySessionId(9999L);
        assertTrue(result.isEmpty());
    }
}
