# Module Context: Trợ Lý Trí Tuệ Nhân Tạo (AI Coach Engine)

## 1. Trách Nhiệm Của Module
Module chịu trách nhiệm:
- Phân tích động lực học thể thao (Sports Biomechanics) từ chuỗi dữ liệu đo của cảm biến IMU MPU6050.
- Vận hành kiến trúc AI song hành (Dual-Engine Architecture):
  - **Cloud LLM (xAI Grok):** Sinh lời nhận xét thân thiện, tự nhiên bằng tiếng Việt theo phong cách HLV chuyên nghiệp, có cấu trúc JSON tương thích với giao diện.
  - **Local DSP Engine (Nội bộ Spring Boot):** Hoạt động $100\%$ offline, tự động thay thế khi mất mạng hoặc không có API Key.
- Đo lường và trực quan hóa 5 chỉ số động học chuyên sâu:
  1. *Landing Softness (Độ êm tiếp đất)*: Đo lực dội ngược ($G$) khi bàn chân chạm sàn.
  2. *Bilateral Symmetry (Cân bằng 2 chân)*: Tỷ lệ phân bổ lực giữa chân trái và chân phải.
  3. *Cadence (Nhịp vận động)*: Số bước mỗi phút ($\text{spm}$) hoặc tần suất bật nhảy.
  4. *Trunk Stability (Độ vững thân trên)*: Góc chúi người và độ lắc hông/lưng.
  5. *Explosiveness (Độ bùng nổ)*: Thời gian bay và gia tốc cất cánh.
- Đề xuất các bài tập khắc phục cụ thể có hướng dẫn số hiệp và số lần (Sets & Reps).

---

## 2. Các Class, Component & Tệp Quan Trọng

### Backend (Spring Boot)
- [`AiCoachController.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/controller/AiCoachController.java): REST endpoints phân tích buổi tập (`/api/ai/session/{sessionId}`) và phân tích nhanh (`/api/ai/quick-analysis`).
- [`AiCoachService.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/AiCoachService.java): Điều phối giữa Cloud LLM và Local Heuristic Engine, đóng gói prompt khoa học thể thao, giải mã kết quả JSON.
- [`BiomechanicalFeatureExtractor.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/service/BiomechanicalFeatureExtractor.java): Động cơ DSP tính toán các chỉ số cơ sinh học từ danh sách mẫu đo `SensorData`.
- [`AiInsightDTO.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/dto/AiInsightDTO.java): DTO trả về cho client gồm điểm số, lời nhận xét tổng quan, cảnh báo rủi ro chấn thương và danh sách bài tập.
- [`BiomechanicalMetricsDTO.java`](file:///d:/EXE101/Second_Skin_Sport/backend/src/main/java/com/secondskin/sport/dto/BiomechanicalMetricsDTO.java): DTO chứa 5 chỉ số động học cốt lõi.

### Frontend (React)
- [`AiCoachInsightCard.jsx`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/AiCoachInsightCard.jsx): Component giao diện hiển thị thẻ báo cáo AI, các thanh đo động học, nhãn cảnh báo rủi ro chấn thương (Low, Moderate, High), và danh sách bài tập đề xuất kèm nút hoàn thành.
- [`AiCoachInsightCard.css`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/components/AiCoachInsightCard.css): Phong cách thiết kế cho thẻ AI.
- [`api.js`](file:///d:/EXE101/Second_Skin_Sport/frontend/src/services/api.js): Chứa `aiService.getSessionAiInsight` và `aiService.getQuickAiInsight`.

---

## 3. Luồng Xử Lý Chính (Core Flow)

1. **Yêu Cầu Phân Tích Buổi Tập:**
   - Frontend gửi `GET /api/ai/session/{sessionId}`.
   - `AiCoachController` truy vấn bản ghi `SportSession` và toàn bộ mẫu `SensorData` liên quan từ database.
2. **Trích Xuất Đặc Trưng Cơ Sinh Học:**
   - `BiomechanicalFeatureExtractor.extract(rawData)` tính toán:
     - Xung lực tiếp đất trung bình ($G$) $\rightarrow$ Điểm độ êm tiếp đất ($0 - 100$).
     - Tỷ lệ dao động gia tốc ngang ($ay$) $\rightarrow$ Cân bằng hai chân ($\%$) ($>90\%$ là tối ưu).
     - Nhịp bước bước chân hoặc tần suất bật nhảy ($\text{spm}$).
     - Độ lệch góc nghiêng pitch/roll $\rightarrow$ Độ vững thân trên ($0 - 100$).
     - Đỉnh gia tốc tức thời khi cất cánh $\rightarrow$ Điểm bùng nổ ($0 - 100$).
3. **Phát Sinh Nhận Xét & Bài Tập Khắc Phục:**
   - `AiCoachService` kiểm tra cấu hình `ai.grok.api-key`:
     - **Nếu có API Key:** Gửi prompt đến xAI Responses API (`https://api.x.ai/v1/responses`) với model cấu hình được; yêu cầu JSON output rồi ánh xạ phản hồi vào `AiInsightDTO`.
     - **Nếu không có API Key / Mất mạng / Lỗi API:** Tự động gọi bộ phân tích biomechanics nội bộ. Động cơ nội bộ dựa trên ngưỡng điểm khoa học để xác định các điểm yếu (ví dụ: tiếp đất cứng do $G > 2.8$) và tự động gán bài tập tương ứng (*Depth Drop*, *A-Skip*, *Single-leg Squats*...).
4. **Hiển Thị Trên Giao Diện:**
   - `AiCoachInsightCard.jsx` render đầy đủ bảng điểm động học kèm lời nhận xét ấm áp, thân thiện.

---

## 4. API & Dependencies Liên Quan
- `GET /api/ai/session/{sessionId}`
- `POST /api/ai/quick-analysis`
- External API: xAI Responses API `https://api.x.ai/v1/responses` (Bearer API key).

---

## 5. Quy Tắc & Lưu Ý Khi Chỉnh Sửa Module
- **Tuyệt đối không lưu API Key trong mã nguồn:** Sử dụng biến môi trường `${XAI_API_KEY:}`; model cấu hình qua `${XAI_MODEL:grok-4.7}`.
- **Bảo toàn cơ chế Fallback:** Không để lỗi gọi xAI làm crash API. Nếu Cloud LLM timeout hoặc trả lỗi HTTP, luôn trả về kết quả từ bộ phân tích biomechanics nội bộ.
- **Đầu ra JSON:** Khi gọi Cloud LLM, yêu cầu JSON output qua `text.format.type: "json_object"`.

