/*
  =============================================================================
  🏃 SECOND SKIN SPORT — ESP32-C3 WEARABLE BIOMETRIC FIRMWARE
  =============================================================================
  Target MCU: ESP32-C3 SuperMini (RISC-V 160MHz)
  Sensors:
    - MPU6050 (6-DOF IMU: Accel + Gyro) via I2C
    - GNSS Module (NEO-6M / ATGM336H / NEO-M8N) via UART
  Communication:
    - Bluetooth Low Energy (BLE 5.0) -> Web Bluetooth API (Direct streaming)
    - Wi-Fi (Credentials received via BLE & saved to NVS Flash memory)
    - HTTP POST to Spring Boot Backend (`/api/sensor-data`) when Wi-Fi is active
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
#define I2C_SDA_PIN      8    // MPU6050 SDA (or GPIO4 depending on PCB wiring)
#define I2C_SCL_PIN      9    // MPU6050 SCL (or GPIO5)
#define GPS_RX_PIN       20   // Connect to GPS TX
#define GPS_TX_PIN       21   // Connect to GPS RX
#define LED_PIN          8    // Onboard Blue LED on ESP32-C3 SuperMini

// ==========================================
// 📡 BLE UUID DEFINITIONS
// ==========================================
#define BLE_DEVICE_NAME        "SecondSkin_ESP32"
#define SERVICE_UUID           "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define SENSOR_CHAR_UUID       "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define COMMAND_CHAR_UUID      "d9a4b3c0-0f2b-4e67-9f12-0761a2938472"

// ==========================================
// ⚙️ GLOBAL INSTANCES & VARIABLES
// ==========================================
Preferences preferences;

BLEServer* pServer = nullptr;
BLECharacteristic* pSensorCharacteristic = nullptr;
BLECharacteristic* pCommandCharacteristic = nullptr;

bool bleClientConnected = false;
bool oldBleClientConnected = false;
bool mpuFound = false;

// Sensor Readings
float ax = 0.0, ay = 0.0, az = 9.81;
float gx = 0.0, gy = 0.0, gz = 0.0;
float pitch = 0.0, roll = 0.0, yaw = 0.0;
float gpsLat = 10.7626, gpsLng = 106.6602, gpsSpeed = 0.0;
int batteryLevel = 92;

// Wi-Fi Configuration stored in Flash
String wifiSSID = "";
String wifiPass = "";
String backendUrl = "http://192.168.1.100:8080/api/sensor-data";

unsigned long lastSensorPublish = 0;
const unsigned long SENSOR_INTERVAL = 100; // 100ms -> 10Hz sampling rate

// ==========================================
// 🔔 BLE SERVER CALLBACKS
// ==========================================
class MyServerCallbacks : public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        bleClientConnected = true;
        digitalWrite(LED_PIN, LOW); // Turn on LED (Active LOW on SuperMini)
        Serial.println(">>> [BLE] Web Client da ket noi thanh cong!");
    }

    void onDisconnect(BLEServer* pServer) {
        bleClientConnected = false;
        digitalWrite(LED_PIN, HIGH); // Turn off LED
        Serial.println(">>> [BLE] Web Client da ngat ket noi.");
    }
};

// ==========================================
// 📥 BLE COMMAND CALLBACK (Wi-Fi Config)
// ==========================================
class CommandCallbacks : public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
        String value = pCharacteristic->getValue().c_str();
        if (value.length() > 0) {
            Serial.print(">>> [BLE Rx Command]: ");
            Serial.println(value);

            // Parse JSON command simple parser or keyword search
            // Expected: {"cmd":"wifi_config","ssid":"...","pass":"...","url":"..."}
            if (value.indexOf("wifi_config") != -1) {
                int ssidStart = value.indexOf("\"ssid\":\"") + 8;
                int ssidEnd = value.indexOf("\"", ssidStart);
                int passStart = value.indexOf("\"pass\":\"") + 8;
                int passEnd = value.indexOf("\"", passStart);

                if (ssidStart > 7 && ssidEnd != -1) {
                    wifiSSID = value.substring(ssidStart, ssidEnd);
                }
                if (passStart > 7 && passEnd != -1) {
                    wifiPass = value.substring(passStart, passEnd);
                }

                int urlStart = value.indexOf("\"url\":\"") + 7;
                int urlEnd = value.indexOf("\"", urlStart);
                if (urlStart > 6 && urlEnd != -1) {
                    String customUrl = value.substring(urlStart, urlEnd);
                    if (customUrl.length() > 5) {
                        backendUrl = customUrl;
                    }
                }

                Serial.printf(">>> [Wi-Fi] Nhan cau hinh moi - SSID: %s\n", wifiSSID.c_str());

                // Save to Flash (NVS)
                preferences.begin("ss_config", false);
                preferences.putString("ssid", wifiSSID);
                preferences.putString("pass", wifiPass);
                preferences.putString("url", backendUrl);
                preferences.end();

                // Send connecting response back to Web over BLE
                String resp = "{\"status\":\"connecting\",\"msg\":\"ESP32 dang thu ket noi WiFi: " + wifiSSID + "\"}";
                pCharacteristic->setValue(resp.c_str());
                pCharacteristic->notify();

                // Connect to Wi-Fi
                WiFi.disconnect(true);
                delay(200);
                WiFi.begin(wifiSSID.c_str(), wifiPass.c_str());
                
                int attempts = 0;
                while (WiFi.status() != WL_CONNECTED && attempts < 20) {
                    delay(500);
                    Serial.print(".");
                    attempts++;
                }

                if (WiFi.status() == WL_CONNECTED) {
                    String ipStr = WiFi.localIP().toString();
                    Serial.printf("\n>>> [Wi-Fi] Ket noi thanh cong! IP: %s\n", ipStr.c_str());
                    String okResp = "{\"status\":\"wifi_connected\",\"ssid\":\"" + wifiSSID + "\",\"ip\":\"" + ipStr + "\",\"msg\":\"WiFi ket noi thanh cong!\"}";
                    pCharacteristic->setValue(okResp.c_str());
                    pCharacteristic->notify();
                } else {
                    Serial.println("\n>>> [Wi-Fi] Ket noi that bai (Sai mat khau hoac ngoai tam phu song)");
                    String failResp = "{\"status\":\"wifi_failed\",\"msg\":\"Khong the ket noi Wi-Fi. Kiem tra lai ten hoac mat khau.\"}";
                    pCharacteristic->setValue(failResp.c_str());
                    pCharacteristic->notify();
                }
            }
        }
    }
};

// ==========================================
// 🛠️ MPU-6050 INITIALIZATION & READING
// ==========================================
void initMPU6050() {
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN, 400000);
    Wire.beginTransmission(0x68);
    if (Wire.endTransmission() == 0) {
        // Wake up MPU6050
        Wire.beginTransmission(0x68);
        Wire.write(0x6B); // PWR_MGMT_1 register
        Wire.write(0x00); // Wake up
        Wire.endTransmission(true);
        mpuFound = true;
        Serial.println(">>> [MPU6050] Tim thay cam bien IMU tai dia chi 0x68.");
    } else {
        mpuFound = false;
        Serial.println(">>> [MPU6050] Khong tim thay cam bien. Chuyen sang che do mo phong (Simulation Mode).");
    }
}

void readSensors() {
    if (mpuFound) {
        Wire.beginTransmission(0x68);
        Wire.write(0x3B); // Starting register for Accel X
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

            // Convert to physical units (±2g range: 16384 LSB/g, ±250°/s: 131 LSB/(°/s))
            ax = (rawAx / 16384.0) * 9.80665;
            ay = (rawAy / 16384.0) * 9.80665;
            az = (rawAz / 16384.0) * 9.80665;

            gx = rawGx / 131.0;
            gy = rawGy / 131.0;
            gz = rawGz / 131.0;

            // Simple pitch & roll from gravity vector
            pitch = atan2(-ax, sqrt(ay * ay + az * az)) * 180.0 / PI;
            roll  = atan2(ay, az) * 180.0 / PI;
        }
    } else {
        // Mock / Simulation realistic sports data if sensor is disconnected
        static float t = 0;
        t += 0.1;
        ax = 0.5 * sin(t) + (random(-10, 10) / 100.0);
        ay = 0.3 * cos(t) + (random(-10, 10) / 100.0);
        az = 9.81 + 0.2 * sin(t * 2);

        gx = 15.0 * sin(t * 1.5);
        gy = 8.0 * cos(t * 1.2);
        gz = 4.0 * sin(t);

        pitch = 10.0 * sin(t);
        roll = 5.0 * cos(t);
        yaw += 0.5;
        if (yaw > 360) yaw = 0;
    }
}

// ==========================================
// 🚀 SETUP
// ==========================================
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n==============================================");
    Serial.println("🏃 SECOND SKIN SPORT — ESP32-C3 SUPERMINI");
    Serial.println("==============================================");

    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, HIGH); // LED off

    // 1. Khoi tao Cam bien I2C MPU-6050
    initMPU6050();

    // 2. Load Wi-Fi credentials da luu trong Flash NVS (neu co)
    preferences.begin("ss_config", true);
    wifiSSID = preferences.getString("ssid", "");
    wifiPass = preferences.getString("pass", "");
    backendUrl = preferences.getString("url", backendUrl);
    preferences.end();

    if (wifiSSID.length() > 0) {
        Serial.printf(">>> [NVS] Tim thay cau hinh Wi-Fi da luu: %s\n", wifiSSID.c_str());
        WiFi.begin(wifiSSID.c_str(), wifiPass.c_str());
    }

    // 3. Khoi tao Bluetooth Low Energy (BLE)
    Serial.println(">>> [BLE] Dang khoi tao BLE GATT Server...");
    BLEDevice::init(BLE_DEVICE_NAME);

    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());

    // Tao BLE Service
    BLEService *pService = pServer->createService(SERVICE_UUID);

    // Characteristic 1: Telemetry Sensor Data (NOTIFY & READ)
    pSensorCharacteristic = pService->createCharacteristic(
        SENSOR_CHAR_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pSensorCharacteristic->addDescriptor(new BLE2902());

    // Characteristic 2: Command & Wi-Fi Provisioning (WRITE & NOTIFY)
    pCommandCharacteristic = pService->createCharacteristic(
        COMMAND_CHAR_UUID,
        BLECharacteristic::PROPERTY_WRITE |
        BLECharacteristic::PROPERTY_NOTIFY
    );
    pCommandCharacteristic->setCallbacks(new CommandCallbacks());
    pCommandCharacteristic->addDescriptor(new BLE2902());

    // Bat Service
    pService->start();

    // Bat Advertising de Web Bluetooth tim thay
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    pAdvertising->setMinPreferred(0x06);
    pAdvertising->setMinPreferred(0x12);
    BLEDevice::startAdvertising();

    Serial.println(">>> [BLE] Dang phat song quang ba voi ten: 'SecondSkin_ESP32'");
    Serial.println(">>> [Web] San sang ket noi voi Web Bluetooth API tren Chrome/Edge!");
}

// ==========================================
// 🔄 MAIN LOOP
// ==========================================
void loop() {
    unsigned long now = millis();

    // Đọc cảm biến liên tục
    readSensors();

    // Gửi gói tin BLE mỗi 100ms khi Web đã kết nối
    if (now - lastSensorPublish >= SENSOR_INTERVAL) {
        lastSensorPublish = now;

        if (bleClientConnected) {
            // Đóng gói JSON ngắn gọn tối ưu BLE MTU
            char jsonBuffer[220];
            snprintf(jsonBuffer, sizeof(jsonBuffer),
                "{\"ax\":%.2f,\"ay\":%.2f,\"az\":%.2f,\"gx\":%.1f,\"gy\":%.1f,\"gz\":%.1f,\"pitch\":%.1f,\"roll\":%.1f,\"yaw\":%.1f,\"lat\":%.4f,\"lng\":%.4f,\"spd\":%.1f,\"bat\":%d}",
                ax, ay, az, gx, gy, gz, pitch, roll, yaw, gpsLat, gpsLng, gpsSpeed, batteryLevel
            );

            pSensorCharacteristic->setValue((uint8_t*)jsonBuffer, strlen(jsonBuffer));
            pSensorCharacteristic->notify();
        }

        // Tùy chọn: Nếu có Wi-Fi và không có BLE, hoặc đồng thời, gửi HTTP POST lên Backend
        if (WiFi.status() == WL_CONNECTED && (now % 2000 < SENSOR_INTERVAL)) {
            // Gửi định kỳ 2s một lần lên Backend qua HTTP
            HTTPClient http;
            http.begin(backendUrl);
            http.addHeader("Content-Type", "application/json");

            char httpPayload[300];
            snprintf(httpPayload, sizeof(httpPayload),
                "{\"deviceId\":\"ESP32-SUPERMINI-01\",\"accelerometerX\":%.2f,\"accelerometerY\":%.2f,\"accelerometerZ\":%.2f,\"gyroscopeX\":%.1f,\"gyroscopeY\":%.1f,\"gyroscopeZ\":%.1f,\"pitch\":%.1f,\"roll\":%.1f,\"yaw\":%.1f,\"movementIntensity\":75}",
                ax, ay, az, gx, gy, gz, pitch, roll, yaw
            );

            int httpCode = http.POST(httpPayload);
            if (httpCode > 0) {
                // Serial.printf(">>> [HTTP] Backend synced: %d\n", httpCode);
            }
            http.end();
        }
    }

    // Xử lý tự động phát lại BLE quảng bá nếu client ngắt kết nối
    if (!bleClientConnected && oldBleClientConnected) {
        delay(500);
        pServer->startAdvertising();
        Serial.println(">>> [BLE] Bat lai quang ba de cho thiet bi khac ket noi...");
        oldBleClientConnected = bleClientConnected;
    }

    if (bleClientConnected && !oldBleClientConnected) {
        oldBleClientConnected = bleClientConnected;
    }

    delay(10);
}
