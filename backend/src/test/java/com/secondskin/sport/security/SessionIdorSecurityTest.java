package com.secondskin.sport.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.entity.PerformanceStatistic;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.PerformanceStatisticRepository;
import com.secondskin.sport.repository.SportSessionRepository;
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
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@DisplayName("Session & Statistics IDOR Security Integration Tests")
public class SessionIdorSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SportSessionRepository sessionRepository;

    @Autowired
    private PerformanceStatisticRepository statisticRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ObjectMapper objectMapper;

    private User userA;
    private User userB;
    private User adminUser;
    private String tokenA;
    private String tokenB;
    private String adminToken;

    private SportSession sessionA;
    private PerformanceStatistic statA;

    @BeforeEach
    void setUp() {
        String suffix = System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);

        userA = new User("Athlete A", "athlete_a_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Pass123!"), Role.USER, "Running");
        userA = userRepository.save(userA);
        tokenA = jwtService.generateToken(userA);

        userB = new User("Athlete B", "athlete_b_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Pass123!"), Role.USER, "Basketball");
        userB = userRepository.save(userB);
        tokenB = jwtService.generateToken(userB);

        adminUser = new User("Admin User", "admin_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Pass123!"), Role.ADMIN, "All");
        adminUser = userRepository.save(adminUser);
        adminToken = jwtService.generateToken(adminUser);

        sessionA = new SportSession(userA.getId(), "DEV-A1", "Running",
                LocalDateTime.now().minusMinutes(40), LocalDateTime.now(),
                40, 0, 15, 3.2, 14.5, 80, 85, "Completed");
        sessionA = sessionRepository.save(sessionA);

        statA = new PerformanceStatistic(sessionA.getId(), userA.getId(), LocalDate.now(),
                "Running", 14.5, 3.2, 9.6, 0, 15, 80, 85);
        statA = statisticRepository.save(statA);
    }

    @Test
    @DisplayName("User B cannot read User A's session -> 403 Forbidden")
    void testUserB_CannotReadUserASession_Returns403() throws Exception {
        mockMvc.perform(get("/api/sessions/" + sessionA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User B cannot update User A's session -> 403 Forbidden")
    void testUserB_CannotUpdateUserASession_Returns403() throws Exception {
        SportSessionDTO updateDto = new SportSessionDTO();
        updateDto.setSport("Hacked Running");

        mockMvc.perform(put("/api/sessions/" + sessionA.getId())
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateDto)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User B cannot delete User A's session -> 403 Forbidden")
    void testUserB_CannotDeleteUserASession_Returns403() throws Exception {
        mockMvc.perform(delete("/api/sessions/" + sessionA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User B cannot read User A's session sensor data -> 403 Forbidden")
    void testUserB_CannotReadUserASensorData_Returns403() throws Exception {
        mockMvc.perform(get("/api/sessions/" + sessionA.getId() + "/sensor-data")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("User B cannot read User A's performance statistic by sessionId -> 403 Forbidden")
    void testUserB_CannotReadUserAStatistic_Returns403() throws Exception {
        mockMvc.perform(get("/api/statistics/" + sessionA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Owner (User A) and Admin can read Session A -> 200 OK")
    void testOwnerAndAdmin_CanReadSessionA_Returns200() throws Exception {
        mockMvc.perform(get("/api/sessions/" + sessionA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionA.getId()));

        mockMvc.perform(get("/api/sessions/" + sessionA.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionA.getId()));
    }

    @Test
    @DisplayName("User B spoofing userId in createSession is neutralized to User B's real id")
    void testCreateSession_UserIdSpoofingNeutralized() throws Exception {
        SportSessionDTO spoofedReq = new SportSessionDTO();
        spoofedReq.setUserId(userA.getId()); // Attacker B tries to create session under victim A
        spoofedReq.setSport("Running");
        spoofedReq.setDurationMinutes(25);

        MvcResult result = mockMvc.perform(post("/api/sessions")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(spoofedReq)))
                .andExpect(status().isOk())
                .andReturn();

        SportSessionDTO created = objectMapper.readValue(result.getResponse().getContentAsString(), SportSessionDTO.class);
        assertEquals(userB.getId(), created.getUserId(), "UserId must be bound to authenticated caller, spoofing neutralized!");
    }
}
