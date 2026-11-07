# Second Skin Sport — Current Status & Technical Roadmap

Tài liệu này ghi nhận hiện trạng triển khai thực tế của hệ thống **Second Skin Sport**, phân định rõ ràng giữa các tính năng đã hoàn thiện (kèm kiểm chứng), các tính năng đang thử nghiệm hoặc dùng dữ liệu dự phòng (mock/fallback), cùng các lỗi/giới hạn kỹ thuật đã biết.

---

## 1. Bảng Hiện Trạng Các Phân Hệ (Implementation Matrix)

| Phân Hệ / Tính Năng | Trạng Thái | Mức Độ Kiểm Chứng | Ghi Chú Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| **Xác thực & JWT** | ✅ Hoàn thành | Đã có Unit Test & Frontend Test | Stateless JWT, cấp token đăng ký/đăng nhập, tự động refresh token khi nhận mã 401. |
| **Bảo Mật IDOR & Quyền Sở Hữu (F11, F12, F13)** | ✅ Hoàn thành | Đã kiểm chứng qua Unit & Security Tests | Chống IDOR triệt để trên Session, Statistic và Đội hình HLV; chặn userId spoofing khi tạo session; HLV chỉ truy cập đội của mình; 404 trước khi check 403. |
| **Quản trị Admin** | ✅ Hoàn thành | Đã có Unit Test & UI Test | Cấp tài khoản HLV mới, khóa/mở khóa user, phân quyền. Đồng bộ hai chiều với bộ nhớ đệm `localStorage`. Không hiển thị thông tin pin. |
| **Điều phối Huấn luyện viên (F12)** | ✅ Hoàn thành | Đã có Unit Test & Integration Test | Quản lý đội, danh sách VĐV, trạng thái `ON_FIELD`/`BENCH`, tính chỉ số mỏi, xoay tua thay người chiến thuật; endpoint chuẩn `/api/coach/tactical/**`. Đã loại bỏ hoàn toàn hiển thị pin VĐV. |
| **Thu thập Batch IoT & Loại bỏ Mock 404 (F14)** | ✅ Hoàn thành | Đã có Unit Test & Integration Test | Endpoint `POST /api/v1/sensor/batches`; trả `ResourceNotFoundException` (404) chuẩn khi session/team không tồn tại, loại bỏ mock fallback. |
| **Thuật toán Nhảy (Jump)** | ✅ Hoàn thành | Đã kiểm chứng thuật toán với Unit Test | Đo thời gian bay (airtime), tính chiều cao nhảy ($h$), đo lực tiếp đất ($G$), bắn sự kiện WebSocket. |
| **Đặc trưng Động học DSP & Thống kê Thực (F15)** | ✅ Hoàn thành | Đã kiểm chứng qua `BiomechanicalFeatureExtractorTest` & `StatisticsServiceTest` | Đo độ êm tiếp đất, nhịp bước, độ vững thân trên, độ bùng nổ; đã loại bỏ tính toán cân bằng 2 chân do phần cứng dùng 1 cảm biến đơn. |
| **Trợ lý AI Coach (Groq)** | ✅ Hoàn thành | Unit Test/Fallback; API cloud chưa live-verified | Tích hợp Groq Chat Completions API qua REST; tự động chuyển sang Local DSP Engine khi không có API key hoặc API lỗi; hỗ trợ chuyên sâu Bóng rổ, Chạy bộ và Bóng chuyền; loại bỏ chỉ số cân bằng 2 chân. |
| **Firmware ESP32-C3 SuperMini** | ✅ Hoàn thành | Đã nạp và kiểm tra Serial / BLE | Hỗ trợ đọc MPU6050 qua I2C (Accel ±8g, Gyro ±500°/s, DLPF ~42Hz), lấy mẫu chuẩn 100Hz non-blocking, FSM Kinematics phân biệt Chạy vs Nhảy, xuất CSV thời gian thực. |
| **Web Bluetooth Direct Stream** | ✅ Hoàn thành | Đã kiểm tra trên trình duyệt Chrome | Kết nối BLE trực tiếp tới ESP32-C3: biểu đồ gia tốc a_mag trực quan hóa các vạch ngưỡng FSM và công cụ ghi log/gắn nhãn CSV trực tiếp trên Web. |
| **Giao diện VĐV & Thống kê** | ✅ Hoàn thành | Đã kiểm tra UI build & Recharts | Dashboard VĐV, hiển thị số buổi tập, biểu đồ phân tích hoạt động, bộ chọn môn thể thao người dùng (Bóng rổ, Chạy bộ, Bóng chuyền); đã loại bỏ các thành phần hiển thị pin. |
| **Thông Báo Kết Thúc Phiên Tập (Notification Engine)** | ✅ Hoàn thành | Đã có Unit Test & Frontend Test (36/36 passed) | Push WebSocket `/topic/notifications`, REST API `/api/notifications/**`, Floating Toast UI và Interactive Dropdown chuông thông báo trên Navbar. |

---

## 2. Các Giới Hạn & Lỗi Kỹ Thuật Đã Biết (Known Issues & Constraints)

## 2A. Milestone 4 — Đã triển khai

- Đã thêm `GlobalExceptionHandler` cho lỗi validation, 400, 403, 404 và 500; Security trả JSON nhất quán cho 401/403.
- Đã thêm React `ErrorBoundary` ở root để tránh giao diện trắng khi component bị lỗi.
- Fallback session offline dùng ID tuần tự theo dữ liệu local, không còn dùng timestamp 13 chữ số có thể xung đột ID database.
- Biểu đồ Statistics giới hạn 100 phiên gần nhất; URL cấu hình batch sensor dùng chuẩn `/api/v1/sensor/batches`.
- Settings lưu và nạp lại cấu hình người dùng từ `localStorage`.
- Màn hình Thiết bị không còn báo kết nối giả khi backend/BLE offline: fallback luôn `connected: false`, chỉ trạng thái BLE/GATT hoặc backend xác nhận mới được hiển thị là hoạt động.
- Báo cáo hiệu suất lấy tên và email từ user hiện đang đăng nhập qua `authService`; không còn hiển thị cố định hồ sơ mẫu Alex Johnson.
- Xuất PDF báo cáo dùng riêng dữ liệu 7 ngày gần nhất, chỉ in phần tổng hợp hoạt động và phân tích AI; các control, Navbar và chẩn đoán phần cứng bị loại khỏi bản in.
- Báo cáo PDF thay phần chẩn đoán cảm biến bằng nhóm chỉ số cơ sinh học 7 ngày: Landing Softness, Explosiveness/Airtime, Trunk Stability và Fatigue Index theo hồ sơ kỹ thuật (đã loại bỏ Bilateral Symmetry).
- PDF report print layout now flows across multiple A4 pages without clipping and includes the project logo in the report header.
- Report filters now provide 3-day, 7-day and 1-month ranges; the logged-in athlete profile is read-only without a dropdown control.
- Settings now persists app preferences, updates the authenticated user's name/preferred sport through `PUT /api/auth/profile`, and sends real IMU calibration/sampling commands over BLE when an ESP32 connection exists; it no longer claims calibration when disconnected.
- Email OTP delivery now uses Gmail SMTP with `spring-boot-starter-mail`, `MAIL_USERNAME`, and `MAIL_APP_PASSWORD`; OAuth2 mail remains only as a non-primary compatibility service.
- Authentication hardening now stores refresh tokens in an HttpOnly SameSite cookie, keeps access tokens in frontend memory only, moves session/team/notification fallback caches to `sessionStorage`, and authenticates STOMP WebSocket connections via CONNECT headers instead of URL query tokens.
- BLE online indicators now use the live browser GATT state as the only source of truth; stale backend device registration status can no longer keep Navbar, Sidebar, or sensor cards showing `TRỰC TUYẾN` after ESP32 disconnects.
- Device screen no longer fabricates fallback devices or displays seeded battery/sync/firmware values as live telemetry; it renders only the BLE device currently recognized by the browser and shows an explicit empty state otherwise.
- Login `Ghi nhớ` now uses a real preference: unchecked creates a session-only HttpOnly refresh cookie, while checked issues a 30-day refresh JWT/cookie; the checkbox styling no longer inherits full-width text-input styles.
- Đã hoàn thiện trang Home (`/home` và landing root) tinh gọn, đúng trọng tâm.
- Khắc phục triệt để lỗi hiển thị dropdown select tàng hình trên toàn bộ ứng dụng.
- Triển khai `UnitContext` toàn diện (Hệ mét vs Hệ Anh-Mỹ).
- Khóa an toàn nút 'Bắt Đầu Theo Dõi' trên Dashboard.
- **Khắc phục lỗi biểu đồ Cường độ chuyển động & Xu hướng hiệu suất phẳng lì ở mức 100%:** Loại bỏ việc dồn trực tiếp trọng lực $1G \approx 9.81 m/s^2$ vào gia tốc chuyển động; chuyển sang tính gia tốc động học cơ bắp $a_{dyn} = |\vec{a}| - 9.81 m/s^2$; công thức cường độ và điểm hiệu suất dao động chân thực (55% - 96%) dựa trên nỗ lực, số cú nhảy và đổi hướng; bổ sung cơ chế tự động chữa lành các bản ghi lịch sử cũ bị kẹt trần 100% trong Database và Frontend Cache.
- Triển khai chế độ Live Session Tracking thời gian thực trên Dashboard.
- Khắc phục triệt để lỗi CSS bleed giữa Dashboard và Activities.
- Nâng cấp giao diện Huấn luyện viên (Coach Portal) sang chuẩn Dark Futuristic Neon/Cyan.

## 2B. Milestone 5 & Cập Nhật Nghiệp Vụ Cảm Biến

- **Loại bỏ nghiệp vụ Cân bằng 2 chân (Bilateral Symmetry / Balance):**
  - Do kiến trúc phần cứng thực tế sử dụng 1 patch cảm biến IMU MPU-6050 gắn tại đầu gối của 1 chân, việc ước tính cân bằng 2 chân bằng 1 cảm biến đơn không đảm bảo tính chính xác cơ sinh học.
  - Đã loại bỏ hoàn toàn việc tính toán lực dội đối xứng ngang trong `BiomechanicalFeatureExtractor.java`.
  - Cập nhật công thức tính điểm phong độ và heuristic trong `AiCoachService.java` (tập trung vào Độ êm tiếp đất 0.3, Độ vững thân trên 0.25, Độ bùng nổ, Cadence; hỗ trợ chuyên sâu thêm bộ môn Bóng chuyền).
  - Loại bỏ các thẻ, thanh đo và cột hiển thị cân bằng 2 chân trên frontend (`ActivityCard.jsx`, `AiCoachInsightCard.jsx`, `Reports.jsx`, `Sensors.jsx`, `api.js`).
- **Loại bỏ toàn bộ thành phần hiển thị Pin trên giao diện 3 Role:**
  - Đã loại bỏ badge pin trên Navbar, thanh bar pin và % pin trên Sidebar.
  - Đã loại bỏ % pin, icon pin và chỉ số pin trung bình trên Coach Dashboard (cả thẻ tổng quan, cầu thủ thi đấu và ghế dự bị).
  - Đã loại bỏ thanh pin và nút sạc trên trang Quản lý Cảm biến (`Sensors.jsx`).
  - Trang Admin tiếp tục duy trì trạng thái không hiển thị pin.
- **Loại bỏ Tự Động Nhận Diện Môn & Cho Phép Người Dùng Tự Chọn:**
  - Thay vì FSM tự động đoán môn dựa trên số cú nhảy ($\ge 6$ cú nhảy tự động chuyển sang Bóng rổ), hệ thống đã chuyển quyền kiểm soát cho người dùng.
  - Cung cấp bộ chọn môn trực quan trên màn hình Cảm biến (`Sensors.jsx`) gồm 3 bộ môn: **Bóng rổ** (`Basketball`), **Chạy bộ** (`Running`), **Bóng chuyền** (`Volleyball`).
  - Đồng bộ trạng thái môn thể thao đã chọn qua `BleContext.jsx` và lưu trữ bền vững trong `localStorage.sss_selected_sport`.

---

## 3. Kế Hoạch & Hạng Mục Tương Lai (Technical Roadmap)

- [ ] **Tích hợp GNSS / GPS:** Hoàn thiện bộ giải mã chuẩn NMEA (tọa độ vĩ độ/kinh độ, bản đồ nhiệt di chuyển trên sân bóng đá) từ chân GPIO 20/21 của ESP32-C3 lên backend.
- [ ] **Tối ưu hóa Database Batch Insert:** Chuyển đổi việc ghi dữ liệu cảm biến thô tần số cao ($10\text{Hz} - 50\text{Hz}$) từ JPA `saveAll` sang cơ chế JDBC Batch hoặc Time-Series Database (TimescaleDB / InfluxDB) khi hệ thống mở rộng lên hàng nghìn VĐV.
- [ ] **Mô-đun Huấn Luyện AI Offline (On-Device Inference):** Nghiên cứu nhúng mô hình phân loại hoạt động (TinyML / TensorFlow Lite for Microcontrollers) trực tiếp trên ESP32-C3 để phân loại động tác ngay tại thiết bị đeo.
