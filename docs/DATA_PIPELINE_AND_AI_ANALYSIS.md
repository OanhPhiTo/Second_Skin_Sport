# 📊 SECOND SKIN SPORT — HỒ SƠ DỮ LIỆU IOT & CƠ CHẾ PHÂN TÍCH AI CHUYÊN SÂU
**Dành cho: Nhóm Phát triển, Kỹ sư IoT, Data Scientist & Huấn luyện viên AI**  
**Phiên bản: 2.0 (Kiến trúc Zero-Touch & Dual-Engine Biomechanics)**  
**Dự án: Second Skin Sport (Hệ thống thiết bị đeo thể thao thông minh)**

---

## 1. TỔNG QUAN KIẾN TRÚC LUỒNG DỮ LIỆU (END-TO-END DATA PIPELINE)

Hệ thống hoạt động theo quy trình khép kín từ cảm biến phần cứng dán trên trang phục thể thao đến báo cáo sinh trắc học trực quan trên Web:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. THIẾT BỊ ĐEO BIÊN (ESP32-C3 SuperMini + MPU-6050 6-DOF IMU)          │
│    - Lấy mẫu 10Hz (100ms/lần): ax, ay, az, gx, gy, gz                  │
│    - Ước lượng góc Euler 3D (Pitch, Roll, Yaw) bằng lượng giác          │
│    - FSM Heuristic: Tự động phân loại Active / Cooldown / Idle        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Web Bluetooth (BLE GATT)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. FRONTEND RAM BUFFER & ZERO-TOUCH ACCUMULATOR (React 19)             │
│    - `Sensors.jsx` & `useSensorWebSocket.ts`: Lưu dữ liệu trên RAM    │
│    - 0 độ trễ (0-latency), KHÔNG ghi DB mỗi 1.5s để chống phồng DB     │
│    - Phát hiện cú nhảy (Jumps > 17.5 m/s²), Đổi hướng (Turn > 120°/s)   │
│    - Gom 60 điểm trajectory tiêu biểu gửi 1 request khi kết thúc       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST API: POST /api/sessions/auto
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. BACKEND SPRING BOOT (Java 21) & DSP FEATURE ENGINE                  │
│    - `AutoSessionService`: Lưu phiên tập SportSession & 60 điểm sóng   │
│    - `BiomechanicalFeatureExtractor`: Trích xuất 5 nhóm động học       │
│      (Landing Softness, Bilateral Symmetry, Cadence, Trunk, Fatigue)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
     Có API Key   │                                   │ Mất mạng / Offline
                  ▼                                   ▼
┌───────────────────────────────────┐   ┌────────────────────────────────┐
│ 4A. CLOUD LLM: GEMINI 1.5 FLASH   │   │ 4B. LOCAL BIOMECHANICS ENGINE  │
│     (Prompt chuyên gia thể thao)  │   │     (Thuật toán DSP nội bộ)    │
│     Sinh JSON tiếng Việt tự nhiên │   │     100% Offline & Bảo mật     │
└─────────────────┬─────────────────┘   └────────────────┬───────────────┘
                  └─────────────────┬────────────────────┘
                                    │ DTO: AiInsightDTO
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 5. GIAO DIỆN NGƯỜI DÙNG (FRONTEND VISUALIZATION)                       │
│    - Thẻ đo IMU thời gian thực (Gia tốc, Con quay, Góc nghiêng)        │
│    - 5 Thanh đo Cơ sinh học (Biomechanical Progress Bars)              │
│    - Phân tích phong độ đời thường + Bài tập khắc phục (Sets & Reps)   │
│    - Phân tầng rủi ro chấn thương (LOW / MEDIUM / HIGH)                │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. THIẾT BỊ ESP32 GỬI NHỮNG DỮ LIỆU GÌ?

ESP32-C3 thu thập dữ liệu từ cảm biến chuyển động MPU-6050 với tần số **10Hz (10 lần/giây, chu kỳ 100ms)** và gửi về ứng dụng thông qua **Bluetooth Low Energy (BLE)** hoặc **Wi-Fi HTTP Batch**.

### 2.1. Cấu trúc gói tin JSON thực tế gửi qua BLE
```json
{
  "ax": 0.82,
  "ay": -0.21,
  "az": 9.73,
  "gx": 12.4,
  "gy": 4.8,
  "gz": -2.1,
  "pitch": 12.0,
  "roll": 4.0,
  "yaw": 82.0,
  "lat": 10.7769,
  "lng": 106.7009,
  "spd": 14.8,
  "bat": 92,
  "s": "active"
}
```

### 2.2. Bảng định nghĩa chi tiết từng trường dữ liệu & Đơn vị vật lý

| Tên trường | Tên đại lượng | Đơn vị đo | Dải giá trị | Ý nghĩa vật lý thực tế |
| :--- | :--- | :--- | :--- | :--- |
| `ax` | Gia tốc trục X | $\text{m/s}^2$ | $\pm 19.6$ ($\pm 2g$) | Gia tốc tiến/lùi dọc theo hướng di chuyển của vận động viên. |
| `ay` | Gia tốc trục Y | $\text{m/s}^2$ | $\pm 19.6$ ($\pm 2g$) | Gia tốc ngang (lắc sang trái/phải), thể hiện sự nghiêng lệch trọng tâm. |
| `az` | Gia tốc trục Z | $\text{m/s}^2$ | $\pm 19.6$ ($\pm 2g$) | Gia tốc thẳng đứng vuông góc mặt đất. Bao gồm trọng lực ($9.81$) và lực dội tiếp đất/bật nhảy. |
| `gx` | Vận tốc góc X | $^\circ/\text{s}$ | $\pm 250^\circ/\text{s}$ | Tốc độ xoay quanh trục ngang (cúi người gập người nhanh hay chậm). |
| `gy` | Vận tốc góc Y | $^\circ/\text{s}$ | $\pm 250^\circ/\text{s}$ | Tốc độ lắc nghiêng người sang hai bên khi tiếp đất hoặc đổi sải chân. |
| `gz` | Vận tốc góc Z | $^\circ/\text{s}$ | $\pm 250^\circ/\text{s}$ | Tốc độ xoay hông/thân người khi chuyển hướng (cắt bóng, đảo bóng). |
| `pitch` | Góc dốc (Pitch) | Độ ($^\circ$) | $-90^\circ \to +90^\circ$ | Độ chúi người về phía trước hoặc ngửa ra sau. |
| `roll` | Góc nghiêng (Roll)| Độ ($^\circ$) | $-180^\circ \to +180^\circ$ | Độ nghiêng của thân/chân sang trái hoặc phải. |
| `yaw` | Góc phương vị | Độ ($^\circ$) | $0^\circ \to 360^\circ$ | Hướng la bàn chuyển động của cơ thể. |
| `lat`, `lng` | Tọa độ GPS | Độ thập phân | Toàn cầu | Tọa độ địa lý ngoài sân vận động (nếu có GPS module). |
| `spd` | Vận tốc tức thời | $\text{km/h}$ | $0 - 45\,\text{km/h}$ | Tốc độ di chuyển thực tế. |
| `bat` | Dung lượng Pin | $\%$ | $0 - 100\%$ | Tình trạng pin LiPo gắn trên trang phục Second Skin. |
| `s` | Trạng thái máy (FSM)| Chuỗi | `active`, `cooldown`, `idle` | Cờ tự động nhận diện vận động tính toán trực tiếp trên chip ESP32. |

---

## 3. DỮ LIỆU ĐÓ ĐƯỢC HIỂN THỊ RA SAO TRÊN GIAO DIỆN?

Hệ thống phân tách giao diện theo 3 cấp độ: **Thời gian thực (Realtime)**, **Tổng quan tiến trình (Dashboard)** và **Chuyên sâu Huấn luyện viên (AI Coach Insight)**:

### 3.1. Màn hình Cảm biến Trực tiếp (`Sensors.jsx` & `SensorCard.jsx`)
Dữ liệu 10Hz từ Web Bluetooth được render trực tiếp trên RAM, không ghi vào Database:
1. **Subcard Gia tốc (Accelerometer - $m/s^2$)**:
   - 3 đồng hồ kỹ thuật số cho $a_x, a_y, a_z$ cập nhật 10 lần/giây.
   - Thanh hiển thị lực tổng hợp: $\text{Resultant G-Force} = \frac{\sqrt{a_x^2 + a_y^2 + a_z^2}}{9.81}$.
2. **Subcard Con quay góc (Gyroscope - $^\circ/s$)**:
   - Hiển thị tốc độ xoay 3 trục $g_x, g_y, g_z$.
3. **Subcard Tư thế không gian (Orientation - Degrees)**:
   - Thể hiện góc Pitch, Roll, Yaw giúp quan sát góc nghiêng cơ thể.
4. **Bảng điều khiển Phiên tập Tự động (Zero-Touch Panel)**:
   - Hiển thị trạng thái phiên: 🟢 `Recording` (Đang tập) / 🟡 `Cooldown` (Nghỉ giữa hiệp) / ⚪ `Idle`.
   - Đồng hồ thời gian tập, số lần bật nhảy (Jumps), số lần bứt tốc chuyển hướng (Direction Changes).

### 3.2. Màn hình Tổng quan Vận động (`Dashboard.jsx` & `PerformanceChart.jsx`)
- **Biểu đồ sóng Recharts (AreaChart)**: Cho phép chuyển đổi linh hoạt theo `Today`, `7 Days`, `30 Days`:
  - Trục gia tốc trung bình ($\text{m/s}^2$).
  - Trục vận tốc di chuyển ($\text{km/h}$).
  - Vùng diện tích Gradient màu xanh Neon thể hiện Cường độ vận động ($\text{Movement Intensity } 0 - 100\%$).
- **Thẻ Thống kê (StatCard)**: Tổng calo tiêu hao, Tổng quãng đường, Nhịp tim trung bình, Điểm phong độ trung bình.

### 3.3. Thẻ Phân Tích Chuyên Sâu AI Coach (`AiCoachInsightCard.jsx` & `Activities.jsx`)
Khi người dùng bấm vào một buổi tập trong danh sách, một Modal chuyên gia AI mở ra hiển thị:
1. **5 Thanh đo Cơ sinh học Chuyên nghiệp (Biomechanical Progress Bars)**:
   - **Độ êm tiếp đất**: Điểm số $/100$ kèm chỉ số lực dội đỉnh $G$.
   - **Cân bằng 2 chân**: Tỷ lệ phần trăm cân đối kèm ghi chú chân chịu lực chính (VD: *"Chân trái chịu lực nhiều hơn"*).
   - **Nhịp bước Cadence**: Số bước/phút ($spm$) kèm % độ đều nhịp.
   - **Độ vững thân trên**: Điểm vững $/100$ kèm góc chúi người $\text{Lean Angle } (^\circ)$.
   - **Độ bùng nổ**: Điểm bùng nổ $/100$ kèm thời gian lơ lửng trên không Airtime ($s$).
2. **Hộp đánh giá phong độ bằng tiếng Việt đời thường**: Lời nhận xét gần gũi như một HLV trực tiếp đứng trên sân.
3. **Hộp Điểm cần khắc phục & Bài tập bổ trợ (Actionable Drills)**: Gợi ý bài tập có số hiệp và số lần thực hiện rõ ràng.
4. **Huy hiệu Cảnh báo Chấn thương (Injury Risk Badge)**: 3 cấp độ màu (🟢 LOW, 🟡 MEDIUM, 🔴 HIGH) kèm giải thích cơ học.
5. **Kế hoạch phục hồi thể lực**: Hướng dẫn chườm đá lạnh, lăn cơ Foam Roller, bù nước và dinh dưỡng.

---

## 4. TRỢ LÍ AI PHÂN TÍCH CÁC DỮ LIỆU ĐÓ ĐỂ LÀM GÌ? (CƠ CHẾ KHOA HỌC THỂ THAO)

Dưới đây là lời giải thích chi tiết vì sao cần từng thông số và công thức tính toán cụ thể trong mã nguồn:

### 4.1. Gia tốc ($a_x, a_y, a_z$) dùng để làm gì?

#### A. Tính Độ lớn Lực Tổng hợp (Vector Magnitude)
$$\text{mag} = \sqrt{a_x^2 + a_y^2 + a_z^2}$$
* **Mục đích**: Nhận biết cường độ chuyển động tổng thể bất kể thiết bị dán nghiêng theo hướng nào. Khi người đứng yên, $\text{mag} \approx 9.81\,\text{m/s}^2$ ($1.0G$). Khi vận động mạnh, $\text{mag}$ tăng lên $15 - 35\,\text{m/s}^2$.

#### B. Phân tích Lực dội Tiếp đất (Landing Impact Force) & Độ êm (Landing Softness)
* **Dữ liệu sử dụng**: Giá trị đỉnh của gia tốc thẳng đứng $a_z$ và vector tổng hợp $\max(\text{mag})$.
* **Công thức quy đổi G-Force**:
  $$\text{PeakLandingImpactG} = \frac{\max(\text{mag})}{9.80665}$$
* **Ý nghĩa đối với AI Coach**:
  - Khi bàn chân chạm sàn, lực phản chấn dội ngược từ mặt đất lên xương ống đồng, khớp gối và cột sống.
  - Nếu $\text{PeakImpactG} \le 2.4G$: Tiếp đất êm ái, khớp gối co gập tự nhiên để triệt tiêu chấn động $\rightarrow$ **An toàn**.
  - Nếu $\text{PeakImpactG} > 3.0G$: Tiếp đất cứng (khóa cứng khớp gối hoặc nện gót mạnh) $\rightarrow$ AI kích hoạt cảnh báo **Nguy cơ viêm gân gót Achilles hoặc đau xương cẳng chân (Shin Splints)**.
* **Công thức điểm tiếp đất êm trong code** ([BiomechanicalFeatureExtractor.java](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/BiomechanicalFeatureExtractor.java#L66)):
  $$\text{LandingSoftnessScore} = 100 - \min(55, \max(0, (\text{PeakImpactG} - 1.8) \times 22))$$

#### C. Nhận diện Kiểu Tiếp Đất (Strike Pattern: Heel Strike vs Midfoot Strike)
* **Dữ liệu**: Biên độ dốc của gia tốc $a_z$ theo thời gian ($\frac{da_z}{dt}$).
* Tiếp đất bằng gót chân (Heel-strike) tạo một gai nhọn đột ngột trong $< 30\text{ms}$ $\rightarrow$ AI nhận diện kỹ thuật chưa tối ưu và đề xuất bài tập *A-Skip* hoặc *Metronome Drill*.

---

### 4.2. Vận tốc góc ($g_x, g_y, g_z$) và Góc nghiêng (Pitch, Roll, Yaw) dùng để làm gì?

#### A. Đo Góc Chúi Thân Trên (Trunk Lean Angle) từ Góc `Pitch`
* **Dữ liệu sử dụng**: Giá trị trung bình của góc `Pitch` ($\bar{\theta}_{\text{Pitch}}$).
* **Ý nghĩa thể thao**:
  - Trong chạy bộ chuyên nghiệp, cơ thể cần chúi về phía trước từ mắt cá chân một góc lý tưởng **$6^\circ - 10^\circ$** để trọng tâm rơi tự nhiên phía trước giúp tăng tốc mà không tốn sức cơ bắp.
  - Nếu $\text{Pitch} < 4^\circ$: Thân người quá thẳng hoặc ngửa ra sau, sải chân bị với quá dài (Overstriding), gót chân đâm xuống đất đóng vai trò như phanh hãm lực.
  - Nếu $\text{Pitch} > 15^\circ$: Chúi người gập hông quá sâu, gây quá tải cơ thắt lưng và cơ dựng gai sống.

#### B. Phân tích Cân Bằng Tải Trọng 2 Chân (Bilateral Symmetry) từ `Roll` & `ay`
* **Dữ liệu sử dụng**: Dấu của góc nghiêng `Roll` và gia tốc ngang $a_y$.
* **Cơ chế tính toán** ([BiomechanicalFeatureExtractor.java](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/BiomechanicalFeatureExtractor.java#L50-L82)):
  - Khi cơ thể tiếp đất chân trái, trọng tâm lệch sang trái: $\text{Roll} < 0$ hoặc $a_y < -0.2\,\text{m/s}^2 \implies \text{LeftImpulse} += |a_y| + |a_x|$.
  - Khi tiếp đất chân phải: $\text{Roll} > 0 \implies \text{RightImpulse} += |a_y| + |a_x|$.
  - Tỷ lệ đối xứng:
    $$\text{Ratio}_{\text{left}} = \frac{\text{LeftImpulse}}{\text{LeftImpulse} + \text{RightImpulse}}$$
    $$\text{Symmetry\%} = 100 - (|\text{Ratio}_{\text{left}} - 0.5| \times 60)$$
* **Ý nghĩa đối với AI Coach**:
  - Nếu độ cân bằng $< 88\%$: Vận động viên đang dồn tải trọng quá nhiều về một bên (ví dụ: Chân trái 58%, Chân phải 42%).
  - Nguyên nhân: Có thể do chân yếu hơn sau chấn thương, hoặc thói quen lệch trục hông.
  - Hành động của AI: Cảnh báo nguy cơ lệch hông và đề xuất bài tập đơn lẻ như *Single-leg Squat (Squat 1 chân)* để phục hồi sức mạnh bên chân yếu.

#### C. Đo Độ Vững Thân Trên (Trunk Stability) từ Phương sai Dao động Góc
* **Dữ liệu sử dụng**: Độ lệch chuẩn ($\sigma$) của góc `Pitch` và `Roll` trong suốt buổi tập:
  $$\sigma_{\text{Pitch}} = \sqrt{\frac{1}{N}\sum (\text{Pitch}_i - \bar{\text{Pitch}})^2}, \quad \sigma_{\text{Roll}} = \sqrt{\frac{1}{N}\sum (\text{Roll}_i - \bar{\text{Roll}})^2}$$
  $$\text{TrunkStabilityScore} = 100 - \min(50, (\sigma_{\text{Pitch}} + \sigma_{\text{Roll}}) \times 1.8)$$
* **Ý nghĩa**:
  - Người có nhóm cơ lõi (Core muscles) khỏe sẽ giữ thân trên đầm chắc, ít lắc lư $\rightarrow$ Độ vững $> 85/100$.
  - Khi cơ thể bắt đầu mỏi, lưng và vai lắc lư dữ dội $\rightarrow$ Điểm độ vững tụt giảm, báo hiệu mất năng lượng hoang phí.

---

### 4.3. Độ Bật Nhảy (Jumps) và Thời Gian Bay (Airtime) được tính từ data nào?

* **Dữ liệu sử dụng**: Chuỗi biến thiên của Vector gia tốc tổng hợp $\text{mag} = \sqrt{a_x^2 + a_y^2 + a_z^2}$.
* **Quy trình nhận diện 4 pha nhảy thể thao**:
  1. **Pha Nén nhún lấy đà (Counter-movement)**: $\text{mag}$ giảm xuống $< 8.0\,\text{m/s}^2$ khi đầu gối chùng xuống.
  2. **Pha Giậm nhảy bứt tốc (Take-off Push)**: Gia tốc tăng vọt đột ngột vượt ngưỡng **$> 17.5\,\text{m/s}^2$** (khoảng $1.8G - 2.5G$).
  3. **Pha Bay tự do trên không (Flight Phase / Airtime)**: Cơ thể ở trạng thái lơ lửng, cảm biến rơi tự do nên gia tốc đo được tụt mạnh về gần $0\,\text{m/s}^2$ (hoặc tiệm cận vi trọng lực). Thời gian kéo dài của pha này là **$\Delta t_{\text{air}}$ (Airtime)**.
  4. **Pha Tiếp đất (Landing Impact)**: Gia tốc va chạm vọt lên cực đại ($> 20\,\text{m/s}^2$).
* **Công thức vật lý tính độ cao bật nhảy (Jump Height)**:
  $$H = \frac{1}{8} g \cdot (\Delta t_{\text{air}})^2 \quad (\text{với } g = 9.81\,\text{m/s}^2)$$
  *Ví dụ: Thời gian bay trên không là $0.5$ giây $\implies$ Độ cao bật nhảy $H = \frac{1}{8} \times 9.81 \times (0.5)^2 \approx 0.306\,\text{m} = 30.6\,\text{cm}$.*
* **Chống đếm trùng (Debouncing)**: Bộ lọc thời gian yêu cầu khoảng cách giữa 2 cú nhảy liên tiếp tối thiểu **$600\text{ms}$** để loại trừ xung lực phản hồi lúc tiếp đất.

---

### 4.4. Số pha Đổi Hướng (Direction Changes) tính từ data nào?

* **Dữ liệu sử dụng**: Độ lớn vận tốc góc con quay $\text{gyroMag} = \sqrt{g_x^2 + g_y^2 + g_z^2}$ và gia tốc ngang $a_y$.
* **Cơ chế nhận diện** ([Sensors.jsx](file:///d:/EXE101/Second_Skin_Sport/frontend/src/pages/Sensors.jsx#L229-L234)):
  - Trong bóng rổ, các pha đảo bóng (Crossover), xoay trụ (Pivot), cắt bóng (Cut) tạo ra xung lực xoay quanh trục thẳng đứng $g_z$ cực lớn.
  - Khi $\text{gyroMag} > 120.0^\circ/\text{s}$ kết hợp với đổi dấu gia tốc ngang trong khoảng cách thời gian $> 500\text{ms}$, hệ thống cộng $+1$ vào bộ đếm **Direction Changes**.
  - Chỉ số này giúp AI đánh giá mức độ linh hoạt và độ bùng nổ chuyển hướng của cầu thủ.

---

### 4.5. Nhịp Vận Động (Cadence - SPM) tính từ data nào?

* **Dữ liệu sử dụng**: Tần số lặp lại của các đỉnh xung lực gia tốc ($\text{mag} > 13.5\,\text{m/s}^2$) theo thời gian.
* **Quy đổi**: Số bước chân trên mỗi phút (Steps Per Minute - SPM).
* **Ý nghĩa đối với AI**:
  - Chuẩn chạy bộ tối ưu cho người trưởng thành là **$165 - 180\,\text{spm}$**.
  - Nếu $\text{Cadence} < 160\,\text{spm}$: Sải chân quá dài, tốn nhiều sức nâng hạ trọng tâm cơ thể và dễ bị chấn thương khớp gối do tiếp đất cứng.
  - AI sẽ khuyến nghị: *"Tăng tần số bước chân ngắn lại theo nhịp Metronome 170 bpm để tiếp đất êm hơn."*

---

### 4.6. Chỉ số Mỏi Cơ (Fatigue Index) tính từ data nào?

* **Dữ liệu sử dụng**: So sánh tích phân năng lượng gia tốc chuyển động giữa **20% thời gian đầu** ($E_{\text{initial}}$) và **20% thời gian cuối** ($E_{\text{final}}$) của phiên tập:
  $$E = \sum_{i=1}^{M} \sqrt{a_{x,i}^2 + a_{y,i}^2 + a_{z,i}^2}$$
  $$\Delta E = \frac{E_{\text{initial}} - E_{\text{final}}}{E_{\text{initial}}}$$
  $$\text{FatigueIndex} = \text{round}(\Delta E \times 100\%) + 12$$
* **Dấu hiệu cơ học khi mỏi cơ**:
  1. Năng lượng bứt tốc giảm ($\Delta E > 25\%$).
  2. Lực dội tiếp đất $\text{PeakImpactG}$ tăng lên (do cơ bắp cẳng chân và đùi không còn sức đàn hồi để hấp thụ lực).
  3. Độ vững thân trên $\text{TrunkStability}$ giảm (người lắc lư nhiều hơn).
* **Tác dụng**: AI dựa vào chỉ số này để quyết định nâng mức cảnh báo nguy cơ chấn thương lên **MEDIUM** hoặc **HIGH**, yêu cầu người tập dừng buổi tập và hướng dẫn giãn cơ.

---

## 5. TỔNG KẾT BẢNG MỐI QUAN HỆ: DỮ LIỆU THÔ $\to$ CHỈ SỐ AI $\to$ GIÁ TRỊ THỰC TIỄN

| Dữ liệu Thô từ ESP32 | Thuật toán Phân tích | Chỉ số Đầu ra của AI | Tác dụng Thực tiễn cho Người Dùng |
| :--- | :--- | :--- | :--- |
| **$a_x, a_y, a_z$** (10Hz) | $\max(\sqrt{a_x^2+a_y^2+a_z^2}) / 9.81$ | **Lực Dội Tiếp Đất (Peak G)** | Biết mình tiếp đất êm hay cứng; phòng tránh đau lưng và thoái hóa khớp gối. |
| **$a_y$ & `Roll`** | Tích phân xung lực 2 bên $\frac{I_L}{I_L+I_R}$ | **Độ Cân Bằng 2 Chân (%)** | Phát hiện chân lệch lực; phòng tránh lật sơmi cổ chân và lệch cột sống. |
| **Đỉnh $a_z > 13.5$** | Đếm chu kỳ bước theo thời gian | **Nhịp Bước (Cadence - spm)** | Sửa lỗi sải chân quá dài; tối ưu hóa hiệu suất tiêu hao năng lượng khi chạy. |
| **`Pitch`, `Roll`** | Phương sai dao động $\sigma_{\text{Pitch}} + \sigma_{\text{Roll}}$ | **Độ Vững Thân Trên (%)** | Đánh giá sức mạnh cơ Core; hạn chế tình trạng lắc lư mất đà khi mệt. |
| **Góc `Pitch`** | Giá trị trung bình $\bar{\theta}_{\text{Pitch}}$ | **Góc Chúi Thân (Lean Angle $^\circ$)** | Duy trì góc chúi khí động học $6-10^\circ$ chuẩn của vận động viên marathon. |
| **$\text{mag} > 17.5$ & rơi tự do** | Phát hiện xung lực & thời gian bay | **Số Cú Nhảy & Độ Bật Cao (Airtime)** | Đo lường độ bùng nổ cơ bắp đùi trong các pha tranh chấp bóng rổ. |
| **$\text{mag}$ đầu vs cuối** | Độ suy giảm năng lượng động học $\Delta E$ | **Chỉ Số Mỏi Cơ (Fatigue Index)** | Biết khi nào cơ bắp đã quá tải để dừng tập đúng lúc, chống đứt dây chằng. |
| **Thời lượng & $a_{\text{avg}}$** | Mô hình MET ($9.8$ Running / $8.2$ Basketball) | **Calo Tiêu Thụ Chính Xác** | Đo lường chính xác lượng calo đốt cháy dựa trên cường độ thực tế. |

---

Tài liệu này là căn cứ kỹ thuật chuẩn hóa giúp các thành viên nhóm Frontend, Backend, Firmware và AI nắm bắt trọn vẹn luồng dữ liệu và ý nghĩa cơ sinh học trong hệ thống **Second Skin Sport**.
