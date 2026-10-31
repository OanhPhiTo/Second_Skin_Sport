# Project: Second Skin Sport System Review, Hardening & Showcase Readiness

## Architecture
Second Skin Sport is an IoT sports analytics platform comprising:
- **Firmware / Hardware Simulator**: ESP32-C3 BLE sensor & MPU6050 emitting kinematic acceleration ($m/s^2$ / $G$) and angular velocity ($^\circ/s$) to backend batch ingestion endpoint `POST /api/v1/sensor/batches`.
- **Spring Boot Backend (Java 21, Spring Boot 3.2)**: 3-tier architecture (Controller -> Service -> Repository), Spring Security with stateless JWT, STOMP WebSocket over SockJS for live telemetry, Biomechanical DSP heuristics + Google Gemini Dual-Engine AI, and H2/SQL Server persistence.
- **React Frontend (React 19, Vite, Tailwind CSS, Lucide icons, Recharts)**: Real-time telemetry dashboards for Athletes, Squad Tactical management for Coaches, and User Administration for Admins.

### Architectural Invariants (AGENTS.md)
1. **Sensor Measurement Units**: Acceleration strictly $m/s^2$ / $G$ ($1G \approx 9.80665 m/s^2$); Gyroscope angular velocity strictly $^\circ/s$.
2. **Backend Clean Architecture**: Controller -> Service -> Repository. Controllers must NOT contain business logic and MUST use DTOs for Request/Response (never expose JPA Entities).
3. **Frontend WebSocket & Buffering**: Clean lifecycle management (`ws.close()` on unmount) and buffer cap ($\le 100$ data points) on all real-time charts.
4. **Sensor Data Ingestion Endpoint**: Batch endpoint `POST /api/v1/sensor/batches`.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | JWT Secret Externalization | Move hardcoded JWT secret from `JwtService.java` to `application.properties` and environment variable | M1 | Survey (SEC-01) |
| F02 | Endpoint Authorization Hardening | Restrict public `permitAll()` in `SecurityConfig`; secure `/api/ai/**`, `/api/sensor-data/**`, `/api/sessions/auto` | M1 | Survey (SEC-02) |
| F03 | WebSocket STOMP Security | Add channel interceptor / token authentication to `/ws/**` STOMP endpoint to protect telemetry & tactical streams | M1 | Survey (SEC-02B) |
| F04 | User Account Status Enforcement | Enforce `userDetails.isEnabled()` check in `JwtAuthenticationFilter` and `AuthService.refreshToken` to invalidate banned users | M1 | Survey (SEC-05) |
| F05 | Safe CORS & Credentials Config | Restrict CORS allowed origins and remove insecure wildcard credentials configuration | M1 | Survey (SEC-08) |
| F06 | Admin Credential Sanitization | Remove plaintext logging of `admin123` from `AdminSeeder.java` and sanitize hardcoded fallback passwords | M1 | Survey (SEC-07) |
| F07 | DTO Suite Creation | Create missing `DeviceDTO`, `SensorDataDTO`, `PerformanceStatisticDTO` in `com.secondskin.sport.dto` | M2 | Survey (Invariant 2) |
| F08 | Controller DTO Refactoring | Refactor `DeviceController`, `SensorDataController`, `SessionController`, `StatisticsController`, `AiCoachController` to use DTOs only | M2 | Survey (Invariant 2) |
| F09 | Controller-Service Separation | Decouple `AiCoachController` from direct repository queries and route logic through `AiCoachService` | M2 | Survey (Invariant 2) |
| F10 | SensorStatusDTO Encapsulation | Refactor `SensorStatusDTO` to encapsulate `SensorDataDTO` instead of JPA Entity `SensorData` | M2 | Survey (Invariant 2) |
| F11 | Session IDOR Prevention | Add authenticated user verification to `SessionService` & `SessionController` (read/update/delete/sensor-data); prevent userId spoofing | M3 | Survey (SEC-03, SEC-06) |
| F12 | Coach Squad IDOR Prevention | Eliminate `teamRepository.findAll()` leakage; enforce coach ownership across all team/roster/telemetry/swap endpoints | M3 | Survey (SEC-04) |
| F13 | Statistics IDOR Prevention | Add session ownership verification to `StatisticsService.getStatisticBySessionId` | M3 | Survey (SEC-03) |
| F14 | Remove Mock 404 Fallbacks | Remove artificial mock session generation on missing entities in `AiCoachController` and `SensorDataService`; throw ResourceNotFoundException | M3 | Survey (R1) |
| F15 | Real Kinematic DSP Calculations | Wire real sensor data from `BiomechanicalFeatureExtractor` into `StatisticsService` (replace hardcoded `+3.2%`, `94%`, `10.4°`) | M3 | Survey (R1) |
| F16 | Global Exception Handling | Implement `@RestControllerAdvice` (`GlobalExceptionHandler`) and `AuthenticationEntryPoint` for uniform error responses | M4 | Survey (R2) |
| F17 | Frontend Session ID Bug Fix | Fix `frontend/src/services/api.js` to avoid generating `id: Date.now()` that conflicts with DB auto-increment | M4 | Survey (R2) |
| F18 | Frontend ErrorBoundary | Add React `<ErrorBoundary>` component to application root to prevent unhandled UI crashes | M4 | Survey (R2) |
| F19 | Frontend Buffer & Hook Consolidation | Add `.slice(-100)` cap in `Statistics.jsx`, consolidate duplicate `useSensorWebSocket`, fix batch URL in `Sensors.jsx`, wire `Settings.jsx` | M4 | Survey (R2, Invariant 3) |
| F20 | API & Architecture Documentation Update | Update `docs/agent-context/CURRENT_STATUS.md` and `API_DOCUMENTATION.md` to reflect all DTO schemas, device endpoints, and security changes | M4 | Survey (R4) |
| F21 | Full E2E Test Suite Validation | Pass 100% of E2E opaque-box test suite (Tiers 1-4) across authentication, sensor batch ingestion, session lifecycle, and coach tactics | M5 | Acceptance Criteria |
| F22 | Adversarial White-Box Hardening | Tier 5 adversarial stress testing, boundary condition verification, and zero-defect showcase validation | M5 | Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Security, Authentication & Authorization Hardening | F01, F02, F03, F04, F05, F06 | none | DONE |
| M2 | DTO Compliance & Clean Architecture Refactoring | F07, F08, F09, F10 | none | DONE |
| M3 | Business Logic Integrity, IDOR Prevention & Real Kinematics | F11, F12, F13, F14, F15 | M1, M2 | DONE |
| M4 | System Robustness, Exception Handling & Frontend Polish | F16, F17, F18, F19, F20 | M2, M3 | DONE |
| M5 | Final E2E Test Pass & Showcase Hardening | F21, F22 | M1, M2, M3, M4, TEST_READY | DONE |

---

## Interface Contracts

### M1 Security ↔ M2/M3 Controllers & Services
- `JwtService.extractUsername(token)` & `extractRole(token)`: unchanged signature, key loaded via Spring `@Value("${application.security.jwt.secret-key}")`.
- `SecurityUtils.getCurrentUser()`: returns authenticated `User` entity or throws `UnauthorizedException`.
- `SecurityConfig`: requires authenticated JWT for `/api/ai/**`, `/api/sensor-data/**`, `/api/sessions/**`, `/api/statistics/**`, `/api/devices/**`.

### M2 DTOs ↔ Controllers & Services
- `DeviceDTO`: fields `(Long id, String name, String deviceCode, String type, String status, Integer batteryLevel, LocalDateTime lastSyncTime, Long userId)`.
- `SensorDataDTO`: fields `(Long id, Long sessionId, String deviceId, LocalDateTime timestamp, Double ax, Double ay, Double az, Double gx, Double gy, Double gz, Double heartRate, Double muscleLoad, Double speedKmh)`.
- `PerformanceStatisticDTO`: matches `PerformanceStatistic` fields without exposing entity relationships.
- All Controller return types: `ResponseEntity<DeviceDTO>`, `ResponseEntity<List<DeviceDTO>>`, `ResponseEntity<SensorDataDTO>`, `ResponseEntity<SportSessionDTO>`, `ResponseEntity<PerformanceStatisticDTO>`, etc.

### M3 Services ↔ M4 Exception Handling
- `ResourceNotFoundException(String message)`: thrown when entity ID does not exist; caught by `GlobalExceptionHandler` and mapped to HTTP 404 with structured JSON `ErrorResponseDTO(timestamp, status, error, message, path)`.
- `AccessDeniedException` / `SecurityException`: mapped to HTTP 403 Forbidden.
- `ValidationException` / `MethodArgumentNotValidException`: mapped to HTTP 400 Bad Request.

---

## Code Layout
```
Second_Skin_Sport/
├── backend/
│   ├── src/main/java/com/secondskin/sport/
│   │   ├── config/             # SecurityConfig, WebSocketConfig, CorsConfig, AdminSeeder
│   │   ├── controller/         # REST Controllers (strictly DTOs, no JPA entity leakage)
│   │   ├── dto/                # Request & Response DTOs
│   │   ├── exception/          # GlobalExceptionHandler, ResourceNotFoundException
│   │   ├── model/              # JPA Entities
│   │   ├── repository/         # Spring Data Repositories
│   │   ├── security/           # JwtService, JwtAuthenticationFilter, SecurityUtils
│   │   └── service/            # Core business & DSP logic (BiomechanicalFeatureExtractor, JumpDetectionService, etc.)
│   └── src/test/java/          # Unit & Integration Tests
├── frontend/
│   ├── src/
│   │   ├── components/         # UI Components, ErrorBoundary
│   │   ├── hooks/              # Consolidated WebSocket hooks (useSensorWebSocket.ts)
│   │   ├── pages/              # Athlete, Coach, Admin, Settings pages
│   │   └── services/           # api.js (sanitized IDs, real endpoint routing)
│   └── package.json
└── docs/agent-context/         # Architectural context & specifications
```
