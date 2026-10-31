package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.dto.BiomechanicalMetricsDTO;
import com.secondskin.sport.dto.SportSessionDTO;
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
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
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
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testAnalyzeSession_FoundInRepository() throws Exception {
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

        Mockito.when(aiCoachService.analyzeSessionById(10L)).thenReturn(mockInsight);

        mockMvc.perform(get("/api/ai/session/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.performanceScore").value(88))
                .andExpect(jsonPath("$.currentPerformance").value("Bạn chơi bóng rất thanh thoát và ổn định."))
                .andExpect(jsonPath("$.biomechanicalMetrics.landingSoftnessScore").value(84));
    }

    @Test
    void testQuickAnalysis() throws Exception {
        SportSessionDTO sessionDto = new SportSessionDTO();
        sessionDto.setUserId(1L);
        sessionDto.setDeviceId("DEV-01");
        sessionDto.setSport("Running");
        sessionDto.setStartTime(LocalDateTime.now().minusMinutes(30));
        sessionDto.setEndTime(LocalDateTime.now());
        sessionDto.setDurationMinutes(30);
        sessionDto.setTotalJumps(0);
        sessionDto.setDirectionChanges(15);
        sessionDto.setAverageAcceleration(2.6);
        sessionDto.setAverageSpeed(14.0);
        sessionDto.setMovementIntensity(80);
        sessionDto.setPerformanceScore(84);
        sessionDto.setStatus("Completed");

        AiInsightDTO mockInsight = new AiInsightDTO(
                "Chạy bộ - Tiêu chuẩn", 84, "LOW",
                "An toàn.", 320,
                List.of("Sải chân đều"), List.of("Đi bộ thả lỏng"),
                "Chạy tốt."
        );

        Mockito.when(aiCoachService.analyzeSession(any(SportSessionDTO.class))).thenReturn(mockInsight);

        mockMvc.perform(post("/api/ai/quick-analysis")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(sessionDto)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.performanceScore").value(84));
    }
}
