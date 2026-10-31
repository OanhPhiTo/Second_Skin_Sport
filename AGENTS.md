# Hướng Dẫn Vận Hành Cho Coding Agents — Second Skin Sport

Tài liệu này là điểm khởi đầu bắt buộc (**Entry Point**) cho mọi Coding Agent khi làm việc trong repository **Second Skin Sport**. 
Mục tiêu là cung cấp ngữ cảnh kiến trúc chuẩn xác, giảm thiểu chi phí quét đọc toàn bộ mã nguồn, và bảo vệ tính toàn vẹn của hệ thống IoT thể thao.

---

## 1. Nguyên Tắc Cốt Lõi (Core Agent Protocols)

1. **Đọc `AGENTS.md` và Context trước khi can thiệp mã nguồn**:
   - Trước khi thực hiện task, xác định module chức năng liên quan thông qua mục **Bản Đồ Ngữ Cảnh (Context Map)** bên dưới.
   - Chỉ đọc các tài liệu ngữ cảnh tương ứng trong thư mục `docs/agent-context/` và các file mã nguồn liên quan trực tiếp.
   - **Tuyệt đối KHÔNG** quét (`glob` / `grep` / `read`) toàn bộ project một cách máy móc khi chưa thu hẹp phạm vi.

2. **Xác minh thực tế trên mã nguồn (Trust, but Verify)**:
   - Tài liệu ngữ cảnh phản ánh kiến trúc và hiện trạng đã kiểm chứng. Tuy nhiên, nếu có mâu thuẫn giữa tài liệu và code thực tế, hãy ưu tiên mã nguồn và cập nhật lại tài liệu tương ứng.
   - Không tự suy đoán hoặc giả định API, schema, hay business logic nếu chưa đối chiếu mã nguồn.

3. **Phạm vi tác động tối thiểu (Focused Diffs)**:
   - Chỉ chỉnh sửa đúng các file phục vụ trực tiếp cho yêu cầu của task.
   - **Tuyệt đối KHÔNG** tự ý tái cấu trúc (refactor), đổi tên biến, hoặc format lại code của các file/module không liên quan.
   - Không ghi đè hoặc can thiệp vào các thay đổi chưa commit của người dùng.

4. **Kiểm thử và Duy trì Chất lượng**:
   - Luôn chạy test suite tương ứng sau khi chỉnh sửa (`mvn test-compile` / test đơn lẻ cho backend; `npm run test` và `npm run build` cho frontend).
   - Tuyệt đối không xóa bỏ, làm yếu (weaken), hoặc `skip` test chỉ để task vượt qua.

5. **Quy tắc An toàn và Bảo mật**:
   - **Tuyệt đối KHÔNG** hardcode mật khẩu, JWT Secret, API Key (Google Gemini), hoặc Connection String vào mã nguồn hoặc tài liệu.
   - Luôn sử dụng biến môi trường (`AI_GEMINI_API_KEY`, `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`).

---

## 2. Quy Chuẩn Kỹ Thuật Bắt Buộc (Architecture Invariants)

Mọi thay đổi mã nguồn phải tuân thủ nghiêm ngặt 4 quy chuẩn bất biến sau:

| Quy chuẩn | Chi tiết kỹ thuật |
| :--- | :--- |
| **Đơn vị đo cảm biến** | - **Gia tốc (ax, ay, az):** Luôn dùng $m/s^2$ (hoặc đơn vị $G$ khi chuẩn hóa tính va chạm: $1G \approx 9.81 m/s^2$).<br>- **Vận tốc góc con quay (gx, gy, gz):** Luôn dùng độ/giây ($^\circ/s$).<br>- Tuyệt đối không hoán đổi hoặc trộn lẫn hai quy ước này. |
| **Kiến trúc Backend** | - Tuân thủ mô hình phân lớp nghiêm ngặt: `Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository`.<br>- **Controller** chỉ nhận request, kiểm tra validation/quyền, ủy nhiệm cho Service, không chứa business logic.<br>- **Bắt buộc dùng DTO** cho Request/Response, không trả Entity JPA trực tiếp ra ngoài API. |
| **Kiến trúc Frontend** | - **WebSocket Lifecycle:** Luôn đóng/hủy kết nối (`ws.close()`, `unsubscribe`) trong hàm cleanup của hook (như `useSensorWebSocket.ts`, `useCoachTacticalWebSocket.js`) khi unmount để tránh rò rỉ bộ nhớ.<br>- **Realtime Chart Buffering:** Giới hạn tối đa số điểm hiển thị trên biểu đồ (mặc định 100 điểm) để tránh nghẽn luồng render DOM. |
| **API Nhận Dữ liệu Cảm biến** | Endpoint chuẩn nhận batch dữ liệu từ thiết bị IoT (ESP32-C3): `POST /api/v1/sensor/batches`. |

---

## 3. Bản Đồ Ngữ Cảnh Dự Án (Context Map)

Trước khi đọc mã nguồn, hãy tra cứu các tài liệu chuyên sâu được chuẩn hóa tại:

### 3.1. Tài liệu Hệ Thống (`docs/agent-context/`)
* **Tổng quan dự án & Công nghệ:** [`PROJECT_OVERVIEW.md`](docs/agent-context/PROJECT_OVERVIEW.md)
  * Mục tiêu sản phẩm, cấu trúc monorepo, tech stack (Spring Boot 3.2, Java 21, React 19, ESP32-C3).
* **Kiến trúc & Luồng xử lý:** [`ARCHITECTURE.md`](docs/agent-context/ARCHITECTURE.md)
  * Luồng ingest dữ liệu IoT, luồng STOMP WebSocket, bảo mật Spring Security JWT stateless.
* **Cơ sở dữ liệu & Entity:** [`DATABASE_SCHEMA.md`](docs/agent-context/DATABASE_SCHEMA.md)
  * Chi tiết 7 bảng database: `users`, `devices`, `sport_sessions`, `sensor_data`, `performance_statistics`, `teams`, `team_athletes`.
* **Đặc tả REST & WebSocket API:** [`API_DOCUMENTATION.md`](docs/agent-context/API_DOCUMENTATION.md)
  * Danh mục endpoints (`/api/auth/*`, `/api/admin/*`, `/api/coach/*`, `/api/v1/sensor/*`, `/api/sessions/*`, `/api/statistics/*`, `/api/devices/*`, `/api/ai/*`, `/ws/*`).
* **Quy ước Lập trình & Tiêu chuẩn:** [`CODING_CONVENTIONS.md`](docs/agent-context/CODING_CONVENTIONS.md)
  * Coding convention Java & React, cấu trúc package, exception handling, DTO mapping rules.
* **Hiện trạng & Kế hoạch:** [`CURRENT_STATUS.md`](docs/agent-context/CURRENT_STATUS.md)
  * Tính năng đã hoàn thành, tính năng mock/fallback, các giới hạn đã biết và backlog kỹ thuật.
* **Quyết định Kiến trúc (ADRs):** [`DECISIONS.md`](docs/agent-context/DECISIONS.md)
  * Ghi chép lý do chọn Dual-Engine AI (Gemini + Local DSP), WebSocket STOMP, JWT Stateless, và LocalStorage Fallback.

### 3.2. Ngữ Cảnh Theo Module Nghiệp Vụ (`docs/agent-context/modules/`)
* **Xác thực & Phân quyền:** [`auth.md`](docs/agent-context/modules/auth.md) — JWT Filter, SecurityFilterChain, Role (`ADMIN`, `COACH`, `USER`).
* **Thu thập & Xử lý Tín hiệu IoT:** [`sensor-iot.md`](docs/agent-context/modules/sensor-iot.md) — ESP32 BLE/Batch API, Jump Detection, DSP Kinematics.
* **Huấn Luyện Viên & Điều phối Đội hình:** [`coach-squad.md`](docs/agent-context/modules/coach-squad.md) — Quản lý roster, tính tải mỏi, đề xuất xoay tua chiến thuật.
* **Quản trị Hệ thống:** [`admin.md`](docs/agent-context/modules/admin.md) — Cấp tài khoản Coach, khóa/mở khóa user, phân quyền.
* **Trợ lí Phân tích AI:** [`ai-coach.md`](docs/agent-context/modules/ai-coach.md) — Tích hợp Google Gemini 1.5 Flash, phân tích động học, đề xuất bài tập.
* **Thống kê & Dashboard VĐV:** [`athlete-analytics.md`](docs/agent-context/modules/athlete-analytics.md) — Buổi tập cá nhân, biểu đồ chỉ số, Recharts.

---

## 4. Quy Trình Tiếp Nhận & Thực Thi Task (Workflow For Agents)

Khi nhận một task mới, coding agent hãy thực hiện theo đúng 5 bước sau:

```
[Nhận Task]
    │
    ▼
[Bước 1: Tra cứu AGENTS.md & Context Map] ──> Xác định module (ví dụ: coach-squad, sensor-iot, admin)
    │
    ▼
[Bước 2: Đọc tài liệu module tương ứng] ──> docs/agent-context/modules/{module}.md
    │
    ▼
[Bước 3: Đọc file mã nguồn mục tiêu] ─────> Chỉ đọc các Controller, Service, Component liên quan
    │
    ▼
[Bước 4: Thực hiện chỉnh sửa tối thiểu] ──> Tuân thủ conventions, không làm ảnh hưởng phần khác
    │
    ▼
[Bước 5: Chạy kiểm thử & Cập nhật Context] > Chạy test suite; cập nhật CURRENT_STATUS.md nếu có thay đổi
```

---

## 5. Cơ Chế Cập Nhật Tài Liệu Ngữ Cảnh (Context Maintenance)

- **Nguyên tắc "Đúng người đúng việc":** Chỉ cập nhật tài liệu nào có mã nguồn thực tế bị biến đổi sau task (ví dụ: thêm endpoint mới thì cập nhật `API_DOCUMENTATION.md`, sửa entity thì cập nhật `DATABASE_SCHEMA.md`).
- **Không viết lại toàn bộ:** Giữ nguyên các phần không bị ảnh hưởng; chỉ thêm hoặc điều chỉnh các mục có sự thay đổi.
- **Ranh giới thực tế:** Khi ghi nhận tính năng mới, chỉ đánh dấu là hoàn thành nếu đã có code và test kiểm chứng; nếu chỉ mới tạo giao diện hoặc mock thì phải ghi rõ là `Mock / In Progress`.

