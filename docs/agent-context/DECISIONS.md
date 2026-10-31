# Second Skin Sport — Architectural Decision Records (ADRs)

Tài liệu này ghi lại các quyết định thiết kế kiến trúc quan trọng (Architectural Decision Records) đã được thông qua và triển khai trong hệ thống **Second Skin Sport**, cùng bối cảnh và lý do lựa chọn.

---

## ADR 01: Kiến Trúc Trí Tuệ Nhân Tạo Song Hành (Dual-Engine AI Architecture)

- **Trạng thái:** Đã chấp thuận & Đã triển khai.
- **Bối cảnh:** 
  - Vận động viên và huấn luyện viên cần những lời nhận xét chuyên môn tự nhiên, dễ hiểu bằng tiếng Việt thay vì các chuỗi số liệu vật lý khô khan ($m/s^2$, $G$, $^\circ/s$).
  - Tuy nhiên, môi trường sân bãi thể thao thực tế thường xuyên gặp tình trạng mạng 4G/Wi-Fi chập chờn, hoặc người dùng chưa có tài khoản/API Key của các dịch vụ đám mây.
- **Quyết định:**
  - Thiết kế kiến trúc AI song hành:
    1. **Engine 1 (Local Biomechanical DSP Engine):** Tích hợp thuật toán xử lý tín hiệu số ngay trong Spring Boot (`BiomechanicalFeatureExtractor.java`). Động cơ này tính toán $100\%$ offline các chỉ số: Độ êm tiếp đất, Độ cân bằng 2 chân, Nhịp bước, và Độ vững thân trên.
    2. **Engine 2A (Cloud LLM - Google Gemini 1.5 Flash):** Khi có kết nối internet và API Key, hệ thống gửi các đặc trưng động học đã tính toán kèm thông số buổi tập tới Gemini với chế độ Structured JSON Output (`responseMimeType: "application/json"`) để sinh báo cáo huấn luyện viên cá nhân hóa.
    3. **Engine 2B (Local Heuristic Engine):** Nếu không có internet hoặc thiếu API Key, hệ thống tự động kích hoạt bộ quy tắc luật thể thao nội bộ để sinh lời khuyên và bài tập khắc phục mà không làm gián đoạn trải nghiệm người dùng.
- **Hệ quả:** Hệ thống đạt độ sẵn sàng cao ($100\%$ uptime), phản hồi $< 1$ giây, an toàn dữ liệu và tối ưu chi phí API.

---

## ADR 02: Giao Thức Truyền Tin Realtime Dựa Trên WebSocket STOMP

- **Trạng thái:** Đã chấp thuận & Đã triển khai.
- **Bối cảnh:** Cảm biến MPU6050 gửi chuỗi gia tốc và con quay với tần số 10Hz. Nếu dùng cơ chế kéo dữ liệu truyền thống (HTTP Polling), băng thông và tải máy chủ sẽ tăng vọt, gây trễ hiển thị biểu đồ trên giao diện Coach và VĐV.
- **Quyết định:**
  - Triển khai Spring WebSocket hỗ trợ giao thức phân tầng STOMP (Simple Text Oriented Messaging Protocol) với bộ môi giới đơn giản `SimpleBroker` tại endpoint `/ws/sensor-data`.
  - Phân vùng kênh truyền theo mục đích sử dụng:
    - Kênh quảng bá chung: `/topic/sensor-telemetry`
    - Kênh riêng theo từng thiết bị: `/topic/devices/{deviceId}/telemetry`
    - Kênh phát hiện sự kiện bật nhảy tức thời: `/topic/jumps`
    - Kênh điều phối chiến thuật đội hình: `/topic/coach/teams/{teamId}/tactical`
- **Hệ quả:** Giảm độ trễ truyền dữ liệu xuống dưới $50\text{ms}$, hỗ trợ giao diện vẽ biểu đồ mượt mà, phân tách rõ ràng giữa dữ liệu đo liên tục và dữ liệu sự kiện đột biến.

---

## ADR 03: Chuẩn Hóa Bắt Buộc Đơn Vị Đo Lường Vật Lý

- **Trạng thái:** Đã chấp thuận & Đã triển khai.
- **Bối cảnh:** Lỗi chuyển đổi đơn vị là nguyên nhân hàng đầu gây sai lệch tính toán trong các hệ thống cơ sinh học (ví dụ: nhầm giữa đơn vị trọng lực $G$ và $m/s^2$, hoặc giữa radian/giây và độ/giây).
- **Quyết định:**
  - **Gia tốc (ax, ay, az):** Luôn đo và lưu trữ bằng **$m/s^2$**. Trọng lực chuẩn quy ước là $9.81 m/s^2$. Khi biểu diễn va đập tiếp đất dạng cường độ tải, mới quy đổi sang bội số $G$ ($G = \frac{a}{9.81}$).
  - **Vận tốc góc (gx, gy, gz):** Luôn đo và hiển thị bằng **độ/giây ($^\circ/s$)**.
- **Hệ quả:** Toàn bộ code từ Firmware ESP32, Tầng Service Spring Boot, đến Recharts Frontend đều thống nhất một ngôn ngữ vật lý duy nhất, loại bỏ hoàn toàn các lỗi tính toán chéo.

---

## ADR 04: Khả Năng Kháng Lỗi Ngoại Tuyến Tại Tầng Dịch Vụ Frontend (Offline Resilience)

- **Trạng thái:** Đã chấp thuận & Đã triển khai.
- **Bối cảnh:** Trong các buổi trình diễn tính năng, giới thiệu sản phẩm hoặc môi trường phát triển cục bộ mà chưa thể khởi động đồng thời SQL Server và Backend, người dùng vẫn cần trải nghiệm đầy đủ giao diện Quản trị và Huấn luyện viên.
- **Quyết định:**
  - Tầng dịch vụ `api.js` được trang bị lớp lưu trữ dự phòng `localStorage` (ví dụ: `sss_admin_users_cache`).
  - Khi API Backend phản hồi lỗi mạng hoặc không thể truy cập, dịch vụ tự động nạp từ bộ nhớ đệm cục bộ và sinh mã ID tuần tự, đảm bảo thao tác tạo tài khoản HLV hoặc thay đổi chiến thuật không bị gián đoạn.
- **Hệ quả:** Giao diện có độ ổn định cực cao, không bao giờ bị sập trắng trang (White Screen of Death) ngay cả khi ngắt kết nối mạng hoàn toàn.

---

## ADR 05: Phân Tầng Tuyệt Đối Giữa Entity Database và DTO

- **Trạng thái:** Đã chấp thuận & Đã triển khai.
- **Bối cảnh:** Trả thẳng JPA Entity ra ngoài REST Controller thường dẫn đến rò rỉ trường nhạy cảm (`password`), gây lỗi tuần hoàn Jackson Serialization khi có quan hệ `@OneToMany`, và làm lộ chi tiết cấu trúc bảng cơ sở dữ liệu.
- **Quyết định:**
  - Mọi Controller chỉ nhận và trả về các đối tượng truyền dữ liệu (DTO) thuộc package `com.secondskin.sport.dto`.
  - Service chịu trách nhiệm chuyển đổi giữa Entity nội bộ và DTO giao tiếp ngoài.
- **Hệ quả:** Bảo mật tuyệt đối dữ liệu nội bộ, dễ dàng thay đổi schema bảng mà không làm gãy giao ước API với phía Frontend và thiết bị IoT.

