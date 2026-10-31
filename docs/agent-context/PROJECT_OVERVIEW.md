# Second Skin Sport — Project Overview

## 1. Mục Tiêu Dự Án (Project Vision & Objectives)

**Second Skin Sport** là nền tảng công nghệ thể thao thông minh (Sports-Tech IoT Platform) kết hợp giữa:
1. **Thiết bị đeo thông minh (Wearable Patch):** Phần cứng siêu nhỏ gọn gắn chip ESP32-C3 SuperMini và cảm biến quán tính 6 bậc tự do (6-DOF IMU MPU-6050), thu thập gia tốc và vận tốc góc với độ trễ thấp.
2. **Hệ thống Backend phân tích chuyên sâu:** Xây dựng trên Spring Boot 3 (Java 21), xử lý chuỗi tín hiệu thời gian thực, phát hiện chuyển động nhảy (Jump Detection), bứt tốc, đổi hướng và đánh giá tải cơ học.
3. **Trợ lý AI Động học Vận động:** Tích hợp mô hình đám mây Google Gemini 1.5 Flash kết hợp với Bộ máy tính toán số động học nội bộ (DSP Feature Extractor), cung cấp nhận xét khoa học thể thao và đề xuất bài tập khắc phục cho VĐV.
4. **Bàn điều khiển chiến thuật Đội hình (Coach Dashboard):** Cho phép Huấn luyện viên giám sát cùng lúc toàn bộ đội hình trên sân theo thời gian thực, tính toán chỉ số mỏi (Fatigue Index), va đập gối/lưng (High Impact Landings) và cảnh báo thay người/xoay tua chiến thuật tự động.
5. **Dashboard VĐV & Quản trị viên:** Giúp VĐV theo dõi tiến trình rèn luyện cá nhân, và Admin quản lý cấp quyền tài khoản HLV/người dùng.

---

## 2. Công Nghệ Sử Dụng (Technology Stack)

### 2.1. Backend (Spring Boot Service)
- **Ngôn ngữ & Runtime:** Java 21 LTS.
- **Framework chính:** Spring Boot 3.2.3.
- **Bảo mật:** Spring Security 6, JWT Stateless Authentication (jjwt 0.11.5), BCrypt Password Hashing, RBAC (Role-Based Access Control: `ADMIN`, `COACH`, `USER`).
- **Cơ sở dữ liệu & ORM:** Spring Data JPA, Hibernate ORM, Microsoft SQL Server (Môi trường vận hành), H2 In-Memory Database (Demo / Test).
- **Giao tiếp Realtime:** Spring WebSocket với STOMP Message Broker (`/ws/sensor-data`, Simple Broker `/topic`).
- **Tích hợp Trí tuệ Nhân tạo (Cloud AI):** Google Gemini REST API (`gemini-1.5-flash`) với chế độ `responseMimeType: "application/json"`.
- **Thư viện bổ trợ:** Project Lombok 1.18.42, Spring Boot Actuator, Jakarta Validation.
- **Kiểm thử:** JUnit 5, Mockito, Spring Boot Starter Test.

### 2.2. Frontend (Single Page Application)
- **Framework & Core:** React 19.2.8, React DOM 19.2.8.
- **Công cụ Build & Dev Server:** Vite 8.3.0.
- **Điều hướng (Routing):** React Router DOM v7.18.4 (hỗ trợ Protected Routes theo Role).
- **Trực quan hóa Dữ liệu (Charts):** Recharts 3.10.1 (ResponsiveContainer, LineChart, AreaChart, BarChart, RadarChart).
- **Bộ icon:** Lucide React 1.46.0.
- **Giao tiếp HTTP:** Axios 1.20.0 với Request/Response Interceptors (tự động gắn JWT Bearer và cơ chế refresh token).
- **Kết nối Trực tiếp Cảm biến:** Web Bluetooth API (kết nối BLE trực tiếp từ trình duyệt Chrome/Edge tới ESP32-C3).
- **Kiểm thử:** Vitest 5.0.3, @testing-library/react 16.3.3, @testing-library/jest-dom 7.0.1, jsdom 30.1.2.

### 2.3. Firmware & IoT Hardware
- **Vi điều khiển (MCU):** ESP32-C3 SuperMini (kiến trúc RISC-V 32-bit, tích hợp Wi-Fi 2.4GHz & Bluetooth 5.2 LE).
- **Cảm biến (IMU):** MPU-6050 (3 trục gia tốc kế + 3 trục con quay hồi chuyển, giao tiếp qua bus I2C: GPIO 8 SDA, GPIO 9 SCL).
- **Môi trường lập trình:** Arduino IDE / ESP-IDF (C/C++).
- **Giao thức truyền dữ liệu:**
  - **Bluetooth Low Energy (BLE):** GATT Custom Service phát dữ liệu động học (10Hz) trực tiếp lên Web.
  - **HTTP REST Batch:** Đóng gói mảng mẫu sensor gửi trực tiếp qua Wi-Fi lên endpoint `POST /api/v1/sensor/batches`.

---

## 3. Cấu Trúc Dự Án (Repository Structure)

Dự án được tổ chức theo mô hình Monorepo:

```text
Second_Skin_Sport/
├── AGENTS.md                          # Điểm khởi đầu & quy chuẩn vận hành cho AI Coding Agents
├── SecondSkin_Backend_Frontend_Architecture.md # Tài liệu kiến trúc sơ bộ ban đầu
├── docker-compose.yml                 # Cấu hình container hóa (tùy chọn)
├── .agents/rules/                     # Quy tắc kiến trúc độc quyền nội bộ MAS
├── backend/                           # Module Backend Spring Boot
│   ├── pom.xml                        # Maven build file (Java 21, Spring Boot 3.2.3)
│   └── src/
│       ├── main/java/com/secondskin/sport/
│       │   ├── Application.java       # Spring Boot Main Entry Point
│       │   ├── config/                # Cấu hình CORS, WebSocket, Seeder, Data Initializer
│       │   ├── controller/            # REST API Controllers (Admin, Auth, Coach, Session, AI...)
│       │   ├── dto/                   # Data Transfer Objects (Request/Response)
│       │   ├── entity/                # JPA Database Entities (User, Session, Device, Team...)
│       │   ├── repository/            # Spring Data JPA Repositories
│       │   ├── security/              # JWT Filters, SecurityConfig, UserDetailsService
│       │   └── service/               # Business Logic, DSP Algorithms, Jump Detection, AI
│       ├── main/resources/
│       │   └── application.properties # Cấu hình cổng, DataSource, JPA, Gemini API Key
│       └── test/                      # Bộ kiểm thử Unit & Integration Tests
├── frontend/                          # Module Frontend React + Vite
│   ├── package.json                   # Dependencies & npm scripts
│   ├── vite.config.js                 # Vite build & test configuration
│   └── src/
│       ├── main.jsx                   # React Entry Point
│       ├── App.jsx                    # Route mapping & layout wrapper
│       ├── assets/                    # Logo, hình ảnh thiết bị, minh họa
│       ├── components/                # UI Components dùng chung (Navbar, Sidebar, Charts, Cards)
│       ├── context/                   # React Contexts (BleContext...)
│       ├── hooks/                     # Custom Hooks (useSensorWebSocket, useCoachTacticalWebSocket)
│       ├── layouts/                   # AdminLayout, CoachLayout, DashboardLayout
│       ├── pages/                     # Các màn hình chính (Dashboard, CoachDashboard, AdminUsers...)
│       ├── services/                  # api.js (Axios API & offline mock fallbacks), bleService.js
│       └── styles/                    # Toàn bộ CSS modules và custom styles
├── firmware/                          # Mã nguồn phần cứng nhúng
│   └── esp32_c3_ble_sensor/
│       ├── esp32_c3_ble_sensor.ino    # Mã nguồn firmware nạp bo mạch ESP32-C3 SuperMini
│       ├── README.md                  # Sơ đồ chân nạp code & hướng dẫn ghép nối BLE
│       └── simulate_squad_telemetry.py# Python script mô phỏng dữ liệu telemetry cả đội bóng
└── docs/                              # Tài liệu kỹ thuật, bằng sáng chế và context
    ├── agent-context/                 # Bộ tài liệu Ngữ cảnh Dự án (Agent Context System)
    │   ├── PROJECT_OVERVIEW.md        # File này
    │   ├── ARCHITECTURE.md
    │   ├── DATABASE_SCHEMA.md
    │   ├── API_DOCUMENTATION.md
    │   ├── CODING_CONVENTIONS.md
    │   ├── CURRENT_STATUS.md
    │   ├── DECISIONS.md
    │   └── modules/                   # Chi tiết kỹ thuật từng module
    └── AI_COACH_DOCUMENTATION.md      # Tài liệu chi tiết thuật toán Trợ lý AI Coach
```

---

## 4. Các Module Nghiệp Vụ Chính (Core Business Modules)

1. **Module Xác Thực & Phân Quyền (Auth & RBAC):**
   - Đăng ký, đăng nhập tài khoản với JWT token.
   - Phân quyền theo 3 vai trò: `ADMIN` (toàn quyền hệ thống), `COACH` (quản lý đội hình, buổi tập, chiến thuật), `USER` (vận động viên cá nhân xem phân tích tập luyện).
   - Cơ chế tự động làm mới access token thông qua interceptor Axios.

2. **Module Thu Thập Dữ Liệu Cảm Biến & IoT (Sensor & IoT Telemetry):**
   - Thu nhận dữ liệu chuỗi 6 trục từ MPU6050 qua BLE Web Bluetooth hoặc endpoint nhận batch `POST /api/v1/sensor/batches`.
   - Phân tích xung lực tiếp đất ($G$), thời gian bay trên không ($Airtime$), phát hiện các cú nhảy (Jump Detection) và tính cường độ vận động tức thời.
   - Phát sóng dữ liệu thời gian thực tới frontend qua WebSocket topic `/topic/sensor-telemetry` và `/topic/jumps`.

3. **Module Quản Trị Đội Hình & Chiến Thuật Coach (Coach & Squad Management):**
   - Huấn luyện viên tạo đội, thêm VĐV vào đội bóng, gán thiết bị sensor và số áo.
   - Giám sát đồng thời các cầu thủ trên sân (`ON_FIELD`) và trên ghế dự bị (`BENCH`).
   - Động cơ tính toán chỉ số mỏi thể lực (`fatigueIndex`) và cảnh báo va đập nguy hiểm (`highImpactLandings`).
   - Tính năng "Đề xuất Thay người Chiến thuật" (Tactical Rotation) và thực thi hoán đổi vị trí trực tiếp (`/api/coach/teams/{teamId}/tactical-action`).

4. **Module Trợ Lý Trí Tuệ Nhân Tạo (AI Coach Engine):**
   - Động cơ phân tích song hành: Google Gemini 1.5 Flash (khi online) và Local Biomechanical DSP Engine (khi offline).
   - Đo lường 5 chỉ số động học: Độ êm tiếp đất (Landing Softness), Cân bằng 2 chân (Bilateral Symmetry), Nhịp vận động (Cadence), Độ vững thân trên (Trunk Stability), và Độ bùng nổ (Explosiveness).
   - Đề xuất các bài tập khắc phục cụ thể theo số hiệp/lần (Actionable Drills: Depth Drop, A-Skip, Single-leg Squats...).

5. **Module Thống Kê & Báo Cáo VĐV (Athlete Analytics & Dashboard):**
   - Tóm tắt tổng quan chỉ số: Tốc độ trung bình, quãng đường, số bước nhảy, điểm hiệu suất (Performance Score).
   - Trực quan hóa lịch sử luyện tập theo biểu đồ đường, cột, và radar qua Recharts.
   - Lọc dữ liệu theo bộ môn (Chạy bộ, Bóng rổ) và khoảng thời gian (Hôm nay, Tuần, Tháng).

6. **Module Quản Trị Hệ Thống (System Administration):**
   - Bảng điều khiển dành riêng cho `ADMIN`.
   - Cấp tài khoản cho Huấn luyện viên mới, phân quyền người dùng, khóa (`ban`) hoặc mở khóa (`unban`) tài khoản người dùng vi phạm.

