package com.secondskin.sport.e2e;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.SensorBatchDTO;
import com.secondskin.sport.dto.SensorReadingDTO;
import com.secondskin.sport.entity.Device;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.Team;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.repository.DeviceRepository;
import com.secondskin.sport.repository.TeamRepository;
import com.secondskin.sport.repository.UserRepository;
import com.secondskin.sport.security.JwtService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.security.Key;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tier 2: Boundary & Corner Cases E2E Test Suite
 * Validates edge conditions, boundary limits, and error scenarios:
 * - Empty & null batches
 * - Kinematic hang time boundaries (<180ms quick step vs >850ms extreme hang time)
 * - Extreme accelerations (positive/negative/zero)
 * - High-load batch stress (150+ telemetry readings)
 * - Security edge cases: missing Bearer, malformed tokens, expired tokens
 * - Battery boundaries (0%, 100%, out-of-bound clamping)
 * - Non-existent resource queries (HTTP 404 behavior)
 */
@SpringBootTest
@AutoConfigureMockMvc
public class Tier2BoundaryCornerE2ETest {

    private static final String SECRET_KEY = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

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
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private User testCoach;
    private String userToken;
    private String coachToken;

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        testUser = new User("Boundary User", "bound_user_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Secret123!"), Role.USER, "Basketball");
        userRepository.save(testUser);
        userToken = jwtService.generateToken(testUser);

        testCoach = new User("Boundary Coach", "bound_coach_" + suffix + "@secondskin.io",
                passwordEncoder.encode("Secret123!"), Role.COACH, "Basketball");
        userRepository.save(testCoach);
        coachToken = jwtService.generateToken(testCoach);
    }

    // =========================================================================
    // 1. EMPTY & NULL BATCHES
    // =========================================================================

    @Test
    @DisplayName("B01: Ingestion of empty readings array returns EMPTY status and 0 records")
    void test01_EmptyBatchPayload_ReturnsEmptyStatus() throws Exception {
        SensorBatchDTO emptyBatch = new SensorBatchDTO("DEV-EMPTY-01", null, 80, Collections.emptyList());

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyBatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EMPTY"))
                .andExpect(jsonPath("$.recordsProcessed").value(0))
                .andExpect(jsonPath("$.message").value("No sensor readings in batch"));
    }

    @Test
    @DisplayName("B02: Ingestion with null readings returns EMPTY status safely")
    void test02_NullReadingsList_ReturnsEmptyStatus() throws Exception {
        SensorBatchDTO nullBatch = new SensorBatchDTO("DEV-NULL-01", null, 80, null);
        nullBatch.setReadings(null);

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(nullBatch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EMPTY"))
                .andExpect(jsonPath("$.recordsProcessed").value(0));
    }

    // =========================================================================
    // 2. KINEMATIC BOUNDARY CASES (AIRTIME THRESHOLDS)
    // =========================================================================

    @Test
    @DisplayName("B03: Zero airtime quick impulse (<180ms) does not register as jump")
    void test03_ZeroAirtime_QuickImpulse_DoesNotRegisterJump() throws Exception {
        String devId = "DEV-AIRTIME-QUICK";
        LocalDateTime now = LocalDateTime.now();

        // Impulse with only 50ms between takeoff and landing (< 180ms MIN_JUMP_AIRTIME_MS)
        List<SensorReadingDTO> sequence = List.of(
                new SensorReadingDTO(now.plusNanos(0L), 0.0, 0.0, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 50),
                new SensorReadingDTO(now.plusNanos(20_000_000L), 0.0, 0.0, 18.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 70), // Takeoff
                new SensorReadingDTO(now.plusNanos(50_000_000L), 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60),  // Airborne
                new SensorReadingDTO(now.plusNanos(70_000_000L), 0.0, 0.0, 24.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 80)  // Landing at 50ms
        );

        SensorBatchDTO batch = new SensorBatchDTO(devId, null, 90, sequence);

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jumpsDetected").value(0));
    }

    @Test
    @DisplayName("B04: Excessive hang time (>850ms) times out to ground without registering jump")
    void test04_ExcessiveHangTime_OverHumanLimit_DoesNotRegisterJump() throws Exception {
        String devId = "DEV-AIRTIME-EXCESS";
        LocalDateTime now = LocalDateTime.now();

        // Simulated sensor inverted on a table or in free-fall box for > 850ms
        List<SensorReadingDTO> sequence = List.of(
                new SensorReadingDTO(now.plusNanos(0L), 0.0, 0.0, 9.81, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 50),
                new SensorReadingDTO(now.plusNanos(100_000_000L), 0.0, 0.0, 18.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 70),
                new SensorReadingDTO(now.plusNanos(200_000_000L), 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60),
                new SensorReadingDTO(now.plusNanos(1_200_000_000L), 0.0, 0.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 60), // > 850ms airtime
                new SensorReadingDTO(now.plusNanos(1_300_000_000L), 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 80)
        );

        SensorBatchDTO batch = new SensorBatchDTO(devId, null, 90, sequence);

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jumpsDetected").value(0));
    }

    // =========================================================================
    // 3. EXTREME ACCELERATIONS & STRESS
    // =========================================================================

    @Test
    @DisplayName("B05: Extreme acceleration values (+/-150 m/s²) are processed safely without crashing")
    void test05_ExtremeAccelerationMagnitude_ProcessedSafely() throws Exception {
        SensorReadingDTO extremeReading = new SensorReadingDTO(
                LocalDateTime.now(), 150.0, -150.0, 180.0, 500.0, -450.0, 300.0, 45.0, -30.0, 90.0, 100
        );
        SensorBatchDTO batch = new SensorBatchDTO("DEV-EXTREME-01", null, 90, List.of(extremeReading));

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.recordsProcessed").value(1));
    }

    @Test
    @DisplayName("B06: Complete zero kinematic inputs (0.0 m/s², 0.0 °/s) are handled without NaN errors")
    void test06_ZeroAcceleration_ProcessedSafelyWithoutArithmeticException() throws Exception {
        SensorReadingDTO zeroReading = new SensorReadingDTO(
                LocalDateTime.now(), 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0
        );
        SensorBatchDTO batch = new SensorBatchDTO("DEV-ZERO-01", null, 50, List.of(zeroReading));

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.recordsProcessed").value(1));
    }

    @Test
    @DisplayName("B07: High batch size stress (150 readings) executes without transaction failure")
    void test07_LargeBatchStress_Processes150ReadingsSuccessfully() throws Exception {
        List<SensorReadingDTO> largeList = new ArrayList<>();
        LocalDateTime baseTime = LocalDateTime.now();

        for (int i = 0; i < 150; i++) {
            largeList.add(new SensorReadingDTO(
                    baseTime.plusNanos(i * 50_000_000L),
                    0.05 * (i % 10), 0.02 * (i % 10), 9.81, 0.1, -0.1, 0.0, 1.0, 0.0, 180.0, 50 + (i % 30)
            ));
        }

        SensorBatchDTO batch = new SensorBatchDTO("DEV-STRESS-150", null, 85, largeList);

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.recordsProcessed").value(150));
    }

    // =========================================================================
    // 4. SECURITY HEADER CORNER CASES
    // =========================================================================

    @Test
    @DisplayName("B08: Authorization header missing 'Bearer ' prefix returns 403 Forbidden")
    void test08_MissingBearerPrefixInAuthHeader_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/sessions")
                        .header("Authorization", userToken)) // No "Bearer " prefix
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("B09: Malformed JWT token returns 403 Forbidden")
    void test09_MalformedJwtToken_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/sessions")
                        .header("Authorization", "Bearer this.is.an.invalid.and.malformed.jwt.token"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("B10: Empty string Authorization header returns 403 Forbidden")
    void test10_EmptyAuthHeader_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/sessions")
                        .header("Authorization", ""))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("B11: Expired JWT token returns 403 Forbidden")
    void test11_ExpiredJwtToken_ReturnsForbidden() throws Exception {
        String expiredToken = createExpiredToken(testUser);

        mockMvc.perform(get("/api/sessions")
                        .header("Authorization", "Bearer " + expiredToken))
                .andExpect(status().isForbidden());
    }

    // =========================================================================
    // 5. BATTERY VALUE BOUNDARIES
    // =========================================================================

    @Test
    @DisplayName("B12: Device battery updates to exact boundary values (0% and 100%) successfully")
    void test12_BatteryLevelBoundary_ZeroAndOneHundredPercent() throws Exception {
        Device dev = deviceRepository.save(new Device("Battery Edge Patch", "DEV-BATT-01", true, 50, "v1.0", "BLE"));

        // 1. Minimum bound: 0%
        mockMvc.perform(put("/api/devices/" + dev.getId() + "/battery")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("batteryLevel", 0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batteryLevel").value(0));

        // 2. Maximum bound: 100%
        mockMvc.perform(put("/api/devices/" + dev.getId() + "/battery")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("batteryLevel", 100))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batteryLevel").value(100));
    }

    @Test
    @DisplayName("B13: Sensor batch with over-100% battery clamps to 100% in database")
    void test13_BatteryLevelBoundary_ClampedOnBatchIngest() throws Exception {
        String devId = "DEV-BATT-CLAMP";
        Device dev = deviceRepository.save(new Device("Clamp Patch", devId, true, 80, "v1.0", "BLE"));

        SensorReadingDTO reading = new SensorReadingDTO(LocalDateTime.now(), 0, 0, 9.81, 0, 0, 0, 0, 0, 0, 50);
        SensorBatchDTO batch = new SensorBatchDTO(devId, null, 150, List.of(reading)); // 150% battery

        mockMvc.perform(post("/api/v1/sensor/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(batch)))
                .andExpect(status().isOk());

        Device reloaded = deviceRepository.findByDeviceId(devId).orElseThrow();
        assertEquals(100, reloaded.getBatteryLevel(), "Battery > 100% must be clamped to 100%");
    }

    // =========================================================================
    // 6. NON-EXISTENT RESOURCE INQUIRIES (HTTP 404)
    // =========================================================================

    @Test
    @DisplayName("B14: Query non-existent sport session ID returns 404 Not Found")
    void test14_NonExistentSessionId_Returns404NotFound() throws Exception {
        mockMvc.perform(get("/api/sessions/999999999")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("B15: Query non-existent device ID returns 404 Not Found")
    void test15_NonExistentDeviceId_Returns404NotFound() throws Exception {
        mockMvc.perform(get("/api/devices/999999999")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("B16: Query non-existent team ID returns 404 Not Found")
    void test16_NonExistentTeamId_Returns404NotFound() throws Exception {
        mockMvc.perform(get("/api/coach/teams/999999999")
                        .header("Authorization", "Bearer " + coachToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("B17: Deleting non-existent athlete from squad returns 404 Not Found")
    void test17_RemoveNonExistentAthleteFromSquad_Returns404NotFound() throws Exception {
        Team team = teamRepository.save(new Team("Hanoi Stars", "Basketball", testCoach.getId(), "VBA"));

        mockMvc.perform(delete("/api/coach/teams/" + team.getId() + "/athletes/999999999")
                        .header("Authorization", "Bearer " + coachToken))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // HELPER: Expired JWT Generator
    // =========================================================================

    private String createExpiredToken(User user) {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET_KEY);
        Key key = Keys.hmacShaKeyFor(keyBytes);
        long nowMs = System.currentTimeMillis();

        return Jwts.builder()
                .setSubject(user.getUsername())
                .setIssuedAt(new Date(nowMs - 7_200_000L))       // 2 hours ago
                .setExpiration(new Date(nowMs - 3_600_000L))   // Expired 1 hour ago
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }
}
