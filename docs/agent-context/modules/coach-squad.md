# Module Context: Quản Lý Đội Hình & Chiến Thuật Coach (Coach & Squad Management)

## 1. Trách Nhiệm Của Module
Module chịu trách nhiệm:
- Cung cấp không gian làm việc chuyên biệt cho Huấn luyện viên (`Role.COACH`).
- Quản lý danh sách đội bóng (`Team`) và danh sách vận động viên (`TeamAthlete`).
- Giám sát trạng thái thi đấu thực tế của từng cầu thủ trên sân (`ON_FIELD`), ghế dự bị (`BENCH`), nghỉ ngơi (`RESTING`), hoặc chấn thương (`INJURED`).
- Động cơ phân tích tải mỏi (Fatigue Index) dựa trên thời gian thi đấu, cường độ di chuyển và tích lũy va đập tiếp đất mạnh.
- Tự động sinh đề xuất xoay tua đội hình (Tactical Rotation Recommendation) và thực thi lệnh hoán đổi cầu thủ ngay trong trận đấu.

---

## 2. Các Class, Component & Tệp Quan Trọng

### Backend (Spring Boot)
- [`CoachController.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/controller/CoachController.java): REST API endpoints cho đội hình, VĐV, và phân tích chiến thuật (được bảo vệ bởi `@PreAuthorize("hasAnyRole('COACH', 'ADMIN')")`).
- [`CoachService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/CoachService.java): Nghiệp vụ CRUD đội bóng, thêm/xóa/đổi trạng thái VĐV.
- [`TacticalRotationService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/TacticalRotationService.java): Động cơ tính toán chỉ số mỏi thể lực, phân loại rủi ro chấn thương và thực hiện hoán đổi vị trí (swap) giữa cầu thủ trên sân và ghế dự bị.
- [`Team.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/Team.java): Entity đội bóng.
- [`TeamAthlete.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/TeamAthlete.java): Entity vận động viên trong đội, chứa các chỉ số telemetry trực tiếp.
- [`AthleteStatus.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/AthleteStatus.java): Enum trạng thái (`ON_FIELD`, `BENCH`, `RESTING`, `INJURED`).

### Frontend (React)
- [`CoachDashboard.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/CoachDashboard.jsx): Bàn điều khiển chiến thuật thời gian thực, hiển thị thẻ cầu thủ theo sơ đồ sân và thanh cảnh báo thay người.
- [`CoachRoster.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/CoachRoster.jsx): Trang quản lý danh sách đội, thêm VĐV mới, gán số áo và gán mã thiết bị cảm biến.
- [`useCoachTacticalWebSocket.js`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/hooks/useCoachTacticalWebSocket.js): Hook lắng nghe luồng chiến thuật `/topic/coach/teams/{teamId}/tactical`.
- [`CoachLayout.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/layouts/CoachLayout.jsx): Layout định vị thanh điều hướng cho vai trò HLV.

---

## 3. Luồng Xử Lý Chính (Core Flow)

1. **Giám Sát Tải Mỏi Đội Hình:**
   - Dữ liệu cảm biến từ các thiết bị `SSS-PATCH-xxx` liên tục cập nhật vào các bản ghi `TeamAthlete` tương ứng qua `SensorBatchService`.
   - `TacticalRotationService.evaluateSquadTactics(teamId)` tính toán:
     - Điểm mỏi thể lực: $\text{fatigueIndex} = \min(100, \text{minutesPlayed} \times 1.8 + \text{intensity} \times 0.25 + \text{highImpactLandings} \times 2.0)$.
     - Mức độ cảnh báo: `CRITICAL` khi $\text{fatigueIndex} \ge 80\%$, `WARNING` khi $\ge 60\%$.
2. **Khuyến Nghị Thay Người Tự Động:**
   - Thuật toán tìm cầu thủ đang ở trên sân (`ON_FIELD`) có chỉ số mỏi cao nhất.
   - Thuật toán quét danh sách ghế dự bị (`BENCH`) để tìm cầu thủ cùng vị trí hoặc có thể lực tốt nhất ($\text{fatigueIndex} < 40\%$).
   - Đóng gói thành `TacticalRotationDTO` và gửi tới WebSocket topic `/topic/coach/teams/{teamId}/tactical`.
3. **Thực Thi Hoán Đổi (Tactical Swap):**
   - HLV bấm nút "Thực hiện Thay người" trên giao diện.
   - Frontend gửi `POST /api/coach/teams/{teamId}/tactical-action` kèm `outAthleteId` và `inAthleteId`.
   - Backend đổi trạng thái: Cầu thủ rời sân chuyển thành `BENCH`, cầu thủ vào sân chuyển thành `ON_FIELD`, cập nhật thời gian và bắn thông báo cập nhật tới toàn đội qua WebSocket.

---

## 4. API & Dependencies Liên Quan
- `GET /api/coach/teams`
- `GET /api/coach/teams/{teamId}/roster`
- `POST /api/coach/teams/{teamId}/athletes`
- `DELETE /api/coach/teams/{teamId}/athletes/{athleteId}`
- `PUT /api/coach/teams/{teamId}/athletes/{athleteId}/status?status=...`
- `GET /api/coach/teams/{teamId}/tactical-analysis`
- `POST /api/coach/teams/{teamId}/tactical-action`
- WebSocket topic: `/topic/coach/teams/{teamId}/tactical`

---

## 5. Quy Tắc & Lưu Ý Khi Chỉnh Sửa Module
- **Kiểm soát quyền truy cập:** Mọi endpoint thuộc module này phải luôn yêu cầu quyền `hasAnyRole('COACH', 'ADMIN')`.
- **Nguyên tử hóa hoán đổi (Atomic Swap):** Khi thay người, phải cập nhật đồng thời cả hai bản ghi VĐV trong cùng một transaction JPA.
- **Dọn dẹp WebSocket:** Luôn đóng kết nối trong hook `useCoachTacticalWebSocket.js` khi chuyển trang để tránh rò rỉ bộ nhớ.

