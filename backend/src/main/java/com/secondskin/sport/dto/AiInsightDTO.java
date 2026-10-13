package com.secondskin.sport.dto;

import java.util.ArrayList;
import java.util.List;

public class AiInsightDTO {
    private String activityType;          // e.g. "Bóng rổ - Tấn công cường độ cao"
    private int performanceScore;         // 0 - 100
    private String injuryRiskLevel;       // "LOW", "MEDIUM", "HIGH"
    private String injuryRiskExplanation; // Giải thích chi tiết nguy cơ chấn thương
    private int estimatedCalories;        // Calo ước tính
    private List<String> postureFeedback = new ArrayList<>(); // Phân tích tư thế & kỹ thuật tiếp đất/xoay khớp
    private List<String> recoveryAdvice = new ArrayList<>();  // Lời khuyên hồi phục thể lực & cơ bắp
    private String aiSummary;             // Nhận xét tổng quan từ AI Coach

    // CÁC TRƯỜNG MỚI GIÚP NGƯỜI DÙNG DỄ HIỂU PHONG ĐỘ & ĐIỂM CẦN CẢI THIỆN
    private BiomechanicalMetricsDTO biomechanicalMetrics;
    private String currentPerformance;    // "Bạn đang hoạt động ra sao?" (Ngôn ngữ đời thường, gần gũi)
    private List<String> areasForImprovement = new ArrayList<>(); // "Bạn cần cải thiện điều gì?" (Điểm yếu kỹ thuật cụ thể)
    private List<String> actionableDrills = new ArrayList<>();    // "Bài tập gợi ý từ AI Coach" (Các bài tập thực hành)

    public AiInsightDTO() {}

    public AiInsightDTO(String activityType, int performanceScore, String injuryRiskLevel,
                        String injuryRiskExplanation, int estimatedCalories,
                        List<String> postureFeedback, List<String> recoveryAdvice, String aiSummary) {
        this.activityType = activityType;
        this.performanceScore = performanceScore;
        this.injuryRiskLevel = injuryRiskLevel;
        this.injuryRiskExplanation = injuryRiskExplanation;
        this.estimatedCalories = estimatedCalories;
        this.postureFeedback = postureFeedback != null ? postureFeedback : new ArrayList<>();
        this.recoveryAdvice = recoveryAdvice != null ? recoveryAdvice : new ArrayList<>();
        this.aiSummary = aiSummary;
    }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public int getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(int performanceScore) { this.performanceScore = performanceScore; }

    public String getInjuryRiskLevel() { return injuryRiskLevel; }
    public void setInjuryRiskLevel(String injuryRiskLevel) { this.injuryRiskLevel = injuryRiskLevel; }

    public String getInjuryRiskExplanation() { return injuryRiskExplanation; }
    public void setInjuryRiskExplanation(String injuryRiskExplanation) { this.injuryRiskExplanation = injuryRiskExplanation; }

    public int getEstimatedCalories() { return estimatedCalories; }
    public void setEstimatedCalories(int estimatedCalories) { this.estimatedCalories = estimatedCalories; }

    public List<String> getPostureFeedback() { return postureFeedback; }
    public void setPostureFeedback(List<String> postureFeedback) { this.postureFeedback = postureFeedback; }

    public List<String> getRecoveryAdvice() { return recoveryAdvice; }
    public void setRecoveryAdvice(List<String> recoveryAdvice) { this.recoveryAdvice = recoveryAdvice; }

    public String getAiSummary() { return aiSummary; }
    public void setAiSummary(String aiSummary) { this.aiSummary = aiSummary; }

    public BiomechanicalMetricsDTO getBiomechanicalMetrics() { return biomechanicalMetrics; }
    public void setBiomechanicalMetrics(BiomechanicalMetricsDTO biomechanicalMetrics) { this.biomechanicalMetrics = biomechanicalMetrics; }

    public String getCurrentPerformance() { return currentPerformance; }
    public void setCurrentPerformance(String currentPerformance) { this.currentPerformance = currentPerformance; }

    public List<String> getAreasForImprovement() { return areasForImprovement; }
    public void setAreasForImprovement(List<String> areasForImprovement) { this.areasForImprovement = areasForImprovement; }

    public List<String> getActionableDrills() { return actionableDrills; }
    public void setActionableDrills(List<String> actionableDrills) { this.actionableDrills = actionableDrills; }
}
