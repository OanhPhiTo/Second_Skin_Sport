# Second Skin Sport — Database Schema

Tài liệu này đặc tả toàn bộ lược đồ cơ sở dữ liệu (Database Schema) của Second Skin Sport, được ánh xạ thông qua các JPA Entities trong package `com.secondskin.sport.entity`. 
Hệ thống sử dụng **Microsoft SQL Server** trong môi trường Production và **H2 In-Memory Database** trong môi trường kiểm thử/demo.

---

## 1. Sơ Đồ Quan Hệ Thực Thể (Entity Relationship Diagram)

```
       ┌──────────────────────┐               ┌──────────────────────┐
       │        users         │1             *│        teams         │
       ├──────────────────────┼───────────────┼──────────────────────┤
       │ id (PK)              │ coach_id (FK) │ id (PK)              │
       │ email (UQ)           │               │ coach_id (FK)        │
       │ role                 │               │ name                 │
       └──────────┬───────────┘               └──────────┬───────────┘
                  │ 1                                    │ 1
                  │                                      │
                  │ *                                    │ *
       ┌──────────┴───────────┐               ┌──────────┴───────────┐
       │    sport_sessions    │1             *│    team_athletes     │
       ├──────────────────────┼───────────────┼──────────────────────┤
       │ id (PK)              │               │ id (PK)              │
       │ user_id (FK)         │               │ team_id (FK)         │
       │ device_id            │               │ user_id (FK, null)   │
       └──────────┬───────────┘               │ device_id            │
                  │ 1                         │ status (ENUM)        │
                  │                           └──────────────────────┘
                  │ *                                    
       ┌──────────┴───────────┐               ┌──────────────────────┐
       │     sensor_data      │               │       devices        │
       ├──────────────────────┤               ├──────────────────────┤
       │ id (PK)              │               │ id (PK)              │
       │ session_id (FK)      │               │ device_id            │
       │ device_id            │               │ device_name          │
       │ accelerometerX/Y/Z   │               │ battery_level        │
       │ gyroscopeX/Y/Z       │               │ connected            │
       └──────────────────────┘               └──────────────────────┘
                  │ 1
                  │ 1
       ┌──────────┴───────────┐
       │performance_statistics│
       ├──────────────────────┤
       │ id (PK)              │
       │ session_id (FK)      │
       │ user_id (FK)         │
       └──────────────────────┘
```

---

## 2. Chi Tiết Các Bảng Dữ Liệu (Table Specifications)

### 2.1. Bảng `users`
Lưu trữ thông tin người dùng, tài khoản vận động viên, huấn luyện viên và quản trị viên.

| Cột (Column) | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PK`, `IDENTITY`, `NOT NULL` | Khóa chính tự tăng |
| `name` | `VARCHAR(255)` | `NULL` | Họ và tên hiển thị |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` | Email đăng nhập hệ thống |
| `password` | `VARCHAR(255)` | `NOT NULL` | Mật khẩu băm bằng BCrypt |
| `role` | `VARCHAR(50)` | `NOT NULL` | Giá trị ENUM: `USER`, `COACH`, `ADMIN` |
| `preferred_sport` | `VARCHAR(255)` | `NULL` | Bộ môn ưu tiên (Basketball, Running...) |
| `created_at` | `DATETIME2` | `NULL` | Thời điểm tạo tài khoản |
| `enabled` | `BIT` (boolean) | `NOT NULL`, Default `1` | Trạng thái hoạt động (`false` = đã bị ban) |

---

### 2.2. Bảng `devices`
Quản lý danh sách thiết bị cảm biến đeo (Wearable Patches).

| Cột (Column) | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PK`, `IDENTITY`, `NOT NULL` | Khóa chính tự tăng |
| `device_name` | `VARCHAR(255)` | `NULL` | Tên thiết bị (ví dụ: Second Skin Patch #001) |
| `device_id` | `VARCHAR(255)` | `NULL` | Mã định danh phần cứng (ví dụ: `SSS-PATCH-001`) |
| `connected` | `BIT` (boolean) | `NOT NULL` | Trạng thái kết nối trực tuyến |
| `battery_level` | `INT` | `NOT NULL` | Dung lượng pin còn lại ($0 - 100\%$) |
| `last_sync` | `DATETIME2` | `NULL` | Thời điểm đồng bộ gần nhất |
| `firmware_version` | `VARCHAR(50)` | `NULL` | Phiên bản firmware (ví dụ: `v2.4.1`) |
| `connection_type` | `VARCHAR(50)` | `NULL` | Giao thức kết nối (`BLE 5.2`, `WiFi`) |

---

### 2.3. Bảng `sport_sessions`
Lưu thông tin tổng hợp của từng buổi luyện tập thể thao.

| Cột (Column) | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PK`, `IDENTITY`, `NOT NULL` | Khóa chính buổi tập |
| `user_id` | `BIGINT` | `NULL` | ID người dùng thực hiện (FK logic tới `users.id`) |
| `device_id` | `VARCHAR(255)` | `NULL` | Mã thiết bị ghi nhận dữ liệu |
| `sport` | `VARCHAR(100)` | `NULL` | Môn thể thao (`Running`, `Basketball`...) |
| `start_time` | `DATETIME2` | `NULL` | Thời gian bắt đầu buổi tập |
| `end_time` | `DATETIME2` | `NULL` | Thời gian kết thúc |
| `duration_minutes` | `INT` | `NOT NULL` | Thời lượng tính theo phút |
| `total_jumps` | `INT` | `NOT NULL` | Tổng số lần bật nhảy được ghi nhận |
| `direction_changes` | `INT` | `NOT NULL` | Tổng số lần đổi hướng đột ngột |
| `average_acceleration` | `FLOAT` | `NOT NULL` | Gia tốc trung bình (Đơn vị: $m/s^2$) |
| `average_speed` | `FLOAT` | `NOT NULL` | Tốc độ trung bình (Đơn vị: $km/h$) |
| `movement_intensity` | `INT` | `NOT NULL` | Cường độ vận động ($0 - 100\%$) |
| `performance_score` | `INT` | `NOT NULL` | Điểm số phong độ tổng quát ($0 - 100$) |
| `status` | `VARCHAR(50)` | `NULL` | Trạng thái (`Completed`, `In Progress`, `Paused`) |

---

### 2.4. Bảng `sensor_data`
Lưu chuỗi dữ liệu động học thô độ phân giải cao được gửi từ cảm biến IMU MPU6050.

| Cột (Column) | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PK`, `IDENTITY`, `NOT NULL` | Khóa chính tự tăng |
| `session_id` | `BIGINT` | `NULL` | FK logic tới `sport_sessions.id` |
| `device_id` | `VARCHAR(255)` | `NULL` | Mã phần cứng thiết bị phát tín hiệu |
| `timestamp` | `DATETIME2` | `NOT NULL` | Thời điểm ghi mẫu thời gian thực |
| `accelerometer_x` | `FLOAT` | `NOT NULL` | Gia tốc trục X (Đơn vị: $m/s^2$) |
| `accelerometer_y` | `FLOAT` | `NOT NULL` | Gia tốc trục Y (Đơn vị: $m/s^2$) |
| `accelerometer_z` | `FLOAT` | `NOT NULL` | Gia tốc trục Z (Đơn vị: $m/s^2$, trọng lực $\approx 9.81$) |
| `gyroscope_x` | `FLOAT` | `NOT NULL` | Vận tốc góc trục X (Đơn vị: $^\circ/s$) |
| `gyroscope_y` | `FLOAT` | `NOT NULL` | Vận tốc góc trục Y (Đơn vị: $^\circ/s$) |
| `gyroscope_z` | `FLOAT` | `NOT NULL` | Vận tốc góc trục Z (Đơn vị: $^\circ/s$) |
| `pitch` | `FLOAT` | `NOT NULL` | Góc chúi trước/sau (Đơn vị: độ $^\circ$) |
| `roll` | `FLOAT` | `NOT NULL` | Góc nghiêng trái/phải (Đơn vị: độ $^\circ$) |
| `yaw` | `FLOAT` | `NOT NULL` | Góc xoay hướng thân (Đơn vị: độ $^\circ$) |
| `movement_intensity`| `INT` | `NOT NULL` | Tải chuyển động tức thời ($0 - 100\%$) |

---

### 2.5. Bảng `performance_statistics`
Bảng tổng hợp dữ liệu lịch sử phục vụ vẽ biểu đồ và phân tích xu hướng lâu dài.

| Cột (Column) | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PK`, `IDENTITY`, `NOT NULL` | Khóa chính tự tăng |
| `session_id` | `BIGINT` | `NULL` | FK logic tới `sport_sessions.id` |
| `user_id` | `BIGINT` | `NULL` | FK logic tới `users.id` |
| `date` | `DATE` | `NULL` | Ngày thực hiện buổi tập |
| `sport` | `VARCHAR(100)` | `NULL` | Môn thể thao |
| `average_speed` | `FLOAT` | `NOT NULL` | Tốc độ trung bình ($km/h$) |
| `average_acceleration` | `FLOAT` | `NOT NULL` | Gia tốc trung bình ($m/s^2$) |
| `total_distance` | `FLOAT` | `NOT NULL` | Tổng quãng đường di chuyển ($km$) |
| `total_jumps` | `INT` | `NOT NULL` | Tổng số lần bật nhảy |
| `direction_changes`| `INT` | `NOT NULL` | Số lần đổi hướng |
| `movement_intensity`| `INT` | `NOT NULL` | Cường độ trung bình ($0 - 100\%$) |
| `performance_score` | `INT` | `NOT NULL` | Điểm phong độ ($0 - 100$) |

---

### 2.6. Bảng `teams`
Quản lý các đội thể thao dưới sự dẫn dắt của Huấn luyện viên (`Role.COACH`).

| Cột (Column) | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PK`, `IDENTITY`, `NOT NULL` | Khóa chính đội bóng |
| `name` | `VARCHAR(255)` | `NOT NULL` | Tên đội bóng (ví dụ: Hanoi Dragons Pro) |
| `sport` | `VARCHAR(100)` | `NOT NULL` | Bộ môn thi đấu (`Basketball`, v.v.) |
| `coach_id` | `BIGINT` | `NOT NULL` | Khóa ngoại trỏ đến `users.id` (HLV sở hữu) |
| `description` | `VARCHAR(255)` | `NULL` | Mô tả giới thiệu đội |
| `created_at` | `DATETIME2` | `NULL` | Ngày tạo đội |

---

### 2.7. Bảng `team_athletes`
Chi tiết danh sách vận động viên thuộc đội hình và trạng thái telemetry thể lực thời gian thực.

| Cột (Column) | Kiểu Dữ Liệu | Ràng Buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PK`, `IDENTITY`, `NOT NULL` | Khóa chính bản ghi VĐV trong đội |
| `team_id` | `BIGINT` | `NOT NULL` | Khóa ngoại trỏ đến `teams.id` |
| `user_id` | `BIGINT` | `NULL` | FK logic tới `users.id` (nếu đã có tài khoản hệ thống) |
| `name` | `VARCHAR(255)` | `NOT NULL` | Tên vận động viên |
| `jersey_number` | `INT` | `NULL` | Số áo thi đấu (ví dụ: 7, 23, 34) |
| `position` | `VARCHAR(50)` | `NULL` | Vị trí thi đấu (PG, SG, SF, PF, C) |
| `device_id` | `VARCHAR(255)` | `NULL` | Mã sensor gán cho VĐV (`SSS-PATCH-001`) |
| `status` | `VARCHAR(50)` | `NOT NULL`, Default `BENCH` | ENUM: `ON_FIELD`, `BENCH`, `RESTING`, `INJURED` |
| `minutes_played` | `INT` | Default `0` | Số phút đã thi đấu trên sân |
| `fatigue_index` | `FLOAT` | Default `0.0` | Chỉ số tải mỏi tích lũy ($0.0 - 100.0\%$) |
| `current_intensity` | `FLOAT` | Default `0.0` | Cường độ vận động tức thời ($0.0 - 100.0\%$) |
| `jump_count` | `INT` | Default `0` | Số lần bật nhảy trong trận |
| `high_impact_landings` | `INT` | Default `0` | Số pha tiếp đất va đập mạnh ($>3.5G$) |
| `heart_rate` | `INT` | Default `75` | Nhịp tim ước tính ($bpm$) |
| `last_telemetry_time` | `DATETIME2` | `NULL` | Thời điểm nhận gói tin telemetry gần nhất |
| `updated_at` | `DATETIME2` | `NULL` | Thời điểm cập nhật trạng thái |

---

## 3. Dữ Liệu Khởi Tạo Mặc Định (Database Seeders)

Hệ thống có 2 bộ khởi tạo dữ liệu tự động (`CommandLineRunner`) khi khởi động ứng dụng nếu cơ sở dữ liệu trống:
1. **`AdminSeeder.java`**:
   - `admin@secondskin.com` / `admin123` (Role: `ADMIN`).
2. **`DataInitializer.java`**:
   - VĐV: `alex.athlete@secondskin.io`, `sarah.runner@secondskin.io`, `emma.fitness@secondskin.io`, `david.swimmer@secondskin.io` (Mật khẩu: `password`, Role: `USER`).
   - HLV: `mike.coach@secondskin.io` (Mật khẩu: `password`, Role: `COACH`).
   - 6 thiết bị cảm biến: `SSS-PATCH-001` đến `SSS-PATCH-006`.
   - Đội bóng mẫu: `Hanoi Dragons Pro` với 5 cầu thủ gán sẵn số áo, vị trí, và telemetry mô phỏng.

