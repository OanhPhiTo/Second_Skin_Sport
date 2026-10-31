package com.secondskin.sport.dto;

public class OverviewStatsDTO {
    private int totalSessions;
    private String totalSessionsChange;

    private String totalActivityTime;
    private String totalActivityTimeChange;

    private double averageAcceleration;
    private String averageAccelerationChange;

    private int totalJumps;
    private String totalJumpsChange;

    private int directionChanges;
    private String directionChangesChange;

    private int performanceScore;
    private String performanceScoreChange;

    public OverviewStatsDTO() {}

    public OverviewStatsDTO(int totalSessions, String totalSessionsChange, 
                            String totalActivityTime, String totalActivityTimeChange, 
                            double averageAcceleration, String averageAccelerationChange, 
                            int totalJumps, String totalJumpsChange, 
                            int directionChanges, String directionChangesChange, 
                            int performanceScore, String performanceScoreChange) {
        this.totalSessions = totalSessions;
        this.totalSessionsChange = totalSessionsChange;
        this.totalActivityTime = totalActivityTime;
        this.totalActivityTimeChange = totalActivityTimeChange;
        this.averageAcceleration = averageAcceleration;
        this.averageAccelerationChange = averageAccelerationChange;
        this.totalJumps = totalJumps;
        this.totalJumpsChange = totalJumpsChange;
        this.directionChanges = directionChanges;
        this.directionChangesChange = directionChangesChange;
        this.performanceScore = performanceScore;
        this.performanceScoreChange = performanceScoreChange;
    }

    public int getTotalSessions() { return totalSessions; }
    public void setTotalSessions(int totalSessions) { this.totalSessions = totalSessions; }

    public String getTotalSessionsChange() { return totalSessionsChange; }
    public void setTotalSessionsChange(String totalSessionsChange) { this.totalSessionsChange = totalSessionsChange; }

    public String getTotalActivityTime() { return totalActivityTime; }
    public void setTotalActivityTime(String totalActivityTime) { this.totalActivityTime = totalActivityTime; }

    // Alias getter and setter for backward compatibility
    public String getTotalTime() { return totalActivityTime; }
    public void setTotalTime(String totalTime) { this.totalActivityTime = totalTime; }

    public String getTotalActivityTimeChange() { return totalActivityTimeChange; }
    public void setTotalActivityTimeChange(String totalActivityTimeChange) { this.totalActivityTimeChange = totalActivityTimeChange; }

    public double getAverageAcceleration() { return averageAcceleration; }
    public void setAverageAcceleration(double averageAcceleration) { this.averageAcceleration = averageAcceleration; }

    public String getAverageAccelerationChange() { return averageAccelerationChange; }
    public void setAverageAccelerationChange(String averageAccelerationChange) { this.averageAccelerationChange = averageAccelerationChange; }

    public int getTotalJumps() { return totalJumps; }
    public void setTotalJumps(int totalJumps) { this.totalJumps = totalJumps; }

    public String getTotalJumpsChange() { return totalJumpsChange; }
    public void setTotalJumpsChange(String totalJumpsChange) { this.totalJumpsChange = totalJumpsChange; }

    public int getDirectionChanges() { return directionChanges; }
    public void setDirectionChanges(int directionChanges) { this.directionChanges = directionChanges; }

    public String getDirectionChangesChange() { return directionChangesChange; }
    public void setDirectionChangesChange(String directionChangesChange) { this.directionChangesChange = directionChangesChange; }

    public int getPerformanceScore() { return performanceScore; }
    public void setPerformanceScore(int performanceScore) { this.performanceScore = performanceScore; }

    public String getPerformanceScoreChange() { return performanceScoreChange; }
    public void setPerformanceScoreChange(String performanceScoreChange) { this.performanceScoreChange = performanceScoreChange; }
}
