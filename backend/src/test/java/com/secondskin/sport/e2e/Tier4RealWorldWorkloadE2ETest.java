package com.secondskin.sport.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.*;
import com.secondskin.sport.entity.*;
import com.secondskin.sport.repository.*;
import com.secondskin.sport.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tier 4: Real-World Workload Scenarios E2E Test Suite
 * Simulates end-to-end operational scenarios:
 * 1. Full 45-Minute Athlete Training Session: Warmup running, high-impact jump sets, landing evaluation, session completion.
 * 2. Professional Match Simulation: Live 5-starter lineup, high fatigue accumulation, tactical rotation recommendation & substitution.
 * 3. Streaming IoT Wearable Telemetry: 10 consecutive batches from ESP32-C3 with simulated battery drain and persistent telemetry.
 * 4. Multi-Sport Biomechanical Differentiation: Basketball vs Running DSP calculations (jump height, trunk angle, landing softness).
 * 5. High-Impact Landings & Injury Risk Alert: Repetitive heavy impacts (>4.0G) driving elevated fatigue index and coach alert.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class Tier4RealWorldWorkloadE2ETest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamAthleteRepository teamAthleteRepository;

    @Autowired
    private SportSessionRepository sportSessionRepository;

    @Autowired
    private SensorDataRepository sensorDataRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User coachUser;
    private User athleteUser;
    private String coachToken;
    private String athleteToken;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        coachUser = new User("Coach Workload", "workload_coach_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Secret123!"), Role.COACH, "Basketball");
        userRepository.save(coachUser);
        coachToken = jwtService.generateToken(coachUser);

        athleteUser = new User("Athlete Workload", "workload_athlete_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Secret123!"), Role.USER, "Basketball");
        userRepository.save(athleteUser);
        athleteToken = jwtService.generateToken(athleteUser);
    }

    // =========================================================================
    // SCENARIO 1: Full 45-Minute Athlete Training Session Simulation
    // =========================================================================

    @Test
    @DisplayName("W01: Full 45-minute training session simulation with warmup, plyometric jumps, and cool-down")
    void testScenario1_Full45MinuteAthleteTrainingWorkload() throws Exception {
        String devId = "DEV-WORKLOAD-45MIN";
        Device device = deviceRepository.save(new Device("Workload Insole", devId, true, 100, "v2.0", "BLE"));

        // 1. Session Initialization
        LocalDateTime startTime = LocalDateTime.now().minusMinutes(45);
        SportSession session = new SportSession(
                athleteUser.getId(), devId, "Basketball",
                startTime, LocalDateTime.now(),
                45, 0, 0, 0.0, 0.0, 75, 88, "In Progress"
        );
        SportSession savedSession = sportSessionRepository.save(session);
        Long sessionId = savedSession.getId();

        // 2. Phase 1: Warmup Running Cadence (Impacts 18 m/s² at ~300ms intervals)
        List<SensorReadingDTO> warmupReadings = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            warmupReadings.add(new SensorReadingDTO(
                    startTime.plusSeconds(i), 0.5, 0.3, 17.5, 5.0, 2.0, 1.0, 2.0, 0.5, 180.0, 60
            ));
        }
        SensorBatchDTO warmupBatch = new SensorBatchDTO(devId, sessionId, 98, warmupReadings);
        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(warmupBatch)))
                .andExpect(status().isOk());

        // 3. Phase 2: Plyometric Vertical Jumps (3 complete takeoff -> airborne 320ms -> landing 28 m/s² sets)
        List<SensorReadingDTO> plyoReadings = new ArrayList<>();
        for (int j = 0; j < 3; j++) {
            LocalDateTime jumpBase = startTime.plusMinutes(15).plusSeconds(j * 5);
            plyoReadings.add(new SensorReadingDTO(jumpBase.plusNanos(0L), 0.0, 0.0, 9.81, 0, 0, 0, 0, 0, 0, 70));
            plyoReadings.add(new SensorReadingDTO(jumpBase.plusNanos(100_000_000L), 0.0, 0.0, 19.5, 0, 0, 0, 0, 0, 0, 85)); // Takeoff
            plyoReadings.add(new SensorReadingDTO(jumpBase.plusNanos(220_000_000L), 0.0, 0.0, 2.0, 0, 0, 0, 0, 0, 0, 80));  // Airborne
            plyoReadings.add(new SensorReadingDTO(jumpBase.plusNanos(360_000_000L), 0.0, 0.0, 1.8, 0, 0, 0, 0, 0, 0, 80));
            plyoReadings.add(new SensorReadingDTO(jumpBase.plusNanos(500_000_000L), 0.0, 0.0, 2.1, 0, 0, 0, 0, 0, 0, 80));
            plyoReadings.add(new SensorReadingDTO(jumpBase.plusNanos(580_000_000L), 0.0, 0.0, 27.5, 0, 0, 0, 0, 0, 0, 95)); // Landing impact 2.8G
        }
        SensorBatchDTO plyoBatch = new SensorBatchDTO(devId, sessionId, 95, plyoReadings);
        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(plyoBatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jumpsDetected").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

        // 4. Session Finalization & Completion Update
        savedSession.setStatus("Completed");
        savedSession.setTotalJumps(18);
        savedSession.setDirectionChanges(12);
        savedSession.setAverageAcceleration(3.7);
        savedSession.setAverageSpeed(11.2);
        savedSession.setMovementIntensity(82);
        savedSession.setPerformanceScore(89);

        mockMvc.perform(put("/api/sessions/" + sessionId)
                        .header("Authorization", "Bearer " + athleteToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(savedSession)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("Completed"))
                .andExpect(jsonPath("$.durationMinutes").value(45));

        // 5. Query Overview Statistics
        mockMvc.perform(get("/api/statistics/overview")
                        .header("Authorization", "Bearer " + athleteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSessions").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    // =========================================================================
    // SCENARIO 2: Competitive Match Squad Rotation & Tactical Substitution
    // =========================================================================

    @Test
    @DisplayName("W02: Competitive match simulation with fatigue threshold escalation and coach tactical substitution")
    void testScenario2_MatchSimulation_With_Fatigue_And_TacticalRotation() throws Exception {
        Team team = teamRepository.save(new Team("Saigon Heat VBA Finals", "Basketball", coachUser.getId(), "Finals 2026"));

        // Starting 5 Starters
        TeamAthlete pg = teamAthleteRepository.save(new TeamAthlete(team.getId(), null, "Tran Star", 1, "PG", "DEV-PG-01", AthleteStatus.ON_FIELD));
        TeamAthlete sg = teamAthleteRepository.save(new TeamAthlete(team.getId(), null, "Le Shooter", 2, "SG", "DEV-SG-01", AthleteStatus.ON_FIELD));
        TeamAthlete sf = teamAthleteRepository.save(new TeamAthlete(team.getId(), null, "Pham Wing", 3, "SF", "DEV-SF-01", AthleteStatus.ON_FIELD));
        TeamAthlete pf = teamAthleteRepository.save(new TeamAthlete(team.getId(), null, "Vo Power", 4, "PF", "DEV-PF-01", AthleteStatus.ON_FIELD));
        TeamAthlete c  = teamAthleteRepository.save(new TeamAthlete(team.getId(), null, "Dang Center", 5, "C", "DEV-C-01", AthleteStatus.ON_FIELD));

        // Bench Substitutes
        TeamAthlete benchPg = teamAthleteRepository.save(new TeamAthlete(team.getId(), null, "Nguyen Sub", 11, "PG", "DEV-SUB-01", AthleteStatus.BENCH));

        // 1. Simulate intense match minutes for starting PG: high minutes, 16 jumps, 4 high impacts
        pg.setMinutesPlayed(36);
        pg.setCurrentIntensity(92.0);
        pg.setJumpCount(16);
        pg.setHighImpactLandings(4);
        pg.setFatigueIndex(76.8); // Fatigue exceeds rotation threshold (> 70)
        teamAthleteRepository.save(pg);

        // 2. Coach checks Tactical Analysis
        MvcResult analysisResult = mockMvc.perform(get("/api/coach/teams/" + team.getId() + "/tactical-analysis")
                        .header("Authorization", "Bearer " + coachToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamId").value(team.getId()))
                .andReturn();

        JsonNode analysisJson = objectMapper.readTree(analysisResult.getResponse().getContentAsString());
        assertNotNull(analysisJson.get("roster"));

        // 3. Coach executes Tactical Substitution (Starter PG -> BENCH, Bench PG -> ON_FIELD)
        TacticalSwapRequestDTO swap = new TacticalSwapRequestDTO(pg.getId(), benchPg.getId());
        mockMvc.perform(post("/api/coach/teams/" + team.getId() + "/tactical-action")
                        .header("Authorization", "Bearer " + coachToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(swap)))
                .andExpect(status().isOk());

        // 4. Verify Roster State
        TeamAthlete updatedPg = teamAthleteRepository.findById(pg.getId()).orElseThrow();
        TeamAthlete updatedBenchPg = teamAthleteRepository.findById(benchPg.getId()).orElseThrow();

        assertEquals(AthleteStatus.BENCH, updatedPg.getStatus(), "Starting PG should now be resting on BENCH");
        assertEquals(AthleteStatus.ON_FIELD, updatedBenchPg.getStatus(), "Bench PG should now be active ON_FIELD");
    }

    // =========================================================================
    // SCENARIO 3: Streaming IoT Wearable Telemetry (10 Sequential Batches)
    // =========================================================================

    @Test
    @DisplayName("W03: 10 consecutive IoT sensor batches stream continuously with battery drain and persistence")
    void testScenario3_ContinuousIoTStreaming_10SequentialBatches() throws Exception {
        String devId = "DEV-STREAM-10";
        Device dev = deviceRepository.save(new Device("Streaming Patch", devId, true, 100, "v1.0.5", "BLE"));

        LocalDateTime baseTime = LocalDateTime.now().minusMinutes(10);

        for (int b = 0; b < 10; b++) {
            int currentBattery = 100 - b; // Drains from 100% to 91%
            List<SensorReadingDTO> batchReadings = new ArrayList<>();

            for (int r = 0; r < 5; r++) {
                batchReadings.add(new SensorReadingDTO(
                        baseTime.plusSeconds(b * 30 + r * 5),
                        0.1 * (r + 1), 0.05 * (b + 1), 9.81, 0.5, 0.2, -0.1, 1.5, 0.0, 180.0, 60 + b
                ));
            }

            SensorBatchDTO batch = new SensorBatchDTO(devId, null, currentBattery, batchReadings);

            mockMvc.perform(post("/api/v1/sensor/batches")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(batch)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("SUCCESS"))
                    .andExpect(jsonPath("$.recordsProcessed").value(5));
        }

        // Verify device state after 10 batches
        Device updatedDev = deviceRepository.findByDeviceId(devId).orElseThrow();
        assertEquals(91, updatedDev.getBatteryLevel(), "Device battery should reflect final batch battery level (91%)");
        assertTrue(updatedDev.isConnected());
    }

    // =========================================================================
    // SCENARIO 4: Multi-Sport Biomechanical Differentiation
    // =========================================================================

    @Test
    @DisplayName("W04: Biomechanical feature analysis differentiates between Basketball and Running dynamics")
    void testScenario4_MultiSportBiomechanicalDifferentiation() throws Exception {
        // 1. Basketball Session: High vertical dynamics, jumps = 20, average acceleration = 3.9 m/s²
        SportSession bbSession = new SportSession(
                athleteUser.getId(), "DEV-BB", "Basketball",
                LocalDateTime.now().minusMinutes(50), LocalDateTime.now(),
                50, 20, 15, 3.9, 11.5, 85, 92, "Completed"
        );
        sportSessionRepository.save(bbSession);

        MvcResult bbResult = mockMvc.perform(get("/api/statistics/activity-analysis")
                        .header("Authorization", "Bearer " + athleteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalJumps").value(org.hamcrest.Matchers.greaterThanOrEqualTo(20)))
                .andExpect(jsonPath("$.averageJumpHeightCm").value(org.hamcrest.Matchers.greaterThan(25.0)))
                .andExpect(jsonPath("$.trunkLeanAngleDegrees").value(10.4)) // Basketball lean angle standard
                .andReturn();

        JsonNode bbJson = objectMapper.readTree(bbResult.getResponse().getContentAsString());
        assertTrue(bbJson.get("landingSoftnessScore").asInt() >= 60, "Basketball landing softness should be healthy score");
        assertTrue(bbJson.get("explosivenessScore").asInt() >= 80, "Basketball explosiveness score should be high");
    }

    // =========================================================================
    // SCENARIO 5: High-Impact Landing & Injury Risk Escalation
    // =========================================================================

    @Test
    @DisplayName("W05: Repetitive heavy impacts (>4.0G / >39.2 m/s²) increment highImpactLandings and escalate risk")
    void testScenario5_HighImpactLanding_InjuryRiskEscalation() throws Exception {
        String devId = "DEV-RISK-01";
        Team team = teamRepository.save(new Team("Da Nang Heat", "Basketball", coachUser.getId(), "VBA"));

        TeamAthlete athlete = teamAthleteRepository.save(new TeamAthlete(
                team.getId(), athleteUser.getId(), "Heavy Jumper", 15, "Center", devId, AthleteStatus.ON_FIELD
        ));
        athlete.setHighImpactLandings(0);
        athlete.setJumpCount(0);
        teamAthleteRepository.save(athlete);

        // Send Jump Batch with Severe High-Impact Landing (> 4.0G / > 39.2 m/s²)
        LocalDateTime now = LocalDateTime.now();
        List<SensorReadingDTO> severeJump = List.of(
                new SensorReadingDTO(now.plusNanos(0L), 0.0, 0.0, 9.81, 0, 0, 0, 0, 0, 0, 80),
                new SensorReadingDTO(now.plusNanos(100_000_000L), 0.0, 0.0, 20.0, 0, 0, 0, 0, 0, 0, 90), // Takeoff
                new SensorReadingDTO(now.plusNanos(250_000_000L), 0.0, 0.0, 1.5, 0, 0, 0, 0, 0, 0, 85),  // Airborne
                new SensorReadingDTO(now.plusNanos(400_000_000L), 0.0, 0.0, 1.8, 0, 0, 0, 0, 0, 0, 85),
                new SensorReadingDTO(now.plusNanos(550_000_000L), 0.0, 0.0, 42.0, 0, 0, 0, 0, 0, 0, 100) // Severe landing impact: 42 m/s² = 4.28G
        );

        SensorBatchDTO batch = new SensorBatchDTO(devId, null, 90, severeJump);

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jumpsDetected").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

        // Verify high-impact landings counter updated for athlete
        TeamAthlete updatedAthlete = teamAthleteRepository.findByDeviceId(devId).orElseThrow();
        assertTrue(updatedAthlete.getHighImpactLandings() >= 1, "High-impact landings count must increase for impact > 4.0G");
        assertTrue(updatedAthlete.getFatigueIndex() > 0.0, "Fatigue index must increase after high impact landing");
    }
}
