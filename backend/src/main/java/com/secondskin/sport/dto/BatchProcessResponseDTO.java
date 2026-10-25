package com.secondskin.sport.dto;

import java.util.ArrayList;
import java.util.List;

public class BatchProcessResponseDTO {
    private String status;
    private int processedCount;
    private String message;
    private int jumpsDetected;
    private int stepsDetected;
    private String activityType;
    private List<JumpEventDTO> jumpEvents = new ArrayList<>();

    public BatchProcessResponseDTO() {}

    public BatchProcessResponseDTO(String status, int processedCount, String message) {
        this.status = status;
        this.processedCount = processedCount;
        this.message = message;
    }

    public BatchProcessResponseDTO(String status, int processedCount, String message,
                                   int jumpsDetected, int stepsDetected, String activityType,
                                   List<JumpEventDTO> jumpEvents) {
        this.status = status;
        this.processedCount = processedCount;
        this.message = message;
        this.jumpsDetected = jumpsDetected;
        this.stepsDetected = stepsDetected;
        this.activityType = activityType;
        this.jumpEvents = jumpEvents != null ? jumpEvents : new ArrayList<>();
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getProcessedCount() { return processedCount; }
    public void setProcessedCount(int processedCount) { this.processedCount = processedCount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public int getJumpsDetected() { return jumpsDetected; }
    public void setJumpsDetected(int jumpsDetected) { this.jumpsDetected = jumpsDetected; }

    public int getStepsDetected() { return stepsDetected; }
    public void setStepsDetected(int stepsDetected) { this.stepsDetected = stepsDetected; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public List<JumpEventDTO> getJumpEvents() { return jumpEvents; }
    public void setJumpEvents(List<JumpEventDTO> jumpEvents) { this.jumpEvents = jumpEvents; }
}
