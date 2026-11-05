package com.secondskin.sport.service;

import com.secondskin.sport.dto.JumpEventDTO;
import com.secondskin.sport.dto.SensorReadingDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JumpDetectionService - QA Tests for Jump vs Walk vs Run Classification")
class JumpDetectionServiceTest {

    private JumpDetectionService jumpDetectionService;
    private final String DEVICE_ID = "ESP32-TEST-DEVICE";

    @BeforeEach
    void setUp() {
        jumpDetectionService = new JumpDetectionService(null);
        jumpDetectionService.resetDeviceState(DEVICE_ID);
    }

    @Test
    @DisplayName("Running Test: Repeated high-impact foot strikes without free-fall MUST classify as RUNNING")
    void testRunningDoesNotTriggerJumps() {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Simulate 20 running steps at ~170 SPM (cadence ~350ms between impacts)
        // In running: footstrike impact is 18 - 22 m/s², flight time is negligible (< 100ms)
        for (int i = 0; i < 20; i++) {
            LocalDateTime stepTime = now.plusNanos(i * 350_000_000L);

            // Stance / push-off (12 - 15 m/s²)
            readings.add(new SensorReadingDTO(stepTime, 2.0, 3.0, 14.0, 10.0, 5.0, 2.0, 0.0, 0.0, 0.0, 80));

            // Short swing phase (gravity ~9.8 m/s², NOT deep free-fall)
            readings.add(new SensorReadingDTO(stepTime.plusNanos(100_000_000L), 1.0, 1.0, 9.8, 5.0, 2.0, 1.0, 0.0, 0.0, 0.0, 75));

            // Foot strike impact shock (19 - 22 m/s²)
            readings.add(new SensorReadingDTO(stepTime.plusNanos(250_000_000L), 4.0, 5.0, 20.5, 20.0, 15.0, 8.0, 0.0, 0.0, 0.0, 90));
        }

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);
        JumpDetectionService.DeviceState state = jumpDetectionService.getDeviceState(DEVICE_ID);

        // VERIFY: 0 jumps detected, running steps counted, activity is RUNNING
        assertEquals(0, jumps.size(), "Running must NEVER be misclassified as jumps");
        assertEquals(0, state.totalJumps, "Total jumps must remain 0 during running");
        assertTrue(state.totalSteps > 0, "Running steps must be recognized");
        assertEquals("RUNNING", state.currentActivity, "Activity state should be classified as RUNNING");
    }

    @Test
    @DisplayName("Walking Test: Gentle foot contacts (11-13 m/s²) at ~600ms cadence MUST classify as WALKING")
    void testWalkingDoesNotTriggerJumps() {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Simulate 15 walking steps at ~100 SPM (cadence ~600ms between impacts)
        // In walking: gentle impact is 11.5 - 13.0 m/s², no flight phase (always supported)
        for (int i = 0; i < 15; i++) {
            LocalDateTime stepTime = now.plusNanos(i * 600_000_000L);

            // Mid-stance: steady gravity ~9.8 m/s²
            readings.add(new SensorReadingDTO(stepTime, 0.2, 0.3, 9.8, 5.0, 3.0, 1.0, 0.0, 0.0, 0.0, 30));

            // Heel strike contact: gentle impact ~12.2 m/s²
            readings.add(new SensorReadingDTO(stepTime.plusNanos(300_000_000L), 1.2, 1.0, 12.2, 10.0, 5.0, 2.0, 0.0, 0.0, 0.0, 45));
        }

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);
        JumpDetectionService.DeviceState state = jumpDetectionService.getDeviceState(DEVICE_ID);

        // VERIFY: 0 jumps detected, walking steps counted, activity is WALKING
        assertEquals(0, jumps.size(), "Walking must NEVER be misclassified as jumps");
        assertEquals(0, state.totalJumps, "Total jumps must remain 0 during walking");
        assertTrue(state.totalSteps > 0, "Walking steps must be recognized");
        assertTrue(state.totalWalkSteps > 0, "Walk step counter should increment");
        assertEquals("WALKING", state.currentActivity, "Activity state should be classified as WALKING");
    }

    @Test
    @DisplayName("Single Jump Test: Real jump with sustained airtime and hard landing triggers EXACTLY 1 jump")
    void testSingleJumpDetectedAccurately() {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Phase 1: Ground baseline (9.81 m/s²)
        readings.add(new SensorReadingDTO(now, 0.2, 0.3, 9.8, 1.0, 1.0, 0.5, 0.0, 0.0, 0.0, 20));

        // Phase 2: Explosive takeoff thrust (surge to 18 m/s²)
        readings.add(new SensorReadingDTO(now.plusNanos(100_000_000L), 2.0, 1.0, 18.5, 30.0, 15.0, 5.0, 0.0, 0.0, 0.0, 95));

        // Phase 3: Airborne flight / free-fall (Magnitude ~3.5 m/s² for 350ms)
        readings.add(new SensorReadingDTO(now.plusNanos(200_000_000L), 1.0, 1.0, 3.2, 10.0, 8.0, 2.0, 0.0, 0.0, 0.0, 40));
        readings.add(new SensorReadingDTO(now.plusNanos(300_000_000L), 0.8, 0.5, 3.0, 5.0, 4.0, 1.0, 0.0, 0.0, 0.0, 40));
        readings.add(new SensorReadingDTO(now.plusNanos(450_000_000L), 0.5, 0.8, 3.5, 8.0, 5.0, 2.0, 0.0, 0.0, 0.0, 40));

        // Phase 4: Touchdown landing impact (spikes to 28 m/s² at t = 500ms -> flight time = 300ms)
        readings.add(new SensorReadingDTO(now.plusNanos(500_000_000L), 5.0, 4.0, 28.0, 45.0, 30.0, 12.0, 0.0, 0.0, 0.0, 100));

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);
        JumpDetectionService.DeviceState state = jumpDetectionService.getDeviceState(DEVICE_ID);

        assertEquals(1, jumps.size(), "Must detect exactly 1 jump");
        assertEquals(1, state.totalJumps, "Device state jump count must be 1");
        assertEquals("JUMPING", state.currentActivity, "Activity state should be classified as JUMPING");

        JumpEventDTO jump = jumps.get(0);
        assertTrue(jump.getAirtimeSeconds() >= 0.25 && jump.getAirtimeSeconds() <= 0.40,
                "Airtime should be accurately measured (~0.3s)");
        assertTrue(jump.getJumpHeightCm() > 5.0, "Jump height should be positive and realistic");
        assertTrue(jump.getLandingImpactG() > 2.5, "Landing impact G should reflect high impact");
    }

    @Test
    @DisplayName("Split-Stance Jump Test: Cushioned staggered landing (16.5 m/s²) MUST be detected as JUMP, not RUN")
    void testSplitStanceJumpDetectedAccurately() {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 1. Ground baseline
        readings.add(new SensorReadingDTO(now, 0.1, 0.2, 9.8, 2.0, 1.0, 0.5, 0.0, 0.0, 0.0, 20));

        // 2. Takeoff thrust in split stance (14.0 m/s²)
        readings.add(new SensorReadingDTO(now.plusNanos(80_000_000L), 1.5, 1.0, 14.0, 25.0, 12.0, 6.0, 0.0, 0.0, 0.0, 85));

        // 3. Sustained airborne flight (free fall ~3.5 m/s² for ~280ms)
        readings.add(new SensorReadingDTO(now.plusNanos(150_000_000L), 0.5, 0.5, 3.5, 15.0, 10.0, 5.0, 0.0, 0.0, 0.0, 35));
        readings.add(new SensorReadingDTO(now.plusNanos(280_000_000L), 0.4, 0.6, 3.2, 12.0, 8.0, 4.0, 0.0, 0.0, 0.0, 35));
        readings.add(new SensorReadingDTO(now.plusNanos(380_000_000L), 0.5, 0.5, 3.4, 10.0, 7.0, 3.0, 0.0, 0.0, 0.0, 35));

        // 4. Front foot cushioned landing impact (16.5 m/s² at t = 430ms -> airtime = 280ms)
        readings.add(new SensorReadingDTO(now.plusNanos(430_000_000L), 3.0, 2.5, 16.0, 35.0, 20.0, 8.0, 0.0, 0.0, 0.0, 85));

        // 5. Rear foot secondary contact (14.0 m/s²) 150ms later (t = 580ms)
        readings.add(new SensorReadingDTO(now.plusNanos(580_000_000L), 2.0, 2.0, 13.5, 18.0, 10.0, 4.0, 0.0, 0.0, 0.0, 70));

        // 6. Stable ground stance
        readings.add(new SensorReadingDTO(now.plusNanos(700_000_000L), 0.2, 0.2, 9.8, 1.0, 1.0, 0.5, 0.0, 0.0, 0.0, 20));
        readings.add(new SensorReadingDTO(now.plusNanos(800_000_000L), 0.1, 0.1, 9.8, 0.5, 0.5, 0.2, 0.0, 0.0, 0.0, 15));

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);
        JumpDetectionService.DeviceState state = jumpDetectionService.getDeviceState(DEVICE_ID);

        assertEquals(1, jumps.size(), "Split-stance jump MUST be detected as exactly 1 jump");
        assertEquals(1, state.totalJumps, "Device state jump count must be 1");
        assertEquals(0, state.totalSteps, "Staggered foot landing MUST NOT be misclassified as running steps");
        assertEquals("JUMPING", state.currentActivity, "Current activity must remain JUMPING");
    }

    @Test
    @DisplayName("Standing Leg Kick Test: High-velocity leg kick with extreme gyro (> 350 deg/s) MUST NOT trigger jumps")
    void testStandingLegKickWithHighGyroDoesNotTriggerJump() {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 1. Standing idle
        readings.add(new SensorReadingDTO(now, 0.1, 0.1, 9.8, 2.0, 1.0, 0.5, 0.0, 0.0, 0.0, 15));

        // 2. High-speed leg swing / kick (gyro magnitude ~380 deg/s, momentary accel dip to 5.2 m/s²)
        readings.add(new SensorReadingDTO(now.plusNanos(100_000_000L), 2.0, 3.0, 4.0, 250.0, 220.0, 180.0, 0.0, 0.0, 0.0, 60));

        // 3. Leg flail at apex
        readings.add(new SensorReadingDTO(now.plusNanos(250_000_000L), 1.0, 2.0, 4.5, 260.0, 180.0, 150.0, 0.0, 0.0, 0.0, 60));

        // 4. Foot stamps down or ball impact (24.0 m/s²) at t = 350ms
        readings.add(new SensorReadingDTO(now.plusNanos(350_000_000L), 5.0, 4.0, 23.0, 80.0, 50.0, 30.0, 0.0, 0.0, 0.0, 90));

        // 5. Standing still again
        readings.add(new SensorReadingDTO(now.plusNanos(500_000_000L), 0.1, 0.1, 9.8, 1.0, 1.0, 0.5, 0.0, 0.0, 0.0, 15));

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);
        JumpDetectionService.DeviceState state = jumpDetectionService.getDeviceState(DEVICE_ID);

        assertEquals(0, jumps.size(), "Standing leg kick must NEVER trigger jump detection");
        assertEquals(0, state.totalJumps, "Total jumps must strictly remain 0");
    }

    @Test
    @DisplayName("Standing Leg Raise & Hold Test: Lifting leg and holding supported MUST NOT trigger jumps on footstamp")
    void testStandingLegRaiseWithHoldDoesNotTriggerJump() {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 1. Standing idle
        readings.add(new SensorReadingDTO(now, 0.1, 0.1, 9.8, 1.0, 1.0, 0.5, 0.0, 0.0, 0.0, 15));

        // 2. Leg lift causes momentary dip
        readings.add(new SensorReadingDTO(now.plusNanos(50_000_000L), 0.5, 0.5, 5.5, 10.0, 8.0, 2.0, 0.0, 0.0, 0.0, 30));

        // 3. Leg is held up / supported by body at ~10.2 m/s² for 3 samples (NOT in free-fall!)
        readings.add(new SensorReadingDTO(now.plusNanos(150_000_000L), 1.0, 1.0, 10.0, 5.0, 3.0, 1.0, 0.0, 0.0, 0.0, 30));
        readings.add(new SensorReadingDTO(now.plusNanos(250_000_000L), 0.8, 0.8, 9.8, 4.0, 2.0, 1.0, 0.0, 0.0, 0.0, 30));
        readings.add(new SensorReadingDTO(now.plusNanos(350_000_000L), 0.8, 0.8, 9.8, 4.0, 2.0, 1.0, 0.0, 0.0, 0.0, 30));

        // 4. Foot snaps down onto floor (22 m/s² at t = 450ms)
        readings.add(new SensorReadingDTO(now.plusNanos(450_000_000L), 4.0, 3.0, 21.5, 20.0, 10.0, 5.0, 0.0, 0.0, 0.0, 85));

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);
        JumpDetectionService.DeviceState state = jumpDetectionService.getDeviceState(DEVICE_ID);

        assertEquals(0, jumps.size(), "Lifting and holding leg must abort airborne state and NOT trigger jump");
        assertEquals(0, state.totalJumps, "Total jumps must remain 0");
    }

    @Test
    @DisplayName("Anti-Multiple Trigger Test: Landing rebound within refractory period MUST NOT count extra jumps")
    void testLandingReboundDoesNotCauseDuplicateJumpCount() {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 1. Takeoff (18 m/s²)
        readings.add(new SensorReadingDTO(now, 1.0, 1.0, 18.0, 20.0, 10.0, 5.0, 0.0, 0.0, 0.0, 90));

        // 2. Airtime (300ms free fall)
        readings.add(new SensorReadingDTO(now.plusNanos(100_000_000L), 0.5, 0.5, 3.0, 5.0, 3.0, 1.0, 0.0, 0.0, 0.0, 30));
        readings.add(new SensorReadingDTO(now.plusNanos(250_000_000L), 0.5, 0.5, 3.0, 5.0, 3.0, 1.0, 0.0, 0.0, 0.0, 30));

        // 3. Touchdown impact (30 m/s²) at t = 350ms -> JUMP #1 confirmed!
        readings.add(new SensorReadingDTO(now.plusNanos(350_000_000L), 6.0, 5.0, 30.0, 50.0, 30.0, 15.0, 0.0, 0.0, 0.0, 100));

        // 4. Knee-bend rebound shock (22 m/s²) at t = 500ms (150ms after landing - inside refractory window)
        readings.add(new SensorReadingDTO(now.plusNanos(500_000_000L), 3.0, 2.0, 22.0, 20.0, 15.0, 5.0, 0.0, 0.0, 0.0, 85));

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);
        JumpDetectionService.DeviceState state = jumpDetectionService.getDeviceState(DEVICE_ID);

        assertEquals(1, jumps.size(), "1 jump must ONLY be counted ONCE, not 2-3 times!");
        assertEquals(1, state.totalJumps, "Total jumps must strictly remain 1");
    }

    @Test
    @DisplayName("Consecutive jumps: stable landing re-arms detector without a fixed cooldown")
    void testConsecutiveJumpsRearmAfterStableLanding() {
        LocalDateTime now = LocalDateTime.now();
        List<SensorReadingDTO> readings = List.of(
                reading(now, 9.8),
                reading(now.plusNanos(100_000_000L), 18.0),
                reading(now.plusNanos(150_000_000L), 3.0),
                reading(now.plusNanos(250_000_000L), 3.0),
                reading(now.plusNanos(350_000_000L), 28.0), // Jump 1 landing
                reading(now.plusNanos(400_000_000L), 9.8),
                reading(now.plusNanos(500_000_000L), 9.8), // Stable ground: re-arm
                reading(now.plusNanos(550_000_000L), 18.0), // Jump 2 takeoff
                reading(now.plusNanos(600_000_000L), 3.0),
                reading(now.plusNanos(700_000_000L), 3.0),
                reading(now.plusNanos(800_000_000L), 28.0) // Jump 2 landing, 450ms after jump 1
        );

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);

        assertEquals(2, jumps.size(), "Both jumps should be detected after stable ground re-arm");
        assertEquals(2, jumpDetectionService.getDeviceState(DEVICE_ID).totalJumps);
    }

    private SensorReadingDTO reading(LocalDateTime timestamp, double zMagnitude) {
        return new SensorReadingDTO(timestamp, 0.0, 0.0, zMagnitude,
                0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 50);
    }

    @Test
    @DisplayName("Edge Cases: Empty reading list, stationary idle sensor, dropped sensor")
    void testEdgeCases() {
        // Empty batch
        List<JumpEventDTO> emptyResult = jumpDetectionService.processBatch(DEVICE_ID, new ArrayList<>());
        assertTrue(emptyResult.isEmpty());

        // Stationary idle data (pure 1G gravity = 9.81 m/s²)
        List<SensorReadingDTO> idleReadings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        for (int i = 0; i < 10; i++) {
            idleReadings.add(new SensorReadingDTO(now.plusNanos(i * 100_000_000L), 0.1, 0.1, 9.81, 0.5, 0.2, 0.1, 0.0, 0.0, 0.0, 10));
        }
        List<JumpEventDTO> idleJumps = jumpDetectionService.processBatch(DEVICE_ID, idleReadings);
        assertTrue(idleJumps.isEmpty());

        // Abnormal drop (> 850ms in free fall, e.g. sensor dropped from high window or desk)
        List<SensorReadingDTO> dropReadings = new ArrayList<>();
        dropReadings.add(new SensorReadingDTO(now, 0.0, 0.0, 3.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 20));
        dropReadings.add(new SensorReadingDTO(now.plusSeconds(2), 0.0, 0.0, 25.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 100));
        List<JumpEventDTO> dropJumps = jumpDetectionService.processBatch(DEVICE_ID, dropReadings);
        assertTrue(dropJumps.isEmpty(), "Drop lasting > 850ms should not be treated as a human jump");
    }
}
