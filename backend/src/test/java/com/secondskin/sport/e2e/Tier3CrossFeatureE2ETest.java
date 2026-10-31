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
 * Tier 3: Cross-Feature Interactions E2E Test Suite
 * Validates complex pairwise and multi-stage interactions between system subsystems:
 * 1. Sensor Ingest -> Jump Detection FSM -> Coach Telemetry -> Athlete Fatigue Recalculation
 * 2. Session Lifecycle -> Batch Ingestion with SessionId -> Session Sensor Data Aggregation
 * 3. Device Connection -> Batch Telemetry -> Real-time Sensor Status View
 * 4. Match Fatigue Accumulation -> Tactical Analysis -> Coach Tactical Player Swap
 * 5. Auto-Session Generation -> Global Statistics Overview Aggregation
 * 6. Session Kinematics -> Patent Biomechanical Feature Extraction & Activity Analysis
 */
@SpringBootTest
@AutoConfigureMockMvc
public class Tier3CrossFeatureE2ETest {

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

        coachUser = new User("Coach Cross", "cross_coach_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Secret123!"), Role.COACH, "Basketball");
        userRepository.save(coachUser);
        coachToken = jwtService.generateToken(coachUser);

        athleteUser = new User("Athlete Cross", "cross_athlete_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Secret123!"), Role.USER, "Basketball");
        userRepository.save(athleteUser);
        athleteToken = jwtService.generateToken(athleteUser);
    }

    // =========================================================================
    // FLOW 1: Ingest -> Jump Detection -> Coach Telemetry & Fatigue Recalculation
    // =========================================================================

    @Test
    @DisplayName("C01: Sensor batch jump triggers athlete jump count and fatigue recalculation")
    void test01_SensorIngest_To_JumpDetection_To_CoachFatigueUpdate() throws Exception {
        String devId = "DEV-FLOW-JUMP-" + UUID.randomUUID().toString().substring(0, 6);

        // 1. Create Squad and register Athlete with this deviceId
        Team team = teamRepository.save(new Team("Saigon Heat Main", "Basketball", coachUser.getId(), "VBA 2026"));
        TeamAthlete athlete = new TeamAthlete(
                team.getId(), athleteUser.getId(), "Nguyen Tran", 10, "Small Forward", devId, AthleteStatus.ON_FIELD
        );
        athlete.setCurrentIntensity(20.0);
        athlete.setMinutesPlayed(5);
        athlete.setJumpCount(0);
        athlete.setHighImpactLandings(0);
        teamAthleteRepository.save(athlete);

        // 2. Prepare Jump Telemetry Sequence (Takeoff -> Airborne 300ms -> Impact 26 m/s²)
        LocalDateTime now = LocalDateTime.now();
        List<SensorReadingDTO> jumpBatch = List.of(
                new SensorReadingDTO(now.plusNanos(0L), 0.0, 0.0, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60),
                new SensorReadingDTO(now.plusNanos(100_000_000L), 0.0, 0.0, 19.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 80),
                new SensorReadingDTO(now.plusNanos(200_000_000L), 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 75),
                new SensorReadingDTO(now.plusNanos(350_000_000L), 0.0, 0.0, 1.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 75),
                new SensorReadingDTO(now.plusNanos(480_000_000L), 0.0, 0.0, 2.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 75),
                new SensorReadingDTO(now.plusNanos(550_000_000L), 0.0, 0.0, 26.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 90)
        );

        SensorBatchDTO batchDTO = new SensorBatchDTO(devId, null, 92, jumpBatch);

        // 3. Post Sensor Batch
        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.jumpsDetected").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));

        // 4. Verify athlete telemetry was updated by CoachService
        TeamAthlete updatedAthlete = teamAthleteRepository.findByDeviceId(devId).orElseThrow();
        assertTrue(updatedAthlete.getJumpCount() >= 1, "Athlete jump count must increase by at least 1");
        assertNotNull(updatedAthlete.getLastTelemetryTime(), "Last telemetry timestamp must be updated");
        assertTrue(updatedAthlete.getFatigueIndex() > 0.0, "Athlete fatigue index must be recalculated");
    }

    // =========================================================================
    // FLOW 2: Session Lifecycle -> Batch with SessionId -> Session Sensor Data
    // =========================================================================

    @Test
    @DisplayName("C02: Sensor readings ingested with sessionId are accurately retrievable via session data endpoint")
    void test02_SessionCreation_BatchIngest_SessionSensorDataRetrieval() throws Exception {
        // 1. Create a Sport Session
        SportSession session = new SportSession(
                athleteUser.getId(), "DEV-SES-01", "Basketball",
                LocalDateTime.now().minusMinutes(20), LocalDateTime.now(),
                20, 0, 0, 2.5, 9.0, 65, 80, "In Progress"
        );
        SportSession savedSession = sportSessionRepository.save(session);
        Long sessionId = savedSession.getId();

        // 2. Ingest Batch with that sessionId
        LocalDateTime now = LocalDateTime.now();
        List<SensorReadingDTO> readings = List.of(
                new SensorReadingDTO(now.plusNanos(0L), 0.1, 0.2, 9.81, 1.0, 0.0, 0.0, 2.0, 0.0, 180.0, 50),
                new SensorReadingDTO(now.plusNanos(100_000_000L), 0.3, 0.1, 9.85, 1.2, 0.1, 0.0, 2.1, 0.1, 180.0, 52),
                new SensorReadingDTO(now.plusNanos(200_000_000L), 0.2, 0.3, 9.80, 0.9, -0.1, 0.0, 1.9, -0.1, 180.0, 51)
        );

        SensorBatchDTO batchDTO = new SensorBatchDTO("DEV-SES-01", sessionId, 88, readings);

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batchDTO)))
                .andExpect(status().isOk());

        // 3. Query Session Sensor Data: GET /api/sessions/{id}/sensor-data
        MvcResult result = mockMvc.perform(get("/api/sessions/" + sessionId + "/sensor-data")
                        .header("Authorization", "Bearer " + athleteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(jsonNode.size() >= 3, "Must return at least 3 sensor readings for this session");
        assertEquals("DEV-SES-01", jsonNode.get(0).get("deviceId").asText());
    }

    // =========================================================================
    // FLOW 3: Device Connection -> Batch Telemetry -> Sensor Status View
    // =========================================================================

    @Test
    @DisplayName("C03: Connected device receiving telemetry reflects latest readings in /api/devices/status")
    void test03_DeviceConnection_BatchTelemetry_StatusReflection() throws Exception {
        String devId = "DEV-CONNECT-SYNC";
        Device dev = deviceRepository.save(new Device("Sync Patch", devId, false, 50, "v1.2", "BLE"));

        // 1. Connect Device via REST
        mockMvc.perform(post("/api/devices/" + dev.getId() + "/connect")
                        .header("Authorization", "Bearer " + athleteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connected").value(true));

        // 2. Ingest sensor batch with battery level 96
        SensorReadingDTO reading = new SensorReadingDTO(LocalDateTime.now(), 0.0, 0.0, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 70);
        SensorBatchDTO batch = new SensorBatchDTO(devId, null, 96, List.of(reading));

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk());

        // 3. Check /api/devices/status
        mockMvc.perform(get("/api/devices/status")
                        .header("Authorization", "Bearer " + athleteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batteryLevel").isNumber());
    }

    // =========================================================================
    // FLOW 4: Match Fatigue -> Tactical Analysis -> Tactical Player Swap
    // =========================================================================

    @Test
    @DisplayName("C04: Live athlete fatigue accumulation allows Coach to execute Tactical Swap")
    void test04_CoachTacticalEvaluation_And_PlayerSubstitution() throws Exception {
        Team team = teamRepository.save(new Team("Hanoi Buffaloes Pro", "Basketball", coachUser.getId(), "VBA"));

        // Athlete 1: Starter playing heavy minutes
        TeamAthlete starter = teamAthleteRepository.save(new TeamAthlete(
                team.getId(), null, "Le Bronze", 23, "Power Forward", "DEV-LEBRON", AthleteStatus.ON_FIELD
        ));
        starter.setMinutesPlayed(34);
        starter.setCurrentIntensity(88.0);
        starter.setJumpCount(18);
        starter.setHighImpactLandings(6);
        starter.setFatigueIndex(78.5); // Elevated fatigue
        teamAthleteRepository.save(starter);

        // Athlete 2: Bench substitute fresh
        TeamAthlete bench = teamAthleteRepository.save(new TeamAthlete(
                team.getId(), null, "Kyle Kuzma", 0, "Power Forward", "DEV-KUZMA", AthleteStatus.BENCH
        ));
        bench.setMinutesPlayed(8);
        bench.setCurrentIntensity(25.0);
        bench.setFatigueIndex(15.0);
        teamAthleteRepository.save(bench);

        // 1. Query Coach Tactical Analysis
        mockMvc.perform(get("/api/coach/teams/" + team.getId() + "/tactical-analysis")
                        .header("Authorization", "Bearer " + coachToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.teamId").value(team.getId()))
                .andExpect(jsonPath("$.roster").isArray());

        // 2. Coach executes Tactical Swap (Starter -> BENCH, Bench -> ON_FIELD)
        TacticalSwapRequestDTO swapReq = new TacticalSwapRequestDTO(starter.getId(), bench.getId());

        mockMvc.perform(post("/api/coach/teams/" + team.getId() + "/tactical-action")
                        .header("Authorization", "Bearer " + coachToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(swapReq)))
                .andExpect(status().isOk());

        // 3. Verify Roster reflects state change
        TeamAthlete updatedStarter = teamAthleteRepository.findById(starter.getId()).orElseThrow();
        TeamAthlete updatedBench = teamAthleteRepository.findById(bench.getId()).orElseThrow();

        assertEquals(AthleteStatus.BENCH, updatedStarter.getStatus(), "Starter should now be on the BENCH");
        assertEquals(AthleteStatus.ON_FIELD, updatedBench.getStatus(), "Substitute should now be ON_FIELD");
    }

    // =========================================================================
    // FLOW 5: Auto-Session Creation -> Overview Statistics Aggregation
    // =========================================================================

    @Test
    @DisplayName("C05: AutoSession created from IoT telemetry aggregates into Overview Statistics")
    void test05_AutoSessionCreation_And_OverviewStatsAggregation() throws Exception {
        AutoSessionDTO autoDTO = new AutoSessionDTO();
        autoDTO.setUserId(athleteUser.getId());
        autoDTO.setDeviceId("ESP32-AUTO-01");
        autoDTO.setSport("Basketball");
        autoDTO.setStartTime(LocalDateTime.now().minusMinutes(35));
        autoDTO.setEndTime(LocalDateTime.now());
        autoDTO.setDurationMinutes(35);
        autoDTO.setTotalJumps(15);
        autoDTO.setDirectionChanges(10);
        autoDTO.setAverageAcceleration(3.6);
        autoDTO.setAverageSpeed(11.5);
        autoDTO.setMovementIntensity(80);
        autoDTO.setPerformanceScore(86);
        autoDTO.setStatus("Completed");

        // 1. Post Auto-Session: POST /api/sessions/auto (public IoT endpoint)
        mockMvc.perform(post("/api/sessions/auto")
                        .header("Authorization", "Bearer " + athleteToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(autoDTO)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.sport").value("Basketball"));

        // 2. Query Statistics Overview
        mockMvc.perform(get("/api/statistics/overview")
                        .header("Authorization", "Bearer " + athleteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSessions").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.totalJumps").value(org.hamcrest.Matchers.greaterThanOrEqualTo(15)))
                .andExpect(jsonPath("$.averageAcceleration").isNumber());
    }

    // =========================================================================
    // FLOW 6: Session Kinematics -> Biomechanical Activity Analysis
    // =========================================================================

    @Test
    @DisplayName("C06: Ingested session data populates Activity Analysis with patent DSP kinematic metrics")
    void test06_SessionKinematics_PopulatesActivityAnalysis() throws Exception {
        SportSession session = new SportSession(
                athleteUser.getId(), "DEV-DSP-01", "Basketball",
                LocalDateTime.now().minusMinutes(40), LocalDateTime.now(),
                40, 22, 14, 3.8, 12.0, 85, 90, "Completed"
        );
        sportSessionRepository.save(session);

        mockMvc.perform(get("/api/statistics/activity-analysis")
                        .header("Authorization", "Bearer " + athleteToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalJumps").value(org.hamcrest.Matchers.greaterThanOrEqualTo(22)))
                .andExpect(jsonPath("$.peakImpactG").value(org.hamcrest.Matchers.greaterThan(0.0)))
                .andExpect(jsonPath("$.landingSoftnessScore").isNumber())
                .andExpect(jsonPath("$.explosivenessScore").isNumber())
                .andExpect(jsonPath("$.bilateralSymmetryPercentage").isNumber())
                .andExpect(jsonPath("$.trunkStabilityScore").isNumber());
    }
}
