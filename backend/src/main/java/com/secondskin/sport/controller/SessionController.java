package com.secondskin.sport.controller;

import com.secondskin.sport.dto.AutoSessionDTO;
import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.service.SensorDataService;
import com.secondskin.sport.service.SessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    private final SessionService sessionService;
    private final SensorDataService sensorDataService;

    public SessionController(SessionService sessionService, SensorDataService sensorDataService) {
        this.sessionService = sessionService;
        this.sensorDataService = sensorDataService;
    }

    @GetMapping
    public ResponseEntity<List<SportSessionDTO>> getAllSessions(
            @RequestParam(required = false) String sport) {
        return ResponseEntity.ok(sessionService.getAllSessions(sport));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SportSessionDTO> getSessionById(@PathVariable Long id) {
        return sessionService.getSessionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SportSessionDTO> createSession(@RequestBody SportSessionDTO session) {
        return ResponseEntity.ok(sessionService.createSession(session));
    }

    @PostMapping("/auto")
    public ResponseEntity<SportSessionDTO> createAutoSession(@RequestBody AutoSessionDTO autoSessionDTO) {
        return ResponseEntity.ok(sessionService.createAutoSession(autoSessionDTO));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SportSessionDTO> updateSession(@PathVariable Long id, @RequestBody SportSessionDTO session) {
        return ResponseEntity.ok(sessionService.updateSession(id, session));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSession(@PathVariable Long id) {
        sessionService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/sensor-data")
    public ResponseEntity<List<SensorDataDTO>> getSessionSensorData(@PathVariable Long id) {
        return ResponseEntity.ok(sessionService.getSessionSensorData(id));
    }
}
