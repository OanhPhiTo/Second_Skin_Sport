# Second Skin Sport — API Documentation

Tài liệu này đặc tả toàn bộ hệ thống API (REST và WebSocket STOMP) của nền tảng **Second Skin Sport**.

---

## 1. Thông Tin Chung & Cơ Chế Xác Thực

- **Base URL REST API:** `http://localhost:8080/api`
- **WebSocket STOMP URL:** `ws://localhost:8080/ws/sensor-data` (hoặc qua SockJS: `http://localhost:8080/ws/sensor-data`)
- **Định dạng dữ liệu:** `application/json`
- **Lỗi REST chuẩn:** Các lỗi 400/401/403/404/500 trả về `timestamp`, `status`, `error`, `message` và `path`.
- **Cơ chế xác thực:**
  - Token-Based Authentication thông qua chuỗi JSON Web Token (JWT).
  - Client gửi JWT qua header: `Authorization: Bearer <ACCESS_TOKEN>`.
  - Phân quyền (RBAC): Dựa trên Claim `ROLE_ADMIN`, `ROLE_COACH`, `ROLE_USER`.

---

## 2. Nhóm API Xác Thực (Authentication API) — `/api/auth`

### 2.1. Đăng ký tài khoản mới
- **Endpoint:** `POST /api/auth/register`
- **Quyền hạn:** Public
- **Request Body:**
  ```json
  {
    "name": "Alex Johnson",
    "email": "alex.athlete@secondskin.io",
    "password": "password",
    "preferredSport": "Basketball"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "d41d8cd98f00b204e9800998ecf8427e...",
    "role": "USER",
    "name": "Alex Johnson",
    "email": "alex.athlete@secondskin.io"
  }
  ```

### 2.2. Đăng nhập hệ thống
- **Endpoint:** `POST /api/auth/login`
- **Quyền hạn:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@secondskin.com",
    "password": "admin123"
  }
  ```
- **Response:** `200 OK` (Cấu trúc tương tự đăng ký kèm `role: "ADMIN"`).

### 2.3. Làm mới Access Token
- **Endpoint:** `POST /api/auth/refresh`
- **Header:** `Authorization: Bearer <REFRESH_TOKEN>`
- **Response:** `200 OK` (Trả về access token và refresh token mới).

### 2.4. Yêu cầu mã OTP quên mật khẩu (OAuth2 Email Service)
- **Endpoint:** `POST /api/auth/forgot-password`
- **Quyền hạn:** Public
- **Request Body:**
  ```json
  {
    "email": "alex.athlete@secondskin.io"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Mã xác thực OTP đã được gửi đến email alex.athlete@secondskin.io. Mã có hiệu lực trong vòng 5 phút.",
    "debugOtp": "123456"
  }
  ```

### 2.5. Xác thực mã OTP
- **Endpoint:** `POST /api/auth/verify-otp`
- **Quyền hạn:** Public
- **Request Body:**
  ```json
  {
    "email": "alex.athlete@secondskin.io",
    "otp": "123456"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Xác thực mã OTP thành công. Vui lòng nhập mật khẩu mới."
  }
  ```

### 2.6. Đặt lại mật khẩu mới
- **Endpoint:** `POST /api/auth/reset-password`
- **Quyền hạn:** Public
- **Request Body:**
  ```json
  {
    "email": "alex.athlete@secondskin.io",
    "otp": "123456",
    "newPassword": "NewSecurePassword123"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới."
  }
  ```

---

## 3. Nhóm API Thu Thập Dữ Liệu IoT — `/api/v1/sensor` & `/api/sensor-data`

### 3.1. Nhận gói lô dữ liệu cảm biến (Chuẩn ESP32 Batch API)
- **Endpoint:** `POST /api/v1/sensor/batches`
- **Quyền hạn:** Public (Dành cho ESP32-C3 hoặc Simulator gửi gói)
- **Request Body (`SensorBatchDTO`):**
  ```json
  {
    "deviceId": "SSS-PATCH-001",
    "batchTimestamp": "2026-10-28T10:15:30.000Z",
    "readings": [
      {
        "timestamp": "2026-10-28T10:15:30.000Z",
        "accelerometerX": 0.12,
        "accelerometerY": 0.45,
        "accelerometerZ": 9.81,
        "gyroscopeX": 1.5,
        "gyroscopeY": -0.8,
        "gyroscopeZ": 0.2,
        "pitch": 4.5,
        "roll": -1.2,
        "yaw": 182.0,
        "movementIntensity": 85
      }
    ]
  }
  ```
- **Response:** `200 OK` (`BatchProcessResponseDTO`)
  ```json
  {
    "status": "PROCESSED",
    "recordsProcessed": 10,
    "jumpsDetected": 1,
    "message": "Processed 10 telemetry points from SSS-PATCH-001"
  }
  ```

### 3.2. Lưu mẫu dữ liệu cảm biến đơn lẻ
- **Endpoint:** `POST /api/sensor-data`
- **Quyền hạn:** Public
- **Request Body:** Đối tượng `SensorData`.
- **Response:** `200 OK`

### 3.3. Lấy dữ liệu cảm biến mới nhất
- **Endpoint:** `GET /api/sensor-data/latest`
- **Response:** `200 OK` (Bản ghi `SensorData` mới nhất).

---

## 4. Nhóm API Quản Lý Huấn Luyện Viên & Đội Hình — `/api/coach`

*Yêu cầu quyền: `hasAnyRole('COACH', 'ADMIN')`*

### 4.1. Lấy danh sách đội bóng do Coach quản lý
- **Endpoint:** `GET /api/coach/teams`
- **Response:** `200 OK` (`List<TeamDTO>`)

### 4.2. Tạo đội thể thao mới
- **Endpoint:** `POST /api/coach/teams`
- **Request Body:**
  ```json
  {
    "name": "Saigon Heat Elite",
    "sport": "Basketball",
    "description": "Đội hình trẻ U23"
  }
  ```
- **Response:** `201 Created` (`TeamDTO`)

### 4.3. Lấy danh sách VĐV trong đội (Roster)
- **Endpoint:** `GET /api/coach/teams/{teamId}/roster`
- **Response:** `200 OK` (`List<TeamAthleteDTO>`)

### 4.4. Thêm VĐV vào đội
- **Endpoint:** `POST /api/coach/teams/{teamId}/athletes`
- **Request Body (`AddAthleteRequestDTO`):**
  ```json
  {
    "name": "Luka Doncic",
    "jerseyNumber": 77,
    "position": "PG",
    "deviceId": "SSS-PATCH-007",
    "status": "BENCH"
  }
  ```
- **Response:** `201 Created` (`TeamAthleteDTO`)

### 4.5. Xóa VĐV khỏi đội
- **Endpoint:** `DELETE /api/coach/teams/{teamId}/athletes/{athleteId}`
- **Response:** `204 No Content`

### 4.6. Cập nhật trạng thái thi đấu của VĐV
- **Endpoint:** `PUT /api/coach/teams/{teamId}/athletes/{athleteId}/status?status=ON_FIELD`
- **Param:** `status` = `ON_FIELD` | `BENCH` | `RESTING` | `INJURED`
- **Response:** `200 OK` (`TeamAthleteDTO`)

### 4.7. Lấy telemetry và động học chi tiết của 1 VĐV
- **Endpoint:** `GET /api/coach/teams/{teamId}/athletes/{athleteId}/metrics`
- **Response:** `200 OK` (`AthleteDetailTelemetryDTO`: chỉ số nhịp tim, va đập, quỹ đạo gia tốc...).

### 4.8. Phân tích chiến thuật & Đề xuất xoay tua đội hình
- **Endpoint:** `GET /api/coach/teams/{teamId}/tactical-analysis`
- **Response:** `200 OK` (`SquadTacticalSummaryDTO`: điểm số mệt mỏi đội, cầu thủ nguy cơ cao, cặp thay thế đề xuất).

### 4.9. Thực thi lệnh thay người chiến thuật (Tactical Swap)
- **Endpoint:** `POST /api/coach/teams/{teamId}/tactical-action`
- **Request Body (`TacticalSwapRequestDTO`):**
  ```json
  {
    "outAthleteId": 1,
    "inAthleteId": 4
  }
  ```
- **Response:** `200 OK` (Cập nhật cầu thủ rời sân sang `BENCH` và cầu thủ dự bị lên `ON_FIELD`).

---

## 5. Nhóm API Quản Trị Hệ Thống — `/api/admin`

*Yêu cầu quyền: `hasRole('ADMIN')`*

### 5.1. Lấy danh sách toàn bộ người dùng
- **Endpoint:** `GET /api/admin/users`
- **Response:** `200 OK` (`List<UserDTO>`)

### 5.2. Cấp tài khoản Huấn luyện viên mới
- **Endpoint:** `POST /api/admin/coaches`
- **Request Body (`CreateCoachRequestDTO`):**
  ```json
  {
    "name": "Erik Ten Hag",
    "email": "tenhag@secondskin.io",
    "sport": "Football"
  }
  ```
- **Response:** `201 Created` (`UserDTO` kèm mật khẩu mặc định `Coach@123456`).

### 5.3. Khóa tài khoản người dùng
- **Endpoint:** `PUT /api/admin/users/{id}/ban`
- **Response:** `200 OK` (`"Tài khoản đã bị khóa thành công."`)

### 5.4. Mở khóa tài khoản người dùng
- **Endpoint:** `PUT /api/admin/users/{id}/unban`
- **Response:** `200 OK` (`"Tài khoản đã được mở khóa."`)

### 5.5. Cập nhật vai trò tài khoản
- **Endpoint:** `PUT /api/admin/users/{id}/role?role=COACH`
- **Response:** `200 OK`

### 5.6. Xóa vĩnh viễn người dùng
- **Endpoint:** `DELETE /api/admin/users/{id}`
- **Response:** `200 OK`

---

## 6. Nhóm API Trợ Lý AI & Động Học — `/api/ai`

### 6.1. Phân tích chi tiết buổi tập bằng AI Coach
- **Endpoint:** `GET /api/ai/session/{sessionId}`
- **Quyền hạn:** Public / Authenticated
- **Response:** `200 OK` (`AiInsightDTO`)
  ```json
  {
    "sessionId": 1,
    "overallFeedback": "Buổi tập thể hiện cường độ cao, tiếp đất êm giúp bảo vệ đầu gối.",
    "landingSoftnessScore": 84.5,
    "bilateralSymmetryPercentage": 92.0,
    "cadenceSpm": 174,
    "trunkStabilityScore": 86.0,
    "explosivenessScore": 88.0,
    "injuryRiskLevel": "LOW",
    "areasToImprove": [
      "Có xu hướng hơi đổ người về trước ở các phút cuối"
    ],
    "recommendedDrills": [
      {
        "drillName": "Depth Drop Landing",
        "description": "Rơi từ bục 30cm tiếp đất êm không tiếng động",
        "sets": 3,
        "reps": 8
      }
    ]
  }
  ```

### 6.2. Phân tích nhanh tức thời (Ad-hoc Analysis)
- **Endpoint:** `POST /api/ai/quick-analysis`
- **Request Body:** Đối tượng `SportSession`.
- **Response:** `200 OK` (`AiInsightDTO`).

---

## 7. Nhóm API Buổi Tập & Thống Kê — `/api/sessions` & `/api/statistics`

### 7.1. Danh sách buổi tập
- **Endpoint:** `GET /api/sessions?sport=Basketball`
- **Response:** `200 OK` (`List<SportSessionDTO>`)

### 7.2. Chi tiết 1 buổi tập
- **Endpoint:** `GET /api/sessions/{id}`
- **Response:** `200 OK` (`SportSessionDTO`)

### 7.3. Tạo buổi tập tự động từ thiết bị
- **Endpoint:** `POST /api/sessions/auto`
- **Response:** `200 OK` (`SportSessionDTO`)

### 7.4. Thống kê tổng quan VĐV
- **Endpoint:** `GET /api/statistics/overview`
- **Response:** `200 OK` (`OverviewStatsDTO`: tổng giờ tập, calo, số cú nhảy, điểm phong độ).

---

## 8. Kênh WebSocket STOMP (Realtime Channels)

- **Handshake Endpoint:** `/ws/sensor-data`
- **Topics phát sóng từ Server:**

| Topic Destination | Payload Type | Mô Tả |
| :--- | :--- | :--- |
| `/topic/sensor-telemetry` | `SensorReadingDTO` | Phát broadcast dữ liệu cảm biến mới nhất từ mọi thiết bị |
| `/topic/devices/{deviceId}/telemetry` | `SensorReadingDTO` | Luồng telemetry riêng cho từng thiết bị phần cứng cụ thể |
| `/topic/jumps` | `JumpEventDTO` | Bắn sự kiện tức thì khi phát hiện một cú bật nhảy mới |
| `/topic/devices/{deviceId}/jumps` | `JumpEventDTO` | Sự kiện bật nhảy riêng cho từng thiết bị |
| `/topic/coach/teams/{teamId}/tactical` | `SquadTacticalSummaryDTO` | Bắn cập nhật tình trạng mỏi và cảnh báo xoay tua đội hình |
| `/topic/coach/tactical-stream` | `SquadTacticalSummaryDTO` | Luồng tổng hợp chiến thuật đa đội |
| `/topic/notifications` | `NotificationDTO` | Phát broadcast thông báo hệ thống và hoàn thành phiên tập |
| `/topic/notifications/{userId}` | `NotificationDTO` | Phát thông báo trực tiếp riêng cho từng người dùng |

---

## 9. Nhóm API Thông Báo (Notification API) — `/api/notifications`

### 9.1. Lấy danh sách thông báo
- **Endpoint:** `GET /api/notifications`
- **Quyền hạn:** Authenticated User
- **Response:** `200 OK` (`List<NotificationDTO>`)

### 9.2. Đánh dấu thông báo đã đọc
- **Endpoint:** `PUT /api/notifications/{id}/read`
- **Response:** `200 OK` (`{"success": true}`)

### 9.3. Đánh dấu tất cả thông báo đã đọc
- **Endpoint:** `PUT /api/notifications/read-all`
- **Response:** `200 OK` (`{"success": true}`)

### 9.4. Xóa tất cả thông báo
- **Endpoint:** `DELETE /api/notifications`
- **Response:** `200 OK` (`{"success": true}`)


