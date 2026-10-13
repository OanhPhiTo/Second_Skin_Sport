package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.dto.BiomechanicalMetricsDTO;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.SportSessionRepository;
import com.secondskin.sport.security.CustomUserDetailsService;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.service.AiCoachService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    value = AiCoachController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class AiCoachControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AiCoachService aiCoachService;

    @MockBean
    private SportSessionRepository sessionRepository;

    @MockBean
    private SensorDataRepository sensorDataRepository;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testAnalyzeSession_FoundInRepository() throws Exception {
        SportSession session = new SportSession(
                10L, "DEV-01", "Basketball",
                LocalDateTime.now().minusMinutes(40), LocalDateTime.now(),
                40, 35, 90, 3.1, 16.0, 85, 88, "Completed"
        );

        AiInsightDTO mockInsight = new AiInsightDTO(
                "Bóng rổ - Tấn công", 88, "LOW",
                "Khớp gối hấp thụ lực êm.", 380,
                List.of("Góc gập gối tối ưu"), List.of("Bù nước điện giải"),
                "Buổi tập tốt."
        );
        mockInsight.setCurrentPerformance("Bạn chơi bóng rất thanh thoát và ổn định.");
        mockInsight.setAreasForImprovement(List.of("Chùng gối sâu hơn khi tiếp đất"));
        mockInsight.setActionableDrills(List.of("Depth Drop 3 hiệp x 8 lần"));
        mockInsight.setBiomechanicalMetrics(new BiomechanicalMetricsDTO(84, 2.5, 95, "BALANCED", 132, 90, 85, 8.0, 88, 0.45, 15));

        Mockito.when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        Mockito.when(sensorDataRepository.findBySessionIdOrderByTimestampAsc(10L)).thenReturn(Collections.emptyList());
        Mockito.when(aiCoachService.analyzeSession(eq(session), any())).thenReturn(mockInsight);

        mockMvc.perform(get("/api/ai/session/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.performanceScore").value(88))
                .andExpect(jsonPath("$.currentPerformance").value("Bạn chơi bóng rất thanh thoát và ổn định."))
                .andExpect(jsonPath("$.biomechanicalMetrics.landingSoftnessScore").value(84));
    }

    @Test
    void testQuickAnalysis() throws Exception {
        SportSession session = new SportSession(
                1L, "DEV-01", "Running",
                LocalDateTime.now().minusMinutes(30), LocalDateTime.now(),
                30, 0, 15, 2.6, 14.0, 80, 84, "Completed"
        );

        AiInsightDTO mockInsight = new AiInsightDTO(
                "Chạy bộ - Tiêu chuẩn", 84, "LOW",
                "An toàn.", 320,
                List.of("Sải chân đều"), List.of("Đi bộ thả lỏng"),
                "Chạy tốt."
        );

        Mockito.when(aiCoachService.analyzeSession(any(SportSession.class), any())).thenReturn(mockInsight);

        mockMvc.perform(post("/api/ai/quick-analysis")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(session)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.performanceScore").value(84));
    }
}
