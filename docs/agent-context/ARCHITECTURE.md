# Second Skin Sport — System Architecture

## 1. Kiến Trúc Tổng Thể (High-Level Architecture)

Hệ thống Second Skin Sport được xây dựng theo kiến trúc phân tán hướng dịch vụ (Distributed Sports-IoT Architecture) kết hợp giữa thiết bị cận biên (Edge Device), tầng dịch vụ Backend xử lý dòng tín hiệu động lực học, và giao diện người dùng thời gian thực:

```
[ Phần cứng Cận biên: ESP32-C3 + MPU-6050 ]
        │                             │
   (BLE 5.2 GATT)             (HTTP POST Batch JSON)
        │                             │
        ▼                             ▼
[ Trình duyệt Web (Web BLE) ] ───► [ Spring Boot 3 Backend (:8080) ]
        ▲                                     │
        │                                     ├─► [ Spring Security & JWT Filter ]
        │                                     ├─► [ SensorBatch & Jump Detection ]
        │ (STOMP WebSocket /topic/*)          ├─► [ Tactical Rotation Engine ]
        └─────────────────────────────────────┤─► [ Biomechanical Feature Extractor ]
                                              │           │
                                              │      (REST JSON)
                                              │           ▼
                                              ├─► [ Google Gemini 1.5 Flash Cloud LLM ]
                                              │
                                              ▼
                                    [ Cơ Sở Dữ Liệu ]
                          (SQL Server Production / H2 Demo)
```

---

## 2. Kiến Trúc Tầng Backend (Spring Boot Layering)

Backend tuân thủ nghiêm ngặt mô hình phân tầng tiêu chuẩn trong hệ sinh thái Java Enterprise:

```
                       ┌─────────────────────────────────────────┐
                       │           HTTP Requests / REST          │
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │             Security Layer              │
                       │    (JwtAuthenticationFilter, CORS,      │
                       │       SecurityFilterChain RBAC)         │
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │           Presentation Layer            │
                       │             (Controllers)               │
                       │   Nhận DTO, validate, trả ResponseEntity│
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │          Business Service Layer         │
                       │      (Services, DSP, AI, Logic)         │
                       │ Xử lý nghiệp vụ, thuật toán, điều phối  │
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │          Data Access Layer              │
                       │            (Repositories)               │
                       │      Spring Data JPA Interface          │
                       └────────────────────┬────────────────────┘
                                            │
                                            ▼
                       ┌─────────────────────────────────────────┐
                       │             Database Layer              │
                       │     (SQL Server / H2 In-Memory)         │
                       └─────────────────────────────────────────┘
```

### 2.1. Tầng Bảo Mật (Security Layer)
- **`SecurityConfig.java`**: Cấu hình Spring Security 6 với chế độ `SessionCreationPolicy.STATELESS`.
  - Public endpoints: `/api/auth/**`, `/api/sensor-data/**`, `/api/sessions/auto`, `/api/ai/**`, `/api/v1/sensor/**`, `/ws/**`, `/h2-console/**`.
  - Protected endpoints:
    - `/api/admin/**`: Yêu cầu quyền `ROLE_ADMIN`.
    - `/api/coach/**`: Yêu cầu quyền `ROLE_COACH` hoặc `ROLE_ADMIN`.
    - Các endpoints còn lại: Yêu cầu xác thực JWT hợp lệ.
- **`JwtAuthenticationFilter.java`**: Trích xuất token từ header `Authorization: Bearer <token>`, giải mã username và nạp `UsernamePasswordAuthenticationToken` vào `SecurityContextHolder`.
- **`CustomUserDetailsService.java`**: Nạp thông tin tài khoản từ bảng `users`.

### 2.2. Tầng Controller (Presentation Layer)
- Không chứa nghiệp vụ. Nhận DTO từ client, chuyển cho Service, bọc kết quả DTO trong `ResponseEntity`.
- Toàn bộ ngoại lệ được đón bắt và trả về mã HTTP thích hợp (400, 401, 403, 404, 500).

### 2.3. Tầng Service (Business & Signal Processing Layer)
- **`SensorBatchService.java`**: Tiếp nhận mảng batch các mẫu đo từ thiết bị, gọi `JumpDetectionService` để phát hiện cú nhảy, lưu bản ghi vào `SensorDataRepository`, cập nhật telemetry tức thời cho vận động viên trong `TeamAthleteRepository`, và phát WebSocket tới `/topic/sensor-telemetry` & `/topic/devices/{deviceId}/telemetry`.
- **`JumpDetectionService.java`**: Động cơ phát hiện pha nhảy (Takeoff, Flight, Landing), đo thời gian bay (airtime), tính chiều cao bước nhảy ($h = \frac{1}{8} g \cdot t_{flight}^2$), và tính xung lực tiếp đất ($G$ và $m/s^2$). Phát sự kiện tới `/topic/jumps`.
- **`BiomechanicalFeatureExtractor.java`**: Trích xuất 5 đặc trưng động học từ chuỗi tín hiệu thô:
  1. *Landing Softness (Độ êm tiếp đất)* từ lực va đập đỉnh.
  2. *Bilateral Symmetry (Độ cân bằng 2 chân)* từ tỷ lệ phân bổ gia tốc trục ngang/dọc.
  3. *Cadence (Nhịp vận động)* từ tần số dao động bước.
  4. *Trunk Stability (Độ vững thân trên)* từ dao động góc nghiêng pitch/roll.
  5. *Explosiveness (Độ bùng nổ)* từ đạo hàm gia tốc bứt tốc.
- **`AiCoachService.java`**: Phối hợp giữa Cloud LLM Google Gemini và Local DSP Engine để sinh lời khuyên, nhận diện lỗi kỹ thuật và danh sách bài tập điều chỉnh.
- **`TacticalRotationService.java`**: Theo dõi cường độ di chuyển và tích lũy va đập của từng cầu thủ, tính toán chỉ số mỏi `fatigueIndex` ($0 - 100\%$), nhận diện nguy cơ chấn thương và tự động đề xuất cặp thay người tối ưu (Cầu thủ kiệt sức $\leftrightarrow$ Dự bị sung sức).
- **`CoachService.java`**: Quản lý nghiệp vụ đội bóng, danh sách VĐV, và phân bổ số áo/thiết bị.
- **`AdminService.java`**: Quản lý cấp tài khoản Coach, khóa/mở khóa tài khoản người dùng, đổi role.

---

## 3. Kiến Trúc Tầng Frontend (React 19 + Vite)

Giao diện người dùng được tổ chức theo kiến trúc thành phần (Component-Based Architecture) phân định rõ ràng giữa Quản lý trạng thái, Kết nối mạng, và Trình diễn:

```
[ Browser / User Interaction ]
        │
        ▼
[ Routing & Auth Guard: App.jsx + ProtectedRoute.jsx ]
        │
   ┌────┴────────────────────────┬────────────────────────┐
   ▼                             ▼                        ▼
[ Athlete Views ]         [ Coach Views ]          [ Admin Views ]
- Dashboard.jsx           - CoachDashboard.jsx     - AdminDashboard.jsx
- Activities.jsx          - CoachRoster.jsx        - AdminUsers.jsx
- Sensors.jsx
- Reports.jsx
   │                             │                        │
   └──────────────┬──────────────┴────────────────────────┘
                  │
                  ▼
         [ Custom Hooks & Context ]
         - useSensorWebSocket.ts
         - useCoachTacticalWebSocket.js
         - BleContext.jsx
                  │
                  ▼
         [ Network Services Layer ]
         - api.js (Axios Instance + JWT Refresh + Local Storage Fallback Cache)
         - bleService.js (Web Bluetooth API)
```

### Các Nguyên Tắc Frontend Bắt Buộc:
1. **WebSocket Hook Cleanup:** Mọi hook mở kết nối WebSocket (`useSensorWebSocket.ts`, `useCoachTacticalWebSocket.js`) bắt buộc phải đóng kết nối (`ws.close()`) trong hàm trả về của `useEffect` khi component unmount để giải phóng socket và tránh rò rỉ RAM.
2. **Buffering & Giới hạn điểm vẽ biểu đồ:** Hook giữ mảng `dataPoints` luôn giới hạn tối đa `maxDataPoints` (mặc định 100 phần tử) thông qua `slice(next.length - maxDataPoints)`.
3. **Cơ chế Ngoại tuyến / Fallback kiên cường (Offline Resilience):** Khi backend chưa kịp khởi động hoặc mất kết nối, `api.js` tự động chuyển sang đọc/ghi dữ liệu tạm từ `localStorage` (`sss_admin_users_cache`, v.v.), đảm bảo UI không bao giờ bị sập trắng trang.

---

## 4. Các Luồng Xử Lý Dữ Liệu Trọng Yếu (Critical Data Pipelines)

### Luồng 1: Xử Lý Lô Dữ Liệu Cảm Biến (Sensor Batch Pipeline)
```
ESP32-C3 (POST /api/v1/sensor/batches)
       │
       ▼
SensorBatchController ──► SensorBatchService.processBatch()
                                │
                                ├─► JumpDetectionService.processReading()
                                │        └─► (Nếu có Jump) ──► WebSocket (/topic/jumps)
                                │
                                ├─► SensorDataRepository.saveAll(batch)
                                │
                                ├─► TeamAthleteRepository.updateAthleteTelemetry()
                                │
                                └─► WebSocket (/topic/sensor-telemetry)
```

### Luồng 2: Điều Phối Chiến Thuật Huấn Luyện Viên (Coach Tactical Pipeline)
```
Dữ liệu Telemetry đổ về liên tục (10Hz)
       │
       ▼
TacticalRotationService.evaluateSquadTactics(teamId)
       │
       ├─► Tính tải mỏi: fatigueIndex = f(minutesPlayed, intensity, highImpactLandings)
       ├─► Phân loại rủi ro: Safe (<60%), Warning (60-80%), Critical (>80%)
       ├─► Tìm cặp thay thế: Out (VĐV mệt nhất trên sân) ── In (VĐV khỏe nhất ghế dự bị)
       │
       └─► WebSocket (/topic/coach/teams/{teamId}/tactical)
                 │
                 ▼
          CoachDashboard.jsx (Nhận tín hiệu realtime, hiển thị cảnh báo đỏ và nút hoán đổi)
                 │
                 ▼ (Coach bấm "Thực hiện Thay người")
          POST /api/coach/teams/{teamId}/tactical-action
                 │
                 ▼
          TacticalRotationService.executeSwap() ──► Đổi trạng thái ON_FIELD ↔ BENCH
```

### Luồng 3: Phân Tích Động Học & AI Coach (AI Biomechanical Pipeline)
```
Kết thúc buổi tập (Session Completed)
       │
       ▼
AiCoachController.analyzeSession(sessionId)
       │
       ▼
AiCoachService.analyzeSession()
       │
       ├─► BiomechanicalFeatureExtractor.extract(rawData)
       │        └─► Tính: Landing Softness, Symmetry, Cadence, Stability, Explosiveness
       │
       ├─► Kiểm tra API Key:
       │        ├─► CÓ Key: Gọi Google Gemini 1.5 Flash (Structured JSON Prompt)
       │        └─► KHÔNG Key / Offline: Gọi Local DSP Biomechanics Heuristic Rules
       │
       ▼
Trả về AiInsightDTO (Lời nhận xét, cảnh báo chấn thương, bài tập bổ trợ Sets/Reps)
```

