# 📘 SECOND SKIN SPORT — TÀI LIỆU TRỢ LÍ AI COACH

---

## 1. Model AI Hiện Tại Đang Sử Dụng Là Gì?

Hệ thống Trợ lí AI của **Second Skin Sport** hoạt động theo **Kiến trúc Trí tuệ Nhân tạo Song Hành (Dual-Engine Architecture)** nhằm đảm bảo tốc độ phản hồi tức thì, bảo mật và khả năng hoạt động ngay cả khi mất mạng internet:

```
                  ┌──────────────────────────────────────────────┐
                  │    DỮ LIỆU THÔ CẢM BIẾN (IMU MPU6050 10Hz)    │
                  │        (ax, ay, az, gx, gy, gz, roll, pitch) │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │   ENGINE 1: BIOMECHANICAL DSP FEATURE ENGINE  │
                  │        (Trích xuất đặc trưng động học số)    │
                  │   Landing Impact G, Symmetry %, Cadence, etc.│
                  └──────────────────────┬───────────────────────┘
                                         │
                      Có API Key?        │        Không có API Key / Offline?
            ┌────────────────────────────┴────────────────────────────┐
            ▼                                                         ▼
┌───────────────────────────────┐         ┌───────────────────────────────────────┐
│ ENGINE 2A: CLOUD LLM          │         │ ENGINE 2B: LOCAL BIOMECHANICS ENGINE  │
│ 🌟 Google Gemini 1.5 Flash    │         │ ⚡ Thuật toán Khoa học Thể thao Nội bộ │
│    (`gemini-1.5-flash`)       │         │    100% Offline & Bảo mật             │
└───────────────┬───────────────┘         └───────────────────┬───────────────────┘
                │                                             │
                └──────────────────────┬──────────────────────┘
                                       ▼
                  ┌──────────────────────────────────────────────┐
                  │  BÁO CÁO AI COACH THÂN THIỆN ĐỜI THƯỜNG     │
                  │  (Phong độ, Điểm cần sửa, Bài tập, Chấn thương)│
                  └──────────────────────────────────────────────┘
```

### 1.1. Model Đám Mây (Cloud LLM): **Google Gemini 1.5 Flash**
* **Tên Model kỹ thuật**: `gemini-1.5-flash`
* **Nhà cung cấp**: Google DeepMind / Google Cloud AI
* **Endpoint API**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
* **Lý do lựa chọn**:
  * **Tốc độ phản hồi cực nhanh**: Thời gian xử lý $< 1$ giây, phù hợp cho việc phân tích tức thì ngay khi kết thúc buổi tập.
  * **Chế độ Structured JSON Output**: Hỗ trợ chuẩn `responseMimeType: "application/json"`, đảm bảo dữ liệu trả về luôn tương thích 100% với Frontend mà không bị lỗi cú pháp.
  * **Khả năng diễn đạt tiếng Việt tự nhiên**: Chuyển đổi các thông số vật lý khô khan ($m/s^2, G, ^\circ/s$) thành lời nhận xét gần gũi, ấm áp, có tính động viên cao như một huấn luyện viên riêng.
* **Cấu hình tùy biến**:
  * Có thể đổi sang các model khác như `gemini-1.5-pro` hoặc `gemini-2.0-flash` thông qua file cấu hình `application.properties`:
    ```properties
    ai.gemini.api-key=${AI_GEMINI_API_KEY:}
    ai.gemini.model=gemini-1.5-flash
    ```

### 1.2. Model Xử Lý Tín Hiệu Nội Bộ: **Local Biomechanical DSP Engine**
* **Cơ chế**: Module `BiomechanicalFeatureExtractor.java` và thuật toán khoa học vận động tích hợp trực tiếp trong Backend Spring Boot.
* **Vai trò**: Đảm bảo hệ thống **không bao giờ bị gián đoạn**. Nếu không có internet ngoài sân tập hoặc chưa cấu hình API Key, hệ thống tự động kích hoạt bộ máy tính toán nội bộ để sinh ra toàn bộ báo cáo sinh trắc học và lời khuyên chuẩn xác.

---

## 2. Những Tính Năng Trợ Lí AI Có Thể Làm

Trợ lí AI của Second Skin Sport không chỉ đưa ra các con số vô nghĩa, mà tập trung giải quyết bài toán: **"Giúp người dùng hiểu rõ bản thân đang vận động ra sao và cần cải thiện điều gì"**.

### 🌟 Tính năng 1: Đánh Giá Phong Độ Tổng Thể Bằng Ngôn Ngữ Đời Thường
* **Mô tả**: Tóm tắt buổi tập bằng ngôn ngữ đời thường, gần gũi thay vì hiển thị các bảng số liệu phức tạp.
* **Ví dụ AI phản hồi**:
  > *"Bạn đã hoàn thành buổi chạy 35 phút với tốc độ trung bình 14.5 km/h. Độ cân bằng hai chân đạt 94% (rất đều giữa chân trái và chân phải). Độ êm tiếp đất đạt 82/100 giúp hạn chế đáng kể chấn động dội ngược lên lưng."*

---

### 📊 Tính năng 2: Đo Lường & Trực Quan Hóa 5 Chỉ Số Động Học Chuyên Sâu
Trợ lí AI phân tích trực tiếp sóng dao động gia tốc và con quay từ cảm biến MPU6050 để cho ra 5 chỉ số:

| Chỉ số | Ý nghĩa thực tế đối với người tập | Ngưỡng tối ưu |
| :--- | :--- | :--- |
| **🛡️ Độ Êm Tiếp Đất (Landing Softness)** | Đo lực dội ngược ($G$) khi bàn chân chạm sàn. Giúp người dùng biết mình tiếp đất có bị "cứng" gây đau lưng/gối không. | $> 80/100$ ($< 2.5G$) |
| **⚖️ Cân Bằng 2 Chân (Bilateral Symmetry)** | Đo tỷ lệ phân bổ tải trọng giữa chân trái và chân phải. Giúp phát hiện sớm tật lệch chân hoặc bù trừ lực khi một bên bị đau. | $> 90\%$ (Cân đối) |
| **⏱️ Nhịp Vận Động (Cadence)** | Đếm số bước chân mỗi phút ($\text{spm}$) hoặc tần suất nhịp bật nhảy. Giúp phát hiện lỗi sải chân quá dài gây tốn sức. | $165 - 180\,\text{spm}$ (Chạy bộ) |
| **🧘 Độ Vững Thân Trên (Trunk Stability)** | Đo góc chúi người ($\text{Lean Angle}$) và độ lắc lư của lưng/hông khi di chuyển. | $> 85/100$ (Góc chúi $6 - 10^\circ$) |
| **🚀 Độ Bùng Nổ & Bật Cao (Explosiveness)** | Đo thời gian bay trên không ($\text{Airtime}$) và gia tốc bứt tốc cất cánh. | $> 80/100$ (Bóng rổ) |

---

### 🎯 Tính năng 3: Chỉ Điểm Chính Xác Điểm Yếu Cần Cải Thiện
AI so sánh dữ liệu thực tế với mô hình vận động chuẩn của 2 bộ môn chính (**Chạy bộ** & **Bóng rổ**):
* **Với Chạy bộ**:
  * Phát hiện lỗi tiếp đất bằng gót chân (**Heel strike**) khi tăng tốc hoặc khi về cuối buổi do mệt.
  * Nhắc nhở khi tần số bước chân bị tụt giảm làm mất đà quán tính.
  * Cảnh báo độ lệch trục hông khi một chân chịu tải quá 55%.
* **Với Bóng rổ**:
  * Phát hiện các pha tranh chấp trên không tiếp đất bị khóa cứng khớp gối.
  * Cảnh báo mất thăng bằng thân trên khi thực hiện các pha đảo bóng (crossover) gấp.

---

### 🏋️ Tính năng 4: Huấn Luyện Viên Đề Xuất Bài Tập Khắc Phục (Actionable Drills)
AI không chỉ "chê" điểm yếu mà cung cấp luôn **bài tập thực hành cụ thể kèm số hiệp và số lần (Sets & Reps)**:
* **Khi tiếp đất cứng**: Gợi ý bài tập *Depth Drop* (Rơi từ bục 30cm tiếp đất êm không tiếng động: 3 hiệp x 8 lần).
* **Khi sải bước chậm**: Gợi ý bài tập *A-Skip* trên ức bàn chân (3 hiệp x 30m) để tạo phản xạ Midfoot strike.
* **Khi hai chân bị lệch lực**: Gợi ý bài tập *Single-leg Squat* hoặc đứng thăng bằng 1 chân trên đệm hơi Bosu.

---

### ⚠️ Tính năng 5: Cảnh Báo Nguy Cơ Chấn Thương Sớm (Injury Risk Detection)
Phân loại rủi ro theo 3 cấp độ màu sắc trực quan:
* 🟢 **LOW (An toàn)**: Tải trọng cơ học và phân bổ lực lý tưởng, khớp và dây chằng được bảo vệ tốt.
* 🟡 **MEDIUM (Cần lưu ý)**: Bắt đầu có dấu hiệu mỏi cơ cục bộ, cần chú ý nhịp thở và bù nước.
* 🔴 **HIGH (Cảnh báo quá tải)**:
  * Cảnh báo nguy cơ viêm gân gót **Achilles** hoặc quá tải cơ cẳng chân (Shin Splints).
  * Cảnh báo nguy cơ viêm gân bánh chè đầu gối (**Patellar tendonitis**) hoặc lật sơmi cổ chân do tiếp đất lệch.

---

### 💊 Tính năng 6: Hướng Dẫn Hồi Phục Thể Lực Chuẩn Khoa Học
Đưa ra quy trình hồi phục cá nhân hóa sau mỗi buổi tập:
* Hướng dẫn thời gian chườm đá lạnh tại các khớp chịu tải lớn.
* Hướng dẫn các bài giãn cơ tĩnh và sử dụng con lăn bọt (Foam Roller).
* Tính toán lượng nước điện giải và protein cần nạp trong "cửa sổ vàng" 30 phút sau khi tập.

---

### 🔥 Tính năng 7: Tính Toán Calo Tiêu Thụ Dựa Trên Chỉ Số MET
* Sử dụng hệ số trao đổi chất tương đương (**Metabolic Equivalent of Task - MET**):
  * **Chạy bộ (Running)**: $\text{MET} = 9.8$
  * **Bóng rổ (Basketball)**: $\text{MET} = 8.2$
* Kết hợp với thời lượng và gia tốc vận động thực tế từ cảm biến để đưa ra số Calo tiêu hao chuẩn xác thay vì ước lượng ngẫu nhiên.

---

## 3. Tổng Kết Kiến Trúc Công Nghệ

| Thành phần | Công nghệ sử dụng | Vai trò |
| :--- | :--- | :--- |
| **Model LLM** | Google Gemini 1.5 Flash (`gemini-1.5-flash`) | Phân tích ngữ nghĩa & sinh lời khuyên tiếng Việt |
| **Model DSP** | Biomechanical Feature Extractor (Java 21) | Xử lý tín hiệu số gia tốc & con quay 10Hz |
| **Backend API** | Spring Boot 3.2.3 REST + STOMP WebSocket | Xử lý phân tích và truyền nhận thời gian thực |
| **Frontend UI** | React 19 + Recharts + CSS Glassmorphism | Trực quan hóa 5 thanh đo và thẻ lời khuyên |
| **Firmware IoT** | ESP32-C3 RISC-V + MPU-6050 | Thu thập dữ liệu gia tốc 3 trục & tư thế |
