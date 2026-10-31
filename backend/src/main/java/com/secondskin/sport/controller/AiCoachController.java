package com.secondskin.sport.controller;

import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.service.AiCoachService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiCoachController {

    private final AiCoachService aiCoachService;

    public AiCoachController(AiCoachService aiCoachService) {
        this.aiCoachService = aiCoachService;
    }

    /**
     * Get AI Biomechanical analysis & injury risk assessment for a specific session
     * Retrieval logic cleanly delegated to AiCoachService (F09)
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<AiInsightDTO> analyzeSession(@PathVariable Long sessionId) {
        AiInsightDTO insight = aiCoachService.analyzeSessionById(sessionId);
        if (insight == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(insight);
    }

    /**
     * Quick ad-hoc AI analysis for real-time or custom telemetry
     * Exclusively accepts SportSessionDTO (F08)
     */
    @PostMapping("/quick-analysis")
    public ResponseEntity<AiInsightDTO> quickAnalysis(@RequestBody SportSessionDTO sessionDto) {
        return ResponseEntity.ok(aiCoachService.analyzeSession(sessionDto));
    }
}
