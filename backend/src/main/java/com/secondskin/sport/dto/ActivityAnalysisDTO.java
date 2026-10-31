package com.secondskin.sport.dto;

public class ActivityAnalysisDTO {
    private int jumps;
    private double averageJumpHeightCm;
    private int directionChanges;
    private int movementIntensity;

    // Biomechanical metrics from patent documentation
    private int landingSoftnessScore;
    private double peakLandingImpactG;
    private int explosivenessScore;
    private double averageAirtimeSeconds;
    private int bilateralSymmetryPct;
    private String dominantSide;
    private int trunkStabilityScore;
    private double trunkLeanAngleDegrees;
    private int fatigueIndex;

    public ActivityAnalysisDTO() {}

    public ActivityAnalysisDTO(
            int jumps,
            double averageJumpHeightCm,
            int directionChanges,
            int movementIntensity,
            int landingSoftnessScore,
            double peakLandingImpactG,
            int explosivenessScore,
            double averageAirtimeSeconds,
            int bilateralSymmetryPct,
            String dominantSide,
            int trunkStabilityScore,
            double trunkLeanAngleDegrees
    ) {
        this(jumps, averageJumpHeightCm, directionChanges, movementIntensity,
             landingSoftnessScore, peakLandingImpactG, explosivenessScore,
             averageAirtimeSeconds, bilateralSymmetryPct, dominantSide,
             trunkStabilityScore, trunkLeanAngleDegrees, 0);
    }

    public ActivityAnalysisDTO(
            int jumps,
            double averageJumpHeightCm,
            int directionChanges,
            int movementIntensity,
            int landingSoftnessScore,
            double peakLandingImpactG,
            int explosivenessScore,
            double averageAirtimeSeconds,
            int bilateralSymmetryPct,
            String dominantSide,
            int trunkStabilityScore,
            double trunkLeanAngleDegrees,
            int fatigueIndex
    ) {
        this.jumps = jumps;
        this.averageJumpHeightCm = averageJumpHeightCm;
        this.directionChanges = directionChanges;
        this.movementIntensity = movementIntensity;
        this.landingSoftnessScore = landingSoftnessScore;
        this.peakLandingImpactG = peakLandingImpactG;
        this.explosivenessScore = explosivenessScore;
        this.averageAirtimeSeconds = averageAirtimeSeconds;
        this.bilateralSymmetryPct = bilateralSymmetryPct;
        this.dominantSide = dominantSide;
        this.trunkStabilityScore = trunkStabilityScore;
        this.trunkLeanAngleDegrees = trunkLeanAngleDegrees;
        this.fatigueIndex = fatigueIndex;
    }

    public int getJumps() { return jumps; }
    public void setJumps(int jumps) { this.jumps = jumps; }

    public double getAverageJumpHeightCm() { return averageJumpHeightCm; }
    public void setAverageJumpHeightCm(double averageJumpHeightCm) { this.averageJumpHeightCm = averageJumpHeightCm; }

    // Alias getter and setter for backward compatibility
    public double getJumpHeight() { return averageJumpHeightCm; }
    public void setJumpHeight(double jumpHeight) { this.averageJumpHeightCm = jumpHeight; }

    public int getTotalJumps() { return jumps; }
    public void setTotalJumps(int totalJumps) { this.jumps = totalJumps; }

    public int getDirectionChanges() { return directionChanges; }
    public void setDirectionChanges(int directionChanges) { this.directionChanges = directionChanges; }

    public int getMovementIntensity() { return movementIntensity; }
    public void setMovementIntensity(int movementIntensity) { this.movementIntensity = movementIntensity; }

    public int getLandingSoftnessScore() { return landingSoftnessScore; }
    public void setLandingSoftnessScore(int landingSoftnessScore) { this.landingSoftnessScore = landingSoftnessScore; }

    public double getPeakLandingImpactG() { return peakLandingImpactG; }
    public void setPeakLandingImpactG(double peakLandingImpactG) { this.peakLandingImpactG = peakLandingImpactG; }

    public double getPeakImpactG() { return peakLandingImpactG; }
    public void setPeakImpactG(double peakImpactG) { this.peakLandingImpactG = peakImpactG; }

    public int getExplosivenessScore() { return explosivenessScore; }
    public void setExplosivenessScore(int explosivenessScore) { this.explosivenessScore = explosivenessScore; }

    public double getAverageAirtimeSeconds() { return averageAirtimeSeconds; }
    public void setAverageAirtimeSeconds(double averageAirtimeSeconds) { this.averageAirtimeSeconds = averageAirtimeSeconds; }

    public int getBilateralSymmetryPct() { return bilateralSymmetryPct; }
    public void setBilateralSymmetryPct(int bilateralSymmetryPct) { this.bilateralSymmetryPct = bilateralSymmetryPct; }

    public int getBilateralSymmetryPercentage() { return bilateralSymmetryPct; }
    public void setBilateralSymmetryPercentage(int bilateralSymmetryPercentage) { this.bilateralSymmetryPct = bilateralSymmetryPercentage; }

    public String getDominantSide() { return dominantSide; }
    public void setDominantSide(String dominantSide) { this.dominantSide = dominantSide; }

    public int getTrunkStabilityScore() { return trunkStabilityScore; }
    public void setTrunkStabilityScore(int trunkStabilityScore) { this.trunkStabilityScore = trunkStabilityScore; }

    public double getTrunkLeanAngleDegrees() { return trunkLeanAngleDegrees; }
    public void setTrunkLeanAngleDegrees(double trunkLeanAngleDegrees) { this.trunkLeanAngleDegrees = trunkLeanAngleDegrees; }

    public int getFatigueIndex() { return fatigueIndex; }
    public void setFatigueIndex(int fatigueIndex) { this.fatigueIndex = fatigueIndex; }
}
