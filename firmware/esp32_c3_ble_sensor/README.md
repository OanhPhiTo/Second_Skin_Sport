# 🏃 Hướng Dẫn Nạp Code & Kết Nối ESP32-C3 SuperMini với Web qua Bluetooth (BLE)

Tài liệu này hướng dẫn nạp mã nguồn cho bo mạch **ESP32-C3 SuperMini** và kết nối trực tiếp với ứng dụng Web **Second Skin Sport** qua Bluetooth Low Energy (BLE) trên Google Chrome / Microsoft Edge.

---

## 📌 1. Sơ Đồ Đấu Nối Phần Cứng (Wiring Diagram)

### ESP32-C3 SuperMini kết nối với Cảm biến IMU MPU-6050
| Chân ESP32-C3 SuperMini | Chân MPU-6050 | Chức năng | Ghi chú |
| :--- | :--- | :--- | :--- |
| **3V3** | **VCC** | Nguồn 3.3V | Cung cấp nguồn ổn định |
| **GND** | **GND** | Nối đất Mass | Mass chung |
| **GPIO 8** | **SDA** | I2C Data | Có thể đổi trong code |
| **GPIO 9** | **SCL** | I2C Clock | Có thể đổi trong code |

### ESP32-C3 SuperMini kết nối với Module GNSS / GPS (Tùy chọn)
| Chân ESP32-C3 SuperMini | Chân Module GPS | Chức năng |
| :--- | :--- | :--- |
| **3V3** | **VCC** | Nguồn 3.3V |
| **GND** | **GND** | Nối đất |
| **GPIO 20** | **TX** | Nhận dữ liệu NMEA |
| **GPIO 21** | **RX** | Truyền lệnh cấu hình GPS |

> 💡 **Lưu ý:** Nếu bạn chưa hàn cảm biến MPU6050 hoặc cảm biến bị lỏng, firmware sẽ **tự động kích hoạt chế độ mô phỏng thể thao (Simulation Mode)** để bạn vẫn có thể kiểm tra kết nối Bluetooth và truyền dữ liệu lên Web ngay lập tức mà không bị treo bo mạch!

---

## ⚙️ 2. Cài Đặt Trên Arduino IDE

1. **Thêm ESP32 Board URL** (nếu chưa có):
   - Vào `File` -> `Preferences` -> Mục **Additional Boards Manager URLs**, thêm link:
     ```
     https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
     ```
2. **Cài đặt Board ESP32**:
   - Vào `Tools` -> `Board` -> `Boards Manager...`, gõ `esp32` của Espressif Systems và bấm **Install** (phiên bản 2.0.14 trở lên).
3. **Cấu hình Board**:
   - Board: chọn **`ESP32C3 Dev Module`**
   - Flash Size: **`4MB`**
   - Partition Scheme: **`Default 4MB with spiffs`** hoặc **`Minimal SPIFFS (Large APPS with OTA)`**
   - **USB CDC On Boot:** chọn **`Enabled`** *(Rất quan trọng trên dòng ESP32-C3 SuperMini để in Serial Monitor qua cổng Type-C)*
   - CPU Frequency: **`160MHz (WiFi/BT)`**
4. **Cổng nạp (Port):** Chọn cổng COM của ESP32-C3 (ví dụ `COM3`, `COM5`).
5. Bấm nút **Upload (→)** để nạp code.

---

## 🌐 3. Cách Kết Nối với Trang Web Second Skin Sport

1. Mở trang web ứng dụng ở trang **Sensor Management** (`/sensors`).
2. Đảm bảo máy tính/laptop hoặc điện thoại Android đã **bật Bluetooth**.
3. Sử dụng trình duyệt **Google Chrome** hoặc **Microsoft Edge**.
4. Bấm nút **"Quét & Kết Nối Bluetooth"**:
   - Cửa sổ ghép nối Bluetooth của trình duyệt sẽ hiện lên.
   - Chọn thiết bị có tên **`SecondSkin_ESP32`**.
   - Bấm **Pair / Ghép nối**.
5. **Xem dữ liệu trực tiếp:**
   - Dữ liệu 6 trục (Gia tốc X/Y/Z, Con quay X/Y/Z, Góc nghiêng Pitch/Roll) sẽ được stream trực tiếp lên biểu đồ và thẻ cảm biến theo thời gian thực (tần số 10Hz).
   - Bạn có thể bật công tắc **"Tự động đồng bộ lên Server Backend"** để Web lưu các gói tin này vào database Spring Boot.
6. **Chủ động cấu hình Wi-Fi:**
   - Ngay trên bảng điều khiển Bluetooth ở Web, nhập Tên Wi-Fi (SSID) và Mật khẩu nhà bạn.
   - Bấm **"Gửi Cấu Hình Xuống ESP32"**.
   - ESP32 nhận lệnh qua BLE, lưu vào bộ nhớ Flash vĩnh viễn và tự động kết nối Wi-Fi, sau đó báo địa chỉ IP thành công về Web.
