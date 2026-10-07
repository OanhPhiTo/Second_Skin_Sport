---
description:
---

[WORKFLOW: DEVELOP-FEATURE]
Mục đích: Phối hợp 4 Agent (Firmware, Backend, Frontend, QA/Tester) cùng xây dựng và kiểm thử một tính năng mới một cách tự động.

Kịch bản điều phối tự động:

1. Khi người dùng nhập một tính năng mới (Ví dụ: "Thêm tính năng phát hiện cú nhảy cao"):
2. Hệ thống tự động kích hoạt Agent 1 (Firmware Specialist): Viết mã nguồn cho ESP32-C3 để đọc dữ liệu thô MPU6050 với tần số phù hợp, đóng gói JSON và gửi Batch HTTP sang Backend.
3. Hệ thống tự động kích hoạt Agent 2 (Backend Specialist): Nhận payload mẫu từ Agent 1, tạo endpoint `POST /api/v1/sensor/batches`, viết hàm `JumpDetectionService` để xử lý thuật toán lọc ngưỡng và đẩy dữ liệu qua WebSocket.
4. Hệ thống tự động kích hoạt Agent 3 (Frontend Specialist): Viết hook `useSensorWebSocket.ts` để bắt sự kiện từ Backend và vẽ biểu đồ xung gia tốc lên màn hình React Dashboard.
5. Hệ thống tự động kích hoạt Agent 4 (QA/Tester Specialist):
   - Đọc hiểu toàn bộ code do Agent 1, 2, 3 vừa sinh ra.
   - Tự động viết Unit Test cho Backend (sử dụng JUnit/Mockito để test Service và Controller).
   - Viết Unit Test cho Frontend (sử dụng Vitest/Jest hoặc React Testing Library để kiểm tra hook WebSocket và việc render biểu đồ).
   - Thiết kế các test case biên (ví dụ: dữ liệu cảm biến bị rỗng, mất kết nối WebSocket đột ngột) để kiểm tra độ ổn định của hệ thống.
6. Cả 4 Agent tự động kiểm tra chéo (Cross-review), chỉnh sửa code dựa trên phản hồi lỗi của Agent 4 trước khi bàn giao kết quả hoàn chỉnh cuối cùng cho người dùng.
