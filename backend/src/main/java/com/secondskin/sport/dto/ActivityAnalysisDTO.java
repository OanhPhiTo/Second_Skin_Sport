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
    }

    public int getJumps() { return jumps; }
    public void setJumps(int jumps) { this.jumps = jumps; }

    public double getAverageJumpHeightCm() { return averageJumpHeightCm; }
    public void setAverageJumpHeightCm(double averageJumpHeightCm) { this.averageJumpHeightCm = averageJumpHeightCm; }

    public int getDirectionChanges() { return directionChanges; }
    public void setDirectionChanges(int directionChanges) { this.directionChanges = directionChanges; }

    public int getMovementIntensity() { return movementIntensity; }
    public void setMovementIntensity(int movementIntensity) { this.movementIntensity = movementIntensity; }

    public int getLandingSoftnessScore() { return landingSoftnessScore; }
    public void setLandingSoftnessScore(int landingSoftnessScore) { this.landingSoftnessScore = landingSoftnessScore; }

    public double getPeakLandingImpactG() { return peakLandingImpactG; }
    public void setPeakLandingImpactG(double peakLandingImpactG) { this.peakLandingImpactG = peakLandingImpactG; }

    public int getExplosivenessScore() { return explosivenessScore; }
    public void setExplosivenessScore(int explosivenessScore) { this.explosivenessScore = explosivenessScore; }

    public double getAverageAirtimeSeconds() { return averageAirtimeSeconds; }
    public void setAverageAirtimeSeconds(double averageAirtimeSeconds) { this.averageAirtimeSeconds = averageAirtimeSeconds; }

    public int getBilateralSymmetryPct() { return bilateralSymmetryPct; }
    public void setBilateralSymmetryPct(int bilateralSymmetryPct) { this.bilateralSymmetryPct = bilateralSymmetryPct; }

    public String getDominantSide() { return dominantSide; }
    public void setDominantSide(String dominantSide) { this.dominantSide = dominantSide; }

    public int getTrunkStabilityScore() { return trunkStabilityScore; }
    public void setTrunkStabilityScore(int trunkStabilityScore) { this.trunkStabilityScore = trunkStabilityScore; }

    public double getTrunkLeanAngleDegrees() { return trunkLeanAngleDegrees; }
    public void setTrunkLeanAngleDegrees(double trunkLeanAngleDegrees) { this.trunkLeanAngleDegrees = trunkLeanAngleDegrees; }
}
