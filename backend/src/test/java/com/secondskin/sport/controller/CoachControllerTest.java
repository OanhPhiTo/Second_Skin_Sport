package com.secondskin.sport.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.*;
import com.secondskin.sport.entity.AthleteStatus;
import com.secondskin.sport.security.CustomUserDetailsService;
import com.secondskin.sport.security.JwtService;
import com.secondskin.sport.service.CoachService;
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
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
    value = CoachController.class,
    excludeAutoConfiguration = {
        SecurityAutoConfiguration.class,
        UserDetailsServiceAutoConfiguration.class
    }
)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("CoachController - REST Endpoints Tests")
public class CoachControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CoachService coachService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("GET /api/coach/teams returns list of Coach's teams")
    void testGetMyTeams() throws Exception {
        TeamDTO team = TeamDTO.builder()
                .id(1L)
                .name("Hanoi Dragons Pro")
                .sport("Basketball")
                .coachId(3L)
                .totalAthletes(6)
                .onFieldCount(3)
                .benchCount(3)
                .createdAt(LocalDateTime.now())
                .build();

        Mockito.when(coachService.getTeamsByCoach(any())).thenReturn(List.of(team));

        mockMvc.perform(get("/api/coach/teams"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Hanoi Dragons Pro"))
                .andExpect(jsonPath("$[0].sport").value("Basketball"));
    }

    @Test
    @DisplayName("GET /api/coach/teams/{teamId}/roster returns squad athletes")
    void testGetTeamRoster() throws Exception {
        TeamAthleteDTO athlete = TeamAthleteDTO.builder()
                .id(1L)
                .teamId(1L)
                .name("Alex Johnson")
                .jerseyNumber(7)
                .position("PG")
                .deviceId("SSS-PATCH-001")
                .status(AthleteStatus.ON_FIELD)
                .fatigueIndex(82.5)
                .minutesPlayed(32)
                .injuryRiskLevel("CRITICAL")
                .build();

        Mockito.when(coachService.getTeamRoster(eq(1L), any())).thenReturn(List.of(athlete));

        mockMvc.perform(get("/api/coach/teams/1/roster"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Alex Johnson"))
                .andExpect(jsonPath("$[0].jerseyNumber").value(7))
                .andExpect(jsonPath("$[0].fatigueIndex").value(82.5));
    }

    @Test
    @DisplayName("GET /api/coach/teams/{teamId}/athletes/{athleteId}/metrics returns detailed biometrics")
    void testGetAthleteDetailTelemetry() throws Exception {
        AthleteDetailTelemetryDTO detail = AthleteDetailTelemetryDTO.builder()
                .id(1L)
                .teamId(1L)
                .name("Alex Johnson")
                .jerseyNumber(7)
                .position("PG")
                .deviceId("SSS-PATCH-001")
                .status(AthleteStatus.ON_FIELD)
                .minutesPlayed(32)
                .fatigueIndex(82.5)
                .currentIntensity(88.0)
                .jumpCount(42)
                .highImpactLandings(14)
                .heartRate(168)
                .injuryRiskLevel("CRITICAL")
                .recoveryAdvice("Cần rút cầu thủ về ghế dự bị ngay")
                .tacticalActionHint("Đề xuất thay ra ngay")
                .recentTelemetry(Collections.emptyList())
                .build();

        Mockito.when(coachService.getAthleteDetailTelemetry(eq(1L), eq(1L), any())).thenReturn(Optional.of(detail));

        mockMvc.perform(get("/api/coach/teams/1/athletes/1/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alex Johnson"))
                .andExpect(jsonPath("$.jerseyNumber").value(7))
                .andExpect(jsonPath("$.heartRate").value(168))
                .andExpect(jsonPath("$.injuryRiskLevel").value("CRITICAL"))
                .andExpect(jsonPath("$.fatigueIndex").value(82.5));
    }

    @Test
    @DisplayName("GET /api/coach/teams/{teamId}/tactical-analysis returns real-time analysis and rotation alerts")
    void testGetSquadTacticalAnalysis() throws Exception {
        TacticalRotationDTO alert = TacticalRotationDTO.builder()
                .outAthleteId(1L)
                .outAthleteName("Alex Johnson")
                .outJerseyNumber(7)
                .outPosition("PG")
                .outFatigueIndex(82.5)
                .inAthleteId(4L)
                .inAthleteName("Chris Paul")
                .inJerseyNumber(11)
                .inPosition("PG")
                .inFatigueIndex(12.0)
                .urgency("CRITICAL")
                .reason("Cầu thủ quá tải")
                .recommendedTactic("Thay cầu thủ duy trì phòng ngự")
                .build();

        SquadTacticalSummaryDTO summary = SquadTacticalSummaryDTO.builder()
                .teamId(1L)
                .teamName("Hanoi Dragons Pro")
                .sport("Basketball")
                .averageFatigue(76.5)
                .highFatigueCount(1)
                .activeTacticalAlerts(List.of(alert))
                .activeOnField(Collections.emptyList())
                .benchSubstitutes(Collections.emptyList())
                .recommendedPaceAdjustment("Hạ nhịp độ")
                .lastEvaluated("14:30:00")
                .build();

        Mockito.when(coachService.getSquadTacticalAnalysis(eq(1L), any())).thenReturn(summary);

        mockMvc.perform(get("/api/coach/teams/1/tactical-analysis"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamName").value("Hanoi Dragons Pro"))
                .andExpect(jsonPath("$.averageFatigue").value(76.5))
                .andExpect(jsonPath("$.activeTacticalAlerts[0].outAthleteName").value("Alex Johnson"))
                .andExpect(jsonPath("$.activeTacticalAlerts[0].inAthleteName").value("Chris Paul"));
    }

    @Test
    @DisplayName("POST /api/coach/teams/{teamId}/tactical-action executes player substitution")
    void testExecuteTacticalAction() throws Exception {
        TacticalSwapRequestDTO swapReq = new TacticalSwapRequestDTO(1L, 4L);

        SquadTacticalSummaryDTO updatedSummary = SquadTacticalSummaryDTO.builder()
                .teamId(1L)
                .teamName("Hanoi Dragons Pro")
                .averageFatigue(52.0)
                .highFatigueCount(0)
                .activeTacticalAlerts(Collections.emptyList())
                .build();

        Mockito.when(coachService.executeTacticalSwap(eq(1L), eq(1L), eq(4L), any())).thenReturn(updatedSummary);

        mockMvc.perform(post("/api/coach/teams/1/tactical-action")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(swapReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageFatigue").value(52.0))
                .andExpect(jsonPath("$.highFatigueCount").value(0));
    }

    @Test
    @DisplayName("GET /api/coach/teams/{teamId} returns 403 Forbidden when Coach does not own team")
    void testGetTeamById_UnauthorizedCoach_Returns403() throws Exception {
        Mockito.when(coachService.getTeamById(eq(2L), any()))
                .thenThrow(new org.springframework.security.access.AccessDeniedException("You do not have permission to access team 2"));

        mockMvc.perform(get("/api/coach/teams/2"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("GET /api/coach/tactical/roster returns 200 OK for valid teamId query parameter")
    void testGetTacticalRoster_Success() throws Exception {
        TeamAthleteDTO athlete = TeamAthleteDTO.builder()
                .id(1L)
                .teamId(1L)
                .name("Alex Johnson")
                .jerseyNumber(7)
                .status(AthleteStatus.ON_FIELD)
                .build();

        Mockito.when(coachService.getTeamRoster(eq(1L), any())).thenReturn(List.of(athlete));

        mockMvc.perform(get("/api/coach/tactical/roster?teamId=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Alex Johnson"))
                .andExpect(jsonPath("$[0].jerseyNumber").value(7));
    }

    @Test
    @DisplayName("GET /api/coach/tactical/telemetry returns 200 OK for valid query parameters")
    void testGetTacticalTelemetry_Success() throws Exception {
        AthleteDetailTelemetryDTO detail = AthleteDetailTelemetryDTO.builder()
                .id(1L)
                .teamId(1L)
                .name("Alex Johnson")
                .heartRate(165)
                .fatigueIndex(80.0)
                .build();

        Mockito.when(coachService.getAthleteDetailTelemetry(eq(1L), eq(1L), any()))
                .thenReturn(Optional.of(detail));

        mockMvc.perform(get("/api/coach/tactical/telemetry?teamId=1&athleteId=1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alex Johnson"))
                .andExpect(jsonPath("$.heartRate").value(165));
    }

    @Test
    @DisplayName("POST /api/coach/tactical/swap executes rotation successfully with teamId in body")
    void testExecuteTacticalSwap_WithBodyTeamId_Success() throws Exception {
        TacticalSwapRequestDTO swapReq = new TacticalSwapRequestDTO(1L, 1L, 4L); // teamId=1, out=1, in=4

        SquadTacticalSummaryDTO summary = SquadTacticalSummaryDTO.builder()
                .teamId(1L)
                .teamName("Hanoi Dragons Pro")
                .averageFatigue(50.0)
                .build();

        Mockito.when(coachService.executeTacticalSwap(eq(1L), eq(1L), eq(4L), any()))
                .thenReturn(summary);

        mockMvc.perform(post("/api/coach/tactical/swap")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(swapReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamId").value(1L));
    }

    @Test
    @DisplayName("POST /api/coach/tactical/swap returns 400 Bad Request when teamId is omitted")
    void testExecuteTacticalSwap_MissingTeamId_Returns400() throws Exception {
        TacticalSwapRequestDTO invalidReq = new TacticalSwapRequestDTO(null, 1L, 4L);

        mockMvc.perform(post("/api/coach/tactical/swap")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Bad Request"));
    }

    @Test
    @DisplayName("POST /api/coach/tactical/swap returns 403 Forbidden when unauthorized coach calls swap")
    void testExecuteTacticalSwap_UnauthorizedCoach_Returns403() throws Exception {
        TacticalSwapRequestDTO swapReq = new TacticalSwapRequestDTO(2L, 1L, 4L);

        Mockito.when(coachService.executeTacticalSwap(eq(2L), eq(1L), eq(4L), any()))
                .thenThrow(new org.springframework.security.access.AccessDeniedException("Access denied to team 2"));

        mockMvc.perform(post("/api/coach/tactical/swap")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(swapReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }
}
