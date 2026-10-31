package com.secondskin.sport.dto;

import com.secondskin.sport.entity.PerformanceStatistic;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

public class PerformanceStatisticDTOTest {

    @Test
    @DisplayName("PerformanceStatisticDTO fromEntity and toEntity map accurately")
    void testEntityMapping() {
        LocalDate date = LocalDate.now();
        PerformanceStatistic entity = new PerformanceStatistic(
                10L, 1L, date, "Running",
                15.2, 2.7, 7.5,
                0, 12, 75, 88
        );
        entity.setId(5L);

        PerformanceStatisticDTO dto = PerformanceStatisticDTO.fromEntity(entity);
        assertNotNull(dto);
        assertEquals(5L, dto.getId());
        assertEquals(10L, dto.getSessionId());
        assertEquals(1L, dto.getUserId());
        assertEquals("Running", dto.getSport());
        assertEquals(15.2, dto.getAverageSpeed());
        assertEquals(2.7, dto.getAverageAcceleration());
        assertEquals(7.5, dto.getTotalDistance());
        assertEquals(0, dto.getTotalJumps());
        assertEquals(12, dto.getDirectionChanges());
        assertEquals(75, dto.getMovementIntensity());
        assertEquals(88, dto.getPerformanceScore());

        PerformanceStatistic mapped = dto.toEntity();
        assertNotNull(mapped);
        assertEquals(5L, mapped.getId());
        assertEquals(10L, mapped.getSessionId());
        assertEquals(15.2, mapped.getAverageSpeed());
        assertEquals(7.5, mapped.getTotalDistance());
    }

    @Test
    @DisplayName("PerformanceStatisticDTO fromEntity with Biomechanical enrichment")
    void testBiomechanicalEnrichment() {
        PerformanceStatistic entity = new PerformanceStatistic(
                20L, 2L, LocalDate.now(), "Basketball",
                12.0, 3.2, 5.0,
                38, 85, 85, 90
        );

        BiomechanicalMetricsDTO bio = new BiomechanicalMetricsDTO(
                85, 2.4, 92, "BALANCED", 140, 88, 82, 9.5, 85, 0.42, 18
        );

        PerformanceStatisticDTO dto = PerformanceStatisticDTO.fromEntity(entity, bio);
        assertNotNull(dto);
        assertEquals(85, dto.getLandingSoftnessScore());
        assertEquals(2.4, dto.getPeakLandingImpactG());
        assertEquals(92, dto.getBilateralSymmetryPct());
        assertEquals("BALANCED", dto.getDominantSide());
        assertEquals(82, dto.getTrunkStabilityScore());
        assertEquals(9.5, dto.getTrunkLeanAngleDegrees());
        assertEquals(85, dto.getExplosivenessScore());
        assertEquals(18, dto.getFatigueIndex());
    }
}
