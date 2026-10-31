# Module Context: Thống Kê & Báo Cáo VĐV (Athlete Analytics & Dashboard)

## 1. Trách Nhiệm Của Module
Module chịu trách nhiệm:
- Cung cấp không gian làm việc trực quan cho Vận động viên cá nhân (`Role.USER`).
- Quản lý vòng đời các buổi luyện tập thể thao (`SportSession`): bắt đầu, tự động ghi nhận dữ liệu từ cảm biến, hoàn thành buổi tập.
- Tính toán và lưu trữ các chỉ số hiệu suất dài hạn (`PerformanceStatistic`): tốc độ trung bình, quãng đường, số bước nhảy, cường độ vận động, và điểm phong độ.
- Trực quan hóa dữ liệu luyện tập thông qua các biểu đồ Recharts (đường xu hướng, phân bổ cường độ, thống kê theo tuần/tháng).
- Cho phép VĐV xem lại lịch sử các buổi tập, phân tích chi tiết dữ liệu cảm biến từng buổi.

---

## 2. Các Class, Component & Tệp Quan Trọng

### Backend (Spring Boot)
- [`SessionController.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/controller/SessionController.java): REST endpoints quản lý buổi tập (`/api/sessions`).
- [`StatisticsController.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/controller/StatisticsController.java): REST endpoints truy vấn số liệu thống kê tổng quan và phân tích hoạt động (`/api/statistics`).
- [`SessionService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/SessionService.java): Nghiệp vụ tạo buổi tập tự động, cập nhật trạng thái buổi tập.
- [`StatisticsService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/StatisticsService.java): Tính toán chỉ số tổng hợp toàn thời gian, lọc theo bộ môn và khoảng thời gian.
- [`SportSession.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/SportSession.java): JPA Entity lưu trữ thông tin buổi tập.
- [`PerformanceStatistic.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/PerformanceStatistic.java): JPA Entity lưu trữ chỉ số thống kê theo ngày.

### Frontend (React)
- [`Dashboard.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Dashboard.jsx): Màn hình chính của VĐV hiển thị các thẻ tóm tắt (Stat Cards), biểu đồ phong độ (Performance Chart), và danh sách buổi tập gần đây.
- [`Activities.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Activities.jsx): Trang chi tiết danh sách tất cả các buổi tập kèm bộ lọc môn thể thao.
- [`Statistics.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Statistics.jsx): Trang thống kê phân tích chuyên sâu với các biểu đồ xu hướng.
- [`Reports.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Reports.jsx): Trang báo cáo định kỳ.
- [`PerformanceChart.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/PerformanceChart.jsx): Component vẽ biểu đồ Recharts (ResponsiveContainer, AreaChart, LineChart).
- [`StatCard.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/StatCard.jsx): Thẻ hiển thị các chỉ số nhanh (Thời gian tập, Số cú nhảy, Điểm trung bình).
- [`SessionTable.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/SessionTable.jsx): Bảng danh sách các buổi tập.

---

## 3. Luồng Xử Lý Chính (Core Flow)

1. **Hiển Thị Dashboard VĐV:**
   - Khi VĐV truy cập `/dashboard`, frontend gọi song song:
     - `GET /api/statistics/overview` để lấy số liệu thẻ tổng quát (tổng giờ tập, calo tiêu thụ, số lần bật nhảy, điểm trung bình).
     - `GET /api/sessions` để lấy danh sách các buổi tập gần nhất.
     - `GET /api/statistics/activity-analysis` để nạp dữ liệu vẽ biểu đồ tiến độ.
2. **Khởi Tạo Buổi Tập Mới Từ Thiết Bị (Auto-Session):**
   - Khi thiết bị IoT bắt đầu phát dữ liệu có gắn mã người dùng, client gọi `POST /api/sessions/auto`.
   - `SessionService` khởi tạo bản ghi `SportSession` với trạng thái `In Progress`, gán ID buổi tập cho các mẫu đo tiếp theo.
3. **Kết Thúc & Tổng Kết Buổi Tập:**
   - Khi buổi tập hoàn thành, hệ thống cập nhật trạng thái `Completed`, tính toán gia tốc trung bình, số cú nhảy và điểm hiệu suất tổng hợp.
   - Bản ghi được lưu vào bảng `sport_sessions` và tự động sinh bản ghi trong `performance_statistics`.

---

## 4. API & Dependencies Liên Quan
- `GET /api/sessions` (Params: `sport`)
- `GET /api/sessions/{id}`
- `POST /api/sessions`
- `POST /api/sessions/auto`
- `PUT /api/sessions/{id}`
- `DELETE /api/sessions/{id}`
- `GET /api/sessions/{id}/sensor-data`
- `GET /api/statistics/overview`
- `GET /api/statistics/activity-analysis`
- `GET /api/statistics` (Params: `sport`, `timeRange`)
- `GET /api/statistics/{sessionId}`

---

## 5. Quy Tắc & Lưu Ý Khi Chỉnh Sửa Module
- **Xử lý tham số linh hoạt:** Các endpoint nhận `sport` hoặc `timeRange` phải xử lý an toàn khi tham số là `null` hoặc chuỗi rỗng.
- **Biểu đồ Recharts an toàn:** Luôn bọc biểu đồ trong `<ResponsiveContainer>` và kiểm tra mảng dữ liệu đầu vào không được rỗng để tránh vỡ bố cục giao diện.
- **Dự phòng dữ liệu:** Trong trường hợp chưa có dữ liệu tập luyện thực tế trong database, `SessionService` và `StatisticsService` có sẵn các hàm sinh mock data trực quan giúp VĐV luôn xem được giao diện mẫu.

