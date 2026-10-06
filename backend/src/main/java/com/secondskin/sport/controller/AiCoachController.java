package com.secondskin.sport.controller;

import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.repository.SportSessionRepository;
import com.secondskin.sport.service.AiCoachService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AiCoachController {

    private final AiCoachService aiCoachService;
    private final SportSessionRepository sessionRepository;

    public AiCoachController(AiCoachService aiCoachService, SportSessionRepository sessionRepository) {
        this.aiCoachService = aiCoachService;
        this.sessionRepository = sessionRepository;
    }

    /**
     * Get AI Biomechanical analysis & injury risk assessment for a specific session
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<AiInsightDTO> analyzeSession(@PathVariable Long sessionId) {
        return sessionRepository.findById(sessionId)
                .map(session -> ResponseEntity.ok(aiCoachService.analyzeSession(session)))
                .orElseGet(() -> {
                    // Fallback session if not found in database
                    SportSession mockSession = new SportSession(
                            1L, "SSS-PATCH-001", "Basketball",
                            java.time.LocalDateTime.now().minusMinutes(45),
                            java.time.LocalDateTime.now(),
                            45, 42, 115, 3.1, 16.5, 84, 88, "Completed"
                    );
                    return ResponseEntity.ok(aiCoachService.analyzeSession(mockSession));
                });
    }

    /**
     * Quick ad-hoc AI analysis for real-time or custom telemetry
     */
    @PostMapping("/quick-analysis")
    public ResponseEntity<AiInsightDTO> quickAnalysis(@RequestBody SportSession session) {
        return ResponseEntity.ok(aiCoachService.analyzeSession(session));
    }
}
