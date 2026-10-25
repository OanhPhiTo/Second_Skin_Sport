package com.secondskin.sport.service;

import com.secondskin.sport.dto.JumpEventDTO;
import com.secondskin.sport.dto.SensorReadingDTO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * JumpDetectionService
 * Thuật toán phát hiện cú nhảy thể thao và phân biệt chính xác giữa Chạy bộ (Running) và Nhảy (Jumping)
 * dựa trên Máy trạng thái Động học (Kinematic Finite State Machine):
 *
 * 1. GROUND: Trạng thái tiếp đất thông thường (Magnitude ~ 9.81 m/s²).
 * 2. TAKEOFF: Xung lực bật lên của bàn chân (Magnitude > 16.5 m/s²).
 * 3. AIRBORNE: Giai đoạn không trọng lượng / rơi tự do (Magnitude < 6.5 m/s² kéo dài >= 180ms).
 * 4. LANDING: Lực va chạm tiếp đất cực mạnh (Magnitude > 20.0 m/s²).
 * 5. REFRACTORY: Khóa chống dội / debounce trong 850ms để triệt tiêu các dao động phản hồi sau tiếp đất.
 *
 * Tiêu chí phân biệt Chạy (Running) vs Nhảy (Jumping):
 * - Bước chạy có xung lực tiếp đất (14 - 24 m/s²) theo nhịp cadence (240 - 550ms/bước)
 *   nhưng thời gian bay (airtime) rất ngắn (< 150ms).
 * - Cú nhảy yêu cầu thời gian rơi tự do (airtime) liên tục >= 180ms trước khi tiếp đất.
 */
@Service
public class JumpDetectionService {

    private static final Logger log = LoggerFactory.getLogger(JumpDetectionService.class);

    public static final double STANDARD_GRAVITY = 9.80665; // m/s²
    public static final double JUMP_FREEFALL_THRESHOLD = 6.5; // m/s²
    public static final double JUMP_LANDING_IMPACT_THRESHOLD = 20.0; // m/s²
    public static final double TAKEOFF_THRESHOLD = 16.5; // m/s²
    public static final long MIN_JUMP_AIRTIME_MS = 180; // Minimum airtime for genuine vertical jump
    public static final long MAX_JUMP_AIRTIME_MS = 850; // Maximum plausible human hang time
    public static final long JUMP_REFRACTORY_MS = 850;  // Debounce period to prevent double/triple count
    public static final double RUN_STEP_MIN_IMPACT = 13.5; // m/s²
    public static final double RUN_STEP_MAX_IMPACT = 25.0; // m/s²

    public enum KinematicState {
        GROUND,
        TAKEOFF,
        AIRBORNE,
        REFRACTORY
    }

    public static class DeviceState {
        public KinematicState state = KinematicState.GROUND;
        public long airtimeStartEpochMs = 0;
        public long lastJumpEpochMs = 0;
        public long lastStepEpochMs = 0;
        public int totalJumps = 0;
        public int totalSteps = 0;
        public String currentActivity = "IDLE";
        public double lastJumpHeightCm = 0.0;
        public double lastAirtimeSeconds = 0.0;
    }

    private final ConcurrentHashMap<String, DeviceState> deviceStates = new ConcurrentHashMap<>();
    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    public JumpDetectionService(@Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Xử lý một chuỗi các mẫu dữ liệu cảm biến nhận từ thiết bị.
     */
    public List<JumpEventDTO> processBatch(String deviceId, List<SensorReadingDTO> readings) {
        List<JumpEventDTO> detectedJumps = new ArrayList<>();
        if (readings == null || readings.isEmpty()) {
            return detectedJumps;
        }

        String devKey = deviceId != null ? deviceId : "ESP32-SUPERMINI-01";
        DeviceState dev = deviceStates.computeIfAbsent(devKey, k -> new DeviceState());

        long simulatedEpochMs = System.currentTimeMillis();

        for (int i = 0; i < readings.size(); i++) {
            SensorReadingDTO r = readings.get(i);
            long pointEpochMs;
            if (r.getTimestamp() != null) {
                pointEpochMs = r.getTimestamp().toInstant(ZoneOffset.UTC).toEpochMilli();
            } else {
                pointEpochMs = simulatedEpochMs + (i * 100L); // Giả định tần số 10Hz (100ms/mẫu)
            }

            double ax = r.getAccelerometerX();
            double ay = r.getAccelerometerY();
            double az = r.getAccelerometerZ();
            double magnitude = Math.sqrt(ax * ax + ay * ay + az * az);

            JumpEventDTO jump = processSingleSample(devKey, dev, magnitude, pointEpochMs, r.getTimestamp());
            if (jump != null) {
                detectedJumps.add(jump);
                broadcastJumpEvent(devKey, jump);
            }
        }

        return detectedJumps;
    }

    /**
     * Xử lý một mẫu gia tốc đơn lẻ dựa trên máy trạng thái FSM.
     */
    public synchronized JumpEventDTO processSingleSample(String deviceId, DeviceState dev,
                                                         double magnitude, long epochMs,
                                                         LocalDateTime timestamp) {
        LocalDateTime eventTime = timestamp != null ? timestamp : LocalDateTime.now();

        // 1. Kiểm tra hết thời gian khóa chống dội (Refractory Period)
        if (dev.state == KinematicState.REFRACTORY) {
            if (epochMs - dev.lastJumpEpochMs >= JUMP_REFRACTORY_MS) {
                dev.state = KinematicState.GROUND;
            }
        }

        JumpEventDTO confirmedJump = null;

        // 2. Máy trạng thái phát hiện cú nhảy (Jump State Machine)
        switch (dev.state) {
            case GROUND:
                if (magnitude < JUMP_FREEFALL_THRESHOLD) {
                    // Cơ thể rời mặt đất -> Chuyển sang rơi tự do (Airborne)
                    dev.state = KinematicState.AIRBORNE;
                    dev.airtimeStartEpochMs = epochMs;
                } else if (magnitude > TAKEOFF_THRESHOLD) {
                    // Xung lực bật nhảy (Takeoff)
                    dev.state = KinematicState.TAKEOFF;
                }
                break;

            case TAKEOFF:
                if (magnitude < JUMP_FREEFALL_THRESHOLD) {
                    // Tiếp tục pha bay lên không trung
                    dev.state = KinematicState.AIRBORNE;
                    dev.airtimeStartEpochMs = epochMs;
                } else if (magnitude <= 11.5 && magnitude >= 8.5) {
                    // Xung lực không dẫn đến bay (chỉ là nhấp nháy hoặc dậm chân tại chỗ)
                    dev.state = KinematicState.GROUND;
                }
                break;

            case AIRBORNE:
                if (magnitude < JUMP_FREEFALL_THRESHOLD) {
                    // Đang lơ lửng trên không
                } else if (magnitude >= JUMP_LANDING_IMPACT_THRESHOLD) {
                    // Va chạm tiếp đất mạnh!
                    long flightDurationMs = epochMs - dev.airtimeStartEpochMs;

                    if (flightDurationMs >= MIN_JUMP_AIRTIME_MS && flightDurationMs <= MAX_JUMP_AIRTIME_MS) {
                        // XÁC NHẬN CÚ NHẢY HỢP LỆ!
                        dev.totalJumps++;
                        dev.lastJumpEpochMs = epochMs;
                        dev.lastAirtimeSeconds = flightDurationMs / 1000.0;
                        // Độ cao cú nhảy: h = (1/8) * g * t^2
                        dev.lastJumpHeightCm = Math.round((0.125 * STANDARD_GRAVITY * dev.lastAirtimeSeconds * dev.lastAirtimeSeconds) * 1000.0) / 10.0;
                        dev.state = KinematicState.REFRACTORY;
                        dev.currentActivity = "JUMPING";

                        double impactG = Math.round((magnitude / STANDARD_GRAVITY) * 10.0) / 10.0;

                        confirmedJump = new JumpEventDTO(
                                deviceId,
                                eventTime,
                                dev.lastAirtimeSeconds,
                                dev.lastJumpHeightCm,
                                Math.round(magnitude * 10.0) / 10.0,
                                impactG,
                                dev.totalJumps,
                                "JUMP"
                        );

                        log.info(">>> [JUMP DETECTED] Device: {} | Jump #{}: airtime={}ms, height={}cm, impact={}G",
                                deviceId, dev.totalJumps, flightDurationMs, dev.lastJumpHeightCm, impactG);
                    } else {
                        // Thời gian bay quá ngắn (< 180ms) -> Là bước chạy hoặc nhón chân, KHÔNG PHẢI CÚ NHẢY!
                        dev.state = KinematicState.GROUND;
                    }
                } else if (epochMs - dev.airtimeStartEpochMs > MAX_JUMP_AIRTIME_MS) {
                    // Quá thời gian bay tối đa của con người (ví dụ cảm biến bị lật ngược hoặc đặt xuống bàn)
                    dev.state = KinematicState.GROUND;
                }
                break;

            case REFRACTORY:
                // Trong giai đoạn chống dội, bỏ qua mọi xung lực va chạm thứ cấp
                break;
        }

        // 3. Phân biệt Bước chạy (Running Cadence):
        // Khi không trong pha rơi tự do của cú nhảy, kiểm tra nhịp tiếp đất của bước chạy
        if (dev.state != KinematicState.AIRBORNE && dev.state != KinematicState.REFRACTORY) {
            if (magnitude >= RUN_STEP_MIN_IMPACT && magnitude <= RUN_STEP_MAX_IMPACT) {
                long stepInterval = epochMs - dev.lastStepEpochMs;
                if (stepInterval >= 220 && stepInterval <= 550) {
                    // Nhịp bước chạy tiêu chuẩn (110 - 270 spm)
                    dev.totalSteps++;
                    dev.lastStepEpochMs = epochMs;
                    dev.currentActivity = "RUNNING";
                } else if (stepInterval > 550) {
                    dev.lastStepEpochMs = epochMs;
                }
            }
        }

        return confirmedJump;
    }

    private void broadcastJumpEvent(String deviceId, JumpEventDTO jump) {
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/jumps", jump);
                messagingTemplate.convertAndSend("/topic/devices/" + deviceId + "/jumps", jump);
            } catch (Exception e) {
                log.warn("WebSocket publish jump failed: {}", e.getMessage());
            }
        }
    }

    public DeviceState getDeviceState(String deviceId) {
        return deviceStates.computeIfAbsent(deviceId != null ? deviceId : "ESP32-SUPERMINI-01", k -> new DeviceState());
    }

    public void resetDeviceState(String deviceId) {
        deviceStates.remove(deviceId != null ? deviceId : "ESP32-SUPERMINI-01");
    }
}
