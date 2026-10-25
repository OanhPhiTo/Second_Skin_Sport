package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.BatchProcessResponseDTO;
import com.secondskin.sport.dto.SensorBatchDTO;
import com.secondskin.sport.dto.SensorReadingDTO;
import com.secondskin.sport.security.CustomUserDetailsService;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.service.SensorBatchService;
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
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
    value = SensorBatchController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("SensorBatchController - Endpoint POST /api/v1/sensor/batches Tests")
public class SensorBatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SensorBatchService sensorBatchService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("POST /api/v1/sensor/batches should process incoming batch and return DTO")
    void testReceiveSensorBatch_Success() throws Exception {
        SensorReadingDTO reading = new SensorReadingDTO(
                LocalDateTime.now(), 0.5, 0.2, 9.81, 10.0, 5.0, 2.0, 0.0, 0.0, 0.0, 75
        );
        SensorBatchDTO batch = new SensorBatchDTO("ESP32-SUPERMINI-01", 1L, 95, List.of(reading));

        BatchProcessResponseDTO mockResponse = new BatchProcessResponseDTO(
                "SUCCESS", 1, "Processed 1 sensor readings from ESP32-SUPERMINI-01",
                0, 0, "IDLE", Collections.emptyList()
        );

        Mockito.when(sensorBatchService.processBatch(any(SensorBatchDTO.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/sensor/batches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.processedCount").value(1))
                .andExpect(jsonPath("$.activityType").value("IDLE"));
    }
}
