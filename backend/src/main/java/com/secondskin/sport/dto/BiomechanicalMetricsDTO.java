package com.secondskin.sport.dto;

public class BiomechanicalMetricsDTO {
    // 1. Landing Softness / Impact Force (0-100: Càng cao tiếp đất càng êm)
    private int landingSoftnessScore;
    private double peakLandingImpactG; // Gia tốc cực đại khi tiếp đất (G)

    // 2. Bilateral Symmetry (0-100%: Độ cân bằng chịu lực giữa chân trái & chân phải)
    private int bilateralSymmetryPct;
    private String dominantSide; // "LEFT", "RIGHT", "BALANCED"

    // 3. Cadence & Rhythm (Nhịp bước / Nhịp động tác)
    private int cadenceRpm; // Steps/min hoặc reps/min
    private int rhythmConsistencyPct; // Độ ổn định của nhịp (0-100%)

    // 4. Trunk & Core Stability (Độ vững thân trên 0-100%)
    private int trunkStabilityScore;
    private double trunkLeanAngleDegrees; // Góc chúi người / nghiêng hông (độ)

    // 5. Explosiveness & Power (Độ bùng nổ 0-100%)
    private int explosivenessScore;
    private double averageAirtimeSeconds; // Thời gian bay trên không trung bình (s)

    // 6. Fatigue Index (Mức độ suy giảm thể lực: 0-100%, càng thấp càng bền bỉ)
    private int fatigueIndex;

    public BiomechanicalMetricsDTO() {}

    public BiomechanicalMetricsDTO(int landingSoftnessScore, double peakLandingImpactG,
                                   int bilateralSymmetryPct, String dominantSide,
                                   int cadenceRpm, int rhythmConsistencyPct,
                                   int trunkStabilityScore, double trunkLeanAngleDegrees,
                                   int explosivenessScore, double averageAirtimeSeconds,
                                   int fatigueIndex) {
        this.landingSoftnessScore = landingSoftnessScore;
        this.peakLandingImpactG = peakLandingImpactG;
        this.bilateralSymmetryPct = bilateralSymmetryPct;
        this.dominantSide = dominantSide;
        this.cadenceRpm = cadenceRpm;
        this.rhythmConsistencyPct = rhythmConsistencyPct;
        this.trunkStabilityScore = trunkStabilityScore;
        this.trunkLeanAngleDegrees = trunkLeanAngleDegrees;
        this.explosivenessScore = explosivenessScore;
        this.averageAirtimeSeconds = averageAirtimeSeconds;
        this.fatigueIndex = fatigueIndex;
    }

    public int getLandingSoftnessScore() { return landingSoftnessScore; }
    public void setLandingSoftnessScore(int landingSoftnessScore) { this.landingSoftnessScore = landingSoftnessScore; }

    public double getPeakLandingImpactG() { return peakLandingImpactG; }
    public void setPeakLandingImpactG(double peakLandingImpactG) { this.peakLandingImpactG = peakLandingImpactG; }

    public int getBilateralSymmetryPct() { return bilateralSymmetryPct; }
    public void setBilateralSymmetryPct(int bilateralSymmetryPct) { this.bilateralSymmetryPct = bilateralSymmetryPct; }

    public String getDominantSide() { return dominantSide; }
    public void setDominantSide(String dominantSide) { this.dominantSide = dominantSide; }

    public int getCadenceRpm() { return cadenceRpm; }
    public void setCadenceRpm(int cadenceRpm) { this.cadenceRpm = cadenceRpm; }

    public int getRhythmConsistencyPct() { return rhythmConsistencyPct; }
    public void setRhythmConsistencyPct(int rhythmConsistencyPct) { this.rhythmConsistencyPct = rhythmConsistencyPct; }

    public int getTrunkStabilityScore() { return trunkStabilityScore; }
    public void setTrunkStabilityScore(int trunkStabilityScore) { this.trunkStabilityScore = trunkStabilityScore; }

    public double getTrunkLeanAngleDegrees() { return trunkLeanAngleDegrees; }
    public void setTrunkLeanAngleDegrees(double trunkLeanAngleDegrees) { this.trunkLeanAngleDegrees = trunkLeanAngleDegrees; }

    public int getExplosivenessScore() { return explosivenessScore; }
    public void setExplosivenessScore(int explosivenessScore) { this.explosivenessScore = explosivenessScore; }

    public double getAverageAirtimeSeconds() { return averageAirtimeSeconds; }
    public void setAverageAirtimeSeconds(double averageAirtimeSeconds) { this.averageAirtimeSeconds = averageAirtimeSeconds; }

    public int getFatigueIndex() { return fatigueIndex; }
    public void setFatigueIndex(int fatigueIndex) { this.fatigueIndex = fatigueIndex; }
}
