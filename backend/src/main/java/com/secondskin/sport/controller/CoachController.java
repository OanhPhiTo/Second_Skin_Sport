package com.secondskin.sport.controller;

import com.secondskin.sport.dto.*;
import com.secondskin.sport.entity.AthleteStatus;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.security.SecurityUtils;
import com.secondskin.sport.service.CoachService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachController {

    private final CoachService coachService;

    /**
     * Get all squads managed by the authenticated Coach (or all squads across system if ADMIN).
     */
    @GetMapping("/teams")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<List<TeamDTO>> getMyTeams() {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        if (user != null && user.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(coachService.getAllTeams());
        }
        if (user != null) {
            return ResponseEntity.ok(coachService.getTeamsByCoach(user.getId()));
        }
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            throw new AccessDeniedException("Yêu cầu xác thực người dùng để truy cập danh sách đội.");
        }
        return ResponseEntity.ok(coachService.getTeamsByCoach(null));
    }

    /**
     * Get team details by team ID with ownership verification.
     */
    @GetMapping("/teams/{teamId}")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<TeamDTO> getTeamById(@PathVariable Long teamId) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        return coachService.getTeamById(teamId, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create a new squad / team.
     */
    @PostMapping("/teams")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<TeamDTO> createTeam(@RequestBody TeamDTO req) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        Long coachId;
        if (user != null && user.getRole() == Role.ADMIN && req.getCoachId() != null) {
            coachId = req.getCoachId();
        } else if (user != null) {
            coachId = user.getId();
        } else {
            coachId = 1L;
        }
        TeamDTO created = coachService.createTeam(coachId, req.getName(), req.getSport(), req.getDescription());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get athlete roster for a team (Standard REST path + Tactical path alias).
     */
    @GetMapping({"/teams/{teamId}/roster", "/tactical/roster/{teamId}"})
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<List<TeamAthleteDTO>> getTeamRoster(@PathVariable Long teamId) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        return ResponseEntity.ok(coachService.getTeamRoster(teamId, user));
    }

    /**
     * Canonical tactical roster endpoint with query param: GET /api/coach/tactical/roster?teamId=...
     */
    @GetMapping("/tactical/roster")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<List<TeamAthleteDTO>> getTacticalRoster(@RequestParam Long teamId) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        return ResponseEntity.ok(coachService.getTeamRoster(teamId, user));
    }

    /**
     * Add an athlete to a squad with ownership verification.
     */
    @PostMapping("/teams/{teamId}/athletes")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<TeamAthleteDTO> addAthlete(@PathVariable Long teamId, @RequestBody AddAthleteRequestDTO req) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        TeamAthleteDTO added = coachService.addAthleteToTeam(teamId, req, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(added);
    }

    /**
     * Remove an athlete from a squad with ownership verification.
     */
    @DeleteMapping("/teams/{teamId}/athletes/{athleteId}")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<Void> removeAthlete(@PathVariable Long teamId, @PathVariable Long athleteId) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        boolean removed = coachService.removeAthlete(teamId, athleteId, user);
        if (removed) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Update athlete status with ownership verification.
     */
    @PutMapping("/teams/{teamId}/athletes/{athleteId}/status")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<TeamAthleteDTO> updateAthleteStatus(
            @PathVariable Long teamId,
            @PathVariable Long athleteId,
            @RequestParam AthleteStatus status) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        return coachService.updateAthleteStatus(teamId, athleteId, status, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get detailed biometrics and kinematic telemetry (Standard REST path + Tactical path alias).
     */
    @GetMapping({"/teams/{teamId}/athletes/{athleteId}/metrics", "/tactical/telemetry/{teamId}/{athleteId}"})
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<AthleteDetailTelemetryDTO> getAthleteDetailTelemetry(
            @PathVariable Long teamId,
            @PathVariable Long athleteId) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        return coachService.getAthleteDetailTelemetry(teamId, athleteId, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Canonical tactical telemetry endpoint with query parameters: GET /api/coach/tactical/telemetry?teamId=...&athleteId=...
     */
    @GetMapping("/tactical/telemetry")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<AthleteDetailTelemetryDTO> getTacticalTelemetry(
            @RequestParam Long teamId,
            @RequestParam Long athleteId) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        return coachService.getAthleteDetailTelemetry(teamId, athleteId, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Get Real-time Squad Tactical Analysis & Rotation Recommendations.
     */
    @GetMapping("/teams/{teamId}/tactical-analysis")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<SquadTacticalSummaryDTO> getSquadTacticalAnalysis(@PathVariable Long teamId) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        return ResponseEntity.ok(coachService.getSquadTacticalAnalysis(teamId, user));
    }

    /**
     * Execute Tactical Rotation (Standard REST path + Tactical path alias).
     */
    @PostMapping({"/teams/{teamId}/tactical-action", "/tactical/swap/{teamId}"})
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<SquadTacticalSummaryDTO> executeTacticalAction(
            @PathVariable Long teamId,
            @RequestBody TacticalSwapRequestDTO swapReq) {
        User user = SecurityUtils.getCurrentUser().orElse(null);
        SquadTacticalSummaryDTO result = coachService.executeTacticalSwap(
                teamId,
                swapReq.getOutAthleteId(),
                swapReq.getInAthleteId(),
                user
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Canonical tactical swap endpoint: POST /api/coach/tactical/swap
     */
    @PostMapping("/tactical/swap")
    @PreAuthorize("hasAnyRole('COACH', 'ADMIN')")
    public ResponseEntity<SquadTacticalSummaryDTO> executeTacticalSwap(
            @RequestParam(required = false) Long teamId,
            @RequestBody TacticalSwapRequestDTO swapReq) {
        Long targetTeamId = teamId != null ? teamId : swapReq.getTeamId();
        if (targetTeamId == null) {
            throw new IllegalArgumentException("teamId is required for tactical swap");
        }
        User user = SecurityUtils.getCurrentUser().orElse(null);
        SquadTacticalSummaryDTO result = coachService.executeTacticalSwap(
                targetTeamId,
                swapReq.getOutAthleteId(),
                swapReq.getInAthleteId(),
                user
        );
        return ResponseEntity.ok(result);
    }

    // =========================================================================
    // EXCEPTION HANDLERS
    // =========================================================================

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                "error", "Forbidden",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of(
                "error", "Not Found",
                "message", ex.getMessage()
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Bad Request",
                "message", ex.getMessage()
        ));
    }
}
