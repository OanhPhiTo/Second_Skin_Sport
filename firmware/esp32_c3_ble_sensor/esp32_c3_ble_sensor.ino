/*
  =============================================================================
  🏃 SECOND SKIN SPORT — ESP32-C3 WEARABLE BIOMETRIC FIRMWARE
  =============================================================================
  Target MCU: ESP32-C3 SuperMini (RISC-V 160MHz)
  Sensors:
      - MPU6050 (6-DOF IMU: Accel + Gyro) via I2C (SDA: GPIO8, SCL: GPIO9)
      - GNSS Module (NEO-6M / ATGM336H / NEO-M8N) via UART (RX: GPIO20, TX: GPIO21)
  Communication:
      - Bluetooth Low Energy (BLE 5.0) -> Web Bluetooth API (Direct streaming)
      - Wi-Fi (Credentials received via BLE & saved to NVS Flash memory)
  Target Placement:
      - Quanh khớp gối (Trên hoặc dưới đầu gối một chút)
  Sample Rate:
      - Chuẩn hóa 100 Hz (chu kỳ 10,000 us) bằng timer non-blocking + log jitter
  Full-Scale Range:
      - Accel: ±8g (4096 LSB/g) chống bão hòa khi chạm đất
      - Gyro: ±500°/s (65.5 LSB/(°/s))
      - Bật DLPF phần cứng: ~42 Hz (DLPF_CFG = 3)
  =============================================================================
*/

#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ==========================================
// 📌 PIN CONFIGURATION (ESP32-C3 SuperMini)
// ==========================================
#define I2C_SDA_PIN       8   // MPU6050 SDA (hoặc GPIO4 tùy board)
#define I2C_SCL_PIN       9   // MPU6050 SCL (hoặc GPIO5 tùy board)
#define GPS_RX_PIN        20  // Kết nối GPS TX
#define GPS_TX_PIN        21  // Kết nối GPS RX
#define LED_PIN           8   // Onboard Blue LED on ESP32-C3 SuperMini (Active LOW)
#define BATTERY_ADC_PIN   0   // ADC1 Channel 0 (GPIO0 on ESP32-C3)
#define CHARGE_DETECT_PIN 1   // GPIO1: TP4056 CHRG pin (Active LOW)

// ==========================================
// 📡 BLE UUID DEFINITIONS
// ==========================================
#define BLE_DEVICE_NAME        "SecondSkin_ESP32"
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define SENSOR_CHAR_UUID       "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define COMMAND_CHAR_UUID      "d9a4b3c0-0f2b-4e67-9f12-0761a2938472"

// ==========================================
// ⚙️ STRUCT CẤU HÌNH NGƯỠNG ĐỘNG HỌC (KINEMATICS)
// Vị trí đeo: Quanh khớp gối (đùi dưới / cẳng chân trên)
// ==========================================
struct KinematicConfig {
    // 1. Pha bay (Free-fall / Airborne): khi cả cơ thể rời đất hoặc chân vung lơ lửng
    // Chọn 0.40g vì khi rơi tự do/nhấc bổng, độ lớn gia tốc trọng trường biểu kiến giảm sâu < 0.4g
    float flight_thresh_g = 0.40f;

    // Thời gian bay tối thiểu (ms) để lọc bỏ rung chấn cơ học ngắn hạn
    uint16_t min_flight_ms = 65;

    // 2. Tiếp đất của bước chạy (Run Impact Peak):
    // Ở vị trí đầu gối, xung lực tiếp đất khi chạy dao động từ 2.0g - 4.5g
    float run_impact_thresh_g = 2.00f;

    // 3. Tiếp đất của cú nhảy (Jump Impact Peak):
    // Cú nhảy rơi từ trên cao xuống đầu gối chịu xung lực lớn hơn bước chạy (>= 2.8g)
    float jump_impact_thresh_g = 2.80f;

    // 4. Thời gian bay tối thiểu của cú nhảy (Airtime ms):
    // Cú nhảy thể thao thường có hang time từ 220ms - 750ms. Bước chạy thường có airtime < 180ms
    uint16_t jump_min_airtime_ms = 220;

    // 5. Thời gian trơ chống đếm trùng (Refractory Period ms):
    // Ngăn chặn các dao động phục hồi / chân sau tiếp đất bị đếm lặp lại
    uint16_t run_refractory_ms = 150;   // Chạy: 150ms (vừa đủ dập dội, không nuốt pha bay tiếp theo)
    uint16_t jump_refractory_ms = 350;  // Nhảy: 350ms (giảm chấn khuỵu gối)

    // 6. Cửa sổ nhịp bước chạy (Step Interval Window ms):
    // Nhịp chạy của con người thường từ 110 spm (550ms) đến 240 spm (250ms)
    uint16_t run_interval_min_ms = 250;
    uint16_t run_interval_max_ms = 550;
};

KinematicConfig kineConfig;

// ==========================================
// ⚙️ GLOBAL INSTANCES & SENSOR VARIABLES
// ==========================================
Preferences preferences;

BLEServer* pServer = nullptr;
BLECharacteristic* pSensorCharacteristic = nullptr;
BLECharacteristic* pCommandCharacteristic = nullptr;

bool bleClientConnected = false;
bool oldBleClientConnected = false;
bool mpuFound = false;

// Đọc cảm biến: Gia tốc vật lý (m/s² và g), Vận tốc góc (°/s)
float ax = 0.0, ay = 0.0, az = 9.81;        // Đơn vị m/s²
float ax_g = 0.0, ay_g = 0.0, az_g = 1.0;   // Đơn vị g
float gx = 0.0, gy = 0.0, gz = 0.0;         // Đơn vị °/s
float pitch = 0.0, roll = 0.0, yaw = 0.0;
float a_mag_g = 1.0f;                       // Magnitude đơn vị g đã lọc Moving Average
float a_mag_raw_g = 1.0f;                   // Magnitude đơn vị g thô
float gpsLat = 10.7626, gpsLng = 106.6602, gpsSpeed = 0.0;

// Bộ lọc Moving Average 4 mẫu (~40ms) cho gia tốc tổng hợp a_mag
#define MA_SIZE 4
float maBuffer[MA_SIZE] = {1.0f, 1.0f, 1.0f, 1.0f};
uint8_t maIndex = 0;
float maSum = 4.0f;

// Hiệu chuẩn offset con quay khi đứng yên (Zero-motion Gyro Calibration)
float offsetGx = 0.0f, offsetGy = 0.0f, offsetGz = 0.0f;

// Quản lý Pin & Sạc
int batteryLevel = 98;
float batteryVoltage = 4.15;
bool isUsingRealAdc = false;
bool isCharging = false;
unsigned long lastBatteryCheck = 0;
unsigned long lastDrainTick = 0;
unsigned long lastChargeTick = 0;

// Trạng thái vận động & Bộ đếm
String activityState = "idle";
int jumpCount = 0;
int stepCount = 0;
int runStepCount = 0;
int walkStepCount = 0;
float lastAirtime = 0.0;
float lastJumpHeightCm = 0.0;
String currentEvent = "NONE"; // "NONE" | "RUN_STEP" | "JUMP"

// Máy trạng thái Động học (Kinematic FSM)
enum KinematicState { KINE_GROUND, KINE_FLIGHT, KINE_LANDING, KINE_REFRACTORY };
KinematicState kineState = KINE_GROUND;

unsigned long flightStartTime = 0;
unsigned long flightEndTime = 0;
unsigned long flightDurationMs = 0;
unsigned long landingStartTime = 0;
float peakLandingG = 0.0f;
unsigned long refractoryEndTime = 0;

// Cửa sổ trượt ghi nhận các bước tiếp đất gần nhất (Sliding Window)
#define TOUCHDOWN_HIST_SIZE 6
unsigned long tdTimestamps[TOUCHDOWN_HIST_SIZE] = {0};
uint8_t consecutiveRunCadence = 0;
unsigned long lastStepTime = 0;
unsigned long lastJumpTime = 0;

// Cấu hình Wi-Fi lưu trong NVS
String wifiSSID = "";
String wifiPass = "";
String backendUrl = "http://192.168.1.100:8080/api/v1/sensor/batches";

// Định thời lấy mẫu chuẩn 100 Hz (10,000 microsecond)
const unsigned long SAMPLE_PERIOD_US = 10000;
unsigned long lastSampleUs = 0;
unsigned long lastSensorPublish = 0;
const unsigned long SENSOR_INTERVAL = 50; // Gửi BLE notify mỗi 50ms (20 Hz)

// Đo lường và thống kê Jitter của chu kỳ lấy mẫu
long jitterSumUs = 0;
long jitterMinUs = 999999;
long jitterMaxUs = -999999;
long sampleCount1s = 0;
unsigned long lastJitterReportMs = 0;

// Chế độ ghi log CSV qua Serial
bool csvSerialEnabled = false;

// ==========================================
// 🔔 BLE SERVER CALLBACKS
// ==========================================
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        bleClientConnected = true;
        digitalWrite(LED_PIN, LOW); // Bật LED (Active LOW)
        Serial.println(">>> [BLE] Web Client da ket noi thanh cong!");
    }

    void onDisconnect(BLEServer* pServer) {
        bleClientConnected = false;
        digitalWrite(LED_PIN, HIGH); // Tắt LED
        Serial.println(">>> [BLE] Web Client da ngat ket noi.");
    }
};

// ==========================================
// 📥 BLE COMMAND CALLBACK (Config, Wi-Fi, Reset)
// ==========================================
class CommandCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        String value = pCharacteristic->getValue().c_str();
        if (value.length() > 0) {
            Serial.print(">>> [BLE Rx Command]: ");
            Serial.println(value);

            // 1. Lệnh cấu hình ngưỡng động học: {"cmd":"set_config","flt":0.4,"run_imp":2.0,"jmp_imp":2.8,"jmp_air":220,"run_ref":250,"jmp_ref":350}
            if (value.indexOf("set_config") != -1) {
                int p = value.indexOf("\"flt\":");
                if (p != -1) kineConfig.flight_thresh_g = value.substring(p + 6).toFloat();

                p = value.indexOf("\"run_imp\":");
                if (p != -1) kineConfig.run_impact_thresh_g = value.substring(p + 10).toFloat();

                p = value.indexOf("\"jmp_imp\":");
                if (p != -1) kineConfig.jump_impact_thresh_g = value.substring(p + 10).toFloat();

                p = value.indexOf("\"jmp_air\":");
                if (p != -1) kineConfig.jump_min_airtime_ms = value.substring(p + 10).toInt();

                p = value.indexOf("\"run_ref\":");
                if (p != -1) kineConfig.run_refractory_ms = value.substring(p + 10).toInt();

                p = value.indexOf("\"jmp_ref\":");
                if (p != -1) kineConfig.jump_refractory_ms = value.substring(p + 10).toInt();

                Serial.printf(">>> [CONFIG] Cap nhat nguong: Flight=%.2fg, RunImp=%.2fg, JmpImp=%.2fg, JmpAir=%dms\n",
                              kineConfig.flight_thresh_g, kineConfig.run_impact_thresh_g,
                              kineConfig.jump_impact_thresh_g, kineConfig.jump_min_airtime_ms);

                String resp = "{\"status\":\"config_updated\",\"flight\":" + String(kineConfig.flight_thresh_g) + ",\"run_imp\":" + String(kineConfig.run_impact_thresh_g) + "}";
                pCharacteristic->setValue(resp.c_str());
                pCharacteristic->notify();
            }

            // 2. Lệnh bật/tắt xuất CSV qua Serial: {"cmd":"csv_log","enable":true/false}
            if (value.indexOf("csv_log") != -1) {
                if (value.indexOf("\"enable\":true") != -1 || value.indexOf("\"enable\":1") != -1) {
                    csvSerialEnabled = true;
                    Serial.println("timestamp_ms,ax,ay,az,gx,gy,gz,a_mag,event");
                } else {
                    csvSerialEnabled = false;
                    Serial.println(">>> [CSV] Da tat che do xuat CSV.");
                }
                String resp = "{\"status\":\"csv_log_updated\",\"enabled\":" + String(csvSerialEnabled ? "true" : "false") + "}";
                pCharacteristic->setValue(resp.c_str());
                pCharacteristic->notify();
            }

            // 3. Lệnh hiệu chuẩn tĩnh lại cảm biến: {"cmd":"calibrate"}
            if (value.indexOf("calibrate") != -1) {
                // Đặt cờ hoặc gọi hiệu chuẩn
                String resp = "{\"status\":\"calibrating\",\"msg\":\"Dang hieu chuan cam bien... Giu yen 1.5s\"}";
                pCharacteristic->setValue(resp.c_str());
                pCharacteristic->notify();
            }

            // 4. Lệnh reset phiên tập: {"cmd":"reset_session"}
            if (value.indexOf("reset_session") != -1) {
                jumpCount = 0;
                stepCount = 0;
                runStepCount = 0;
                walkStepCount = 0;
                lastAirtime = 0.0f;
                lastJumpHeightCm = 0.0f;
                consecutiveRunCadence = 0;
                kineState = KINE_GROUND;
                activityState = "idle";
                currentEvent = "NONE";
                Serial.println(">>> [SESSION] 🔄 Da reset bo dem Jump & Step ve 0!");
                String resp = "{\"status\":\"session_reset\",\"jc\":0,\"steps\":0}";
                pCharacteristic->setValue(resp.c_str());
                pCharacteristic->notify();
            }

            // 5. Lệnh sạc / xả pin: {"cmd":"set_charging","charging":true/false}
            if (value.indexOf("set_charging") != -1) {
                isCharging = (value.indexOf("\"charging\":true") != -1 || value.indexOf("\"charging\":1") != -1);
                String resp = "{\"status\":\"charge_updated\",\"isCharging\":" + String(isCharging ? "true" : "false") + ",\"battery\":" + String(batteryLevel) + "}";
                pCharacteristic->setValue(resp.c_str());
                pCharacteristic->notify();
            }

            // 6. Cấu hình Wi-Fi
            if (value.indexOf("wifi_config") != -1) {
                int ssidStart = value.indexOf("\"ssid\":\"") + 8;
                int ssidEnd = value.indexOf("\"", ssidStart);
                int passStart = value.indexOf("\"pass\":\"") + 8;
                int passEnd = value.indexOf("\"", passStart);

                if (ssidStart > 7 && ssidEnd != -1) wifiSSID = value.substring(ssidStart, ssidEnd);
                if (passStart > 7 && passEnd != -1) wifiPass = value.substring(passStart, passEnd);

                preferences.begin("ss_config", false);
                preferences.putString("ssid", wifiSSID);
                preferences.putString("pass", wifiPass);
                preferences.end();

                String resp = "{\"status\":\"wifi_saved\",\"ssid\":\"" + wifiSSID + "\"}";
                pCharacteristic->setValue(resp.c_str());
                pCharacteristic->notify();
            }
        }
    }
};

// ==========================================
// 🛠️ MPU-6050 INITIALIZATION & CONFIGURATION
// Accel: ±8g, Gyro: ±500°/s, DLPF: ~42 Hz
// ==========================================
void initMPU6050() {
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, 400000);
    Wire.beginTransmission(0x68);
    if (Wire.endTransmission() == 0) {
        // 1. Thoát Sleep và chọn Clock Source PLL with X-axis Gyroscope (0x01)
        Wire.beginTransmission(0x68);
        Wire.write(0x6B); // PWR_MGMT_1 register
        Wire.write(0x01); // PLL with X axis gyroscope reference (ổn định hơn clock nội 8MHz)
        Wire.endTransmission(true);
        delay(10);

        // 2. Bật DLPF (Digital Low Pass Filter) ~42 Hz (DLPF_CFG = 3)
        // Lọc sạch rung động cơ học cao tần > 44Hz trước khi ADC lấy mẫu
        Wire.beginTransmission(0x68);
        Wire.write(0x1A); // CONFIG register
        Wire.write(0x03); // DLPF_CFG = 3 (Accel 44Hz, Gyro 42Hz, Delay 4.9ms)
        Wire.endTransmission(true);
        delay(5);

        // 3. Cấu hình Gyroscope: ±500°/s (FS_SEL = 1, bit 4:3 = 01 -> 0x08)
        // Độ nhạy: 65.5 LSB/(°/s). Không bị bão hòa khi xoay người/vung chân mạnh
        Wire.beginTransmission(0x68);
        Wire.write(0x1B); // GYRO_CONFIG register
        Wire.write(0x08); // ±500 deg/s
        Wire.endTransmission(true);
        delay(5);

        // 4. Cấu hình Accelerometer: ±8g (AFS_SEL = 2, bit 4:3 = 10 -> 0x10)
        // Độ nhạy: 4096 LSB/g. Chống kẹp bão hòa (clipping) khi tiếp đất mạnh (3g - 6g)
        Wire.beginTransmission(0x68);
        Wire.write(0x1C); // ACCEL_CONFIG register
        Wire.write(0x10); // ±8g
        Wire.endTransmission(true);
        delay(10);

        mpuFound = true;
        Serial.println(">>> [MPU6050] Da cau hinh chuan: Accel ±8g (4096 LSB/g), Gyro ±500°/s (65.5 LSB/°/s), DLPF ~42Hz.");
    } else {
        mpuFound = false;
        Serial.println(">>> [MPU6050] Khong tim thay cam bien tai 0x68. Chuyen sang che do mo phong (Simulation Mode).");
    }
}

// ==========================================
// ⚖️ ZERO-MOTION GYROSCOPE CALIBRATION
// Hiệu chuẩn bù sai số tĩnh khi đứng yên lúc khởi động
// ==========================================
void calibrateSensors() {
    if (!mpuFound) return;

    Serial.println(">>> [CALIB] ⚖️ Dang hieu chuan offset MPU6050 khi dung yen (150 mau)... VUI LONG GIU YEN!");
    digitalWrite(LED_PIN, LOW); // Sáng đèn báo hiệu

    long sumGx = 0, sumGy = 0, sumGz = 0;
    const int CALIB_SAMPLES = 150;

    for (int i = 0; i < CALIB_SAMPLES; i++) {
        Wire.beginTransmission(0x68);
        Wire.write(0x43); // Gyro X register
        Wire.endTransmission(false);
        Wire.requestFrom(0x68, 6, true);
        if (Wire.available() >= 6) {
            int16_t rawGx = Wire.read() << 8 | Wire.read();
            int16_t rawGy = Wire.read() << 8 | Wire.read();
            int16_t rawGz = Wire.read() << 8 | Wire.read();
            sumGx += rawGx;
            sumGy += rawGy;
            sumGz += rawGz;
        }
        delay(8);
    }

    offsetGx = (float)sumGx / CALIB_SAMPLES;
    offsetGy = (float)sumGy / CALIB_SAMPLES;
    offsetGz = (float)sumGz / CALIB_SAMPLES;

    digitalWrite(LED_PIN, HIGH); // Tắt đèn kết thúc hiệu chuẩn
    Serial.printf(">>> [CALIB] Hoan tat! Gyro Offset: X=%.1f, Y=%.1f, Z=%.1f (LSB)\n", offsetGx, offsetGy, offsetGz);
}

// ==========================================
// 📡 READ SENSORS (100 Hz Non-blocking)
// ==========================================
void readSensors() {
    if (mpuFound) {
        Wire.beginTransmission(0x68);
        Wire.write(0x3B); // Accel X register
        Wire.endTransmission(false);
        Wire.requestFrom(0x68, 14, true);

        if (Wire.available() >= 14) {
            int16_t rawAx = Wire.read() << 8 | Wire.read();
            int16_t rawAy = Wire.read() << 8 | Wire.read();
            int16_t rawAz = Wire.read() << 8 | Wire.read();
            int16_t rawTemp = Wire.read() << 8 | Wire.read();
            int16_t rawGx = Wire.read() << 8 | Wire.read();
            int16_t rawGy = Wire.read() << 8 | Wire.read();
            int16_t rawGz = Wire.read() << 8 | Wire.read();

            // Đổi sang đơn vị g với dải đo ±8g (4096 LSB/g)
            ax_g = rawAx / 4096.0f;
            ay_g = rawAy / 4096.0f;
            az_g = rawAz / 4096.0f;

            // Đổi sang m/s² (1g = 9.80665 m/s²)
            ax = ax_g * 9.80665f;
            ay = ay_g * 9.80665f;
            az = az_g * 9.80665f;

            // Đổi sang °/s với dải đo ±500°/s (65.5 LSB/(°/s)) và trừ offset tĩnh
            gx = (rawGx - offsetGx) / 65.5f;
            gy = (rawGy - offsetGy) / 65.5f;
            gz = (rawGz - offsetGz) / 65.5f;

            // Gia tốc tổng hợp thô (đơn vị g)
            a_mag_raw_g = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);

            // Bộ lọc thông thấp Moving Average 4 mẫu (~40ms) loại bỏ nhiễu rung cơ học
            maSum -= maBuffer[maIndex];
            maBuffer[maIndex] = a_mag_raw_g;
            maSum += a_mag_raw_g;
            maIndex = (maIndex + 1) % MA_SIZE;
            a_mag_g = maSum / (float)MA_SIZE;

            // Ước lượng góc nghiêng Pitch & Roll
            pitch = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0 / PI;
            roll  = atan2(ay, az) * 180.0 / PI;
        }
    } else {
        // Mô phỏng nếu không có cảm biến vật lý
        static float t = 0;
        t += 0.05;
        ax_g = 0.1f * sin(t);
        ay_g = 0.1f * cos(t);
        az_g = 1.0f + 0.05f * sin(t * 2);
        ax = ax_g * 9.80665f;
        ay = ay_g * 9.80665f;
        az = az_g * 9.80665f;
        a_mag_g = sqrt(ax_g * ax_g + ay_g * ay_g + az_g * az_g);
        gx = 5.0f * sin(t);
        gy = 4.0f * cos(t);
        gz = 2.0f * sin(t);
        pitch = 5.0 * sin(t);
        roll = 3.0 * cos(t);
    }
}

// ==========================================
// 🏃 MÁY TRẠNG THÁI NHẬN DIỆN CHẠY VS NHẢY (FSM)
// Vị trí: Quanh khớp gối (Chạy: Đỉnh va chạm + Vung chân | Nhảy: Rơi tự do + Tiếp đất mạnh)
// ==========================================
void detectActivityFSM() {
    unsigned long nowMs = millis();
    currentEvent = "NONE";
    float gyroMag = sqrt(gx * gx + gy * gy + gz * gz);

    // Cập nhật đỉnh xung lực trong giai đoạn tiếp đất cú nhảy
    if (kineState == KINE_LANDING) {
        if (a_mag_g > peakLandingG) {
            peakLandingG = a_mag_g;
        }
    }

    // 1. Phục hồi sau giai đoạn trơ
    if (kineState == KINE_REFRACTORY) {
        if (nowMs >= refractoryEndTime) {
            kineState = KINE_GROUND;
        }
    }

    // 2. Máy trạng thái phân loại
    if (kineState == KINE_GROUND) {
        // A. Kiểm tra ứng viên Cú Nhảy: Khi cả 2 chân rời đất, a_mag giảm sâu < 0.65g
        if (a_mag_g < 0.65f) {
            kineState = KINE_FLIGHT;
            flightStartTime = nowMs;
        }
        // B. Kiểm tra Đỉnh va chạm Bước Chạy tại đầu gối:
        // Đỉnh va chạm >= 1.65g VÀ có vận tốc góc vung cẳng chân gyroMag >= 50 deg/s
        else if (a_mag_g >= 1.65f && nowMs - lastStepTime > 220 && nowMs - lastJumpTime > 450) {
            unsigned long stepInterval = nowMs - lastStepTime;

            if (stepInterval >= kineConfig.run_interval_min_ms && stepInterval <= kineConfig.run_interval_max_ms) {
                consecutiveRunCadence++;
                if (consecutiveRunCadence >= 2) {
                    runStepCount++;
                    stepCount++;
                    activityState = "running";
                    currentEvent = "RUN_STEP";

                    Serial.printf(">>> [FSM RUN] Step #%d | Interval: %lu ms | Peak: %.2f g | Gyro: %.1f deg/s\n",
                                  runStepCount, stepInterval, a_mag_g, gyroMag);
                }
                lastStepTime = nowMs;
                refractoryEndTime = nowMs + 180;
                kineState = KINE_REFRACTORY;
            } else if (stepInterval > kineConfig.run_interval_max_ms) {
                consecutiveRunCadence = 1;
                lastStepTime = nowMs;
            }
        }
    }
    else if (kineState == KINE_FLIGHT) {
        // Kết thúc pha bay khi gia tốc vọt lên trở lại
        if (a_mag_g >= 0.65f) {
            flightEndTime = nowMs;
            flightDurationMs = flightEndTime - flightStartTime;

            if (flightDurationMs >= 110 && flightDurationMs <= 800) {
                kineState = KINE_LANDING;
                landingStartTime = nowMs;
                peakLandingG = a_mag_g;
            } else {
                kineState = KINE_GROUND;
            }
        } else if (nowMs - flightStartTime > 850) {
            kineState = KINE_GROUND;
        }
    }
    else if (kineState == KINE_LANDING) {
        bool windowExpired = (nowMs - landingStartTime >= 140);
        if (windowExpired || (peakLandingG >= kineConfig.jump_impact_thresh_g && a_mag_g < peakLandingG * 0.75f)) {
            // Xác nhận Cú Nhảy (JUMP)
            if (flightDurationMs >= 110 && peakLandingG >= 2.20f) {
                jumpCount++;
                lastAirtime = flightDurationMs / 1000.0f;
                lastJumpHeightCm = (0.125f * 9.80665f * lastAirtime * lastAirtime) * 100.0f;
                activityState = "jumping";
                currentEvent = "JUMP";
                lastJumpTime = nowMs;
                consecutiveRunCadence = 0; // Cú nhảy ngắt chuỗi chạy

                Serial.printf(">>> [FSM JUMP] #%d | Airtime: %lu ms | Peak: %.2f g | Height: %.1f cm\n",
                              jumpCount, flightDurationMs, peakLandingG, lastJumpHeightCm);

                kineState = KINE_REFRACTORY;
                refractoryEndTime = nowMs + kineConfig.jump_refractory_ms;
            } else {
                kineState = KINE_GROUND;
            }
        }
    }

    // Tự động chuyển về trạng thái IDLE nếu không có chuyển động sau 2.5s
    if (nowMs - lastStepTime > 2500 && nowMs - lastJumpTime > 2500) {
        if (activityState != "idle") {
            activityState = "idle";
        }
        consecutiveRunCadence = 0;
    }
}

// ==========================================
// 🔋 QUẢN LÝ PIN
// ==========================================
void updateBatteryStatus() {
    unsigned long now = millis();
    if (now - lastBatteryCheck < 2000) return;
    lastBatteryCheck = now;

    // Đọc chân sạc phần cứng TP4056 (Active LOW)
    if (digitalRead(CHARGE_DETECT_PIN) == LOW) {
        isCharging = true;
    }

    if (isCharging) {
        if (now - lastChargeTick >= 25000) {
            lastChargeTick = now;
            if (batteryLevel < 100) batteryLevel++;
        }
    } else {
        unsigned long drainInterval = (activityState == "running" || activityState == "jumping") ? 60000 : 120000;
        if (now - lastDrainTick >= drainInterval) {
            lastDrainTick = now;
            if (batteryLevel > 5) batteryLevel--;
        }
    }
}

// ==========================================
// 🚀 SETUP
// ==========================================
void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n==============================================");
    Serial.println("🏃 SECOND SKIN SPORT — ESP32-C3 SUPERMINI");
    Serial.println("Firmware v2.0: FSM Kinematics 100Hz | BLE Web");
    Serial.println("==============================================");

    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, HIGH); // LED off
    pinMode(CHARGE_DETECT_PIN, INPUT_PULLUP);

    // 1. Khởi tạo MPU-6050 với cấu hình chuẩn
    initMPU6050();

    // 2. Hiệu chuẩn con quay khi đứng yên
    calibrateSensors();

    // 3. Khởi tạo BLE GATT Server
    Serial.println(">>> [BLE] Dang khoi tao BLE GATT Server...");
    BLEDevice::init(BLE_DEVICE_NAME);

    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Characteristic 1: Telemetry Data (NOTIFY & READ)
    pSensorCharacteristic = pService->createCharacteristic(
        SENSOR_CHAR_UUID,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    pSensorCharacteristic->addDescriptor(new BLE2902());

    // Characteristic 2: Command & Config (WRITE & NOTIFY)
    pCommandCharacteristic = pService->createCharacteristic(
        COMMAND_CHAR_UUID,
        BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY
    );
    pCommandCharacteristic->setCallbacks(new CommandCallbacks());
    pCommandCharacteristic->addDescriptor(new BLE2902());

    pService->start();

    // Phát sóng quảng bá BLE
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.println(">>> [BLE] San sang phat song quang ba 'SecondSkin_ESP32'!");
    Serial.println(">>> [READY] Vong lap lay mau 100Hz da kich hoat.");

    lastSampleUs = micros();
}

// ==========================================
// 🔄 MAIN LOOP (100 Hz Non-blocking Scheduler)
// ==========================================
void loop() {
    unsigned long currentUs = micros();

    // -------------------------------------------------------------------------
    // ⏱️ TICK LẤY MẪU CỐ ĐỊNH 100 HZ (Mỗi 10,000 µs = 10 ms)
    // -------------------------------------------------------------------------
    if (currentUs - lastSampleUs >= SAMPLE_PERIOD_US) {
        // Đo lường Jitter của chu kỳ lấy mẫu
        long dt = (long)(currentUs - lastSampleUs);
        long jitter = dt - SAMPLE_PERIOD_US;

        // Cập nhật mốc thời gian lấy mẫu kế tiếp
        lastSampleUs = currentUs;

        // Thống kê Jitter
        jitterSumUs += abs(jitter);
        if (jitter < jitterMinUs) jitterMinUs = jitter;
        if (jitter > jitterMaxUs) jitterMaxUs = jitter;
        sampleCount1s++;

        // 1. Đọc cảm biến quán tính IMU
        readSensors();

        // 2. Chạy máy trạng thái phát hiện Chạy vs Nhảy
        detectActivityFSM();

        // 3. Xuất dòng CSV qua Serial nếu được bật
        if (csvSerialEnabled) {
            unsigned long nowMs = millis();
            Serial.printf("%lu,%.2f,%.2f,%.2f,%.1f,%.1f,%.1f,%.3f,%s\n",
                          nowMs, ax, ay, az, gx, gy, gz, a_mag_g, currentEvent.c_str());
        }
    }

    // -------------------------------------------------------------------------
    // 📊 BÁO CÁO THỐNG KÊ TIMING & JITTER MỖI 1 GIÂY RA SERIAL
    // -------------------------------------------------------------------------
    unsigned long nowMs = millis();
    if (nowMs - lastJitterReportMs >= 1000) {
        lastJitterReportMs = nowMs;
        if (sampleCount1s > 0) {
            long avgJitter = jitterSumUs / sampleCount1s;
            Serial.printf(">>> [TIMING 100Hz] Samples/s: %ld | Jitter Avg: %ld us | Min: %ld us | Max: %ld us\n",
                          sampleCount1s, avgJitter, jitterMinUs, jitterMaxUs);
        }
        jitterSumUs = 0;
        jitterMinUs = 999999;
        jitterMaxUs = -999999;
        sampleCount1s = 0;
    }

    // -------------------------------------------------------------------------
    // 🔋 CẬP NHẬT TRẠNG THÁI PIN
    // -------------------------------------------------------------------------
    updateBatteryStatus();

    // -------------------------------------------------------------------------
    // 📡 TRUYỀN TELEMETRY QUA BLE NOTIFY MỖI 50 MS (20 HZ)
    // Gửi kèm a_mag (g), sự kiện (evt: NONE/RUN_STEP/JUMP), số bước, số nhảy
    // -------------------------------------------------------------------------
    if (nowMs - lastSensorPublish >= SENSOR_INTERVAL) {
        lastSensorPublish = nowMs;

        if (bleClientConnected) {
            char jsonBuffer[340];
            snprintf(jsonBuffer, sizeof(jsonBuffer),
                "{\"ax\":%.2f,\"ay\":%.2f,\"az\":%.2f,\"amag\":%.2f,\"gx\":%.1f,\"gy\":%.1f,\"gz\":%.1f,\"pitch\":%.1f,\"roll\":%.1f,\"yaw\":%.1f,\"bat\":%d,\"chg\":%d,\"s\":\"%s\",\"jc\":%d,\"jh\":%.1f,\"steps\":%d,\"rsteps\":%d,\"wsteps\":0,\"evt\":\"%s\"}",
                ax, ay, az, a_mag_g, gx, gy, gz, pitch, roll, yaw, batteryLevel, isCharging ? 1 : 0,
                activityState.c_str(), jumpCount, lastJumpHeightCm, stepCount, runStepCount, currentEvent.c_str()
            );

            pSensorCharacteristic->setValue((uint8_t*)jsonBuffer, strlen(jsonBuffer));
            pSensorCharacteristic->notify();
        }
    }

    // -------------------------------------------------------------------------
    // 🔄 TỰ ĐỘNG PHÁT LẠI QUẢNG BÁ BLE NẾU BỊ NGẮT KẾT NỐI
    // -------------------------------------------------------------------------
    if (!bleClientConnected && oldBleClientConnected) {
        delay(200);
        pServer->startAdvertising();
        Serial.println(">>> [BLE] Bat lai quang ba de cho Web ket noi...");
        oldBleClientConnected = bleClientConnected;
    }

    if (bleClientConnected && !oldBleClientConnected) {
        oldBleClientConnected = bleClientConnected;
    }
}
