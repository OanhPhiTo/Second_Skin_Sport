package com.secondskin.sport.dto;

public class BatchProcessResponseDTO {
    private String status;
    private int processedCount;
    private String message;

    public BatchProcessResponseDTO() {}

    public BatchProcessResponseDTO(String status, int processedCount, String message) {
        this.status = status;
        this.processedCount = processedCount;
        this.message = message;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getProcessedCount() { return processedCount; }
    public void setProcessedCount(int processedCount) { this.processedCount = processedCount; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
