# Module Context: Thu Thập & Xử Lý Tín Hiệu IoT (Sensor & IoT Telemetry)

## 1. Trách Nhiệm Của Module
Module chịu trách nhiệm:
- Giao tiếp với thiết bị phần cứng cận biên (ESP32-C3 SuperMini) và cảm biến quán tính 6-DOF MPU-6050.
- Tiếp nhận dữ liệu chuỗi thời gian qua hai kênh: Web Bluetooth API (trực tiếp từ trình duyệt) và HTTP Batch REST API (`POST /api/v1/sensor/batches`).
- Xử lý thuật toán phát hiện bật nhảy (Jump Detection Algorithm): thời gian bay (airtime), độ cao nhảy ($h$), xung lực tiếp đất ($G$).
- Trích xuất đặc trưng động lực học số (Biomechanical DSP Features): Độ êm tiếp đất, nhịp bước, độ vững thân trên, độ bùng nổ (đã loại bỏ nghiệp vụ cân bằng 2 chân do phần cứng sử dụng 1 cảm biến đơn lẻ trên đầu gối).
- Hỗ trợ lựa chọn bộ môn chủ động bởi người dùng (Bóng rổ - Basketball, Chạy bộ - Running, Bóng chuyền - Volleyball) thay vì nhận diện tự động bằng FSM.
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
- [`BiomechanicalFeatureExtractor.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/BiomechanicalFeatureExtractor.java): Trích xuất độ êm tiếp đất, nhịp bước, độ vững thân trên, độ bùng nổ.
- [`SensorData.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/SensorData.java): JPA Entity lưu mẫu đo cảm biến.
- [`WebSocketConfig.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/config/WebSocketConfig.java): Cấu hình STOMP endpoint `/ws/sensor-data` và broker `/topic`.

### Frontend (React)
- [`BleContext.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/context/BleContext.jsx): Quản lý phiên làm việc cảm biến Bluetooth, lưu trữ lựa chọn môn thể thao `selectedSport` (Basketball, Running, Volleyball) và xử lý chốt buổi tập.
- [`bleService.js`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/services/bleService.js): Đóng gói Web Bluetooth API kết nối trực tiếp với ESP32-C3 qua GATT Custom Service.
- [`Sensors.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Sensors.jsx): Giao diện quản lý cảm biến, kết nối Bluetooth, bộ chọn môn thể thao trực quan (Bóng rổ, Chạy bộ, Bóng chuyền), không hiển thị thành phần pin.
- [`useSensorWebSocket.ts`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/hooks/useSensorWebSocket.ts): Custom hook quản lý vòng đời WebSocket, nhận dữ liệu telemetry và sự kiện nhảy.
- [`SensorCard.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/SensorCard.jsx): Thẻ hiển thị trực quan thông số 6 trục và thời gian thực.

---

## 3. Luồng Xử Lý Chính (Core Flow)

1. **Thu mẫu & Truyền tin từ Phần cứng:**
   - ESP32-C3 đọc IMU MPU-6050 trong vòng lặp khoảng 100Hz; FSM trên firmware xử lý từng mẫu và BLE gửi telemetry 20Hz.
   - Dữ liệu được phát qua BLE Characteristic hoặc gom nhóm gửi qua Wi-Fi lên endpoint `POST /api/v1/sensor/batches`.
2. **Xử lý Động học & Phân Biệt Bật Nhảy (Jumping) vs Chạy Bộ (Running) vs Đi Bộ (Walking):**
   - `SensorBatchService` nhận mảng `SensorReadingDTO`.
   - Với mỗi mẫu, `JumpDetectionService` đánh giá ngưỡng đa trục (Multi-axis Kinematic FSM):
     - **Pha Takeoff:** Gia tốc tổng hợp $a_{mag} > 13.5\,m/s^2$ (ngưỡng nhạy bén, nhận diện cả cú nhảy nhẹ nhàng hoặc chân trước chân sau).
     - **Pha Flight (Airborne):** $a_{mag} < 7.2\,m/s^2$; airtime hợp lệ từ 150–850ms.
       - *Chống kích hoạt nhầm khi đá chân / dơ chân:* Lọc bỏ chuyển động quay góc cực mạnh $|\omega| > 320^\circ/s$; tự động hủy trạng thái Airborne nếu chân có điểm tựa mặt đất ($8.5 \le a_{mag} \le 13.5\,m/s^2$) duy trì $\ge 3$ mẫu liên tiếp.
     - **Pha Landing:** $a_{mag} \ge 15.0\,m/s^2$ (nhận diện tiếp đất nhạy bén, bắt trọn cả tiếp đất giảm chấn/chân trước chân sau).
     - **Pha Refractory (Chống dội & Khóa bước chân):** Hấp thụ va chạm chân thứ hai và chấn động thứ cấp trong 550ms, ngăn chặn tính trùng vào bước đi/chạy.
     - **Phân loại Đi bộ (Walking):** Xung lực va chạm nhẹ $10.6 \le a_{mag} < 14.0\,m/s^2$, nhịp bước thong thả 420–950ms (65–140 spm).
     - **Phân loại Chạy bộ (Running):** Xung lực dứt khoát $14.0 \le a_{mag} \le 25.0\,m/s^2$, nhịp bước nhanh 200–480ms (125–270 spm).
     - **Trạng thái Nghỉ (Idle):** Tự động chuyển về IDLE nếu không có bước chân hoặc cú nhảy sau 2.5 giây.
   - Khi phát hiện cú nhảy, bắn sự kiện ngay lập tức tới WebSocket `/topic/jumps`.
3. **Phát Sóng Telemetry:**
   - Mẫu đo mới nhất được phát tới `/topic/sensor-telemetry` và `/topic/devices/{deviceId}/telemetry`.
   - Hook `useSensorWebSocket.ts` nhận dữ liệu, cập nhật state và giới hạn buffer 100 điểm để hiển thị trên biểu đồ Recharts.
4. **Lựa Chọn Bộ Môn & Chốt Buổi Tập:**
   - Người dùng tự chủ động chọn môn thể thao: Bóng rổ (`Basketball`), Chạy bộ (`Running`), hoặc Bóng chuyền (`Volleyball`) tại màn hình Sensors trước/trong khi bắt đầu phiên đo.
   - Buổi tập được lưu với đúng môn đã chọn, không bị ghi đè tự động bởi số lượng cú nhảy.

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
- **Loại bỏ hiển thị Pin:** Không hiển thị icon, số %, hoặc thanh đo pin trên giao diện người dùng ở cả 3 vai trò (User, Coach, Admin).
