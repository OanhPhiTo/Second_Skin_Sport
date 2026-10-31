# Module Context: Thu Thập & Xử Lý Tín Hiệu IoT (Sensor & IoT Telemetry)

## 1. Trách Nhiệm Của Module
Module chịu trách nhiệm:
- Giao tiếp với thiết bị phần cứng cận biên (ESP32-C3 SuperMini) và cảm biến quán tính 6-DOF MPU-6050.
- Tiếp nhận dữ liệu chuỗi thời gian qua hai kênh: Web Bluetooth API (trực tiếp từ trình duyệt) và HTTP Batch REST API (`POST /api/v1/sensor/batches`).
- Xử lý thuật toán phát hiện bật nhảy (Jump Detection Algorithm): thời gian bay (airtime), độ cao nhảy ($h$), xung lực tiếp đất ($G$).
- Trích xuất đặc trưng động lực học số (Biomechanical DSP Features).
- Phát sóng dữ liệu thời gian thực tới người dùng thông qua các topic WebSocket STOMP.

---

## 2. Các Class, Component & Tệp Quan Trọng

### Firmware & Công Cụ Mô Phỏng
- [`esp32_c3_ble_sensor.ino`](file:///d:/EXE101/Second_Skin_Sport/firmware/esp32_c3_ble_sensor/esp32_c3_ble_sensor.ino): Mã nguồn firmware ESP32-C3 SuperMini đọc MPU-6050, hỗ trợ fallback tự động sang chế độ mô phỏng thể thao nếu cảm biến chưa hàn/lỏng.
- [`simulate_squad_telemetry.py`](file:///d:/EXE101/Second_Skin_Sport/firmware/esp32_c3_ble_sensor/simulate_squad_telemetry.py): Script mô phỏng dữ liệu telemetry cả đội bóng phục vụ kiểm thử.

### Backend (Spring Boot)
- [`SensorBatchController.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/controller/SensorBatchController.java): Endpoint nhận lô dữ liệu cảm biến `POST /api/v1/sensor/batches`.
- [`SensorBatchService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/SensorBatchService.java): Phân tích lô dữ liệu, gọi `JumpDetectionService`, lưu trữ và phát tin qua WebSocket.
- [`JumpDetectionService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/JumpDetectionService.java): Thuật toán máy trạng thái phát hiện pha dậm nhảy, bay trên không, và tiếp đất.
- [`BiomechanicalFeatureExtractor.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/BiomechanicalFeatureExtractor.java): Trích xuất độ êm tiếp đất, đối xứng hai chân, nhịp bước, độ vững thân trên.
- [`SensorData.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/SensorData.java): JPA Entity lưu mẫu đo cảm biến.
- [`WebSocketConfig.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/config/WebSocketConfig.java): Cấu hình STOMP endpoint `/ws/sensor-data` và broker `/topic`.

### Frontend (React)
- [`bleService.js`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/services/bleService.js): Đóng gói Web Bluetooth API kết nối trực tiếp với ESP32-C3 qua GATT Custom Service.
- [`Sensors.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Sensors.jsx): Giao diện quản lý cảm biến, kết nối Bluetooth, và cấu hình Wi-Fi xuống ESP32.
- [`useSensorWebSocket.ts`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/hooks/useSensorWebSocket.ts): Custom hook quản lý vòng đời WebSocket, nhận dữ liệu telemetry và sự kiện nhảy.
- [`SensorCard.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/SensorCard.jsx): Thẻ hiển thị trực quan thông số 6 trục và thời gian thực.

---

## 3. Luồng Xử Lý Chính (Core Flow)

1. **Thu mẫu & Truyền tin từ Phần cứng:**
   - ESP32-C3 đọc IMU MPU-6050 tần số 10Hz qua giao tiếp I2C.
   - Dữ liệu được phát qua BLE Characteristic hoặc gom nhóm gửi qua Wi-Fi lên endpoint `POST /api/v1/sensor/batches`.
2. **Xử lý Động học & Phát Hiện Nhảy:**
   - `SensorBatchService` nhận mảng `SensorReadingDTO`.
   - Với mỗi mẫu, `JumpDetectionService` đánh giá ngưỡng gia tốc:
     - Pha Takeoff: Gia tốc tổng hợp $a_{mag} > 1.8G$.
     - Pha Flight: $a_{mag} < 0.35G$ (trạng thái không trọng lượng), bắt đầu bấm giờ airtime.
     - Pha Landing: $a_{mag} > 2.2G$, kết thúc cú nhảy, tính chiều cao $h = \frac{1}{8} g \cdot t_{flight}^2$ và lực va đập đỉnh.
   - Khi phát hiện cú nhảy, bắn sự kiện ngay lập tức tới WebSocket `/topic/jumps`.
3. **Phát Sóng Telemetry:**
   - Mẫu đo mới nhất được phát tới `/topic/sensor-telemetry` và `/topic/devices/{deviceId}/telemetry`.
   - Hook `useSensorWebSocket.ts` nhận dữ liệu, cập nhật state và giới hạn buffer 100 điểm để hiển thị trên biểu đồ Recharts.

---

## 4. API & Dependencies Liên Quan
- `POST /api/v1/sensor/batches`
- `POST /api/sensor-data`
- `GET /api/sensor-data/latest`
- `GET /api/sensor-data/session/{sessionId}`
- WebSocket topics: `/topic/sensor-telemetry`, `/topic/devices/{deviceId}/telemetry`, `/topic/jumps`, `/topic/devices/{deviceId}/jumps`.

---

## 5. Quy Tắc & Lưu Ý Khi Chỉnh Sửa Module
- **Bắt buộc tuân thủ quy ước đơn vị:** Gia tốc luôn là $m/s^2$ (hoặc G khi chuẩn hóa va đập); vận tốc góc luôn là $^\circ/s$.
- **Vòng đời WebSocket:** Bắt buộc gọi `ws.close()` trong hook cleanup khi unmount.
- **Giới hạn điểm vẽ:** Không đẩy quá 100 điểm realtime lên state của biểu đồ.
- **Kháng lỗi phần cứng:** Firmware luôn giữ cơ chế tự động chuyển sang chế độ mô phỏng thể thao (Simulation Mode) nếu không đọc được MPU6050 qua I2C.

