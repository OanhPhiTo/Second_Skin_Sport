# Second Skin Sport — Test Infrastructure & E2E Test Strategy (TEST_INFRA.md)

## 1. Overview & Architecture

The testing infrastructure for **Second Skin Sport** provides end-to-end (E2E), integration, and unit verification for an IoT sports analytics platform comprising:
- **Spring Boot 3.2 (Java 21)** REST API and WebSocket STOMP backend.
- **Biomechanical Kinematic Engine**: Finite State Machine (FSM) jump detection, landing impact analysis, running cadence recognition.
- **Coach Squad Tactical Engine**: Real-time fatigue calculation, rotation recommendation, and tactical substitutions.
- **Stateless JWT Security**: Role-based access control (`ADMIN`, `COACH`, `USER`).

The E2E test suite adopts an **opaque-box testing paradigm**: tests interact exclusively with the public HTTP REST interfaces and WebSocket channels without mocking internal services, using a dedicated in-memory H2 database instance (`jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1`) to guarantee pristine isolation.

---

## 2. Test Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Language** | Java | 21 (LTS) | Modern language runtime and syntax |
| **Framework** | Spring Boot Test | 3.2.3 | Application context lifecycle & test runner |
| **Runner** | JUnit Jupiter (JUnit 5) | 5.10.x | Test execution, lifecycle hooks, assertions |
| **HTTP Testing** | Spring MVC Test (`MockMvc`) | 3.2.3 | Full servlet filter chain, security, JSON assertions |
| **JSON SerDe** | Jackson `ObjectMapper` | 2.15.x | Payload serialization, deserialization, tree parsing |
| **Database** | H2 Database Engine | In-Memory | Transient isolated storage (`create-drop`) |
| **Security** | Spring Security Test & JJWT | 0.11.5 | Token generation, validation, authorization checks |

---

## 3. Directory Layout

All E2E test suites reside in `backend/src/test/java/com/secondskin/sport/e2e/`:

```
backend/
├── src/test/java/com/secondskin/sport/
│   ├── controller/               # Controller-level slice tests
│   ├── service/                  # Service-level unit & algorithmic tests
│   └── e2e/                      # 4-Tier Opaque-Box E2E Test Suite
│       ├── Tier1FeatureCoverageE2ETest.java    # Tier 1: >=5 tests per core feature
│       ├── Tier2BoundaryCornerE2ETest.java     # Tier 2: Boundary & corner cases
│       ├── Tier3CrossFeatureE2ETest.java       # Tier 3: Pairwise cross-feature interactions
│       └── Tier4RealWorldWorkloadE2ETest.java  # Tier 4: Realistic 45-min workloads & game scenarios
└── src/test/resources/
    ├── application.properties    # H2 in-memory DB configuration
    └── META-INF/
```

---

## 4. 4-Tier Test Suite Structure

### Tier 1: Feature Coverage (`Tier1FeatureCoverageE2ETest.java`)
Validates the fundamental contract (happy and negative paths) for every public feature domain with at least 5 isolated test cases per feature:
1. **Authentication & Authorization**: User registration, duplicate registration rejection, valid credential login, invalid credential rejection, token refresh.
2. **Sensor Batch Ingestion**: Single reading ingestion, multi-sample batch processing, batch with device identifier, batch without device fallback, device synchronization & battery update.
3. **Sport Session CRUD**: Session creation, retrieve session by ID, query sessions filtered by sport, update existing session, session deletion.
4. **Coach Squad Management**: Squad/team creation, list teams for coach, add athlete to roster, update athlete status (`ON_FIELD` $\leftrightarrow$ `BENCH`), remove athlete from squad.
5. **Device Status & Telemetry**: List registered devices, retrieve device by ID, query overall sensor status (`/api/devices/status`), update connection state (connect/disconnect), update device battery level.

### Tier 2: Boundary & Corner Cases (`Tier2BoundaryCornerE2ETest.java`)
Pushes the system to operational and kinematic limits:
- **Empty & Null Batches**: Empty `readings: []` array, null readings, empty request bodies.
- **Kinematic Hang Time Boundaries**: Sub-threshold airtime (<180ms, e.g., 50ms quick tap/step) must not register as jump; super-threshold airtime (>850ms) must not register or must timeout to GROUND.
- **Extreme Kinematic Accelerations**: Large accelerations ($\pm 100 m/s^2$), zero acceleration ($0.0 m/s^2$), near-freefall values.
- **Large Batch Stress**: 100+ telemetry readings in a single batch to verify pipeline throughput without memory or transaction overflow.
- **Security Header Anomalies**: Missing `Bearer ` prefix, empty authorization header, malformed token string, expired token verification.
- **Battery & Telemetry Bounds**: Battery levels at 0%, 100%, and clamped values (>100% or <0%).
- **Non-Existent Resource ID Inquiries**: 404 behavior for invalid session, device, and team identifiers.

### Tier 3: Cross-Feature Interactions (`Tier3CrossFeatureE2ETest.java`)
Verifies pairwise interaction across system boundaries:
- **Ingestion $\rightarrow$ Jump Detection $\rightarrow$ Coach Squad Telemetry**: Telemetry from ESP32 batch triggers jump detection, updates athlete jump count and high-impact landings, recalculating the coach fatigue index.
- **Session Lifecycle $\rightarrow$ Ingestion $\rightarrow$ Statistics**: Session created, sensor batch ingested with `sessionId`, statistics service aggregating performance score, total jumps, and average acceleration.
- **Coach Squad $\rightarrow$ Live Match Fatigue $\rightarrow$ Tactical Swap**: High intensity batch drives athlete fatigue above threshold; coach triggers tactical player swap (`outAthlete` $\rightarrow$ `BENCH`, `inAthlete` $\rightarrow$ `ON_FIELD`); roster verifies immediate status reflection.
- **Device Management $\rightarrow$ Telemetry Sync**: Device connection, batch ingestion with battery status, checking `/api/devices/status` reflects latest telemetry.
- **Auto-Session Creation $\rightarrow$ Batch Processing $\rightarrow$ Session Sensor Data Retrieval**: Device triggers `/api/sessions/auto`, batch ingested, `/api/sessions/{id}/sensor-data` returns full chronological telemetry points.

### Tier 4: Real-World Workload Scenarios (`Tier4RealWorldWorkloadE2ETest.java`)
Simulates authentic athletic and coaching workflows:
- **Scenario 1: Full 45-Minute Athlete Training Session**: Warm-up running phase with cadence steps, followed by high-intensity vertical jump sets (landing impact > 3.0G), and cool-down phase; session verification against activity analysis.
- **Scenario 2: Professional Match Squad Rotation Simulation**: Starting lineup of 5 basketball players; continuous telemetry drives starting guard's fatigue index high (>75); coach AI generates rotation recommendation; coach executes substitution; bench player takes the court.
- **Scenario 3: Sequential IoT Patch Telemetry Stream**: 10 consecutive sensor batches simulating streaming ESP32 wearable packets over time; checks database persistence, step counter accumulation, and battery discharge.
- **Scenario 4: Multi-Sport Biomechanical Differentiation**: Comparison of basketball session (high jumps, high vertical takeoff) vs running session (sustained cadence, low jump height) verifying sport-specific DSP calculations.
- **Scenario 5: High-Impact Landings & Injury Risk Alert**: Athlete subjected to repetitive heavy landings (>4.5G); system accumulates high-impact count, triggers tactical alerts, and updates squad risk profile.

---

## 5. Execution & Verification

### Compilation Verification
```bash
cd backend
mvn test-compile
```

### Full E2E Test Suite Execution
```bash
cd backend
mvn test -Dtest="Tier1FeatureCoverageE2ETest,Tier2BoundaryCornerE2ETest,Tier3CrossFeatureE2ETest,Tier4RealWorldWorkloadE2ETest"
```

### Individual Tier Execution
```bash
mvn test -Dtest=Tier1FeatureCoverageE2ETest
mvn test -Dtest=Tier2BoundaryCornerE2ETest
mvn test -Dtest=Tier3CrossFeatureE2ETest
mvn test -Dtest=Tier4RealWorldWorkloadE2ETest
```

---

## 6. Test Isolation & Determinism Principles

1. **Independent State**: Each test method sets up required entities or utilizes unique identifiers (e.g. emails with UUID / unique timestamps) to prevent state collisions.
2. **In-Memory Volatility**: The H2 database re-creates schema on test context initialization (`ddl-auto=create-drop`).
3. **Stateless Tokens**: JWT tokens are minted on-demand using valid user details or test security utilities without shared singleton mutation.
4. **Architectural Compliance**: Strictly conforms to `AGENTS.md` unit invariants:
   - Accelerations in $m/s^2$ or $G$ ($1G \approx 9.80665 m/s^2$).
   - Angular velocities in $^\circ/s$.
   - Controllers invoked through HTTP REST contract returning DTOs.
