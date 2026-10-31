# Module Context: Quản Trị Hệ Thống (System Administration)

## 1. Trách Nhiệm Của Module
Module chịu trách nhiệm:
- Cung cấp không gian làm việc chuyên biệt cho Quản trị viên (`Role.ADMIN`).
- Quản lý toàn bộ danh sách người dùng trong hệ thống (VĐV, HLV, Admin).
- Cấp mới tài khoản Huấn luyện viên (`Role.COACH`) với mật khẩu khởi tạo mặc định.
- Khóa (`ban`) hoặc mở khóa (`unban`) tài khoản người dùng vi phạm quy chế.
- Nâng cấp hoặc thay đổi vai trò (Role Elevation).
- Xóa vĩnh viễn tài khoản người dùng.
- Đồng bộ bộ nhớ đệm ngoại tuyến (`localStorage`) để đảm bảo trải nghiệm không bị gián đoạn khi vận hành demo.

---

## 2. Các Class, Component & Tệp Quan Trọng

### Backend (Spring Boot)
- [`AdminController.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/controller/AdminController.java): REST endpoints quản trị (bảo vệ bởi `@PreAuthorize("hasRole('ADMIN')")`), có `@ExceptionHandler(IllegalArgumentException.class)`.
- [`AdminService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/AdminService.java): Nghiệp vụ xác thực trùng lặp email, mã hóa mật khẩu mặc định `Coach@123456`, cập nhật trạng thái `enabled` của Entity `User`.
- [`AdminSeeder.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/config/AdminSeeder.java): Khởi tạo tài khoản Quản trị viên mặc định (`admin@secondskin.com` / `admin123`).
- [`UserDTO.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/dto/UserDTO.java): DTO an toàn trả thông tin người dùng (không chứa trường password).
- [`CreateCoachRequestDTO.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/dto/CreateCoachRequestDTO.java): DTO nhận thông tin tạo HLV mới.

### Frontend (React)
- [`AdminUsers.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/AdminUsers.jsx): Giao diện danh sách người dùng, form cấp tài khoản HLV mới với modal popup, nút toggle Khóa/Mở khóa tài khoản.
- [`AdminDashboard.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/AdminDashboard.jsx): Bảng điều khiển tổng quan số lượng VĐV, HLV, và thiết bị trong hệ thống.
- [`AdminLayout.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/layouts/AdminLayout.jsx): Khung điều hướng giao diện riêng cho Admin.
- [`api.js`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/services/api.js): Chứa `adminService`, các hàm quản lý cache `getStoredAdminUsers()` và `saveStoredAdminUsers()`.

---

## 3. Luồng Xử Lý Chính (Core Flow)

1. **Cấp Tài Khoản Huấn Luyện Viên Mới:**
   - Admin nhập họ tên, email và bộ môn trong modal `AdminUsers.jsx`.
   - Gửi request `POST /api/admin/coaches`.
   - `AdminService` thực hiện:
     - Kiểm tra email rỗng hoặc không đúng định dạng.
     - Kiểm tra email đã tồn tại trong database (nếu trùng, ném `IllegalArgumentException` $\rightarrow$ Controller trả về HTTP `400 Bad Request` kèm thông báo lỗi).
     - Thiết lập mật khẩu mặc định `Coach@123456`, mã hóa bằng BCrypt, gắn quyền `Role.COACH`.
     - Lưu vào database và trả về `UserDTO` mới.
   - Frontend nhận DTO, cập nhật danh sách hiển thị và lưu vào cache `localStorage` (`sss_admin_users_cache`).
2. **Khóa / Mở Khóa Người Dùng:**
   - Admin bấm nút toggle Khóa/Mở khóa.
   - Gửi request `PUT /api/admin/users/{id}/ban` hoặc `PUT /api/admin/users/{id}/unban`.
   - `AdminService` đổi cờ `enabled = false` hoặc `true` trên Entity `User`.
   - Khi tài khoản bị khóa (`enabled = false`), `CustomUserDetailsService` và Spring Security sẽ từ chối đăng nhập của tài khoản đó.

---

## 4. API & Dependencies Liên Quan
- `GET /api/admin/users`
- `POST /api/admin/coaches`
- `PUT /api/admin/users/{id}/ban`
- `PUT /api/admin/users/{id}/unban`
- `PUT /api/admin/users/{id}/role?role=...`
- `DELETE /api/admin/users/{id}`

---

## 5. Quy Tắc & Lưu Ý Khi Chỉnh Sửa Module
- **Bắt buộc phân quyền:** Mọi thao tác quản trị đều phải yêu cầu quyền `hasRole('ADMIN')`.
- **Validation chặt chẽ:** Luôn `.trim()` chuỗi email và kiểm tra trùng lặp trước khi tạo người dùng mới.
- **Bảo toàn DTO:** Tuyệt đối không trả entity `User` ra khỏi Controller.
- **Đồng bộ hai chiều với Cache:** Mọi thay đổi trong `adminService` tại `api.js` phải cập nhật lại `localStorage` để duy trì trạng thái khi người dùng F5 hoặc reload trang.

