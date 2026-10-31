package com.secondskin.sport.controller;

import com.secondskin.sport.dto.ActivityAnalysisDTO;
import com.secondskin.sport.dto.OverviewStatsDTO;
import com.secondskin.sport.dto.PerformanceStatisticDTO;
import com.secondskin.sport.service.StatisticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {
    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/overview")
    public ResponseEntity<OverviewStatsDTO> getOverviewStats() {
        return ResponseEntity.ok(statisticsService.getOverviewStats());
    }

    @GetMapping("/activity-analysis")
    public ResponseEntity<ActivityAnalysisDTO> getActivityAnalysis() {
        return ResponseEntity.ok(statisticsService.getActivityAnalysis());
    }

    @GetMapping
    public ResponseEntity<List<PerformanceStatisticDTO>> getStatistics(
            @RequestParam(required = false) String sport,
            @RequestParam(required = false) String timeRange) {
        return ResponseEntity.ok(statisticsService.getStatisticsDTO(sport, timeRange));
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<PerformanceStatisticDTO> getStatisticBySessionId(@PathVariable Long sessionId) {
        return statisticsService.getStatisticDTOBySessionId(sessionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
