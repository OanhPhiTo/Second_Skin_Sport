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

@DisplayName("JumpDetectionService - QA Tests for Jump vs Run Accuracy")
class JumpDetectionServiceTest {

    private JumpDetectionService jumpDetectionService;
    private final String DEVICE_ID = "ESP32-TEST-DEVICE";

    @BeforeEach
    void setUp() {
        jumpDetectionService = new JumpDetectionService(null);
        jumpDetectionService.resetDeviceState(DEVICE_ID);
    }

    @Test
    @DisplayName("Running Test: Repeated high-impact foot strikes without free-fall MUST NOT trigger jumps")
    void testRunningDoesNotTriggerJumps() {
        List<SensorReadingDTO> readings = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Simulate 20 running steps at ~170 SPM (cadence ~350ms between impacts)
        // In running: footstrike impact is 18 - 22 m/s², but flight time is negligible (< 100ms)
        for (int i = 0; i < 20; i++) {
            LocalDateTime stepTime = now.plusNanos(i * 350_000_000L);

            // Stance / push-off (12 - 15 m/s²)
            readings.add(new SensorReadingDTO(stepTime, 2.0, 3.0, 14.0, 10.0, 5.0, 2.0, 0.0, 0.0, 0.0, 80));

            // Short swing phase (gravity ~9.8 m/s², NOT deep free-fall)
            readings.add(new SensorReadingDTO(stepTime.plusNanos(100_000_000L), 1.0, 1.0, 9.8, 5.0, 2.0, 1.0, 0.0, 0.0, 0.0, 75));

            // Foot strike impact shock (19 - 22 m/s²), which previously falsely triggered jumps
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

        JumpEventDTO jump = jumps.get(0);
        assertTrue(jump.getAirtimeSeconds() >= 0.25 && jump.getAirtimeSeconds() <= 0.40,
                "Airtime should be accurately measured (~0.3s)");
        assertTrue(jump.getJumpHeightCm() > 5.0, "Jump height should be positive and realistic");
        assertTrue(jump.getLandingImpactG() > 2.5, "Landing impact G should reflect high impact");
    }

    @Test
    @DisplayName("Anti-Multiple Trigger Test: Landing rebound and settling steps within refractory period MUST NOT count extra jumps")
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

        // 4. Knee-bend rebound shock (22 m/s²) at t = 550ms (200ms after landing - inside 850ms refractory window)
        // Previously this caused False Jump #2!
        readings.add(new SensorReadingDTO(now.plusNanos(550_000_000L), 3.0, 2.0, 22.0, 20.0, 15.0, 5.0, 0.0, 0.0, 0.0, 85));

        // 5. Stabilizing recovery step (19 m/s²) at t = 750ms (400ms after landing - inside 850ms refractory window)
        // Previously this caused False Jump #3!
        readings.add(new SensorReadingDTO(now.plusNanos(750_000_000L), 2.0, 2.0, 19.5, 15.0, 10.0, 4.0, 0.0, 0.0, 0.0, 80));

        List<JumpEventDTO> jumps = jumpDetectionService.processBatch(DEVICE_ID, readings);
        JumpDetectionService.DeviceState state = jumpDetectionService.getDeviceState(DEVICE_ID);

        // VERIFY: The 1 jump must NOT be multiplied into 2 or 3 jumps!
        assertEquals(1, jumps.size(), "1 jump must ONLY be counted ONCE, not 2-3 times!");
        assertEquals(1, state.totalJumps, "Total jumps must strictly remain 1");
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
