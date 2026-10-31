package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AutoSessionDTO;
import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.security.CustomUserDetailsService;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.service.SensorDataService;
import com.secondskin.sport.service.SessionService;
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

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = SessionController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false)
public class SessionControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SessionService sessionService;

    @MockBean
    private SensorDataService sensorDataService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/sessions returns List of SportSessionDTO")
    void testGetAllSessions() throws Exception {
        SportSessionDTO dto = new SportSessionDTO();
        dto.setId(1L);
        dto.setSport("Running");

        Mockito.when(sessionService.getAllSessions(null)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/sessions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[0].sport").value("Running"));
    }

    @Test
    @DisplayName("GET /api/sessions/{id} returns SportSessionDTO")
    void testGetSessionById() throws Exception {
        SportSessionDTO dto = new SportSessionDTO();
        dto.setId(1L);
        dto.setSport("Basketball");

        Mockito.when(sessionService.getSessionById(1L)).thenReturn(Optional.of(dto));

        mockMvc.perform(get("/api/sessions/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.sport").value("Basketball"));
    }

    @Test
    @DisplayName("POST /api/sessions accepts SportSessionDTO and returns SportSessionDTO")
    void testCreateSession() throws Exception {
        SportSessionDTO input = new SportSessionDTO();
        input.setSport("Running");
        input.setDurationMinutes(30);

        SportSessionDTO created = new SportSessionDTO();
        created.setId(10L);
        created.setSport("Running");
        created.setDurationMinutes(30);

        Mockito.when(sessionService.createSession(any(SportSessionDTO.class))).thenReturn(created);

        mockMvc.perform(post("/api/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.sport").value("Running"));
    }

    @Test
    @DisplayName("POST /api/sessions/auto accepts AutoSessionDTO and returns SportSessionDTO")
    void testCreateAutoSession() throws Exception {
        AutoSessionDTO input = new AutoSessionDTO();
        input.setSport("Running");

        SportSessionDTO created = new SportSessionDTO();
        created.setId(20L);
        created.setSport("Running");

        Mockito.when(sessionService.createAutoSession(any(AutoSessionDTO.class))).thenReturn(created);

        mockMvc.perform(post("/api/sessions/auto")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(20L));
    }

    @Test
    @DisplayName("PUT /api/sessions/{id} accepts SportSessionDTO and returns SportSessionDTO")
    void testUpdateSession() throws Exception {
        SportSessionDTO input = new SportSessionDTO();
        input.setDurationMinutes(45);

        SportSessionDTO updated = new SportSessionDTO();
        updated.setId(10L);
        updated.setDurationMinutes(45);

        Mockito.when(sessionService.updateSession(eq(10L), any(SportSessionDTO.class))).thenReturn(updated);

        mockMvc.perform(put("/api/sessions/10")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(input)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10L))
                .andExpect(jsonPath("$.durationMinutes").value(45));
    }

    @Test
    @DisplayName("DELETE /api/sessions/{id} returns 204 No Content")
    void testDeleteSession() throws Exception {
        mockMvc.perform(delete("/api/sessions/10"))
                .andExpect(status().isNoContent());

        Mockito.verify(sessionService).deleteSession(10L);
    }

    @Test
    @DisplayName("GET /api/sessions/{id}/sensor-data returns List of SensorDataDTO")
    void testGetSessionSensorData() throws Exception {
        SensorDataDTO dataPoint = new SensorDataDTO();
        dataPoint.setId(100L);
        dataPoint.setSessionId(1L);
        dataPoint.setDeviceId("DEV-01");
        dataPoint.setAx(1.2);
        dataPoint.setAy(0.3);
        dataPoint.setAz(9.8);

        Mockito.when(sessionService.getSessionSensorData(1L)).thenReturn(List.of(dataPoint));

        mockMvc.perform(get("/api/sessions/1/sensor-data"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(100L))
                .andExpect(jsonPath("$[0].deviceId").value("DEV-01"))
                .andExpect(jsonPath("$[0].ax").value(1.2));
    }
}
