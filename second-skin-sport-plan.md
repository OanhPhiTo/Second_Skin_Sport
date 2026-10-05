# 🏃 Second Skin Sport — Project Implementation Plan

> **Dự án:** Smart Wearable Sports Monitoring System  
> **Tech Stack:** ESP32-C3 · Spring Boot 3.2 (Java 17) · Python AI Service · React · SQL Server  
> **Trạng thái hiện tại:** Frontend pages đã có skeleton (Dashboard, Activities, Sensors, Statistics, Reports, Settings) · Backend Spring Boot đã khởi tạo (H2/SQL Server)

---

## 📋 Tổng quan các Phase

| Phase | Tên | Thời gian ước tính | Ưu tiên |
|---|---|---|---|
| **P0** | Foundation & Setup | 1 tuần | 🔴 Critical |
| **P1** | Hardware – ESP32-C3 Firmware | 2–3 tuần | 🔴 Critical |
| **P2** | Backend – Spring Boot API | 3–4 tuần | 🔴 Critical |
| **P3** | AI Analysis Service | 3–4 tuần | 🟠 High |
| **P4** | Frontend – React Dashboard | 3–4 tuần | 🟠 High |
| **P5** | Integration & Testing | 2 tuần | 🟡 Medium |

**Tổng dự kiến:** ~14–18 tuần (3,5–4,5 tháng)

---

## ⚙️ Phase 0 — Foundation & Infrastructure Setup
**Thời gian:** 1 tuần  
**Mục tiêu:** Chuẩn bị môi trường, cấu trúc project, CI/CD cơ bản

### Tasks

#### 0.1 Repository & Branching Strategy
- [ ] Cấu hình Git branching: `main` → `develop` → `feature/*`
- [ ] Thiết lập `.github/workflows` cho CI tự động (build + test)
- [ ] Viết `README.md` tổng quan cho toàn project

#### 0.2 Backend Setup
- [ ] Cấu hình `application.properties` cho 2 profile: `dev` (H2) và `prod` (SQL Server)
- [ ] Thêm dependency: **Spring Security + JWT**, **WebSocket**, **Validation**
- [ ] Cấu hình CORS cho phép React dev server (`localhost:5173`)
- [ ] Cấu hình Swagger/OpenAPI để tạo API docs tự động

#### 0.3 Frontend Setup
- [ ] Cài thêm packages: `axios`, `react-router-dom`, `recharts`, `leaflet`, `socket.io-client`
- [ ] Tạo cấu trúc thư mục chuẩn: `hooks/`, `context/`, `utils/`, `api/`
- [ ] Cấu hình environment variables (`.env.development`, `.env.production`)

#### 0.4 AI Service Setup
- [ ] Tạo thư mục `ai-service/` với cấu trúc FastAPI
- [ ] Cấu hình `requirements.txt`: `fastapi`, `uvicorn`, `numpy`, `scikit-learn`, `pandas`
- [ ] Tạo Docker Compose cho toàn bộ hệ thống

#### 0.5 Database Schema Design
- [ ] Thiết kế ERD (Entity Relationship Diagram)
- [ ] Viết migration scripts (Flyway hoặc Liquibase)

### Deliverables
- ✅ Monorepo chạy được trên local
- ✅ API docs tự động tại `/swagger-ui.html`
- ✅ Docker Compose khởi động được Backend + AI + DB

---

## 📡 Phase 1 — Hardware: ESP32-C3 Firmware
**Thời gian:** 2–3 tuần  
**Mục tiêu:** ESP32-C3 thu thập sensor data và gửi lên server qua Wi-Fi

### Tasks

#### 1.1 Môi trường phát triển
- [ ] Cài đặt Arduino IDE / PlatformIO
- [ ] Cấu hình board ESP32-C3 SuperMini
- [ ] Kết nối và test MPU6050 qua I2C
- [ ] Kết nối và test GNSS module qua UART/Serial

#### 1.2 Đọc dữ liệu sensor
- [ ] Viết driver đọc MPU6050: acceleration (ax, ay, az) + gyroscope (gx, gy, gz)
- [ ] Viết driver đọc GNSS: latitude, longitude, speed, altitude
- [ ] Cấu hình tần số lấy mẫu: MPU6050 @ 50Hz, GNSS @ 1Hz
- [ ] Đồng bộ timestamp từ GNSS hoặc NTP

#### 1.3 Xử lý và đóng gói dữ liệu
- [ ] Tạo cấu trúc JSON packet:
  ```json
  {
    "deviceId": "ESP32-001",
    "timestamp": 1700000000000,
    "accel": { "x": 0.12, "y": -0.05, "z": 9.81 },
    "gyro":  { "x": 0.01, "y": 0.02,  "z": -0.01 },
    "gnss":  { "lat": 10.762, "lng": 106.660, "speed": 2.5, "distance": 120.5 }
  }
  ```
- [ ] Buffer dữ liệu trong SPIFFS (local flash) khi mất mạng
- [ ] Logic auto-sync khi kết nối được khôi phục

#### 1.4 Truyền dữ liệu
- [ ] Kết nối Wi-Fi với retry logic + exponential backoff
- [ ] Gửi HTTP POST tới `POST /api/v1/sensor-data` với JWT header
- [ ] Xử lý response (200 OK → xóa buffer, 4xx → log lỗi)
- [ ] LED indicator: xanh = connected, đỏ = offline, nhấp nháy = đang sync

#### 1.5 Quản lý nguồn điện
- [ ] Cấu hình Deep Sleep giữa các lần gửi (nếu không cần real-time)
- [ ] Monitor mức pin và đưa vào JSON packet

### Deliverables
- ✅ ESP32-C3 gửi sensor JSON lên server mỗi 200ms (5 Hz)
- ✅ Offline buffer hoạt động khi mất Wi-Fi
- ✅ Serial Monitor hiển thị data real-time để debug

---

## 🖥️ Phase 2 — Backend: Spring Boot REST API
**Thời gian:** 3–4 tuần  
**Mục tiêu:** API server đầy đủ, bảo mật, lưu trữ và phân phối dữ liệu

### Tasks

#### 2.1 Domain Model & Database (Tuần 1)

**Entities cần tạo:**

| Entity | Mô tả |
|---|---|
| `User` | Tài khoản người dùng |
| `WearableDevice` | Thông tin thiết bị ESP32 |
| `SensorReading` | Một mẫu dữ liệu sensor (accel, gyro, gnss) |
| `ActivitySession` | Một buổi tập (start → end) |
| `AnalysisResult` | Kết quả AI trả về cho một session |

- [ ] Tạo JPA Entities và Repositories
- [ ] Tạo Flyway migration `V1__init_schema.sql`
- [ ] Viết unit tests cho Repositories

#### 2.2 Authentication & Security (Tuần 1)
- [ ] Thêm `spring-boot-starter-security` + `jjwt`
- [ ] Endpoint: `POST /api/auth/register` — tạo tài khoản
- [ ] Endpoint: `POST /api/auth/login` — trả về JWT access token + refresh token
- [ ] Endpoint: `POST /api/auth/refresh` — làm mới access token
- [ ] JWT filter cho tất cả các request `/api/**`
- [ ] Device authentication: mỗi ESP32 có device token riêng

#### 2.3 Sensor Data Ingestion API (Tuần 2)
- [ ] `POST /api/v1/sensor-data` — nhận batch data từ ESP32
  - Validate JSON schema
  - Xác thực device token
  - Lưu vào DB (batch insert)
  - Trigger async analysis nếu đủ time window
- [ ] `GET /api/v1/sensor-data/live` — WebSocket endpoint phát real-time data
- [ ] `POST /api/v1/sensor-data/batch` — sync offline buffer

#### 2.4 Activity Session API (Tuần 2)
- [ ] `POST /api/v1/sessions/start` — bắt đầu buổi tập
- [ ] `POST /api/v1/sessions/{id}/end` — kết thúc buổi tập
- [ ] `GET /api/v1/sessions` — lịch sử các buổi tập (pagination)
- [ ] `GET /api/v1/sessions/{id}` — chi tiết một buổi tập
- [ ] `DELETE /api/v1/sessions/{id}` — xóa buổi tập

#### 2.5 AI Service Integration (Tuần 3)
- [ ] Tạo `AiServiceClient` (RestTemplate/WebClient) gọi Python AI API
- [ ] Gửi time-window (30 giây) data → `POST http://ai-service:8000/analyze`
- [ ] Lưu kết quả trả về vào `AnalysisResult`
- [ ] Schedule async job: cứ 30 giây gửi batch mới sang AI

#### 2.6 Dashboard & Statistics API (Tuần 3–4)
- [ ] `GET /api/v1/dashboard/summary` — tổng hợp hôm nay
- [ ] `GET /api/v1/statistics/weekly` — thống kê 7 ngày
- [ ] `GET /api/v1/statistics/monthly` — thống kê tháng
- [ ] `GET /api/v1/analysis/{sessionId}` — kết quả AI theo session
- [ ] `GET /api/v1/route/{sessionId}` — dữ liệu GPS route

#### 2.7 Testing
- [ ] Unit tests cho Service layer (JUnit 5 + Mockito)
- [ ] Integration tests cho Controller layer (MockMvc)
- [ ] Postman collection cho tất cả endpoints

### Deliverables
- ✅ Toàn bộ REST API documented tại Swagger UI
- ✅ JWT Auth hoạt động
- ✅ Sensor data được lưu vào DB
- ✅ WebSocket phát real-time data

---

## 🤖 Phase 3 — AI Analysis Service (Python/FastAPI)
**Thời gian:** 3–4 tuần  
**Mục tiêu:** Service nhận time-window sensor data, trả về kết quả phân tích

### Tasks

#### 3.1 Cấu trúc dự án AI
```
ai-service/
├── app/
│   ├── main.py              # FastAPI app
│   ├── models/
│   │   ├── activity.py      # Activity classification model
│   │   └── posture.py       # Posture analysis model
│   ├── schemas/
│   │   ├── input.py         # SensorWindow schema
│   │   └── output.py        # AnalysisResult schema
│   ├── services/
│   │   ├── feature_extractor.py
│   │   ├── activity_classifier.py
│   │   ├── metrics_calculator.py
│   │   └── posture_analyzer.py
│   └── routers/
│       └── analyze.py
├── models/                  # Saved ML models (.pkl / .h5)
├── data/                    # Training data
├── notebooks/               # Jupyter notebooks for training
└── requirements.txt
```

#### 3.2 Input/Output Schema
- [ ] Định nghĩa `SensorWindow` input (array of 150 samples = 30s × 5Hz):
  ```json
  {
    "sessionId": "uuid",
    "deviceId": "ESP32-001",
    "samples": [
      { "timestamp": 1700000000, "ax": 0.1, "ay": 0.2, "az": 9.8,
        "gx": 0.01, "gy": 0.02, "gz": 0.01,
        "lat": 10.762, "lng": 106.660, "speed": 2.5 }
    ]
  }
  ```
- [ ] Định nghĩa `AnalysisResult` output:
  ```json
  {
    "activity": "RUNNING",
    "confidence": 0.94,
    "metrics": {
      "stepCount": 45, "cadence": 90, "speed": 2.8,
      "distance": 84, "intensity": "HIGH", "consistency": 0.87
    },
    "posture": {
      "score": 78, "deviations": ["FORWARD_LEAN", "ARM_ASYMMETRY"],
      "recommendations": ["Giữ lưng thẳng hơn", "Đối xứng hai tay"]
    }
  }
  ```

#### 3.3 Feature Extraction
- [ ] Tính thống kê từ accel: mean, std, min, max, range, energy, RMS
- [ ] Tính thống kê từ gyro: tương tự
- [ ] Tính FFT features (dominant frequency)
- [ ] Tính correlation giữa các trục
- [ ] Tính GNSS features: avg speed, distance delta, smoothness

#### 3.4 Activity Classification Model
- [ ] Thu thập / tạo training dataset (CSV) cho 5 hoạt động
- [ ] Thử nghiệm các model:
  - Random Forest (baseline, dễ interpret)
  - SVM với RBF kernel
  - LSTM (nếu có đủ data)
- [ ] Train, evaluate (accuracy, F1-score per class)
- [ ] Export model sang `.pkl` (scikit-learn) hoặc `.h5` (Keras)
- [ ] Load model khi server khởi động

#### 3.5 Performance Metrics Calculator
- [ ] **Step count:** Đếm đỉnh gia tốc trên trục thẳng đứng (peak detection)
- [ ] **Cadence:** steps/minute = step count × (60 / window_duration)
- [ ] **Speed:** Lấy trung bình GNSS speed hoặc tính từ accel integration
- [ ] **Distance:** Tích lũy từ GNSS, fallback từ step count × stride length
- [ ] **Intensity:** Phân loại LOW/MEDIUM/HIGH theo RMS accel
- [ ] **Consistency:** Đo độ ổn định chu kỳ bước (variance of step intervals)

#### 3.6 Posture Analysis
- [ ] Tính trunk inclination angle từ accel (pitch, roll)
- [ ] So sánh với reference angles cho từng hoạt động
- [ ] Detect deviation: forward lean > 15°, lateral lean > 10°
- [ ] Rule-based recommendations dựa trên detected deviations

#### 3.7 API Endpoint
- [ ] `POST /analyze` — nhận SensorWindow, trả AnalysisResult
- [ ] `GET /health` — health check
- [ ] `GET /model-info` — thông tin model đang dùng

### Deliverables
- ✅ FastAPI server chạy tại port 8000
- ✅ Accuracy activity classification ≥ 85%
- ✅ Response time < 500ms cho 1 time window

---

## 🎨 Phase 4 — Frontend: React Dashboard
**Thời gian:** 3–4 tuần  
**Mục tiêu:** UI hiển thị real-time data, thống kê, bản đồ, AI feedback

> **Lưu ý:** Các trang (`Dashboard`, `Activities`, `Sensors`, `Statistics`, `Reports`, `Settings`) đã có skeleton. Phase này sẽ kết nối với API thật và hoàn thiện UI.

### Tasks

#### 4.1 API Layer & State Management (Tuần 1)
- [ ] Tạo `api/axiosClient.js` với interceptor tự động attach JWT
- [ ] Tạo các API services:
  - `api/authApi.js` — login, register, refresh
  - `api/sensorApi.js` — live data, history
  - `api/sessionApi.js` — CRUD sessions
  - `api/analysisApi.js` — AI results
- [ ] Tạo `AuthContext` — quản lý login state
- [ ] Setup WebSocket connection hook `useWebSocket.js`

#### 4.2 Authentication Pages (Tuần 1)
- [ ] Trang Login với form validation
- [ ] Trang Register
- [ ] Protected Route HOC (redirect nếu chưa login)
- [ ] Auto refresh token logic

#### 4.3 Dashboard Page — Real-time (Tuần 2)
**File:** `pages/Dashboard.jsx`
- [ ] Kết nối WebSocket → update metrics real-time
- [ ] Widget: **Current Activity** (icon + label + confidence %)
- [ ] Widget: **Live Sensor Graphs** — 3 line charts (Ax/Ay/Az, Gx/Gy/Gz)
- [ ] Widget: **Today Summary** — steps, distance, time, calories
- [ ] Widget: **Posture Score** — gauge/meter 0–100
- [ ] Widget: **Connection Status** — ESP32 online/offline indicator

#### 4.4 Statistics Page — Charts & Analytics (Tuần 2)
**File:** `pages/Statistics.jsx`
- [ ] Biểu đồ cột: Steps per day (7 ngày / 30 ngày)
- [ ] Biểu đồ đường: Speed over time trong một session
- [ ] Pie chart: Thời gian theo từng hoạt động
- [ ] Thẻ số liệu: Total distance, Avg cadence, Best session
- [ ] Filter: theo ngày / tuần / tháng

#### 4.5 Activities Page — Session History (Tuần 2–3)
**File:** `pages/Activities.jsx`
- [ ] Danh sách session (list/card view)
- [ ] Filter theo loại hoạt động, ngày tháng
- [ ] Modal chi tiết session:
  - Thông tin tổng (thời gian, quãng đường, bước đi)
  - Biểu đồ speed/intensity theo thời gian
  - AI Feedback: posture score + deviation list + recommendations
  - GPS route map

#### 4.6 Map & Route Visualization (Tuần 3)
- [ ] Tích hợp **Leaflet.js** (OpenStreetMap, miễn phí)
- [ ] Vẽ polyline route từ GPS coordinates
- [ ] Color-coded route theo tốc độ (xanh = chậm, đỏ = nhanh)
- [ ] Markers: điểm bắt đầu (xanh), kết thúc (đỏ)
- [ ] Popup khi click điểm: speed, timestamp

#### 4.7 Sensors Page — Raw Data Monitor (Tuần 3)
**File:** `pages/Sensors.jsx`
- [ ] Live oscilloscope-style graphs (Recharts `LineChart`)
- [ ] Hiển thị giá trị hiện tại: Ax, Ay, Az, Gx, Gy, Gz
- [ ] GPS coordinates + accuracy
- [ ] Device info: battery, firmware version, connection quality

#### 4.8 AI Feedback Panel (Tuần 4)
- [ ] Component `AIFeedbackCard.jsx`:
  - Activity badge + confidence bar
  - Posture score dial
  - Deviation list với icon cảnh báo
  - Tips/recommendations text
- [ ] Animation khi feedback được cập nhật
- [ ] Historical comparison: score hôm nay vs tuần trước

#### 4.9 Settings Page (Tuần 4)
**File:** `pages/Settings.jsx`
- [ ] Quản lý thiết bị ESP32 (thêm/xóa/đổi tên)
- [ ] Cấu hình cảnh báo (target steps, max heart rate)
- [ ] Profile người dùng (chiều cao, cân nặng → tính calories chính xác)
- [ ] Export dữ liệu (CSV/JSON)

### Deliverables
- ✅ Dashboard hiển thị real-time data từ WebSocket
- ✅ Map vẽ route GPS hoàn chỉnh
- ✅ AI Feedback hiển thị sau mỗi buổi tập
- ✅ Responsive trên cả desktop và tablet

---

## 🔗 Phase 5 — Integration & Testing
**Thời gian:** 2 tuần  
**Mục tiêu:** Kết nối toàn bộ hệ thống và kiểm thử end-to-end

### Tasks

#### 5.1 End-to-End Integration Test
- [ ] Test luồng: ESP32 gửi data → Spring Boot nhận → lưu DB → gửi AI → AI phân tích → trả kết quả → Frontend hiển thị
- [ ] Test offline buffer: ngắt Wi-Fi → ESP32 buffer → kết nối lại → sync
- [ ] Test authentication: device token expired, user token expired

#### 5.2 Performance Testing
- [ ] Đo latency: sensor → dashboard < 2 giây
- [ ] Load test AI service: 10 request/giây
- [ ] Test DB với 100,000 sensor records

#### 5.3 Demo Preparation
- [ ] Chuẩn bị **demo script** cho buổi chạy thực tế
- [ ] Chuẩn bị **mock data** cho trường hợp không có phần cứng
- [ ] Chuẩn bị **slide presentation** kỹ thuật

---

## 📁 Cấu trúc thư mục đề xuất

```
Second_Skin_Sport/
├── firmware/                    # ESP32-C3 Arduino/PlatformIO code
│   ├── src/
│   │   ├── main.cpp
│   │   ├── SensorManager.h/cpp
│   │   ├── WifiManager.h/cpp
│   │   └── DataUploader.h/cpp
│   └── platformio.ini
│
├── backend/                     # Spring Boot (đã có)
│   └── src/main/java/com/secondskin/
│       ├── controller/
│       ├── service/
│       ├── repository/
│       ├── entity/
│       ├── dto/
│       ├── security/
│       └── config/
│
├── ai-service/                  # Python FastAPI (cần tạo)
│   ├── app/
│   ├── models/
│   ├── notebooks/
│   └── requirements.txt
│
├── frontend/                    # React (đã có)
│   └── src/
│       ├── api/                 # axios clients
│       ├── components/
│       ├── context/             # Auth, WebSocket context
│       ├── hooks/               # useWebSocket, useAuth
│       ├── pages/
│       └── utils/
│
└── docker-compose.yml           # Khởi động toàn bộ hệ thống
```

---

## 🔑 API Endpoints Tổng hợp

### Authentication
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản |
| POST | `/api/auth/login` | Đăng nhập, nhận JWT |
| POST | `/api/auth/refresh` | Làm mới JWT |

### Sensor Data
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/sensor-data` | ESP32 gửi data |
| POST | `/api/v1/sensor-data/batch` | Sync offline buffer |
| WS | `/ws/sensor-data` | Real-time stream → Frontend |

### Sessions
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/sessions/start` | Bắt đầu buổi tập |
| POST | `/api/v1/sessions/{id}/end` | Kết thúc buổi tập |
| GET | `/api/v1/sessions` | Danh sách sessions |
| GET | `/api/v1/sessions/{id}` | Chi tiết session |

### Analysis & Statistics
| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/analysis/{sessionId}` | Kết quả AI |
| GET | `/api/v1/route/{sessionId}` | GPS route data |
| GET | `/api/v1/statistics/weekly` | Thống kê tuần |
| GET | `/api/v1/dashboard/summary` | Tổng hợp hôm nay |

### AI Service (Internal)
| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `http://ai-service:8000/analyze` | Spring Boot gọi AI |
| GET | `http://ai-service:8000/health` | Health check |

---

## ⚠️ Rủi ro & Giải pháp

| Rủi ro | Mức độ | Giải pháp |
|---|---|---|
| Không có đủ training data cho AI | 🔴 Cao | Sử dụng public dataset (UCI HAR, WISDM) + augment |
| GNSS indoor không chính xác | 🟠 Trung bình | Fallback: tính distance từ step count + stride length |
| Latency cao (sensor → dashboard) | 🟠 Trung bình | Tối ưu batch size, WebSocket thay HTTP polling |
| Pin ESP32 hết nhanh | 🟡 Thấp | Deep sleep giữa cycles, giảm sampling rate khi idle |
| Không có phần cứng khi demo | 🟡 Thấp | Tạo sensor data simulator (script Python) |

---

## 🏁 Milestone Summary

```
Tuần 1:     [P0] ✅ Setup xong, Docker chạy được
Tuần 2–3:   [P1] ✅ ESP32 gửi data lên server
Tuần 4–6:   [P2] ✅ Backend API hoàn chỉnh + Auth + DB
Tuần 7–9:   [P3] ✅ AI service classify activity ≥ 85%
Tuần 10–13: [P4] ✅ Frontend Dashboard + Map + AI Feedback
Tuần 14–15: [P5] ✅ E2E test + Demo ready
```

---

> **Ghi chú:** Plan này có thể điều chỉnh linh hoạt tùy theo số lượng thành viên nhóm và tiến độ thực tế. Recommend bắt đầu P1 (Hardware) và P2 (Backend) song song nếu nhóm đủ người.
