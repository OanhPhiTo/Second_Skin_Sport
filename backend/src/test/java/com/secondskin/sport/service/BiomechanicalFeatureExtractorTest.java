package com.secondskin.sport.service;

import com.secondskin.sport.dto.BiomechanicalMetricsDTO;
import com.secondskin.sport.entity.SensorData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class BiomechanicalFeatureExtractorTest {

    private BiomechanicalFeatureExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new BiomechanicalFeatureExtractor();
    }

    @Test
    void testExtractFeatures_WithEmptyList_ReturnsSensibleDefaults() {
        BiomechanicalMetricsDTO metrics = extractor.extractFeatures(Collections.emptyList(), "Running");
        assertNotNull(metrics);
        assertTrue(metrics.getLandingSoftnessScore() > 50);
        assertTrue(metrics.getBilateralSymmetryPct() >= 80);
        assertEquals("BALANCED", metrics.getDominantSide());
    }

    @Test
    void testExtractFeatures_WithNormalRunningData_CalculatesCorrectMetrics() {
        List<SensorData> rawData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (int i = 0; i < 40; i++) {
            // Simulated rhythmic running stride
            double ax = 0.5 * Math.sin(i * 0.5);
            double ay = 0.3 * Math.cos(i * 0.5);
            double az = 9.81 + 4.5 * Math.sin(i * 0.8);
            double roll = 2.0 * Math.sin(i * 0.5);
            SensorData data = new SensorData(
                    1L, "DEV-01", now.plusSeconds(i),
                    ax, ay, az, 10.0, 5.0, 2.0, 7.5, roll, 0.0, 75
            );
            rawData.add(data);
        }

        BiomechanicalMetricsDTO metrics = extractor.extractFeatures(rawData, "Running");
        assertNotNull(metrics);
        assertTrue(metrics.getCadenceRpm() >= 150 && metrics.getCadenceRpm() <= 185);
        assertTrue(metrics.getBilateralSymmetryPct() >= 75);
        assertTrue(metrics.getLandingSoftnessScore() > 60);
        assertTrue(metrics.getPeakLandingImpactG() > 1.0);
    }

    @Test
    void testExtractFeatures_WithHardLandingShock_ReducesSoftnessScore() {
        List<SensorData> rawData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Data with severe landing impacts (> 35 m/s² ~ 3.6G)
        for (int i = 0; i < 20; i++) {
            double az = (i % 5 == 0) ? 38.0 : 9.81;
            SensorData data = new SensorData(
                    1L, "DEV-01", now.plusSeconds(i),
                    1.2, 0.5, az, 15.0, 8.0, 5.0, 10.0, 2.0, 0.0, 90
            );
            rawData.add(data);
        }

        BiomechanicalMetricsDTO metrics = extractor.extractFeatures(rawData, "Basketball");
        assertNotNull(metrics);
        assertTrue(metrics.getPeakLandingImpactG() >= 3.0);
        // Landing softness score should reflect higher impact (lower score)
        assertTrue(metrics.getLandingSoftnessScore() < 75);
    }

    @Test
    void testExtractFeatures_WithAsymmetricalTilt_DetectsDominantSide() {
        List<SensorData> rawData = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // Heavy left bias: negative ay and negative roll
        for (int i = 0; i < 30; i++) {
            SensorData data = new SensorData(
                    1L, "DEV-01", now.plusSeconds(i),
                    0.2, -2.5, 12.0, 5.0, 2.0, 1.0, 5.0, -8.0, 0.0, 70
            );
            rawData.add(data);
        }

        BiomechanicalMetricsDTO metrics = extractor.extractFeatures(rawData, "Running");
        assertNotNull(metrics);
        assertEquals("LEFT", metrics.getDominantSide());
    }
}
