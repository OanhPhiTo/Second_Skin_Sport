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
 * Thuật toán phát hiện cú nhảy thể thao và phân loại đa hoạt động (Multi-Activity Classification):
 * - BẬT NHẢY (Jumping)
 * - CHẠY BỘ (Running)
 * - ĐI BỘ (Walking)
 * - ĐỨNG YÊN / NGHỈ (Idle)
 *
 * Dựa trên Máy trạng thái Động học Đa trục (Multi-axis Kinematic Finite State Machine):
 * 1. GROUND: Trạng thái tiếp đất thông thường (Magnitude ~ 9.81 m/s²).
 * 2. TAKEOFF: Xung lực bật lên của bàn chân (Magnitude > 13.5 m/s²).
 * 3. AIRBORNE: Giai đoạn không trọng lượng / rơi tự do (Magnitude < 7.2 m/s² kéo dài >= 150ms).
 *    Lọc bỏ chuyển động đá chân / vung chân khi đứng yên qua Gyroscope (|ω| > 320°/s) và kiểm tra liên tục tình trạng rơi tự do.
 * 4. LANDING: Lực va chạm tiếp đất (Magnitude >= 15.0 m/s², phù hợp cả cú nhảy chân trước chân sau - split jump và tiếp đất giảm chấn).
 * 5. REFRACTORY: Hấp thụ dội tiếp đất và chấn động thứ cấp (chân sau tiếp đất), ngăn chặn đếm nhầm thành bước đi / chạy.
 *
 * Tiêu chí phân loại Vận động:
 * - Đi bộ (Walking): Xung lực êm dịu (10.6 - 14.0 m/s²), nhịp bước 420 - 950ms (65 - 140 spm).
 * - Chạy bộ (Running): Xung lực dứt khoát (14.0 - 25.0 m/s²), nhịp bước 200 - 480ms (125 - 270 spm).
 * - Bật nhảy (Jumping): Có pha rơi tự do liên tục >= 150ms kết thúc bằng va chạm tiếp đất >= 15.0 m/s².
 */
@Service
public class JumpDetectionService {

    private static final Logger log = LoggerFactory.getLogger(JumpDetectionService.class);

    public static final double STANDARD_GRAVITY = 9.80665; // m/s²
    public static final double JUMP_FREEFALL_THRESHOLD = 8.0; // m/s² - nhận diện pha bay trên không nhạy bén (unweighting < 8.0 m/s²)
    public static final double JUMP_LANDING_IMPACT_THRESHOLD = 13.0; // m/s² - nhận diện tiếp đất nhạy bén kể cả nhảy nhẹ / tiếp đất êm
    public static final double TAKEOFF_THRESHOLD = 12.5; // m/s² - lực dậm nhảy tự nhiên không cần dùng sức quá mức
    public static final long MIN_JUMP_AIRTIME_MS = 135; // Minimum airtime (135ms): nhận trọn cú nhảy nhẹ/hop (140-250ms), loại bỏ bước chạy (40-90ms)
    public static final long MAX_JUMP_AIRTIME_MS = 850; // Maximum plausible human hang time
    public static final double MAX_AIRBORNE_GYRO = 450.0; // °/s - lọc bỏ động tác vung đá chân quay nhanh
    public static final int GROUNDED_SAMPLES_TO_REARM = 2;
    public static final long GROUNDED_STABILITY_MS = 80;
    public static final double GROUNDED_MIN_MAGNITUDE = 8.5;
    public static final double GROUNDED_MAX_MAGNITUDE = 12.5;
    public static final double RUN_STEP_MIN_IMPACT = 14.0; // m/s²
    public static final double RUN_STEP_MAX_IMPACT = 25.0; // m/s²
    public static final double WALK_STEP_MIN_IMPACT = 10.6; // m/s²
    public static final double WALK_STEP_MAX_IMPACT = 14.0; // m/s²

    public enum KinematicState {
        GROUND,
        TAKEOFF,
        AIRBORNE,
        REFRACTORY
    }

    public static class DeviceState {
        public KinematicState state = KinematicState.GROUND;
        public long airtimeStartEpochMs = 0;
        public long takeoffEpochMs = 0;
        public long lastStepEpochMs = 0;
        public long lastJumpEpochMs = 0;
        public int totalJumps = 0;
        public int totalSteps = 0;
        public int totalWalkSteps = 0;
        public int totalRunSteps = 0;
        public int consecutiveRunSteps = 0;
        public int consecutiveWalkSteps = 0;
        public int groundedSamplesAfterLanding = 0;
        public int supportedSamplesInAir = 0;
        public long groundedSinceEpochMs = 0;
        public String currentActivity = "IDLE"; // "IDLE" | "WALKING" | "RUNNING" | "JUMPING"
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

            double gx = r.getGyroscopeX();
            double gy = r.getGyroscopeY();
            double gz = r.getGyroscopeZ();
            double gyroMagnitude = Math.sqrt(gx * gx + gy * gy + gz * gz);

            JumpEventDTO jump = processSingleSample(devKey, dev, magnitude, gyroMagnitude, pointEpochMs, r.getTimestamp());
            if (jump != null) {
                detectedJumps.add(jump);
                broadcastJumpEvent(devKey, jump);
            }
        }

        return detectedJumps;
    }

    public synchronized JumpEventDTO processSingleSample(String deviceId, DeviceState dev,
                                                         double magnitude, long epochMs,
                                                         LocalDateTime timestamp) {
        return processSingleSample(deviceId, dev, magnitude, 0.0, epochMs, timestamp);
    }

    /**
     * Xử lý một mẫu cảm biến đơn lẻ dựa trên máy trạng thái FSM kết hợp gia tốc và vận tốc góc.
     */
    public synchronized JumpEventDTO processSingleSample(String deviceId, DeviceState dev,
                                                         double magnitude, double gyroMagnitude,
                                                         long epochMs, LocalDateTime timestamp) {
        LocalDateTime eventTime = timestamp != null ? timestamp : LocalDateTime.now();

        // 1. Giai đoạn chống dội (Refractory Lockout):
        // Hấp thụ va chạm tiếp đất của chân thứ hai (nhảy chân trước chân sau) và dao động phục hồi.
        if (dev.state == KinematicState.REFRACTORY) {
            boolean stabilityTimeout = (epochMs - dev.lastJumpEpochMs >= 550);
            if (magnitude >= GROUNDED_MIN_MAGNITUDE && magnitude <= GROUNDED_MAX_MAGNITUDE) {
                if (dev.groundedSamplesAfterLanding == 0) {
                    dev.groundedSinceEpochMs = epochMs;
                }
                dev.groundedSamplesAfterLanding++;
            } else {
                dev.groundedSamplesAfterLanding = 0;
                dev.groundedSinceEpochMs = 0;
            }
            if (stabilityTimeout || (dev.groundedSamplesAfterLanding >= GROUNDED_SAMPLES_TO_REARM
                    && epochMs - dev.groundedSinceEpochMs >= GROUNDED_STABILITY_MS)) {
                dev.state = KinematicState.GROUND;
                dev.groundedSamplesAfterLanding = 0;
                dev.groundedSinceEpochMs = 0;
            }
        }

        JumpEventDTO confirmedJump = null;

        // 2. Máy trạng thái phát hiện cú nhảy (Jump State Machine)
        switch (dev.state) {
            case GROUND:
                if (magnitude >= TAKEOFF_THRESHOLD) {
                    // Xung lực dậm nhảy bật lên (Takeoff thrust) bắt buộc để cơ thể rời mặt đất
                    dev.state = KinematicState.TAKEOFF;
                    dev.takeoffEpochMs = epochMs;
                }
                break;

            case TAKEOFF:
                if (magnitude < JUMP_FREEFALL_THRESHOLD) {
                    // Chuyển tiếp thành công sang pha bay lên không trung
                    dev.state = KinematicState.AIRBORNE;
                    dev.airtimeStartEpochMs = epochMs;
                    dev.supportedSamplesInAir = 0;
                } else if (epochMs - dev.takeoffEpochMs > 350) {
                    // Quá thời gian đẩy mà không có rơi tự do
                    dev.state = KinematicState.GROUND;
                }
                break;

            case AIRBORNE:
                // Lọc bỏ động tác vung đá chân cực nhanh khi đang trong pha bay
                if (gyroMagnitude > MAX_AIRBORNE_GYRO) {
                    dev.state = KinematicState.GROUND;
                    dev.supportedSamplesInAir = 0;
                } else if (magnitude < JUMP_FREEFALL_THRESHOLD) {
                    // Đang duy trì trạng thái rơi tự do không trọng lượng
                    dev.supportedSamplesInAir = 0;
                } else if (magnitude >= JUMP_LANDING_IMPACT_THRESHOLD) {
                    // Va chạm tiếp đất xác nhận! (Hỗ trợ cả tiếp đất giảm chấn / chân trước chân sau >= 15 m/s²)
                    long flightDurationMs = epochMs - dev.airtimeStartEpochMs;

                    if (flightDurationMs >= MIN_JUMP_AIRTIME_MS && flightDurationMs <= MAX_JUMP_AIRTIME_MS) {
                        // XÁC NHẬN CÚ NHẢY HỢP LỆ!
                        dev.totalJumps++;
                        dev.lastAirtimeSeconds = flightDurationMs / 1000.0;
                        // Độ cao cú nhảy: h = (1/8) * g * t^2
                        dev.lastJumpHeightCm = Math.round((0.125 * STANDARD_GRAVITY * dev.lastAirtimeSeconds * dev.lastAirtimeSeconds) * 1000.0) / 10.0;
                        dev.state = KinematicState.REFRACTORY;
                        dev.groundedSamplesAfterLanding = 0;
                        dev.groundedSinceEpochMs = 0;
                        dev.lastJumpEpochMs = epochMs;
                        dev.currentActivity = "JUMPING";
                        // Reset nhịp bước để không tính va chạm tiếp đất thành bước đi / chạy
                        dev.consecutiveRunSteps = 0;
                        dev.consecutiveWalkSteps = 0;
                        dev.lastStepEpochMs = epochMs;

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
                        // Thời gian bay quá ngắn (< 150ms) -> Nhón chân hoặc bước chạy nhanh
                        dev.state = KinematicState.GROUND;
                    }
                } else if (magnitude >= 8.5 && magnitude < 12.8) {
                    // Quan sát thấy gia tốc trọng trường thông thường liên tục >= 3 mẫu khi đang 'airborne'
                    // -> VĐV thực tế đang đứng hoặc được nâng đỡ (chân dơ lên rồi giữ lại), KHÔNG PHẢI RƠI TỰ DO!
                    dev.supportedSamplesInAir++;
                    if (dev.supportedSamplesInAir >= 3) {
                        dev.state = KinematicState.GROUND;
                        dev.supportedSamplesInAir = 0;
                    }
                } else if (epochMs - dev.airtimeStartEpochMs > MAX_JUMP_AIRTIME_MS) {
                    // Quá thời gian bay tối đa của con người
                    dev.state = KinematicState.GROUND;
                }
                break;

            case REFRACTORY:
                // Trong giai đoạn chống dội, bỏ qua mọi xung lực va chạm thứ cấp
                break;
        }

        // 3. Phân biệt Đi bộ (Walking) vs Chạy bộ (Running):
        // Không nhận diện bước chân khi đang bay, đang chống dội hoặc trong vòng 350ms sau cú tiếp đất nhảy
        if (dev.state != KinematicState.AIRBORNE && dev.state != KinematicState.REFRACTORY
                && (epochMs - dev.lastJumpEpochMs > 450)) {

            long stepInterval = epochMs - dev.lastStepEpochMs;

            // Kịch bản A: Chạy bộ (Running) - Xung lực mạnh (14.0 - 25.0 m/s²), nhịp nhanh (200 - 480ms)
            if (magnitude >= RUN_STEP_MIN_IMPACT && magnitude <= RUN_STEP_MAX_IMPACT) {
                if (stepInterval >= 200 && stepInterval <= 480) {
                    dev.consecutiveRunSteps++;
                    dev.consecutiveWalkSteps = 0;
                    if (dev.consecutiveRunSteps >= 2) {
                        dev.totalSteps++;
                        dev.totalRunSteps++;
                        dev.currentActivity = "RUNNING";
                    }
                    dev.lastStepEpochMs = epochMs;
                } else if (stepInterval > 480 && stepInterval <= 850) {
                    // Nhịp chậm hơn nhưng xung lực hơi cao (bước đi nhanh / sải bước mạnh)
                    dev.consecutiveWalkSteps++;
                    dev.consecutiveRunSteps = 0;
                    if (dev.consecutiveWalkSteps >= 2) {
                        dev.totalSteps++;
                        dev.totalWalkSteps++;
                        dev.currentActivity = "WALKING";
                    }
                    dev.lastStepEpochMs = epochMs;
                } else if (stepInterval > 850) {
                    dev.consecutiveRunSteps = 1;
                    dev.consecutiveWalkSteps = 0;
                    dev.lastStepEpochMs = epochMs;
                }
            }
            // Kịch bản B: Đi bộ (Walking) - Xung lực êm dịu (10.6 - 14.0 m/s²), nhịp thư thả (420 - 950ms)
            else if (magnitude >= WALK_STEP_MIN_IMPACT && magnitude < WALK_STEP_MAX_IMPACT) {
                if (stepInterval >= 420 && stepInterval <= 950) {
                    dev.consecutiveWalkSteps++;
                    dev.consecutiveRunSteps = 0;
                    if (dev.consecutiveWalkSteps >= 2) {
                        dev.totalSteps++;
                        dev.totalWalkSteps++;
                        dev.currentActivity = "WALKING";
                    }
                    dev.lastStepEpochMs = epochMs;
                } else if (stepInterval > 950) {
                    dev.consecutiveWalkSteps = 1;
                    dev.consecutiveRunSteps = 0;
                    dev.lastStepEpochMs = epochMs;
                }
            }
        }

        // Tự động chuyển về trạng thái IDLE nếu không có bước đi/chạy hoặc nhảy trong 2.5 giây
        if (epochMs - dev.lastStepEpochMs > 2500 && epochMs - dev.lastJumpEpochMs > 2500) {
            dev.currentActivity = "IDLE";
            dev.consecutiveRunSteps = 0;
            dev.consecutiveWalkSteps = 0;
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
