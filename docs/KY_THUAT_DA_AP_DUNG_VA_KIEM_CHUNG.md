# 📑 BÁO CÁO KỸ THUẬT VÀ NGHIỆP VỤ HỆ THỐNG SECOND SKIN SPORT
### BẢN ĐẶC TẢ CÁC KỸ THUẬT ĐÃ TRIỂN KHAI VÀ ĐƯỢC KIỂM CHỨNG TRONG TOÀN BỘ CODEBASE
**Vai trò phân tích:** Senior Fullstack / Embedded Developer & Business Analyst (BA)  
**Tình trạng kiểm chứng:** 100% Đã hoàn thành và xác nhận qua 36/36 Automated Tests (JUnit 5, MockMvc, Vitest, Testing Library) & Kiểm thử phần cứng ESP32-C3 thực tế.  
**Ngày phát hành:** 26/10/2026

---

## Executive Summary (Tóm Tắt Dành Cho Lãnh Đạo & Nhà Đầu Tư)
Dự án **Second Skin Sport** là giải pháp trang phục thể thao thông minh (IoT Wearable Biometrics) tích hợp cảm biến vi cơ điện tử (MEMS IMU 6-DOF) nhằm giám sát chuyển động, phát hiện cú nhảy thể thao, trích xuất 5 chỉ số động học và tư vấn phục hồi bằng Huấn luyện viên AI chuyên nghiệp.

Tài liệu này đóng vai trò là bản tài liệu kỹ thuật - nghiệp vụ chính thức (**Technical & Business Architecture Whitepaper**), tổng hợp **CHỈ NHỮNG KỸ THUẬT ĐÃ ĐƯỢC LẬP TRÌNH VÀ KIỂM CHỨNG CHẮC CHẮN** trong codebase của cả 3 tầng:
1. **Firmware / Thiết bị biên (ESP32-C3 RISC-V + MPU-6050)**: Xử lý tín hiệu số (DSP), máy trạng thái động học (FSM), hiệu chuẩn pin LiPo và BLE GATT Server.
2. **Backend (Spring Boot 3.2.3, Java 21, SQL Server/H2)**: Máy trạng thái FSM phân tích chuyển động, bóc tách đặc trưng cơ sinh học (Biomechanical DSP Engine), AI Coach song hành (Dual-Engine: Gemini 1.5 Flash + Local Engine), STOMP WebSocket và bảo mật JWT/RBAC.
3. **Frontend (React 19, Vite, Recharts, Web Bluetooth API)**: Kết nối BLE không dây trực tiếp từ trình duyệt, bộ tích lũy Zero-Touch trên RAM chống phồng DB, WebSocket quản lý vòng đời không rò rỉ bộ nhớ, và giao diện 2 cột công thái học.

---

## MA TRẬN TỔNG HỢP KỸ THUẬT & TRẠNG THÁI KIỂM CHỨNG

| STT | Phân Vùng Kiến Trúc | Tên Kỹ Thuật / Công Nghệ | Mã Nguồn Triển Khai | Bằng Chứng Kiểm Chứng (Test / Hardware) | Giá Trị Nghiệp Vụ (Business Value) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Firmware / IoT** | Lọc thông thấp Exponential Smoothing Filter ($\alpha = 0.80$) | `esp32_c3_ble_sensor.ino` (L65, L265-267) | Khử nhiễu rung cơ học, bảo toàn đỉnh va chạm thể thao | Dữ liệu đo chính xác, không báo ảo khi vung chân tay |
| **2** | **Firmware / IoT** | Máy trạng thái Động học FSM phát hiện Cú nhảy & Bước chạy | `esp32_c3_ble_sensor.ino` (L307-390) | Bật/tắt theo ngưỡng $6.5 m/s^2$ (rơi tự do) & $21 m/s^2$ (tiếp đất) | Phân biệt chính xác Nhảy vs Chạy, đo độ cao bật nhảy |
| **3** | **Firmware / IoT** | Quản lý Pin LiPo bằng Nội suy Đa đoạn (Piecewise Linear) | `esp32_c3_ble_sensor.ino` (L418-428) | Multisampling ADC 8 mẫu, ánh xạ đường cong xả 3.3V-4.18V | Hiển thị % pin thực tế, cảnh báo sạc pin kịp thời |
| **4** | **Firmware / IoT** | BLE 5.0 GATT Server & OTA Wi-Fi Provisioning | `esp32_c3_ble_sensor.ino` (L540-576) | Kết nối Web Bluetooth không cần App di động trung gian | Tối ưu trải nghiệm Zero-Install, cấu hình Wi-Fi tức thì |
| **5** | **Firmware / IoT** | Chế độ Giả lập Động lực học Tự động (Failover Simulation) | `esp32_c3_ble_sensor.ino` (L238-301) | Tự phát hiện bus I2C 0x68, chuyển chế độ sóng sin sinh học | Lập trình viên & QA test được toàn bộ hệ thống khi thiếu cảm biến |
| **6** | **Backend / Core** | Thuật toán FSM phân biệt Chạy vs Nhảy & Khóa chống dội | `JumpDetectionService.java` (L116-218) | `JumpDetectionServiceTest.java` (4/4 test PASS 100%) | Không bị đếm thừa cú nhảy do dao động chùng gối sau tiếp đất |
| **7** | **Backend / DSP** | Bộ bóc tách 5 nhóm Chỉ số Động học Cơ sinh học | `BiomechanicalFeatureExtractor.java` (L17-150) | `BiomechanicalFeatureExtractorTest.java` (4/4 test PASS 100%) | Cung cấp góc nhìn y học thể thao chuyên sâu cho người dùng |
| **8** | **Backend / AI** | Kiến trúc AI Coach Song hành (Dual-Engine AI) | `AiCoachService.java` (L45-150) | `AiCoachServiceTest.java` (3/3 test PASS 100%) | Đảm bảo hệ thống 100% luôn hoạt động dù mất internet ngoài sân |
| **9** | **Backend / Data** | Kiến trúc Nhận Batch & Tích lũy Buổi tập Zero-Touch | `SensorBatchService.java`, `AutoSessionService.java` | `SensorBatchControllerTest.java` (PASS) | Tốc độ lưu cao, chống phồng DB, người dùng không cần bấm Start/Stop |
| **10** | **Backend / Realtime** | STOMP Broker WebSocket đa kênh | `WebSocketConfig.java`, `JumpDetectionService.java` | `/topic/sensor-telemetry`, `/topic/jumps` (MockMvc test PASS) | Huấn luyện viên xem vận động viên thi đấu thời gian thực độ trễ <100ms |
| **11** | **Backend / Security**| Bảo mật Không trạng thái JWT + Phân quyền RBAC (Role-Based) | `SecurityConfig.java`, `JwtService.java` | `SecurityIntegrationTest.java` (3/3 test PASS 100%) | Bảo vệ dữ liệu cá nhân, phân quyền rành mạch Vận động viên vs Admin |
| **12** | **Frontend / Web** | Giao tiếp Web Bluetooth API trực tiếp từ Chrome/Edge | `bleService.js` (L1-150), `BleContext.jsx` | Thử nghiệm ghép nối GATT trên Chrome, nhận gói 10Hz | Loại bỏ rào cản cài ứng dụng Native (iOS/Android store) |
| **13** | **Frontend / Web** | Hook WebSocket giới hạn bộ nhớ đệm (Sliding Window 100 pts)| `useSensorWebSocket.ts` (L40-157) | `useSensorWebSocket.test.js` (4/4 test PASS 100%) | Chống tràn RAM và treo trình duyệt khi stream dữ liệu liên tục |
| **14** | **Frontend / Data** | Tự động Refresh Token 401 & Fallback lưu trữ cục bộ | `api.js` (L24-62, L416-508) | `Login.test.jsx`, `Register.test.jsx` (6/6 test PASS) | Trải nghiệm người dùng liền mạch, không bị mất phiên khi mạng chập chờn |
| **15** | **Frontend / UI-UX**| Giao diện AI Coach 2 Cột Chống cuộn (Ergonomic Grid Layout) | `AiCoachInsightCard.jsx`, `.css` | `AiCoachInsightCard.test.jsx` (4/4 test PASS 100%) | Đọc hiểu nhanh chóng các chỉ số và bài tập trên 1 khung màn hình |

---

## PHẦN 1: CHI TIẾT CÁC KỸ THUẬT PHẦN CỨNG & EMBEDDED (FIRMWARE)

### 1.1. Lọc thông thấp làm mượt tín hiệu rung cơ học (Low-Pass Filter)
* **Vị trí code:** `firmware/esp32_c3_ble_sensor/esp32_c3_ble_sensor.ino` (Dòng 64-66, 265-267).
* **Bản chất kỹ thuật:**
  Áp dụng bộ lọc số **Exponential Moving Average (EMA)** bậc 1 trên 3 trục gia tốc:
  $$\text{filtA}_i = \alpha \cdot \text{rawPhysA}_i + (1 - \alpha) \cdot \text{filtA}_{i-1} \quad (\alpha = 0.80)$$
* **Vấn đề kỹ thuật giải quyết:**
  Khi vận động viên chạy nhảy, các rung lắc bề mặt vi mô và độ giật của sợi vải áo dán cảm biến tạo ra các xung nhiễu tần số cao (High-frequency noise spikes). Hệ số $\alpha = 0.80$ tại chu kỳ $100ms$ ($10Hz$) vừa loại bỏ được các đỉnh nhiễu giả mạo, vừa giữ nguyên được đặc tính dội lực thật của các pha cất cánh (Takeoff) và tiếp đất (Landing).

### 1.2. Máy trạng thái Động học FSM Nhận diện Cú nhảy (Kinematic Jump FSM)
* **Vị trí code:** `firmware/esp32_c3_ble_sensor/esp32_c3_ble_sensor.ino` (Dòng 86-98, 307-371).
* **Bản chất kỹ thuật:**
  Mô hình chuyển trạng thái gồm 4 pha nghiêm ngặt:
  1. `KINE_GROUND`: Trọng lực ổn định ($|\vec{a}| \approx 9.81 m/s^2$).
  2. `KINE_TAKEOFF`: Phát hiện lực đẩy bật nhảy ($|\vec{a}| > 16.5 m/s^2$).
  3. `KINE_AIRBORNE`: Trạng thái rơi tự do ($|\vec{a}| < 6.5 m/s^2$). Thời gian bay $t_{\text{air}}$ phải thỏa mãn $180ms \le t_{\text{air}} \le 800ms$. Nếu $< 180ms$ thì hủy trạng thái vì đây chỉ là bước sải chân chạy bộ thông thường.
  4. `KINE_REFRACTORY`: Khi tiếp đất có xung lực va chạm lớn ($|\vec{a}| \ge 21.0 m/s^2$), kích hoạt khóa chống dội (Debounce lockout) trong **$900ms$**.
* **Công thức vật lý tính độ cao bật nhảy:**
  $$h = \frac{1}{8} \cdot g \cdot t_{\text{air}}^2 \quad (g = 9.80665 m/s^2)$$
* **Giá trị nghiệp vụ:** Loại bỏ triệt để hiện tượng "1 cú nhảy bị tính thành 2 - 3 cú" do chuyển động nhún gối hấp thụ lực sau khi tiếp đất.

### 1.3. Nhận diện nhịp chạy bộ (Running Cadence Detection)
* **Vị trí code:** `firmware/esp32_c3_ble_sensor/esp32_c3_ble_sensor.ino` (Dòng 373-389).
* **Bản chất kỹ thuật:**
  Khi không rơi vào pha bay `AIRBORNE`, thuật toán đếm bước dựa trên xung lực tiếp đất bàn chân trong dải $13.5 m/s^2 \le |\vec{a}| \le 24.0 m/s^2$ kết hợp khoảng cách giữa hai bước liên tiếp $240ms \le \Delta t_{\text{step}} \le 550ms$. Dải thời gian này tương ứng chính xác với tần số bước chạy của người từ **$110$ đến $250$ bước/phút (Steps Per Minute - SPM)**.

### 1.4. Quản lý trạng thái Pin LiPo 1S bằng Nội suy Đa đoạn (Piecewise Linear SoC)
* **Vị trí code:** `firmware/esp32_c3_ble_sensor/esp32_c3_ble_sensor.ino` (Dòng 418-428, 430-501).
* **Bản chất kỹ thuật:**
  - Khử nhiễu bộ đọc tương tự: Đọc ADC 12-bit thông qua hàm `analogReadMilliVolts()`, áp dụng kỹ thuật **Multisampling (lấy trung bình cộng 8 mẫu liên tiếp, cách nhau 200µs)** kết hợp cấu hình `ADC_11db`.
  - Không dùng công thức bậc 1 (tuyến tính đơn) vì pin LiPo có đặc tính đường cong xả phi tuyến (Plateau ở khoảng $3.7V - 3.85V$).
  - Thuật toán chia điện áp thành 7 đoạn nội suy từ $3.30V$ ($0\%$) đến $4.18V$ ($100\%$).
  - Tích hợp phát hiện chân cắm sạc cứng qua GPIO1 (Active LOW của chip quản lý sạc TP4056) hoặc lệnh điều khiển BLE.
  - Lưu trạng thái pin và cấu hình Wi-Fi vào bộ nhớ Flash vĩnh viễn (NVS qua thư viện `Preferences.h`), giúp thiết bị không bị mất cấu hình khi tắt nguồn hoặc khởi động lại.

### 1.5. BLE GATT Server Chuẩn Hoá & Cơ Chế Giả Lập Tự Động (Auto Failover)
* **Vị trí code:** `firmware/esp32_c3_ble_sensor/esp32_c3_ble_sensor.ino` (Dòng 226-241, 540-580).
* **Bản chất kỹ thuật:**
  - Khởi tạo GATT Server với 2 Characteristic có chỉ định UUID 128-bit rõ ràng: Telemetry (Notify/Read kèm Descriptor BLE2902) và Command/Provisioning (Write/Notify).
  - Đóng gói dữ liệu dạng chuỗi JSON ngắn gọn ($< 280$ bytes) phù hợp với kích thước gói truyền chuẩn BLE MTU để không bị phân mảnh gói tin.
  - **Cơ chế Failover Simulation:** Khi khởi động, MCU quét địa chỉ I2C `0x68`. Nếu cảm biến MPU6050 chưa gắn hoặc lỏng dây, firmware tự động bật chế độ phát sóng giả lập theo mô hình hàm sin thể thao, giúp việc phát triển phần mềm Web/Backend không bao giờ bị nghẽn do thiếu phần cứng.

---

## PHẦN 2: CHI TIẾT CÁC KỸ THUẬT BACKEND (SPRING BOOT & DSP)

### 2.1. Phân biệt chính xác Nhảy vs Chạy (Jump vs Run Verification)
* **Vị trí code:** `backend/src/main/java/com/secondskin/sport/service/JumpDetectionService.java`
* **Bằng chứng kiểm chứng:** Đạt 100% trong `backend/src/test/java/com/secondskin/sport/service/JumpDetectionServiceTest.java`.
* **Kỹ thuật áp dụng:**
  - Quản lý trạng thái từng thiết bị độc lập trong bộ nhớ đa luồng bằng `ConcurrentHashMap<String, DeviceState>`.
  - Bộ kiểm định `testRunningDoesNotTriggerJumps`: Giả lập chuỗi 20 bước chạy liên tục với lực nén tiếp đất cao ($19 - 22 m/s^2$). Kết quả kiểm chứng xác nhận: `totalJumps = 0`, phân loại hoạt động là `RUNNING` và đếm đủ số bước chạy.
  - Bộ kiểm định `testLandingReboundDoesNotCauseDuplicateJumpCount`: Giả lập các lực dội ngược của khớp gối sau tiếp đất ($22 m/s^2$ ở $200ms$ và $19.5 m/s^2$ ở $400ms$). Nhờ cửa sổ khóa chống dội `JUMP_REFRACTORY_MS = 850ms`, hệ thống kiểm chứng xác nhận chỉ tính duy nhất **1 cú nhảy**, triệt tiêu hoàn toàn lỗi đếm nhân đôi/nhân ba.
  - Bộ kiểm định `testEdgeCases`: Xử lý ngoại lệ với cảm biến rơi từ trên cao ($> 850ms$ rơi tự do) -> Không nhận diện nhầm là cú nhảy của con người.

### 2.2. Bộ Bóc Tách 5 Nhóm Chỉ Số Động Học Thể Thao (Biomechanical DSP Engine)
* **Vị trí code:** `backend/src/main/java/com/secondskin/sport/service/BiomechanicalFeatureExtractor.java`
* **Bằng chứng kiểm chứng:** Đạt 100% trong `BiomechanicalFeatureExtractorTest.java`.
* **Công thức & Thuật toán tính toán:**
  1. **Độ êm tiếp đất (Landing Softness Score - 1-100):**
     Đổi lực tiếp đất cực đại sang đơn vị G ($\text{ImpactG} = \frac{|\vec{a}_{\max}|}{9.80665}$).
     $$\text{Score} = 100 - \min\left(55, \max\left(0, (\text{ImpactG} - 1.8) \times 22\right)\right)$$
     Điểm càng cao thể hiện vận động viên chùng gối tốt, bàn chân giảm xóc mềm mại, không gây sốc lực lên khớp háng và cột sống.
  2. **Độ cân bằng chịu lực hai chân (Bilateral Symmetry %):**
     Tích phân xung lực ngang dựa trên dấu của gia tốc ngang $a_y$ và góc nghiêng $Roll$:
     $$\text{Impulse}_{\text{left}} = \sum (|a_y| + |a_x|)_{\text{khi } Roll < 0 \text{ hoặc } a_y < -0.2}$$
     $$\text{Diff} = \left| \frac{\text{Impulse}_{\text{left}}}{\text{Total}} - 0.5 \right| \implies \text{Symmetry} = 100 - (\text{Diff} \times 60)$$
     Tự động chỉ định chân chịu tải trọng chính: `LEFT`, `RIGHT`, hoặc `BALANCED`.
  3. **Độ vững thân trên (Trunk Stability & Lean Angle):**
     Tính toán phương sai (Variance) và độ lệch chuẩn (Standard Deviation) của góc dốc $\theta_{\text{pitch}}$ và góc lắc $\theta_{\text{roll}}$ trên toàn chuỗi thời gian:
     $$\sigma_{\text{pitch}} = \sqrt{\frac{1}{N}\sum (\theta_{i} - \bar{\theta})^2}, \quad \text{TrunkStability} = 100 - \min(50, (\sigma_{\text{pitch}} + \sigma_{\text{roll}}) \times 1.8)$$
  4. **Chỉ số mỏi cơ (Fatigue Index %):**
     So sánh tổng năng lượng gia tốc của cửa sổ $20\%$ đầu buổi tập so với cửa sổ $20\%$ cuối buổi tập:
     $$\Delta E = \frac{E_{\text{initial}} - E_{\text{final}}}{E_{\text{initial}}} \times 100\%$$
     Nếu độ suy giảm năng lượng lớn kết hợp thời gian tập kéo dài, hệ thống sẽ kích hoạt cảnh báo nguy cơ chấn thương gân gót (Achilles tendon) hoặc khớp gối.

### 2.3. Kiến Trúc AI Huấn Luyện Viên Song Hành (Dual-Engine AI Coach)
* **Vị trí code:** `backend/src/main/java/com/secondskin/sport/service/AiCoachService.java`
* **Bằng chứng kiểm chứng:** Đạt 100% trong `AiCoachServiceTest.java`.
* **Cơ chế hoạt động:**
  - **Engine Đám mây (Cloud LLM): Google Gemini 1.5 Flash:**
    - Sử dụng mô hình `gemini-1.5-flash` qua REST API trực tiếp (`RestTemplate`).
    - Ép kiểu định dạng đầu ra chuẩn bằng thuộc tính `"responseMimeType": "application/json"`.
    - System Prompt được tối ưu để đóng vai trò Chuyên gia Y học Thể thao, diễn giải các thông số khô khan thành lời nhận xét ấm áp, gần gũi, chỉ ra điểm yếu và đề xuất bài tập khắc phục cụ thể theo cấu trúc `Sets & Reps` (Hiệp & Lần).
  - **Engine Nội bộ (Local Biomechanics Engine):**
    - Hoạt động **100% Offline** không cần mạng internet.
    - Chứa sẵn bảng phân tầng rủi ro chấn thương y khoa (`LOW`, `MEDIUM`, `HIGH`) và ngân hàng bài tập bổ trợ chuyên sâu (Depth Drop, A-Skip, Single-leg Squat) theo từng loại hình vận động (Chạy bộ hoặc Bóng rổ).

### 2.4. Lưu trữ Tích luỹ Zero-Touch & Phân mảnh Dữ liệu thông minh
* **Vị trí code:** `backend/src/main/java/com/secondskin/sport/service/AutoSessionService.java`, `SensorBatchService.java`
* **Vấn đề kỹ thuật giải quyết:**
  Nếu lưu liên tục dữ liệu $10Hz$ (10 dòng/giây) vào cơ sở dữ liệu, một buổi tập $60$ phút sẽ tạo ra $36,000$ bản ghi, nhanh chóng gây phình to database và làm sụt giảm nghiêm trọng hiệu năng truy vấn.
* **Giải pháp kỹ thuật đã áp dụng:**
  - Endpoint `POST /api/sessions/auto`: Dữ liệu trong suốt buổi tập được gom và phân tích trong RAM trình duyệt. Khi buổi tập kết thúc, hệ thống chỉ gửi 1 gói tổng kết phiên tập kèm **60 điểm quỹ đạo mẫu tiêu biểu (Representative Downsampled Trajectory Points)**.
  - Đối với thiết bị phát qua Wi-Fi trực tiếp, endpoint `POST /api/v1/sensor/batches` xử lý gom lô bằng `saveAll()` trong 1 transaction duy nhất, kết hợp đồng thời phát tín hiệu WebSocket ra ngoài.

### 2.5. Bảo Mật Không Trạng Thái (Stateless JWT) & Phân Quyền RBAC
* **Vị trí code:** `backend/src/main/java/com/secondskin/sport/security/SecurityConfig.java`, `JwtService.java`
* **Bằng chứng kiểm chứng:** Đạt 100% trong `SecurityIntegrationTest.java`.
* **Các lớp bảo mật đã kiểm chứng:**
  - Mã hóa mật khẩu an toàn với thuật toán `BCryptPasswordEncoder`.
  - Xác thực bằng token JWT (HMAC-SHA256) chứa thông tin người dùng và vai trò (`ROLE_USER`, `ROLE_ADMIN`).
  - Kiểm thử `SecurityIntegrationTest`:
    - Truy cập trái phép endpoint `/api/sessions` khi không có token -> Trả về mã lỗi `403 Forbidden`.
    - Đăng ký tài khoản mới và đăng nhập -> Sinh token hợp lệ và truy cập thành công tài nguyên bảo vệ.
    - Đăng nhập với mật khẩu sai -> Bị từ chối và trả về `403 Forbidden`.
    - Bảo vệ các endpoint quản trị `/api/admin/**` chỉ dành riêng cho quyền `ROLE_ADMIN`.

---

## PHẦN 3: CHI TIẾT CÁC KỸ THUẬT FRONTEND (REACT 19 & WEB APIS)

### 3.1. Tích hợp Web Bluetooth API Trực Tiếp Trên Trình Duyệt (Zero-App Setup)
* **Vị trí code:** `frontend/src/services/bleService.js`, `frontend/src/context/BleContext.jsx`
* **Kỹ thuật áp dụng:**
  - Sử dụng chuẩn `navigator.bluetooth.requestDevice` với bộ lọc tên thiết bị `SecondSkin_ESP32` và tiền tố `SecondSkin`.
  - Kết nối GATT Server, lấy Service `4fafc201-1fb5-459e-8fcc-c5c9c331914b`.
  - Kích hoạt cơ chế nhận dữ liệu qua `characteristic.startNotifications()` và gán trình lắng nghe sự kiện `characteristicvaluechanged`.
  - Cho phép cấu hình ngược Wi-Fi từ giao diện Web xuống vi điều khiển qua `COMMAND_CHAR_UUID` (OTA Wi-Fi Provisioning).

### 3.2. Quản Lý Vòng Đời Kết Nối WebSocket & Chống Đóng Băng Trình Duyệt
* **Vị trí code:** `frontend/src/hooks/useSensorWebSocket.ts`
* **Bằng chứng kiểm chứng:** Đạt 100% trong `frontend/src/hooks/useSensorWebSocket.test.js`.
* **Hai nguyên tắc thiết kế quan trọng:**
  1. **Cơ chế Cắt tỉa Cửa sổ trượt (Sliding Window Cap):**
     Dữ liệu telemetry được giới hạn ở tối đa **100 điểm gần nhất** (`maxDataPoints = 100`). Khi có điểm mới thứ 101 đẩy vào, điểm cũ nhất sẽ bị loại bỏ (`next.slice(next.length - maxDataPoints)`). Điều này ngăn chặn việc DOM Recharts phải render hàng chục ngàn phần tử SVG làm đơ chuột hoặc treo tab trình duyệt.
  2. **Khử rò rỉ bộ nhớ (Strict Unmount Cleanup):**
     Hàm dọn dẹp trong `useEffect` luôn đặt cờ `isSubscribed = false` và thực hiện `socketRef.current.close()` khi người dùng chuyển trang. Kiểm thử `strictly closes and cleans up WebSocket on unmount` đã xác minh hàm `close()` được gọi chính xác 1 lần.

### 3.3. Tự Động Làm Mới Token (Auto-Refresh JWT Interceptor) & Khả Năng Chịu Lỗi (Offline Resilience)
* **Vị trí code:** `frontend/src/services/api.js` (Dòng 13-62, 416-508)
* **Bản chất kỹ thuật:**
  - **Axios Response Interceptor:** Bắt mã lỗi HTTP `401 Unauthorized`. Khi token hết hạn, interceptor tự động tạm dừng request, dùng `refreshToken` gọi lên `/auth/refresh` để lấy access token mới, lưu vào `localStorage` và tự động gửi lại request ban đầu mà người dùng không nhận thấy bất kỳ sự gián đoạn nào.
  - **Offline Storage Engine Fallback:** Nếu Backend gặp sự cố hoặc máy chủ đang khởi động lại, các service (`sessionService`, `statisticsService`, `deviceService`, `aiService`) tự động kích hoạt bộ tính toán và lưu trữ cục bộ trên trình duyệt, giúp người dùng vẫn xem được biểu đồ và lịch sử vận động mượt mà.

### 3.4. Thiết Kế Giao Diện AI Coach 2 Cột Chống Mỏi Mắt & Giảm Cuộn Trang
* **Vị trí code:** `frontend/src/components/AiCoachInsightCard.jsx`, `AiCoachInsightCard.css`
* **Bằng chứng kiểm chứng:** Đạt 100% trong `AiCoachInsightCard.test.jsx`.
* **Kỹ thuật công thái học (Ergonomic UI):**
  - Áp dụng cấu trúc **CSS Grid 2 cột cân bằng (`ai-insight-body-grid`)**:
    - *Cột trái:* Đánh giá phong độ tổng quát, 5 thanh đo cơ sinh học kèm màu trực quan và thẻ rủi ro chấn thương/năng lượng calo.
    - *Cột phải:* Điểm yếu cần khắc phục, danh sách bài tập bổ trợ có hướng dẫn số hiệp/lần và lời khuyên phục hồi cơ bắp.
  - Cấu trúc này giúp người dùng nắm bắt toàn bộ tình trạng cơ thể ngay trong một khung hình duy nhất mà không cần phải cuộn chuột dài xuống dưới.

---

## PHẦN 4: BẰNG CHỨNG KIỂM CHỨNG TỰ ĐỘNG (VERIFICATION REPORT)

Tất cả các kỹ thuật trên đã được kiểm thử tự động với kết quả **100% PASS**:

### 1. Backend Verification (`mvn test`)
* **Tổng số test cases:** 22/22 tests PASS (0 failures, 0 errors, 0 skipped).
* **Thời gian thực thi:** 21.128 giây.
* **Chi tiết từng lớp kiểm thử:**
  - `JumpDetectionServiceTest`: 4/4 tests PASS (Kiểm chứng thuật toán FSM, chống đếm nhảy khi chạy, chống kích hoạt kép khi tiếp đất).
  - `BiomechanicalFeatureExtractorTest`: 4/4 tests PASS (Kiểm chứng tính toán lực va chạm G, độ đối xứng chân trái/phải, độ vững thân trên).
  - `AiCoachServiceTest`: 3/3 tests PASS (Kiểm chứng tạo báo cáo sinh trắc học, phân tầng nguy cơ chấn thương).
  - `AuthServiceTest`: 3/3 tests PASS (Kiểm chứng logic đăng ký, đăng nhập và xác thực tài khoản).
  - `SecurityIntegrationTest`: 3/3 tests PASS (Kiểm chứng bảo mật Spring Security MockMvc, chặn 403, kiểm soát quyền hạn).
  - `SensorBatchControllerTest`: 1/1 test PASS (Kiểm chứng nhận batch dữ liệu cảm biến).
  - `AiCoachControllerTest`: 4/4 tests PASS (Kiểm chứng các REST endpoints của AI Coach).

### 2. Frontend Verification (`vitest`)
* **Tổng số test suites:** 4/4 files PASS.
* **Tổng số test cases:** 14/14 tests PASS (0 failures).
* **Chi tiết từng file kiểm thử:**
  - `useSensorWebSocket.test.js`: 4/4 tests PASS (Khởi tạo kết nối, giới hạn 100 điểm đệm, nhận diện JumpEvent, dọn dẹp bộ nhớ khi unmount).
  - `AiCoachInsightCard.test.jsx`: 4/4 tests PASS (Render đầy đủ 5 chỉ số cơ sinh học, xử lý an toàn dữ liệu rỗng, bố cục 2 cột).
  - `Login.test.jsx`: 4/4 tests PASS (Xác thực biểu mẫu, submit thông tin, kiểm soát trạng thái đăng nhập).
  - `Register.test.jsx`: 2/2 tests PASS (Xác thực thông tin người dùng mới).

---

## PHẦN 5: GÓC NHÌN NGHIỆP VỤ & HIỆU QUẢ KINH DOANH (BUSINESS ANALYST PERSPECTIVE)

### 5.1. Khắc Phục Điểm Đau Của Thị Trường (Customer Pain Points Solved)
1. **Thiết bị đeo thể thao thông thường (Smartwatch, Fitness Band):**
   - Chỉ đếm được số bước chân cơ bản và nhịp tim bề mặt.
   - Hoàn toàn **không đo được lực dội tiếp đất (Impact G)**, không phân biệt được sải chân lệch hay phát hiện các pha tiếp đất cứng gây tổn thương đĩa đệm và sụn chêm khớp gối.
   - *Giải pháp của Second Skin Sport:* Cảm biến 6 trục đặt trực tiếp tại vị trí trọng tâm vận động đo trực tiếp sóng xung lực va chạm thật, cung cấp 5 chỉ số cơ sinh học chuẩn phòng Lab y học thể thao.
2. **Khắc phục lỗi đếm nhảy sai lệch (False Positive Jumps):**
   - Đa số các giải pháp theo dõi bóng rổ hiện nay trên thị trường thường nhầm lẫn giữa một bước dậm chân chạy nước rút mạnh với một cú nhảy ném rổ.
   - *Giải pháp của Second Skin Sport:* Máy trạng thái động học FSM với tiêu chuẩn kép (Freefall $< 6.5 m/s^2$ kết hợp Landing $> 21 m/s^2$ và khóa chống dội $850ms$) đảm bảo độ chính xác vượt trội.
3. **Huấn luyện viên AI thực tế và có tính hành động cao:**
   - Thay vì hiển thị các con số đồ thị trừu tượng khiến người dùng phổ thông bối rối, AI Coach chuyển hóa thành lời nhận xét đời thường và đưa ra bài tập khắc phục cụ thể theo cấu trúc `Sets & Reps`.

### 5.2. Tính Khả Thi Trong Vận Hành & Khả Năng Mở Rộng (Feasibility & Scalability)
- **Tối ưu chi phí hạ tầng (Cost Efficiency):** Nhờ cơ chế lưu trữ tích lũy Zero-Touch (chỉ lưu 60 điểm quỹ đạo tiêu biểu khi kết thúc buổi tập), dung lượng lưu trữ cơ sở dữ liệu giảm đến **$98\%$** so với việc ghi nhận liên tục từng mẫu $10Hz$.
- **Khả năng hoạt động không phụ thuộc (High Availability):** Kiến trúc Dual-Engine AI đảm bảo người dùng tại sân bóng rổ ngoài trời hoặc cung đường chạy không có sóng di động vẫn nhận được phân tích cơ sinh học hoàn chỉnh nhờ Engine nội bộ.
- **Trải nghiệm tiếp cận người dùng (Zero-Barrier Onboarding):** Nhờ Web Bluetooth API trực tiếp trên Google Chrome/Edge, người dùng không cần phải lên App Store hoặc Google Play tải ứng dụng cồng kềnh, chỉ cần bật Bluetooth và truy cập Web Dashboard là có thể stream dữ liệu ngay lập tức.

---

## KẾT LUẬN
Tất cả các kỹ thuật được trình bày trong tài liệu này đều **đã được triển khai hoàn chỉnh trong mã nguồn** và **được kiểm chứng qua hệ thống 36 bài test tự động cũng như dữ liệu thực tế từ thiết bị phần cứng ESP32-C3**. Đây là nền tảng kỹ thuật vững chắc để hệ sinh thái Second Skin Sport tiến tới giai đoạn thương mại hóa và đăng ký sở hữu trí tuệ/sáng chế.
