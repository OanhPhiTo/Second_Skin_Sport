# Second Skin Sport — Current Status & Technical Roadmap

Tài liệu này ghi nhận hiện trạng triển khai thực tế của hệ thống **Second Skin Sport**, phân định rõ ràng giữa các tính năng đã hoàn thiện (kèm kiểm chứng), các tính năng đang thử nghiệm hoặc dùng dữ liệu dự phòng (mock/fallback), cùng các lỗi/giới hạn kỹ thuật đã biết.

---

## 1. Bảng Hiện Trạng Các Phân Hệ (Implementation Matrix)

| Phân Hệ / Tính Năng | Trạng Thái | Mức Độ Kiểm Chứng | Ghi Chú Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| **Xác thực & JWT** | ✅ Hoàn thành | Đã có Unit Test & Frontend Test | Stateless JWT, cấp token đăng ký/đăng nhập, tự động refresh token khi nhận mã 401. |
| **Bảo Mật IDOR & Quyền Sở Hữu (F11, F12, F13)** | ✅ Hoàn thành | Đã kiểm chứng qua Unit & Security Tests | Chống IDOR triệt để trên Session, Statistic và Đội hình HLV; chặn userId spoofing khi tạo session; HLV chỉ truy cập đội của mình; 404 trước khi check 403. |
| **Quản trị Admin** | ✅ Hoàn thành | Đã có Unit Test & UI Test | Cấp tài khoản HLV mới, khóa/mở khóa user, phân quyền. Đồng bộ hai chiều với bộ nhớ đệm `localStorage`. |
| **Điều phối Huấn luyện viên (F12)** | ✅ Hoàn thành | Đã có Unit Test & Integration Test | Quản lý đội, danh sách VĐV, trạng thái `ON_FIELD`/`BENCH`, tính chỉ số mỏi, xoay tua thay người chiến thuật; endpoint chuẩn `/api/coach/tactical/**`. |
| **Thu thập Batch IoT & Loại bỏ Mock 404 (F14)** | ✅ Hoàn thành | Đã có Unit Test & Integration Test | Endpoint `POST /api/v1/sensor/batches`; trả `ResourceNotFoundException` (404) chuẩn khi session/team không tồn tại, loại bỏ mock fallback. |
| **Thuật toán Nhảy (Jump)** | ✅ Hoàn thành | Đã kiểm chứng thuật toán với Unit Test | Đo thời gian bay (airtime), tính chiều cao nhảy ($h$), đo lực tiếp đất ($G$), bắn sự kiện WebSocket. |
| **Đặc trưng Động học DSP & Thống kê Thực (F15)** | ✅ Hoàn thành | Đã kiểm chứng qua `BiomechanicalFeatureExtractorTest` & `StatisticsServiceTest` | Đo độ êm tiếp đất, đối xứng 2 chân, độ vững thân trên, độ bùng nổ, tính `accelChange` và `fatigueIndex` động từ telemetry cảm biến thực tế. |
| **Trợ lý AI Coach (Gemini)** | ✅ Hoàn thành | Đã có Unit Test & Mock Fallback | Tích hợp Google Gemini 1.5 Flash qua REST; tự động chuyển sang Local DSP Engine khi không có API key; báo 404 chuẩn khi session không tồn tại. |
| **Firmware ESP32-C3 SuperMini** | ✅ Hoàn thành | Đã nạp và kiểm tra Serial / BLE | Hỗ trợ đọc cảm biến MPU6050 qua I2C, tự động bật chế độ giả lập nếu cảm biến chưa gắn. |
| **Web Bluetooth Direct Stream** | ✅ Hoàn thành | Đã kiểm tra trên trình duyệt Chrome | Kết nối BLE trực tiếp từ Web tới ESP32-C3 để xem biểu đồ dao động 6 trục thời gian thực. |
| **Giao diện VĐV & Thống kê** | ✅ Hoàn thành | Đã kiểm tra UI build & Recharts | Dashboard VĐV, hiển thị số buổi tập, biểu đồ phân tích hoạt động, lịch sử luyện tập. |
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
- Báo cáo PDF thay phần chẩn đoán cảm biến bằng nhóm chỉ số cơ sinh học 7 ngày: Landing Softness, Explosiveness/Airtime, Bilateral Symmetry, Trunk Stability và Fatigue Index theo hồ sơ kỹ thuật.
- PDF report print layout now flows across multiple A4 pages without clipping and includes the project logo in the report header.
- Report filters now provide 3-day, 7-day and 1-month ranges; the logged-in athlete profile is read-only without a dropdown control.
- Settings now persists app preferences, updates the authenticated user's name/preferred sport through `PUT /api/auth/profile`, and sends real IMU calibration/sampling commands over BLE when an ESP32 connection exists; it no longer claims calibration when disconnected.
- Email OTP delivery now uses Gmail SMTP with `spring-boot-starter-mail`, `MAIL_USERNAME`, and `MAIL_APP_PASSWORD`; OAuth2 mail remains only as a non-primary compatibility service.

## 2B. Milestone 5 — Đã hoàn tất

- Bộ kiểm thử E2E Tiers 1–4 đạt **53/53**, bao phủ xác thực, batch sensor, session lifecycle, tactical rotation và workload liên tục.
- Hợp đồng auto-session trong E2E đã được cập nhật để gửi JWT, phù hợp với chính sách bảo vệ `/api/sessions/**`.
- Batch response hỗ trợ cả `processedCount` và `recordsProcessed` để duy trì tương thích API.

1. **Surefire Forking Hang trên Môi trường Windows Terminal:**
   - *Mô tả:* Khi chạy lệnh `mvn test` toàn bộ repository, tiến trình Maven Surefire có thể bị treo vô hạn ở giai đoạn forked JVM do xung đột giữa cơ chế socket giao tiếp của Surefire 3.1.2 và tiến trình WebSocket broker trên Windows.
   - *Giải pháp hiện tại:* Kiểm tra tính hợp lệ của mã nguồn bằng `mvn test-compile`, và chỉ chạy các test suite đơn vị mục tiêu (ví dụ: `mvn test -Dtest=BiomechanicalFeatureExtractorTest,JumpDetectionServiceTest,AdminServiceTest`).

   - Frontend Vitest có thể gặp lỗi môi trường `ENOENT` khi sandbox dọn thư mục tạm trong lúc chạy nhiều suite; production build vẫn chạy thành công.

2. **Cơ Sở Dữ Liệu SQL Server Mặc Định vs H2:**
   - *Mô tả:* File `application.properties` hiện trỏ tới SQL Server tại `localhost:1433`. Nếu máy phát triển chưa cài đặt hoặc chưa khởi động SQL Server container, ứng dụng Spring Boot sẽ báo lỗi kết nối.
   - *Khuyến nghị:* Với môi trường kiểm thử hoặc demo nhanh không có SQL Server, chuyển sang cấu hình H2 In-Memory Database (đã có sẵn trong file properties ở dạng comment).

3. **Phụ Thuộc Biến Môi Trường Google Gemini:**
   - *Mô tả:* Tính năng phân tích AI nâng cao sử dụng API Key Google Gemini (`AI_GEMINI_API_KEY`). Nếu người dùng chưa cấu hình biến môi trường này, hệ thống sẽ sử dụng Local Biomechanical DSP Heuristics để trả về kết quả. Đây là tính năng dự phòng có chủ đích, không phải lỗi hệ thống.

---

## 3. Kế Hoạch & Hạng Mục Tương Lai (Technical Roadmap)

- [ ] **Tích hợp GNSS / GPS:** Hoàn thiện bộ giải mã chuẩn NMEA (tọa độ vĩ độ/kinh độ, bản đồ nhiệt di chuyển trên sân bóng đá) từ chân GPIO 20/21 của ESP32-C3 lên backend.
- [ ] **Tối ưu hóa Database Batch Insert:** Chuyển đổi việc ghi dữ liệu cảm biến thô tần số cao ($10\text{Hz} - 50\text{Hz}$) từ JPA `saveAll` sang cơ chế JDBC Batch hoặc Time-Series Database (TimescaleDB / InfluxDB) khi hệ thống mở rộng lên hàng nghìn VĐV.
- [ ] **Mô-đun Huấn Luyện AI Offline (On-Device Inference):** Nghiên cứu nhúng mô hình phân loại hoạt động (TinyML / TensorFlow Lite for Microcontrollers) trực tiếp trên ESP32-C3 để phân loại động tác ngay tại thiết bị đeo.

