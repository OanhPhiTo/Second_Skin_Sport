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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.lang.reflect.Proxy;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("StatisticsService Unit & DSP Kinematics Tests")
public class StatisticsServiceTest {

    private PerformanceStatisticRepository statisticRepository;
    private SportSessionRepository sessionRepository;
    private SensorDataRepository sensorDataRepository;
    private BiomechanicalFeatureExtractor featureExtractor;
    private StatisticsService statisticsService;

    private User testUser;
    private List<SportSession> mockSessions = new ArrayList<>();
    private Map<Long, List<SensorData>> mockSensorDataMap = new HashMap<>();
    private Map<Long, PerformanceStatistic> mockStatisticMap = new HashMap<>();
    private BiomechanicalMetricsDTO mockExtractedMetrics;

    @BeforeEach
    void setUp() {
        mockSessions = new ArrayList<>();
        mockSensorDataMap = new HashMap<>();
        mockStatisticMap = new HashMap<>();
        mockExtractedMetrics = null;

        sessionRepository = (SportSessionRepository) Proxy.newProxyInstance(
                SportSessionRepository.class.getClassLoader(),
                new Class<?>[]{SportSessionRepository.class},
                (proxy, method, args) -> {
                    if ("findByUserId".equals(method.getName())) {
                        return mockSessions;
                    }
                    if ("findAll".equals(method.getName())) {
                        return mockSessions;
                    }
                    return null;
                }
        );

        sensorDataRepository = (SensorDataRepository) Proxy.newProxyInstance(
                SensorDataRepository.class.getClassLoader(),
                new Class<?>[]{SensorDataRepository.class},
                (proxy, method, args) -> {
                    if ("findBySessionIdOrderByTimestampAsc".equals(method.getName()) && args != null && args.length > 0) {
                        Long sid = (Long) args[0];
                        return mockSensorDataMap.getOrDefault(sid, Collections.emptyList());
                    }
                    return Collections.emptyList();
                }
        );

        statisticRepository = (PerformanceStatisticRepository) Proxy.newProxyInstance(
                PerformanceStatisticRepository.class.getClassLoader(),
                new Class<?>[]{PerformanceStatisticRepository.class},
                (proxy, method, args) -> {
                    if ("findBySessionId".equals(method.getName()) && args != null && args.length > 0) {
                        Long sid = (Long) args[0];
                        return Optional.ofNullable(mockStatisticMap.get(sid));
                    }
                    return Optional.empty();
                }
        );

        featureExtractor = new BiomechanicalFeatureExtractor() {
            @Override
            public BiomechanicalMetricsDTO extractFeatures(List<SensorData> telemetry, String sport) {
                if (mockExtractedMetrics != null) {
                    return mockExtractedMetrics;
                }
                return super.extractFeatures(telemetry, sport);
            }
        };

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
        SportSession recent = new SportSession(1L, "DEV-01", "Running", now.minusDays(2), now.minusDays(2).plusMinutes(30),
                30, 0, 10, 4.0, 15.0, 80, 85, "Completed");
        SportSession prior = new SportSession(1L, "DEV-01", "Running", now.minusDays(10), now.minusDays(10).plusMinutes(30),
                30, 0, 10, 2.0, 10.0, 70, 75, "Completed");

        mockSessions = List.of(recent, prior);

        OverviewStatsDTO stats = statisticsService.getOverviewStats();

        assertNotNull(stats);
        assertEquals(2, stats.getTotalSessions());
        assertEquals("+100.0%", stats.getAverageAccelerationChange());
    }

    @Test
    @DisplayName("getOverviewStats returns baseline zeroes when user has no sessions")
    void testGetOverviewStats_EmptySessions_ReturnsBaselineZeroes() {
        mockSessions = Collections.emptyList();

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

        mockExtractedMetrics = new BiomechanicalMetricsDTO(
                82, 2.4, 0, "BALANCED", 165, 90, 91, 9.5, 88, 0.45, 35
        );

        mockSessions = List.of(latest);
        mockSensorDataMap.put(10L, rawTelemetry);

        ActivityAnalysisDTO result = statisticsService.getActivityAnalysis();

        assertNotNull(result);
        assertEquals(20, result.getJumps());
        assertEquals(20, result.getTotalJumps());
        assertEquals(82, result.getLandingSoftnessScore());
        assertEquals(2.4, result.getPeakLandingImpactG());
        assertEquals(2.4, result.getPeakImpactG());
        assertEquals(88, result.getExplosivenessScore());
        assertEquals(0, result.getBilateralSymmetryPct());
        assertEquals(0, result.getBilateralSymmetryPercentage());
        assertEquals("BALANCED", result.getDominantSide());
        assertEquals(91, result.getTrunkStabilityScore());
        assertEquals(9.5, result.getTrunkLeanAngleDegrees());
        assertEquals(35, result.getFatigueIndex());
        assertTrue(result.getAverageJumpHeightCm() > 20.0);
    }

    @Test
    @DisplayName("getActivityAnalysis provides graceful fallback when raw sensor data is empty")
    void testGetActivityAnalysis_ZeroSensorPoints_GracefulFallback() {
        SportSession latest = new SportSession(1L, "DEV-01", "Basketball",
                LocalDateTime.now().minusMinutes(30), LocalDateTime.now(),
                30, 15, 30, 2.8, 14.0, 75, 80, "Completed");
        latest.setId(20L);

        mockSessions = List.of(latest);
        mockSensorDataMap.put(20L, Collections.emptyList());

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

        mockStatisticMap.put(10L, stat);

        Optional<PerformanceStatisticDTO> result = statisticsService.getStatisticDTOBySessionId(10L);

        assertTrue(result.isPresent());
        assertEquals(10L, result.get().getSessionId());
        assertEquals("Basketball", result.get().getSport());
    }

    @Test
    @DisplayName("getStatisticBySessionId throws AccessDeniedException when caller is unauthorized non-owner")
    void testGetStatisticBySessionId_UnauthorizedUser_ThrowsAccessDenied() {
        PerformanceStatistic stat = new PerformanceStatistic(20L, 2L, LocalDate.now(), "Basketball",
                15.0, 3.0, 5.0, 20, 40, 80, 85);

        mockStatisticMap.put(20L, stat);

        assertThrows(AccessDeniedException.class, () -> statisticsService.getStatisticBySessionId(20L));
    }

    @Test
    @DisplayName("getStatisticBySessionId succeeds when caller is COACH or ADMIN")
    void testGetStatisticBySessionId_CoachOrAdmin_Succeeds() {
        PerformanceStatistic stat = new PerformanceStatistic(30L, 2L, LocalDate.now(), "Basketball",
                15.0, 3.0, 5.0, 20, 40, 80, 85);

        mockStatisticMap.put(30L, stat);

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
        Optional<PerformanceStatistic> result = statisticsService.getStatisticBySessionId(9999L);
        assertTrue(result.isEmpty());
    }
}
