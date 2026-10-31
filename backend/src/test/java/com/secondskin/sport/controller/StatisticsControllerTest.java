package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.ActivityAnalysisDTO;
import com.secondskin.sport.dto.OverviewStatsDTO;
import com.secondskin.sport.dto.PerformanceStatisticDTO;
import com.secondskin.sport.security.CustomUserDetailsService;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.service.StatisticsService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    value = StatisticsController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class StatisticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StatisticsService statisticsService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/statistics/overview returns OverviewStatsDTO")
    void testGetOverviewStats() throws Exception {
        OverviewStatsDTO overview = new OverviewStatsDTO(
                5, "+5 tuần này", "2h 30m", "+10%",
                2.8, "+3.2%", 120, "+24 /phiên",
                45, "+9 /phiên", 85, "Hạng Tối Ưu"
        );

        Mockito.when(statisticsService.getOverviewStats()).thenReturn(overview);

        mockMvc.perform(get("/api/statistics/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSessions").value(5))
                .andExpect(jsonPath("$.totalActivityTime").value("2h 30m"))
                .andExpect(jsonPath("$.totalTime").value("2h 30m"));
    }

    @Test
    @DisplayName("GET /api/statistics/activity-analysis returns ActivityAnalysisDTO")
    void testGetActivityAnalysis() throws Exception {
        ActivityAnalysisDTO analysis = new ActivityAnalysisDTO(
                25, 42.0, 18, 85,
                88, 2.4, 90, 0.45, 94, "BALANCED", 86, 10.4
        );

        Mockito.when(statisticsService.getActivityAnalysis()).thenReturn(analysis);

        mockMvc.perform(get("/api/statistics/activity-analysis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jumps").value(25))
                .andExpect(jsonPath("$.averageJumpHeightCm").value(42.0))
                .andExpect(jsonPath("$.jumpHeight").value(42.0));
    }

    @Test
    @DisplayName("GET /api/statistics returns List of PerformanceStatisticDTO")
    void testGetStatistics() throws Exception {
        PerformanceStatisticDTO stat = PerformanceStatisticDTO.builder()
                .id(1L)
                .sessionId(10L)
                .userId(1L)
                .sport("Running")
                .date(LocalDate.now())
                .averageSpeed(14.5)
                .averageAcceleration(2.8)
                .totalDistance(8.5)
                .totalJumps(0)
                .directionChanges(15)
                .movementIntensity(80)
                .performanceScore(85)
                .build();

        Mockito.when(statisticsService.getStatisticsDTO(null, null)).thenReturn(List.of(stat));

        mockMvc.perform(get("/api/statistics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].sport").value("Running"))
                .andExpect(jsonPath("$[0].averageSpeed").value(14.5));
    }

    @Test
    @DisplayName("GET /api/statistics/{sessionId} returns PerformanceStatisticDTO")
    void testGetStatisticBySessionId() throws Exception {
        PerformanceStatisticDTO stat = PerformanceStatisticDTO.builder()
                .id(2L)
                .sessionId(15L)
                .sport("Basketball")
                .totalJumps(35)
                .build();

        Mockito.when(statisticsService.getStatisticDTOBySessionId(15L)).thenReturn(Optional.of(stat));

        mockMvc.perform(get("/api/statistics/15"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(2L))
                .andExpect(jsonPath("$.totalJumps").value(35));
    }
}
