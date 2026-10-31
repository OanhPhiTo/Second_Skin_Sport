package com.secondskin.sport.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AddAthleteRequestDTO;
import com.secondskin.sport.dto.TacticalSwapRequestDTO;
import com.secondskin.sport.entity.*;
import com.secondskin.sport.repository.TeamAthleteRepository;
import com.secondskin.sport.repository.TeamRepository;
import com.secondskin.sport.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Coach Squad IDOR Security Integration Tests")
public class CoachSquadIdorSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamAthleteRepository athleteRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User coachA;
    private User coachB;
    private User adminUser;
    private String tokenCoachA;
    private String tokenCoachB;
    private String tokenAdmin;

    private Team teamA;
    private TeamAthlete athleteA1;
    private TeamAthlete athleteA2;

    @BeforeEach
    void setUp() {
        String suffix = System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);

        coachA = new User("Coach Alpha", "coach_a_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Pass123!"), Role.COACH, "Basketball");
        coachA = userRepository.save(coachA);
        tokenCoachA = jwtService.generateToken(coachA);

        coachB = new User("Coach Beta", "coach_b_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Pass123!"), Role.COACH, "Basketball");
        coachB = userRepository.save(coachB);
        tokenCoachB = jwtService.generateToken(coachB);

        adminUser = new User("Admin", "admin_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Pass123!"), Role.ADMIN, "All");
        adminUser = userRepository.save(adminUser);
        tokenAdmin = jwtService.generateToken(adminUser);

        teamA = new Team("Hanoi Dragons Alpha", "Basketball", coachA.getId(), "Alpha squad");
        teamA = teamRepository.save(teamA);

        athleteA1 = new TeamAthlete(teamA.getId(), null, "Player 1", 7, "PG", "DEV-01", AthleteStatus.ON_FIELD);
        athleteA1 = athleteRepository.save(athleteA1);

        athleteA2 = new TeamAthlete(teamA.getId(), null, "Player 2", 11, "SG", "DEV-02", AthleteStatus.BENCH);
        athleteA2 = athleteRepository.save(athleteA2);
    }

    @Test
    @DisplayName("Coach B cannot view Team A details -> 403 Forbidden")
    void testCoachB_CannotViewTeamA_Returns403() throws Exception {
        mockMvc.perform(get("/api/coach/teams/" + teamA.getId())
                        .header("Authorization", "Bearer " + tokenCoachB))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Coach B cannot view Team A roster -> 403 Forbidden")
    void testCoachB_CannotViewTeamARoster_Returns403() throws Exception {
        mockMvc.perform(get("/api/coach/teams/" + teamA.getId() + "/roster")
                        .header("Authorization", "Bearer " + tokenCoachB))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Coach B cannot add athlete to Team A -> 403 Forbidden")
    void testCoachB_CannotAddAthleteToTeamA_Returns403() throws Exception {
        AddAthleteRequestDTO req = AddAthleteRequestDTO.builder()
                .name("Injected Player")
                .jerseyNumber(99)
                .position("C")
                .deviceId("DEV-99")
                .status(AthleteStatus.BENCH)
                .build();

        mockMvc.perform(post("/api/coach/teams/" + teamA.getId() + "/athletes")
                        .header("Authorization", "Bearer " + tokenCoachB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Coach B cannot view Team A canonical tactical roster -> 403 Forbidden")
    void testCoachB_CannotViewTeamACanonicalTacticalRoster_Returns403() throws Exception {
        mockMvc.perform(get("/api/coach/tactical/roster?teamId=" + teamA.getId())
                        .header("Authorization", "Bearer " + tokenCoachB))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Coach B cannot trigger tactical swap on Team A -> 403 Forbidden")
    void testCoachB_CannotTriggerTacticalSwapOnTeamA_Returns403() throws Exception {
        TacticalSwapRequestDTO swapReq = new TacticalSwapRequestDTO(teamA.getId(), athleteA1.getId(), athleteA2.getId());

        mockMvc.perform(post("/api/coach/tactical/swap")
                        .header("Authorization", "Bearer " + tokenCoachB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(swapReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("Coach A (owner) can manage Team A -> 200 OK")
    void testCoachA_OwnerCanViewAndManageTeamA_Returns200() throws Exception {
        mockMvc.perform(get("/api/coach/teams/" + teamA.getId())
                        .header("Authorization", "Bearer " + tokenCoachA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(teamA.getId()));

        mockMvc.perform(get("/api/coach/tactical/roster?teamId=" + teamA.getId())
                        .header("Authorization", "Bearer " + tokenCoachA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("Non-existent team returns 404 Not Found before checking permissions")
    void testNonExistentTeam_Returns404() throws Exception {
        mockMvc.perform(get("/api/coach/teams/999999999")
                        .header("Authorization", "Bearer " + tokenCoachA))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("Not Found"));
    }

    @Test
    @DisplayName("Admin can view Team A across platform -> 200 OK")
    void testAdmin_CanViewTeamA_Returns200() throws Exception {
        mockMvc.perform(get("/api/coach/teams/" + teamA.getId())
                        .header("Authorization", "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(teamA.getId()));
    }
}
