package com.secondskin.sport.dto;

import java.util.List;

public class AiInsightDTO {
    private String activityType;          // e.g. "Bóng rổ - Tấn công cường độ cao"
    private int performanceScore;         // 0 - 100
    private String injuryRiskLevel;       // "LOW", "MEDIUM", "HIGH"
    private String injuryRiskExplanation; // Giải thích chi tiết nguy cơ chấn thương
    private int estimatedCalories;        // Calo ước tính
    private List<String> postureFeedback; // Phân tích tư thế & kỹ thuật tiếp đất/xoay khớp
    private List<String> recoveryAdvice;  // Lời khuyên hồi phục thể lực & cơ bắp
    private String aiSummary;             // Nhận xét tổng quan từ AI Coach

    public AiInsightDTO() {}

    public AiInsightDTO(String activityType, int performanceScore, String injuryRiskLevel,
                        String injuryRiskExplanation, int estimatedCalories,
                        List<String> postureFeedback, List<String> recoveryAdvice, String aiSummary) {
        this.activityType = activityType;
        this.performanceScore = performanceScore;
        this.injuryRiskLevel = injuryRiskLevel;
        this.injuryRiskExplanation = injuryRiskExplanation;
        this.estimatedCalories = estimatedCalories;
        this.postureFeedback = postureFeedback;
        this.recoveryAdvice = recoveryAdvice;
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
}
