# Second Skin Sport — Coding Conventions

Tài liệu này quy chuẩn các nguyên tắc lập trình, quy ước đặt tên, xử lý ngoại lệ, và tiêu chuẩn kiểm thử cho cả Backend (Spring Boot) và Frontend (React) trong repository **Second Skin Sport**.

---

## 1. Quy Chuẩn Backend (Spring Boot & Java 21)

### 1.1. Quy Ước Đặt Tên (Naming Conventions)
- **Tên Class:** PascalCase kèm hậu tố chỉ định tầng kiến trúc:
  - Controller: `AdminController.java`, `AiCoachController.java`.
  - Service: `SensorBatchService.java`, `TacticalRotationService.java`.
  - Repository: `UserRepository.java`, `TeamAthleteRepository.java`.
  - DTO: `SensorBatchDTO.java`, `CreateCoachRequestDTO.java`, `UserDTO.java`.
  - Entity: Danh từ số ít, trùng khớp ý niệm cơ sở dữ liệu (`User.java`, `SportSession.java`).
- **Tên Method & Biến:** camelCase (`getTeamsByCoach`, `fatigueIndex`, `landingImpactMs2`).
- **Hằng số & Enum:** UPPER_SNAKE_CASE (`Role.ADMIN`, `AthleteStatus.ON_FIELD`).
- **REST Endpoints:** Danh từ số nhiều, chữ thường, phân cách bằng dấu gạch ngang (`/api/coach/teams/{teamId}/tactical-analysis`).

### 1.2. Phân Tách Tầng Nghiệp Vụ & DTO
- **Không viết nghiệp vụ trong Controller:**
  - Controller chỉ làm nhiệm vụ: Giải mã token/kiểm tra quyền (`@PreAuthorize`), validate đầu vào, gọi Service và bọc DTO kết quả vào `ResponseEntity`.
  - Toàn bộ tính toán động học, thay đổi trạng thái entity, hoặc gọi các repository phải nằm hoàn toàn trong tầng `@Service`.
- **Tuyệt đối không trả Entity JPA ra ngoài API:**
  - Entity có thể chứa các trường nhạy cảm (`password`) hoặc gây lỗi vòng lặp tuần hoàn (`circular references`).
  - Mọi dữ liệu trả ra cho client phải được chuyển đổi (map) sang DTO chuyên biệt.

### 1.3. Thống Nhất Đơn Vị Đo Lường Vật Lý
- **Gia tốc (ax, ay, az):**
  - Mặc định toàn hệ thống là **$m/s^2$**.
  - Trọng lực chuẩn tại mặt đất là $\approx 9.81 m/s^2$.
  - Khi biểu diễn lực va đập tiếp đất dạng bội số trọng lực, sử dụng $G$ ($1G = 9.81 m/s^2$).
- **Vận tốc góc con quay (gx, gy, gz):**
  - Mặc định là **độ/giây ($^\circ/s$)**.
- Tuyệt đối không hoán đổi hoặc tính toán sai lệch giữa radian và độ.

### 1.4. Xử Lý Ngoại Lệ & Validation
- Kiểm tra tính hợp lệ của tham số ngay tại đầu hàm service (ví dụ: `if (email == null || email.isBlank()) throw new IllegalArgumentException("Email không được để trống.");`).
- Khai báo `@ExceptionHandler(IllegalArgumentException.class)` tại Controller hoặc `@ControllerAdvice` để trả về JSON dạng:
  ```json
  {
    "message": "Nội dung thông báo lỗi thân thiện"
  }
  ```
  kèm HTTP status `400 Bad Request`.

### 1.5. Tiêu Chuẩn Kiểm Thử Backend (JUnit 5 & Mockito)
- Đặt file test trong `src/test/java/com/secondskin/sport/...` tương ứng với package nguồn.
- Đặt tên test method rõ nghĩa hành vi: `testMethod_Condition_ExpectedResult()` (ví dụ: `createCoach_Success()`, `createCoach_DuplicateEmail_ThrowsException()`).
- Sử dụng `@ExtendWith(MockitoExtension.class)` cho các unit test thuần túy của Service để đảm bảo tốc độ chạy cực nhanh ($< 1$ giây) mà không cần nạp toàn bộ Spring Context.

---

## 2. Quy Chuẩn Frontend (React 19 & Vite)

### 2.1. Cấu Trúc Component & Tệp CSS
- Mỗi component chức năng được đặt trong file `.jsx` viết hoa chữ cái đầu (`Navbar.jsx`, `AiCoachInsightCard.jsx`).
- File CSS đi kèm mang cùng tên (`AiCoachInsightCard.css`) và được import trực tiếp trong component.
- Tránh viết style inline phức tạp; ưu tiên các class CSS có phân cấp rõ ràng.

### 2.2. Quản Lý Vòng Đời Kết Nối WebSocket (Lifecycle Cleanup)
- Bất kỳ hook hoặc component nào khởi tạo kết nối WebSocket (`new WebSocket(...)`) **bắt buộc phải có hàm dọn dẹp (cleanup function)** trong `useEffect`:
  ```javascript
  useEffect(() => {
    let isSubscribed = true;
    const ws = new WebSocket(url);
    // ... lắng nghe message
    return () => {
      isSubscribed = false;
      ws.close(); // Giải phóng socket ngay khi unmount
    };
  }, [url]);
  ```
- Không tạo lại socket mới trên mỗi lần component re-render. Sử dụng `useRef` hoặc dependency array rỗng/tối thiểu.

### 2.3. Giới Hạn Điểm Vẽ Biểu Đồ Realtime (Chart Buffering)
- Luôn giới hạn số lượng điểm dữ liệu hiển thị tối đa (mặc định 100 điểm) để tránh việc trình duyệt bị nghẽn CPU khi nhận luồng dữ liệu 10Hz:
  ```javascript
  setDataPoints(prev => {
    const next = [...prev, newPoint];
    return next.length > 100 ? next.slice(next.length - 100) : next;
  });
  ```

### 2.4. Khả Năng Kháng Lỗi & Dự Phòng Ngoại Tuyến (Offline Resilience)
- Trong `api.js`, tất cả các hàm gọi API đều phải có khối `try...catch` an toàn.
- Khi backend không khả dụng (Network Error, 404, 500) hoặc đang ở chế độ demo sân bãi, dịch vụ phải tự động nạp dữ liệu từ bộ nhớ đệm `localStorage` (ví dụ `getStoredAdminUsers()`) hoặc trả về bộ mock data có sẵn.
- Không để xảy ra hiện tượng "trang trắng" (Uncaught crash) khi API trả về rỗng hoặc lỗi kết nối.

### 2.5. Tiêu Chuẩn Kiểm Thử Frontend (Vitest & React Testing Library)
- Mọi trang quan trọng (`Login`, `Register`, `CoachDashboard`, `AdminUsers`) đều phải có file test `.test.jsx` đi kèm.
- Tìm kiếm phần tử giao diện theo vai trò (`getByRole`) hoặc nhãn (`getByLabelText`, `getByText`).
- Mock các module dịch vụ (`vi.mock('../services/api.js')`) để kiểm thử cả trường hợp thành công lẫn trường hợp bắt lỗi.
- Đảm bảo lệnh `npm run test` và `npm run build` luôn vượt qua $100\%$ trước khi hoàn thành task.

