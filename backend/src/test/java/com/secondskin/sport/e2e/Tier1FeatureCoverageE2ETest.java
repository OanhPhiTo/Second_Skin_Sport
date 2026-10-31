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
 * Tier 1: Feature Coverage E2E Test Suite
 * Minimum 5 test cases per core feature domain:
 * 1. Authentication (login / register / refresh)
 * 2. Sensor Batch Ingestion (single / multi / device sync / jump detection)
 * 3. Sport Session CRUD (create / read / filter / update / delete)
 * 4. Coach Squad Roster (create team / list teams / add athlete / update status / remove athlete)
 * 5. Device Status (list / get by id / sensor status / connect-disconnect / update battery)
 */
@SpringBootTest
@AutoConfigureMockMvc
public class Tier1FeatureCoverageE2ETest {

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

    private User testUser;
    private User testCoach;
    private String userToken;
    private String coachToken;

    @BeforeEach
    void setUp() {
        String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);

        testUser = new User(
                "Athlete " + uniqueSuffix,
                "athlete_" + uniqueSuffix + "@secondskin.io",
                passwordEncoder.encode("Secret123!"),
                Role.USER,
                "Basketball"
        );
        userRepository.save(testUser);
        userToken = jwtService.generateToken(testUser);

        testCoach = new User(
                "Coach " + uniqueSuffix,
                "coach_" + uniqueSuffix + "@secondskin.io",
                passwordEncoder.encode("Secret123!"),
                Role.COACH,
                "Basketball"
        );
        userRepository.save(testCoach);
        coachToken = jwtService.generateToken(testCoach);
    }

    // =========================================================================
    // FEATURE 1: Authentication & Authorization (5 Test Cases)
    // =========================================================================

    @Test
    @DisplayName("F1-01: User registration with valid data returns 200 OK and JWT token")
    void test01_RegisterNewUser_Success() throws Exception {
        String uniqueEmail = "reg_" + System.currentTimeMillis() + "@secondskin.io";
        RegisterRequest request = new RegisterRequest("New Athlete", uniqueEmail, "SecurePass123!", "Running");

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.email").value(uniqueEmail))
                .andReturn();

        String responseStr = result.getResponse().getContentAsString();
        AuthResponse authResponse = objectMapper.readValue(responseStr, AuthResponse.class);
        assertNotNull(authResponse.getToken());
    }

    @Test
    @DisplayName("F1-02: User registration with duplicate email fails with client/server error")
    void test02_RegisterDuplicateEmail_Fails() throws Exception {
        RegisterRequest duplicateRequest = new RegisterRequest("Duplicate User", testUser.getEmail(), "AnotherPass123!", "Tennis");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateRequest)))
                .andExpect(result -> assertTrue(result.getResponse().getStatus() >= 400,
                        "Duplicate registration must reject with HTTP >= 400"));
    }

    @Test
    @DisplayName("F1-03: Login with correct email and password returns 200 OK and token")
    void test03_Login_Success() throws Exception {
        AuthRequest loginRequest = new AuthRequest(testUser.getEmail(), "Secret123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(testUser.getEmail()));
    }

    @Test
    @DisplayName("F1-04: Login with incorrect password returns 401/403 forbidden")
    void test04_Login_WrongPassword_Fails() throws Exception {
        AuthRequest badLogin = new AuthRequest(testUser.getEmail(), "WrongPassword999!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(result -> assertTrue(
                        result.getResponse().getStatus() == 401 || result.getResponse().getStatus() == 403,
                        "Bad credentials must return 401 or 403"));
    }

    @Test
    @DisplayName("F1-05: Refresh token exchange produces a new valid access token")
    void test05_RefreshToken_Success() throws Exception {
        String refreshToken = jwtService.generateRefreshToken(testUser);

        mockMvc.perform(post("/api/auth/refresh")
                        .header("Authorization", "Bearer " + refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value(testUser.getEmail()));
    }

    // =========================================================================
    // FEATURE 2: Sensor Batch Ingestion (5 Test Cases)
    // =========================================================================

    @Test
    @DisplayName("F2-01: Ingestion of a single telemetry reading returns SUCCESS status")
    void test06_SensorBatch_SingleReading_Success() throws Exception {
        SensorReadingDTO reading = new SensorReadingDTO(
                LocalDateTime.now(), 0.15, -0.05, 9.81, 1.2, -0.5, 0.1, 4.0, -1.0, 180.0, 55
        );
        SensorBatchDTO batch = new SensorBatchDTO("ESP32-DEV-T1-1", null, 95, List.of(reading));

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.recordsProcessed").value(1));
    }

    @Test
    @DisplayName("F2-02: Ingestion of multiple telemetry points records all readings accurately")
    void test07_SensorBatch_MultipleReadings_Success() throws Exception {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now();
        for (int i = 0; i < 5; i++) {
            readings.add(new SensorReadingDTO(
                    baseTime.plusNanos(i * 100_000_000L),
                    0.2 * i, 0.1 * i, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 40 + i
            ));
        }
        SensorBatchDTO batch = new SensorBatchDTO("ESP32-DEV-T1-2", null, 90, readings);

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.recordsProcessed").value(5));
    }

    @Test
    @DisplayName("F2-03: Batch with specific device updates device lastSync and battery level")
    void test08_SensorBatch_UpdatesRegisteredDeviceLastSyncAndBattery() throws Exception {
        String devId = "ESP32-SYNC-01";
        Device dev = new Device("Wearable Patch", devId, false, 40, "v1.0.0", "BLE");
        deviceRepository.save(dev);

        SensorReadingDTO reading = new SensorReadingDTO(
                LocalDateTime.now(), 0.0, 0.0, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 50
        );
        SensorBatchDTO batch = new SensorBatchDTO(devId, null, 88, List.of(reading));

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"));

        Device updatedDev = deviceRepository.findByDeviceId(devId).orElseThrow();
        assertEquals(88, updatedDev.getBatteryLevel());
        assertTrue(updatedDev.isConnected());
        assertNotNull(updatedDev.getLastSync());
    }

    @Test
    @DisplayName("F2-04: Batch without deviceId gracefully defaults to ESP32-SUPERMINI-01")
    void test09_SensorBatch_WithoutDeviceId_UsesDefaultDevice() throws Exception {
        SensorReadingDTO reading = new SensorReadingDTO(
                LocalDateTime.now(), 0.1, 0.1, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 30
        );
        SensorBatchDTO batch = new SensorBatchDTO(null, null, 75, List.of(reading));

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("ESP32-SUPERMINI-01")));
    }

    @Test
    @DisplayName("F2-05: Kinematic FSM detects jump when takeoff, freefall, and landing sequence is sent")
    void test10_SensorBatch_WithValidJumpTrajectory_DetectsJump() throws Exception {
        String devId = "ESP32-JUMP-01";
        LocalDateTime now = LocalDateTime.now();

        List<SensorReadingDTO> jumpSequence = List.of(
                // 1. Ground state (~9.81 m/s²)
                new SensorReadingDTO(now.plusNanos(0L), 0.0, 0.0, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 50),
                // 2. Takeoff impulse (> 16.5 m/s²)
                new SensorReadingDTO(now.plusNanos(100_000_000L), 0.0, 0.0, 18.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 70),
                // 3. Airborne freefall (< 6.5 m/s²) for ~300ms (>= 180ms threshold)
                new SensorReadingDTO(now.plusNanos(200_000_000L), 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60),
                new SensorReadingDTO(now.plusNanos(350_000_000L), 0.0, 0.0, 1.8, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60),
                new SensorReadingDTO(now.plusNanos(480_000_000L), 0.0, 0.0, 2.2, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60),
                // 4. Landing impact (> 20.0 m/s²)
                new SensorReadingDTO(now.plusNanos(550_000_000L), 0.0, 0.0, 24.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 85)
        );

        SensorBatchDTO batch = new SensorBatchDTO(devId, null, 90, jumpSequence);

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.jumpsDetected").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }

    // =========================================================================
    // FEATURE 3: Sport Session CRUD (5 Test Cases)
    // =========================================================================

    @Test
    @DisplayName("F3-01: Create a sport session returns 200 OK with created session payload")
    void test11_CreateSession_Success() throws Exception {
        SportSession session = new SportSession(
                testUser.getId(), "SSS-DEV-001", "Basketball",
                LocalDateTime.now().minusMinutes(45), LocalDateTime.now(),
                45, 14, 8, 3.4, 12.5, 82, 88, "Completed"
        );

        MvcResult result = mockMvc.perform(post("/api/sessions")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(session)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.sport").value("Basketball"))
                .andExpect(jsonPath("$.totalJumps").value(14))
                .andReturn();

        JsonNode jsonNode = objectMapper.readTree(result.getResponse().getContentAsString());
        assertNotNull(jsonNode.get("id").asLong());
    }

    @Test
    @DisplayName("F3-02: Retrieve sport session by ID returns 200 OK with matching record")
    void test12_GetSessionById_Success() throws Exception {
        SportSession session = new SportSession(
                testUser.getId(), "SSS-DEV-002", "Running",
                LocalDateTime.now().minusMinutes(30), LocalDateTime.now(),
                30, 2, 4, 2.1, 14.0, 75, 84, "Completed"
        );
        SportSession saved = sportSessionRepository.save(session);

        mockMvc.perform(get("/api/sessions/" + saved.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(saved.getId()))
                .andExpect(jsonPath("$.sport").value("Running"));
    }

    @Test
    @DisplayName("F3-03: Retrieve all sessions with sport filter returns only matched sessions")
    void test13_GetAllSessions_WithSportFilter() throws Exception {
        SportSession s1 = new SportSession(testUser.getId(), "DEV-1", "Basketball", LocalDateTime.now(), LocalDateTime.now(), 20, 5, 2, 2.0, 10.0, 60, 80, "Completed");
        SportSession s2 = new SportSession(testUser.getId(), "DEV-2", "Running", LocalDateTime.now(), LocalDateTime.now(), 30, 0, 1, 1.8, 12.0, 65, 82, "Completed");
        sportSessionRepository.saveAll(List.of(s1, s2));

        mockMvc.perform(get("/api/sessions?sport=Basketball")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.sport != 'Basketball')]").isEmpty());
    }

    @Test
    @DisplayName("F3-04: Update an existing sport session persists modified duration and status")
    void test14_UpdateSession_Success() throws Exception {
        SportSession session = new SportSession(testUser.getId(), "DEV-3", "Basketball", LocalDateTime.now(), LocalDateTime.now(), 15, 3, 1, 1.5, 8.0, 50, 70, "In Progress");
        SportSession saved = sportSessionRepository.save(session);

        saved.setDurationMinutes(60);
        saved.setStatus("Completed");
        saved.setTotalJumps(20);

        mockMvc.perform(put("/api/sessions/" + saved.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saved)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andExpect(jsonPath("$.status").value("Completed"))
                .andExpect(jsonPath("$.totalJumps").value(20));
    }

    @Test
    @DisplayName("F3-05: Delete a sport session returns 204 No Content and removes resource")
    void test15_DeleteSession_Success() throws Exception {
        SportSession session = new SportSession(testUser.getId(), "DEV-DEL", "Running", LocalDateTime.now(), LocalDateTime.now(), 10, 0, 0, 1.0, 5.0, 40, 60, "Completed");
        SportSession saved = sportSessionRepository.save(session);

        mockMvc.perform(delete("/api/sessions/" + saved.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/sessions/" + saved.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // FEATURE 4: Coach Squad Management (5 Test Cases)
    // =========================================================================

    @Test
    @DisplayName("F4-01: Coach creates a new squad team successfully with 201 Created")
    void test16_CoachCreateTeam_Success() throws Exception {
        TeamDTO newTeam = TeamDTO.builder()
                .name("Saigon Heat Youth")
                .sport("Basketball")
                .description("Youth Development League")
                .build();

        mockMvc.perform(post("/api/coach/teams")
                        .header("Authorization", "Bearer " + coachToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newTeam)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.name").value("Saigon Heat Youth"))
                .andExpect(jsonPath("$.sport").value("Basketball"));
    }

    @Test
    @DisplayName("F4-02: Coach queries teams list and receives teams managed by coach")
    void test17_CoachGetTeams_Success() throws Exception {
        Team team = new Team("Hanoi Buffaloes", "Basketball", testCoach.getId(), "VBA League");
        teamRepository.save(team);

        mockMvc.perform(get("/api/coach/teams")
                        .header("Authorization", "Bearer " + coachToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.name == 'Hanoi Buffaloes')]").isNotEmpty());
    }

    @Test
    @DisplayName("F4-03: Coach adds an athlete to the squad roster with 201 Created")
    void test18_CoachAddAthleteToRoster_Success() throws Exception {
        Team team = teamRepository.save(new Team("Da Nang Dragons", "Basketball", testCoach.getId(), "VBA"));

        AddAthleteRequestDTO athleteReq = AddAthleteRequestDTO.builder()
                .name("Nguyen Van A")
                .jerseyNumber(7)
                .position("Point Guard")
                .deviceId("DEV-ATH-007")
                .status(AthleteStatus.BENCH)
                .build();

        mockMvc.perform(post("/api/coach/teams/" + team.getId() + "/athletes")
                        .header("Authorization", "Bearer " + coachToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(athleteReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Nguyen Van A"))
                .andExpect(jsonPath("$.jerseyNumber").value(7))
                .andExpect(jsonPath("$.position").value("Point Guard"))
                .andExpect(jsonPath("$.status").value("BENCH"));
    }

    @Test
    @DisplayName("F4-04: Coach updates athlete status to ON_FIELD")
    void test19_CoachUpdateAthleteStatus_Success() throws Exception {
        Team team = teamRepository.save(new Team("Can Tho Catfish", "Basketball", testCoach.getId(), "VBA"));
        TeamAthlete athlete = teamAthleteRepository.save(new TeamAthlete(
                team.getId(), null, "Tran Van B", 12, "Shooting Guard", "DEV-ATH-012", AthleteStatus.BENCH
        ));

        mockMvc.perform(put("/api/coach/teams/" + team.getId() + "/athletes/" + athlete.getId() + "/status?status=ON_FIELD")
                        .header("Authorization", "Bearer " + coachToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ON_FIELD"));
    }

    @Test
    @DisplayName("F4-05: Coach removes athlete from squad returns 204 No Content")
    void test20_CoachRemoveAthleteFromRoster_Success() throws Exception {
        Team team = teamRepository.save(new Team("Nha Trang Dolphins", "Basketball", testCoach.getId(), "VBA"));
        TeamAthlete athlete = teamAthleteRepository.save(new TeamAthlete(
                team.getId(), null, "Le Van C", 30, "Center", "DEV-ATH-030", AthleteStatus.BENCH
        ));

        mockMvc.perform(delete("/api/coach/teams/" + team.getId() + "/athletes/" + athlete.getId())
                        .header("Authorization", "Bearer " + coachToken))
                .andExpect(status().isNoContent());

        assertTrue(teamAthleteRepository.findById(athlete.getId()).isEmpty());
    }

    // =========================================================================
    // FEATURE 5: Device Status & Telemetry (5 Test Cases)
    // =========================================================================

    @Test
    @DisplayName("F5-01: Query all devices returns 200 OK with registered hardware list")
    void test21_GetAllDevices_Success() throws Exception {
        Device d1 = new Device("Foot Patch Left", "DEV-P01", true, 92, "v1.0.1", "BLE");
        Device d2 = new Device("Foot Patch Right", "DEV-P02", true, 89, "v1.0.1", "BLE");
        deviceRepository.saveAll(List.of(d1, d2));

        mockMvc.perform(get("/api/devices")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[?(@.deviceId == 'DEV-P01')]").isNotEmpty());
    }

    @Test
    @DisplayName("F5-02: Query device by ID returns 200 OK with correct device record")
    void test22_GetDeviceById_Success() throws Exception {
        Device dev = deviceRepository.save(new Device("Waist Sensor", "DEV-W01", true, 96, "v1.0.2", "WiFi"));

        mockMvc.perform(get("/api/devices/" + dev.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(dev.getId()))
                .andExpect(jsonPath("$.deviceName").value("Waist Sensor"))
                .andExpect(jsonPath("$.batteryLevel").value(96));
    }

    @Test
    @DisplayName("F5-03: Query overall sensor status returns 200 OK with SensorStatusDTO")
    void test23_GetSensorStatus_Success() throws Exception {
        deviceRepository.save(new Device("Primary Patch", "DEV-STATUS-01", true, 85, "v1.0.0", "BLE"));

        mockMvc.perform(get("/api/devices/status")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deviceId").isNotEmpty())
                .andExpect(jsonPath("$.batteryLevel").isNumber());
    }

    @Test
    @DisplayName("F5-04: Connect and Disconnect device toggles connection state")
    void test24_ConnectAndDisconnectDevice_Success() throws Exception {
        Device dev = deviceRepository.save(new Device("Smart Shin Guard", "DEV-SHIN-01", false, 70, "v1.0.0", "BLE"));

        // 1. Connect
        mockMvc.perform(post("/api/devices/" + dev.getId() + "/connect")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connected").value(true));

        // 2. Disconnect
        mockMvc.perform(post("/api/devices/" + dev.getId() + "/disconnect")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.connected").value(false));
    }

    @Test
    @DisplayName("F5-05: Update device battery level returns 200 OK with updated level")
    void test25_UpdateDeviceBattery_Success() throws Exception {
        Device dev = deviceRepository.save(new Device("Smart Insole", "DEV-INSOLE-01", true, 60, "v1.0.0", "BLE"));

        mockMvc.perform(put("/api/devices/" + dev.getId() + "/battery")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(java.util.Map.of("batteryLevel", 78))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.batteryLevel").value(78));

        Device reloaded = deviceRepository.findById(dev.getId()).orElseThrow();
        assertEquals(78, reloaded.getBatteryLevel());
    }
}
