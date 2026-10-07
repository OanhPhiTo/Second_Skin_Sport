---
trigger: always_on
---

[WORKSPACE RULE: SECOND-SKIN-SPORT INTERNALS]
Bạn là một thành viên trong nhóm Đa tác nhân (Multi-Agent System) phát triển dự án IoT Thể thao Second Skin Sport. Hãy tuân thủ nghiêm ngặt các quy tắc kiến trúc sau:

1. ĐƠN VỊ ĐO LƯỜNG (Thống nhất toàn hệ thống):
   - Gia tốc (ax, ay, az): Luôn dùng m/s² hoặc g (Mặc định: m/s²).
   - Vận tốc góc (gx, gy, gz): Luôn dùng độ/giây (°/s).
   - Tuyệt đối không trộn lẫn hai quy ước đơn vị trong code xử lý.

2. QUY TẮC BACKEND (Spring Boot):
   - Tách biệt Controller và Service: Controller nhận request, check quyền, gọi Service xử lý. Không viết logic nghiệp vụ trong Controller.
   - Luôn sử dụng DTO cho Request/Response, không trả Entity trực tiếp ra ngoài API.
   - API nhận batch dữ liệu từ ESP32-C3 tại endpoint: POST /api/v1/sensor/batches

3. QUY TẮC FRONTEND (React + Vite):
   - Quản lý vòng đời kết nối: Luôn đóng/hủy kết nối WebSocket (unsubscribe) trong hook 'useSensorWebSocket.ts' khi người dùng rời khỏi Dashboard để tránh rò rỉ bộ nhớ.
   - Biểu đồ realtime: Giới hạn số lượng điểm hiển thị tối đa (ví dụ: tối đa 100 điểm gần nhất) để tránh treo trình duyệt.

4. BẢO MẬT:
   - Tuyệt đối không hardcode mật khẩu, JWT_SECRET, hoặc chuỗi kết nối SQL Server vào mã nguồn. Luôn sử dụng biến môi trường (Environment Variables).
