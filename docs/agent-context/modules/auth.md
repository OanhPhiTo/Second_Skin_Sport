# Module Context: Xác Thực & Phân Quyền (Auth & RBAC)

## 1. Trách Nhiệm Của Module
Module chịu trách nhiệm:
- Cung cấp cơ chế đăng ký và đăng nhập bảo mật cho người dùng.
- Cung cấp cơ chế Quên mật khẩu 3 bước bảo mật (Email -> Xác thực OTP gửi qua email hỗ trợ OAuth2 -> Đặt lại mật khẩu mới).
- Sinh và xác thực JSON Web Token (JWT) không trạng thái (stateless).
- Cơ chế tự động làm mới access token thông qua refresh token.
- Phân quyền người dùng (Role-Based Access Control) theo 3 vai trò: `USER`, `COACH`, `ADMIN`.
- Bảo vệ các endpoint API Backend thông qua Spring Security Filter Chain và bảo vệ các trang Frontend bằng React Router Protected Routes.

---

## 2. Các Class, Component & Tệp Quan Trọng

### Backend
- [`AuthController.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/controller/AuthController.java): Expose các REST endpoints đăng ký, đăng nhập, refresh token, quên mật khẩu, xác thực OTP, đặt lại mật khẩu.
- [`AuthService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/AuthService.java): Xử lý logic băm mật khẩu BCrypt, kiểm tra thông tin đăng nhập, sinh JWT pair, điều phối sinh OTP và đặt lại mật khẩu.
- [`OtpService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/OtpService.java): Sinh mã OTP 6 chữ số an toàn với `SecureRandom`, lưu trữ thời gian hết hạn (5 phút), giới hạn số lần thử (tối đa 5 lần) chống brute force.
- [`OAuth2MailService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/OAuth2MailService.java): Dịch vụ gửi email OTP qua chuẩn bảo mật hiện đại OAuth2 (hỗ trợ Google Gmail API RFC 2822 với Refresh Token Grant Flow), fallback an toàn cho môi trường test/dev.
- [`JwtService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/security/JwtService.java): Trích xuất claims, kiểm tra thời hạn và ký token HMAC-SHA256.
- [`JwtAuthenticationFilter.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/security/JwtAuthenticationFilter.java): Bộ lọc chặn request để trích xuất Bearer token và nạp vào SecurityContext.
- [`SecurityConfig.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/security/SecurityConfig.java): Định nghĩa quyền truy cập URL theo vai trò và cấu hình CORS.
- [`User.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/User.java): Entity người dùng triển khai `UserDetails`.
- [`Role.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/entity/Role.java): Enum 3 quyền: `USER`, `ADMIN`, `COACH`.

### Frontend
- [`Login.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Login.jsx): Giao diện đăng nhập và kích hoạt popup Quên mật khẩu.
- [`ForgotPasswordModal.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/ForgotPasswordModal.jsx): Popup 3 bước phục hồi mật khẩu (Nhập email -> Nhập mã OTP với countdown timer -> Đổi mật khẩu mới).
- [`Register.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Register.jsx): Giao diện đăng ký.
- [`ProtectedRoute.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/ProtectedRoute.jsx): Route guard chặn người dùng chưa đăng nhập hoặc không đủ quyền.
- [`api.js`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/services/api.js): Axios interceptor gắn token vào header, tự động refresh token khi gặp HTTP 401 và các hàm authService `forgotPassword`, `verifyOtp`, `resetPassword`.

---

## 3. Luồng Xử Lý Chính (Core Flow)

1. **Đăng nhập:**
   - Client gửi `POST /api/auth/login` với email và password.
   - `AuthService` xác thực qua `AuthenticationManager`. Nếu hợp lệ, sinh cặp `token` (access token) và `refreshToken`.
   - Client lưu `token`, `refreshToken`, và `role` vào `localStorage`.
2. **Ủy quyền Request:**
   - Axios Request Interceptor tự động thêm header `Authorization: Bearer <token>`.
   - Backend `JwtAuthenticationFilter` đọc header, kiểm tra chữ ký token. Nếu hợp lệ, nạp quyền vào `SecurityContext`.
3. **Làm mới Token (Auto-Refresh):**
   - Khi token hết hạn, Backend trả về HTTP `401 Unauthorized`.
   - Axios Response Interceptor chặn lỗi 401, gửi `POST /api/auth/refresh` bằng refresh token.
   - Nhận access token mới, cập nhật `localStorage` và gửi lại request ban đầu một cách trong suốt.

4. **Quên Mật Khẩu & Xác Thực OTP (OAuth2 Email):**
   - Bước 1: Người dùng click "Quên mật khẩu?" trên Login page, popup mở ra yêu cầu nhập email.
   - Bước 2: Backend `POST /api/auth/forgot-password` kiểm tra tài khoản, sinh OTP 6 số (5 phút) và gửi qua `OAuth2MailService` (Google OAuth2 API RFC 2822).
   - Bước 3: Người dùng nhập mã OTP vào popup. Client gửi `POST /api/auth/verify-otp`.
   - Bước 4: Nhập mật khẩu mới. Client gửi `POST /api/auth/reset-password` để mã hóa BCrypt và cập nhật database.

---

## 4. API & Dependencies Liên Quan
- `POST /api/auth/register` (Public)
- `POST /api/auth/login` (Public)
- `POST /api/auth/refresh` (Yêu cầu header Authorization chứa Bearer refresh token)
- `POST /api/auth/forgot-password` (Public, gửi OTP đặt lại mật khẩu)
- `POST /api/auth/verify-otp` (Public, xác thực mã OTP)
- `POST /api/auth/reset-password` (Public, đặt mật khẩu mới sau khi xác thực OTP)

---

## 5. Quy Tắc & Lưu Ý Khi Chỉnh Sửa Module
- **Tuyệt đối không hardcode bí mật JWT:** Khóa ký JWT phải được quản lý an toàn.
- **Không trả password ra ngoài:** Luôn dùng `UserDTO` hoặc `AuthResponse`, không trả trực tiếp entity `User`.
- **Đồng bộ vai trò Frontend & Backend:** Enum `Role` (`USER`, `COACH`, `ADMIN`) trên Backend phải khớp hoàn toàn với các kiểm tra `role === 'COACH'` tại Frontend.

