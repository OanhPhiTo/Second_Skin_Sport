package com.secondskin.sport.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.dto.BiomechanicalMetricsDTO;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.entity.SportSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class AiCoachService {

    @Value("${ai.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${ai.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final BiomechanicalFeatureExtractor featureExtractor;

    public AiCoachService(BiomechanicalFeatureExtractor featureExtractor) {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
        this.featureExtractor = featureExtractor;
    }

    /**
     * Phân tích buổi tập cơ bản (dùng default features nếu chưa có raw data)
     */
    public AiInsightDTO analyzeSession(SportSession session) {
        return analyzeSession(session, Collections.emptyList());
    }

    /**
     * Phân tích chuyên sâu từ dữ liệu thô cảm biến (10Hz raw data points)
     */
    public AiInsightDTO analyzeSession(SportSession session, List<SensorData> rawData) {
        String sport = session.getSport() != null ? session.getSport() : "Running";
        BiomechanicalMetricsDTO metrics = featureExtractor.extractFeatures(rawData, sport);

        AiInsightDTO insight;
        if (geminiApiKey != null && !geminiApiKey.trim().isEmpty()) {
            try {
                insight = callGeminiApi(session, metrics);
                if (insight != null) {
                    insight.setBiomechanicalMetrics(metrics);
                    return insight;
                }
            } catch (Exception e) {
                System.err.println(">>> [AI] Gemini API call failed, switching to local biomechanics engine: " + e.getMessage());
            }
        }

        insight = generateBiomechanicalInsights(session, metrics);
        insight.setBiomechanicalMetrics(metrics);
        return insight;
    }

    /**
     * Gọi Google Gemini API với System Prompt chuyên gia khoa học thể thao
     */
    private AiInsightDTO callGeminiApi(SportSession session, BiomechanicalMetricsDTO metrics) {
        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey.trim()
        );

        String prompt = String.format(
                "Bạn là một Huấn Luyện Viên AI và chuyên gia khoa học thể thao cho hệ thống thiết bị đeo 'Second Skin Sport'.\n" +
                "Mục tiêu của bạn là giúp người dùng DỄ HIỂU BẢN THÂN: hiểu họ đang hoạt động ra sao, phong độ thế nào và cần cải thiện điều gì bằng ngôn ngữ đời thường, tích cực và dễ áp dụng.\n\n" +
                "DỮ LIỆU ĐỘNG HỌC THU THẬP TỪ CẢM BIẾN (Chuyên sâu 2 môn: Chạy bộ & Bóng rổ):\n" +
                "- Môn thể thao: %s\n" +
                "- Thời lượng: %d phút | Tốc độ TB: %.1f km/h | Gia tốc TB: %.2f m/s²\n" +
                "- Số cú bật nhảy: %d | Số pha đổi hướng bứt tốc: %d\n" +
                "- Lực dội tiếp đất đỉnh điểm: %.1fG (Độ êm tiếp đất: %d/100)\n" +
                "- Độ cân bằng hai chân: %d%% (Chân chịu lực chính: %s)\n" +
                "- Nhịp bước (Cadence): %d bước/phút (Độ đều nhịp: %d%%)\n" +
                "- Độ vững thân trên: %d/100 (Góc chúi người: %.1f độ)\n" +
                "- Độ bùng nổ: %d/100 | Mức độ mỏi cơ: %d%%\n\n" +
                "YÊU CẦU: Trả về ĐÚNG MỘT JSON thuần túy (không bọc trong markdown, không có text phụ) có cấu trúc sau:\n" +
                "{\n" +
                "  \"activityType\": \"<Tên hoạt động, VD: Bóng rổ - Tấn công & Bật nhảy linh hoạt hoặc Chạy bộ - Rèn luyện sức bền>\",\n" +
                "  \"performanceScore\": <Điểm tổng kết từ 1-100>,\n" +
                "  \"currentPerformance\": \"<1-2 đoạn văn ngắn giải thích người dùng đang hoạt động ra sao: nhịp độ, thể lực, sự bùng nổ bằng giọng nói ấm áp, gần gũi>\",\n" +
                "  \"areasForImprovement\": [\"<Điểm yếu kỹ thuật 1 cần sửa, VD: Tiếp đất hơi cứng>\", \"<Điểm yếu kỹ thuật 2, VD: Lệch trọng tâm chân phải>\"] ,\n" +
                "  \"actionableDrills\": [\"<Bài tập cụ thể 1 khắc phục điểm yếu>\", \"<Bài tập cụ thể 2>\", \"<Bài tập cụ thể 3>\"],\n" +
                "  \"injuryRiskLevel\": \"<LOW hoặc MEDIUM hoặc HIGH>\",\n" +
                "  \"injuryRiskExplanation\": \"<Cảnh báo nguy cơ chấn thương gối/cổ chân/gân gót dễ hiểu>\",\n" +
                "  \"estimatedCalories\": <Số calo tiêu thụ ước tính>,\n" +
                "  \"postureFeedback\": [\"<Góp ý tư thế chuyên sâu 1>\", \"<Góp ý tư thế chuyên sâu 2>\"],\n" +
                "  \"recoveryAdvice\": [\"<Lời khuyên phục hồi cơ bắp 1>\", \"<Lời khuyên phục hồi cơ bắp 2>\"],\n" +
                "  \"aiSummary\": \"<Lời động viên tổng kết từ AI Coach>\"\n" +
                "}",
                session.getSport(),
                session.getDurationMinutes(),
                session.getAverageSpeed(),
                session.getAverageAcceleration(),
                session.getTotalJumps(),
                session.getDirectionChanges(),
                metrics.getPeakLandingImpactG(),
                metrics.getLandingSoftnessScore(),
                metrics.getBilateralSymmetryPct(),
                metrics.getDominantSide(),
                metrics.getCadenceRpm(),
                metrics.getRhythmConsistencyPct(),
                metrics.getTrunkStabilityScore(),
                metrics.getTrunkLeanAngleDegrees(),
                metrics.getExplosivenessScore(),
                metrics.getFatigueIndex()
        );

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentObj = Map.of("parts", List.of(textPart));
        Map<String, Object> generationConfig = Map.of(
                "temperature", 0.35,
                "responseMimeType", "application/json"
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(contentObj),
                "generationConfig", generationConfig
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    String rawJson = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                    return objectMapper.readValue(rawJson, AiInsightDTO.class);
                }
            } catch (Exception parseErr) {
                System.err.println(">>> [AI] Error parsing Gemini JSON response: " + parseErr.getMessage());
            }
        }
        return null;
    }

    /**
     * Bộ máy phân tích Khoa học Thể thao Nội bộ (Local Biomechanics Engine)
     * Đảm bảo luôn hoạt động offline 100% với phân tích sinh trắc học chính xác
     */
    public AiInsightDTO generateBiomechanicalInsights(SportSession session, BiomechanicalMetricsDTO metrics) {
        String sport = session.getSport() != null ? session.getSport() : "Running";
        boolean isRunning = "running".equalsIgnoreCase(sport);
        int duration = session.getDurationMinutes() > 0 ? session.getDurationMinutes() : 30;
        int jumps = session.getTotalJumps();
        int directionChanges = session.getDirectionChanges();
        double avgAccel = session.getAverageAcceleration();
        int intensity = session.getMovementIntensity() > 0 ? session.getMovementIntensity() : 75;

        // 1. Tính toán Calo (MET: Running=9.8, Basketball=8.0)
        double met = isRunning ? 9.8 : 8.2;
        int calories = (int) Math.round(met * 70.0 * (duration / 60.0));

        // 2. Điểm phong độ
        int score = isRunning
                ? (int) Math.min(98, Math.max(68, Math.round((intensity * 0.45) + (metrics.getLandingSoftnessScore() * 0.25) + (metrics.getBilateralSymmetryPct() * 0.3))))
                : (int) Math.min(98, Math.max(65, Math.round((intensity * 0.4) + (metrics.getExplosivenessScore() * 0.3) + (metrics.getLandingSoftnessScore() * 0.3))));

        // 3. Phân tích phong độ hiện tại (Ngôn ngữ đời thường)
        String currentPerformance;
        List<String> areasForImprovement = new ArrayList<>();
        List<String> actionableDrills = new ArrayList<>();
        List<String> postureFeedback = new ArrayList<>();
        List<String> recoveryAdvice = new ArrayList<>();
        String riskLevel = "LOW";
        String riskExplanation;

        if (isRunning) {
            // === CHẠY BỘ (RUNNING) ===
            currentPerformance = String.format(
                    "Bạn đã hoàn thành buổi chạy %d phút với tốc độ trung bình %.1f km/h và nhịp bước %d bước/phút. " +
                    "Độ cân bằng hai chân đạt %d%%, thể hiện sự đồng đều rất tốt giữa chân trái và chân phải. " +
                    "Độ êm tiếp đất đạt %d/100 giúp hạn chế đáng kể chấn động dội ngược lên lưng.",
                    duration, session.getAverageSpeed(), metrics.getCadenceRpm(),
                    metrics.getBilateralSymmetryPct(), metrics.getLandingSoftnessScore()
            );

            if (metrics.getLandingSoftnessScore() < 75 || metrics.getPeakLandingImpactG() > 2.8) {
                areasForImprovement.add("Kỹ thuật tiếp đất còn dồn lực lớn về gót chân (" + metrics.getPeakLandingImpactG() + "G) khi tăng tốc độ.");
                actionableDrills.add("Bài tập Chạy bước nhỏ (A-Skip) trên ức bàn chân: 3 hiệp x 30m để hình thành phản xạ Midfoot strike.");
            }

            if (metrics.getBilateralSymmetryPct() < 88) {
                areasForImprovement.add("Chân " + ("LEFT".equals(metrics.getDominantSide()) ? "trái" : "phải") + " đang chịu tải nhiều hơn chân còn lại, dễ gây lệch trục hông.");
                actionableDrills.add("Bài tập Single-leg Squat (Squat 1 chân): 3 hiệp x 10 lần mỗi bên để cân bằng sức mạnh cơ đùi.");
            }

            if (metrics.getCadenceRpm() < 162) {
                areasForImprovement.add("Nhịp bước (" + metrics.getCadenceRpm() + " spm) hơi chậm, khiến sải chân bị kéo dài quá mức (Overstriding).");
                actionableDrills.add("Bài tập Chạy theo máy đếm nhịp Metronome (170-175 bpm) để tăng tần số nhịp bước ngắn.");
            }

            if (areasForImprovement.isEmpty()) {
                areasForImprovement.add("Duy trì nhịp thở 2:2 nhịp nhàng khi chuyển đổi vận tốc ở các dốc nhỏ.");
                actionableDrills.add("Bài tập Bật nhảy lò cò tiếp đất êm: 2 hiệp x 20 lần giúp tăng độ đàn hồi gân Achilles.");
            }

            // Đánh giá nguy cơ chấn thương chạy bộ
            if (metrics.getPeakLandingImpactG() > 3.0 || metrics.getFatigueIndex() > 35 || duration > 65) {
                riskLevel = "HIGH";
                riskExplanation = "Cảnh báo quá tải vùng cẳng chân và gân Achilles do xung lực dội ngược cao (" + metrics.getPeakLandingImpactG() + "G) khi cơ bắp mệt mỏi ở cuối buổi.";
                recoveryAdvice.add("Chườm lạnh gân gót Achilles và cơ bắp chuối 15 phút.");
                recoveryAdvice.add("Dùng con lăn foam roller thư giãn dải chậu chày (IT Band) và cơ đùi sau.");
                recoveryAdvice.add("Nghỉ ngơi hoặc đạp xe nhẹ nhàng trong 24 giờ tới.");
            } else if (metrics.getFatigueIndex() > 20 || duration > 40) {
                riskLevel = "MEDIUM";
                riskExplanation = "Cường độ chạy ở mức tương đối. Cơ bắp chân có dấu hiệu căng cứng nhẹ ở 10 phút cuối.";
                recoveryAdvice.add("Bổ sung 400-500ml nước bù điện giải ngay sau buổi chạy.");
                recoveryAdvice.add("Thực hiện 10 phút kéo giãn cơ bắp chân và cơ gập hông.");
            } else {
                riskExplanation = "Xung lực tiếp đất và độ cân bằng sải chân hoàn toàn trong ngưỡng lý tưởng, nguy cơ chấn thương rất thấp.";
                recoveryAdvice.add("Đi bộ thả lỏng 5 phút và hít thở sâu để hạ nhịp tim.");
                recoveryAdvice.add("Bổ sung bữa ăn giàu protein nạc và tinh bột tiêu hóa chậm.");
            }

            postureFeedback.add("Độ chúi thân trên: " + metrics.getTrunkLeanAngleDegrees() + "° (Góc khí động học chuẩn 6-10° hỗ trợ trọng tâm rơi tự nhiên).");
            postureFeedback.add("Độ vững vùng hông và lưng đạt " + metrics.getTrunkStabilityScore() + "/100, không bị lắc lư mất thăng bằng.");

        } else {
            // === BÓNG RỔ (BASKETBALL) ===
            currentPerformance = String.format(
                    "Bạn đã chơi một trận bóng rổ nhiệt huyết trong %d phút với %d cú bật nhảy và %d pha đổi hướng bứt tốc. " +
                    "Độ bùng nổ đạt %d/100 với thời gian trên không trung bình %.2fs. " +
                    "Độ vững thân trên đạt %d/100 giúp bạn duy trì thăng bằng rất tốt khi tranh chấp bóng.",
                    duration, jumps, directionChanges, metrics.getExplosivenessScore(),
                    metrics.getAverageAirtimeSeconds(), metrics.getTrunkStabilityScore()
            );

            if (metrics.getLandingSoftnessScore() < 78 || metrics.getPeakLandingImpactG() > 3.2) {
                areasForImprovement.add("Lực tiếp đất sau các pha tranh chấp trên không đạt tới " + metrics.getPeakLandingImpactG() + "G, khớp gối cần chùng sâu hơn để giảm chấn.");
                actionableDrills.add("Bài tập Depth Drop (Rơi từ bục 30cm tiếp đất êm không phát ra tiếng): 3 hiệp x 8 lần.");
            }

            if (metrics.getBilateralSymmetryPct() < 86) {
                areasForImprovement.add("Xu hướng tiếp đất dồn trọng tâm về chân " + ("LEFT".equals(metrics.getDominantSide()) ? "trái" : "phải") + ", tăng nguy cơ lật sơmi cổ chân.");
                actionableDrills.add("Bài tập Đứng thăng bằng 1 chân trên đệm hơi (Bosu Ball): 3 hiệp x 30 giây mỗi chân.");
            }

            if (directionChanges > 60 && metrics.getTrunkStabilityScore() < 80) {
                areasForImprovement.add("Góc thân trên bị nghiêng nhiều khi thực hiện crossover đổi hướng đột ngột.");
                actionableDrills.add("Bài tập Chạy luồn cọc số 8 (Agility Cone Drill): rèn luyện kỹ thuật hạ thấp trọng tâm hông.");
            }

            if (areasForImprovement.isEmpty()) {
                areasForImprovement.add("Tối ưu hóa lực đẩy cổ chân để rút ngắn thời gian chuẩn bị cất cánh.");
                actionableDrills.add("Bài tập Bật nhảy chạm bảng rổ liên hoàn (Rim jumps): 3 hiệp x 10 lần.");
            }

            // Đánh giá nguy cơ chấn thương bóng rổ
            if (jumps > 45 || (metrics.getPeakLandingImpactG() > 3.4 && metrics.getFatigueIndex() > 30)) {
                riskLevel = "HIGH";
                riskExplanation = "Áp lực dồn nén lên gân bánh chè (Patellar tendon) và dây chằng cổ chân ở mức cao do tần suất bật nhảy lớn (" + jumps + " lần).";
                recoveryAdvice.add("Chườm lạnh hai đầu gối 15-20 phút để giảm căng thẳng vi thể quanh gân.");
                recoveryAdvice.add("Kéo giãn cơ tứ đầu đùi (Quadriceps) và cơ mông.");
                recoveryAdvice.add("Hạn chế bật nhảy cường độ cao trong ngày mai.");
            } else if (jumps > 25 || directionChanges > 60) {
                riskLevel = "MEDIUM";
                riskExplanation = "Độ chịu lực khớp cổ chân và gối tốt. Có dấu hiệu mỏi nhẹ do nhiều pha bẻ góc đổi hướng liên tục.";
                recoveryAdvice.add("Xoay thả lỏng khớp cổ chân và ngâm chân nước ấm thư giãn.");
                recoveryAdvice.add("Bổ sung nước và protein trong 30 phút sau trận đấu.");
            } else {
                riskExplanation = "Khả năng giảm chấn và phối hợp vận động an toàn tuyệt đối, khớp gối hấp thụ lực rất êm.";
                recoveryAdvice.add("Thực hiện 5 phút giãn cơ tĩnh toàn thân.");
                recoveryAdvice.add("Nghỉ ngơi và bổ sung dinh dưỡng điều độ.");
            }

            postureFeedback.add("Lực tiếp đất trung bình: " + metrics.getPeakLandingImpactG() + "G (Điểm êm: " + metrics.getLandingSoftnessScore() + "/100).");
            postureFeedback.add("Tỷ lệ phân phối lực hai chân: " + metrics.getBilateralSymmetryPct() + "% đối xứng.");
        }

        String summary = String.format(
                "Buổi tập %s hoàn thành xuất sắc với điểm phong độ %d/100, tiêu hao ước tính ~%d kcal. " +
                "Kỹ thuật vận động vững vàng, bạn chỉ cần lưu ý %s để đạt phong độ đỉnh cao!",
                sport, score, calories,
                areasForImprovement.isEmpty() ? "duy trì nhịp thở đều đặn" : areasForImprovement.get(0).toLowerCase()
        );

        AiInsightDTO dto = new AiInsightDTO(
                sport + " - " + (intensity > 80 ? "Cường độ cao" : "Tiêu chuẩn"),
                score,
                riskLevel,
                riskExplanation,
                calories,
                postureFeedback,
                recoveryAdvice,
                summary
        );

        dto.setCurrentPerformance(currentPerformance);
        dto.setAreasForImprovement(areasForImprovement);
        dto.setActionableDrills(actionableDrills);
        return dto;
    }
}
