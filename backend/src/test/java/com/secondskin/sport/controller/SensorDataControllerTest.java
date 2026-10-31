package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.security.CustomUserDetailsService;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.service.SensorDataService;
import org.junit.jupiter.api.DisplayName;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    value = SensorDataController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class SensorDataControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SensorDataService sensorDataService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/sensor-data accepts and returns SensorDataDTO")
    void testPostSensorData() throws Exception {
        SensorDataDTO input = SensorDataDTO.builder()
                .sessionId(1L)
                .deviceId("DEV-01")
                .ax(1.0)
                .ay(2.0)
                .az(9.8)
                .gx(0.1)
                .gy(0.2)
                .gz(0.3)
                .build();

        SensorDataDTO saved = SensorDataDTO.builder()
                .id(100L)
                .sessionId(1L)
                .deviceId("DEV-01")
                .ax(1.0)
                .ay(2.0)
                .az(9.8)
                .accelerometerX(1.0)
                .accelerometerY(2.0)
                .accelerometerZ(9.8)
                .timestamp(LocalDateTime.now())
                .build();

        Mockito.when(sensorDataService.saveSensorDataDTO(any(SensorDataDTO.class))).thenReturn(saved);

        mockMvc.perform(post("/api/sensor-data")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(100L))
                .andExpect(jsonPath("$.sessionId").value(1L))
                .andExpect(jsonPath("$.ax").value(1.0))
                .andExpect(jsonPath("$.accelerometerX").value(1.0));
    }

    @Test
    @DisplayName("GET /api/sensor-data/latest returns SensorDataDTO")
    void testGetLatestSensorData() throws Exception {
        SensorDataDTO latest = SensorDataDTO.builder()
                .id(200L)
                .deviceId("DEV-01")
                .ax(0.5)
                .ay(0.2)
                .az(9.81)
                .accelerometerX(0.5)
                .build();

        Mockito.when(sensorDataService.getLatestSensorDataDTO()).thenReturn(Optional.of(latest));

        mockMvc.perform(get("/api/sensor-data/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(200L))
                .andExpect(jsonPath("$.deviceId").value("DEV-01"))
                .andExpect(jsonPath("$.ax").value(0.5));
    }

    @Test
    @DisplayName("GET /api/sensor-data/session/{sessionId} returns List of SensorDataDTO")
    void testGetRecentDataPoints() throws Exception {
        SensorDataDTO pt = SensorDataDTO.builder()
                .id(300L)
                .sessionId(5L)
                .deviceId("DEV-01")
                .ax(1.2)
                .accelerometerX(1.2)
                .build();

        Mockito.when(sensorDataService.getSensorDataDTOBySessionId(5L)).thenReturn(List.of(pt));

        mockMvc.perform(get("/api/sensor-data/session/5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(300L))
                .andExpect(jsonPath("$[0].sessionId").value(5L))
                .andExpect(jsonPath("$[0].ax").value(1.2));
    }
}
