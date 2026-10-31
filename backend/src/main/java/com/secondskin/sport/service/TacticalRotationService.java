package com.secondskin.sport.service;

import com.secondskin.sport.dto.SquadTacticalSummaryDTO;
import com.secondskin.sport.dto.TacticalRotationDTO;
import com.secondskin.sport.dto.TeamAthleteDTO;
import com.secondskin.sport.entity.AthleteStatus;
import com.secondskin.sport.entity.Team;
import com.secondskin.sport.entity.TeamAthlete;
import com.secondskin.sport.repository.TeamAthleteRepository;
import com.secondskin.sport.repository.TeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TacticalRotationService {

    private static final Logger log = LoggerFactory.getLogger(TacticalRotationService.class);

    private final TeamRepository teamRepository;
    private final TeamAthleteRepository athleteRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public TacticalRotationService(TeamRepository teamRepository,
                                  TeamAthleteRepository athleteRepository,
                                  @Autowired(required = false) SimpMessagingTemplate messagingTemplate) {
        this.teamRepository = teamRepository;
        this.athleteRepository = athleteRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Calculate Fatigue Index (0.0 - 100.0) from biomechanical and kinematic factors
     * Follows workspace rule: Accelerations in m/s^2, Angular velocity in deg/s.
     */
    public double calculateFatigueIndex(double currentIntensity, int minutesPlayed, int jumpCount, int highImpactLandings) {
        double intensityFactor = Math.min(100.0, Math.max(0.0, currentIntensity)) * 0.35;
        double minutesFactor = Math.min(100.0, (minutesPlayed / 40.0) * 100.0) * 0.30;
        double impactFactor = Math.min(100.0, (highImpactLandings * 5.0)) * 0.20;
        double jumpFactor = Math.min(100.0, (jumpCount * 1.5)) * 0.15;

        double total = intensityFactor + minutesFactor + impactFactor + jumpFactor;
        return Math.round(Math.min(100.0, Math.max(0.0, total)) * 10.0) / 10.0;
    }

    /**
     * Determine Injury Risk Level based on fatigue and impact stress
     */
    public String determineInjuryRiskLevel(double fatigueIndex, int minutesPlayed, int highImpactLandings) {
        if (fatigueIndex >= 80.0 || (minutesPlayed >= 35 && highImpactLandings >= 12)) {
            return "CRITICAL";
        } else if (fatigueIndex >= 70.0 || highImpactLandings >= 8) {
            return "HIGH";
        } else if (fatigueIndex >= 45.0) {
            return "MODERATE";
        } else {
            return "LOW";
        }
    }

    /**
     * Evaluate squad tactical state and generate real-time rotation recommendations
     */
    public SquadTacticalSummaryDTO evaluateSquadTactics(Long teamId) {
        Team team = teamRepository.findById(teamId)
                .orElse(null);

        String teamName = team != null ? team.getName() : "Đội tuyển Second Skin";
        String sport = team != null ? team.getSport() : "Basketball";

        List<TeamAthlete> allAthletes = athleteRepository.findByTeamId(teamId);

        List<TeamAthlete> onFieldEntities = allAthletes.stream()
                .filter(a -> a.getStatus() == AthleteStatus.ON_FIELD)
                .collect(Collectors.toList());

        List<TeamAthlete> benchEntities = allAthletes.stream()
                .filter(a -> a.getStatus() == AthleteStatus.BENCH)
                .collect(Collectors.toList());

        List<TeamAthleteDTO> onFieldDTOs = onFieldEntities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        List<TeamAthleteDTO> benchDTOs = benchEntities.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        // Calculate Squad Averages
        double avgFatigue = 0.0;
        int highFatigueCount = 0;
        if (!onFieldEntities.isEmpty()) {
            double sum = 0;
            for (TeamAthlete a : onFieldEntities) {
                sum += (a.getFatigueIndex() != null ? a.getFatigueIndex() : 0.0);
                if (a.getFatigueIndex() != null && a.getFatigueIndex() >= 70.0) {
                    highFatigueCount++;
                }
            }
            avgFatigue = Math.round((sum / onFieldEntities.size()) * 10.0) / 10.0;
        }

        // Generate Tactical Rotation Recommendations
        List<TacticalRotationDTO> alerts = new ArrayList<>();
        Set<Long> alreadySuggestedBenchIds = new HashSet<>();

        // Sort on-field players by fatigue descending to prioritize highest risk
        List<TeamAthlete> sortedFatigued = new ArrayList<>(onFieldEntities);
        sortedFatigued.sort((a, b) -> Double.compare(
                b.getFatigueIndex() != null ? b.getFatigueIndex() : 0.0,
                a.getFatigueIndex() != null ? a.getFatigueIndex() : 0.0
        ));

        for (TeamAthlete fatigued : sortedFatigued) {
            double fatigue = fatigued.getFatigueIndex() != null ? fatigued.getFatigueIndex() : 0.0;
            String risk = determineInjuryRiskLevel(fatigue, fatigued.getMinutesPlayed(), fatigued.getHighImpactLandings());

            if (fatigue >= 70.0 || "HIGH".equals(risk) || "CRITICAL".equals(risk)) {
                // Find best matching bench candidate
                TeamAthlete bestBench = findBestBenchCandidate(fatigued, benchEntities, alreadySuggestedBenchIds);

                if (bestBench != null) {
                    alreadySuggestedBenchIds.add(bestBench.getId());

                    String urgency = fatigue >= 80.0 || "CRITICAL".equals(risk) ? "CRITICAL" : "HIGH";
                    String reason = String.format(
                            "VĐV #%d %s (%s) thi đấu %d phút, %d cú nhảy, tải trọng tiếp đất cao. Chỉ số mỏi chạm %s%% (%s).",
                            fatigued.getJerseyNumber(), fatigued.getName(), fatigued.getPosition(),
                            fatigued.getMinutesPlayed(), fatigued.getJumpCount(), fatigue, urgency
                    );

                    String tactic = String.format(
                            "Khuyến nghị thay #%d %s (Mỏi: %.1f%%) vào sân đảm nhận vị trí %s, duy trì cự ly phòng ngự và phòng tránh căng cơ/quá tải gân kheo.",
                            bestBench.getJerseyNumber(), bestBench.getName(),
                            bestBench.getFatigueIndex() != null ? bestBench.getFatigueIndex() : 5.0,
                            fatigued.getPosition()
                    );

                    alerts.add(TacticalRotationDTO.builder()
                            .outAthleteId(fatigued.getId())
                            .outAthleteName(fatigued.getName())
                            .outJerseyNumber(fatigued.getJerseyNumber())
                            .outPosition(fatigued.getPosition())
                            .outFatigueIndex(fatigue)
                            .inAthleteId(bestBench.getId())
                            .inAthleteName(bestBench.getName())
                            .inJerseyNumber(bestBench.getJerseyNumber())
                            .inPosition(bestBench.getPosition())
                            .inFatigueIndex(bestBench.getFatigueIndex() != null ? bestBench.getFatigueIndex() : 5.0)
                            .reason(reason)
                            .urgency(urgency)
                            .recommendedTactic(tactic)
                            .build()
                    );
                }
            }
        }

        // Squad pace tactical recommendation
        String paceAdvice;
        if (avgFatigue >= 75.0) {
            paceAdvice = "⚠️ Báo động thể lực toàn đội: Chỉ số mỏi vượt ngưỡng an toàn (75%+). Huấn luyện viên nên gọi hội ý (Time-out) và hạ nhịp độ trận đấu, chuyển sang phòng ngự khu vực 2-3.";
        } else if (avgFatigue >= 60.0) {
            paceAdvice = "⚡ Cường độ vận động trung bình cao: Khuyến khích luân chuyển bóng nhanh, giảm tải các pha bứt tốc 1-1 đơn lẻ để duy trì sức bền hiệp cuối.";
        } else {
            paceAdvice = "✅ Thể lực đội hình sung mãn: Duy trì chiến thuật pressing toàn sân và phản công chuyển đổi trạng thái tốc độ cao.";
        }

        List<TeamAthleteDTO> rosterDTOs = new ArrayList<>(onFieldDTOs);
        rosterDTOs.addAll(benchDTOs);
        SquadTacticalSummaryDTO summary = SquadTacticalSummaryDTO.builder()
                .teamId(teamId)
                .teamName(teamName)
                .sport(sport)
                .activeOnField(onFieldDTOs)
                .benchSubstitutes(benchDTOs)
                .roster(rosterDTOs)
                .averageFatigue(avgFatigue)
                .highFatigueCount(highFatigueCount)
                .activeTacticalAlerts(alerts)
                .recommendedPaceAdjustment(paceAdvice)
                .lastEvaluated(LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy")))
                .build();

        // Broadcast to coach live WebSocket topic
        broadcastSquadTactics(summary);

        return summary;
    }

    /**
     * Find optimal bench substitute with matching/compatible position and lowest fatigue
     */
    private TeamAthlete findBestBenchCandidate(TeamAthlete starter, List<TeamAthlete> bench, Set<Long> excludeIds) {
        return bench.stream()
                .filter(b -> !excludeIds.contains(b.getId()))
                .sorted((b1, b2) -> {
                    // Match position first if possible
                    boolean b1Pos = Objects.equals(b1.getPosition(), starter.getPosition());
                    boolean b2Pos = Objects.equals(b2.getPosition(), starter.getPosition());
                    if (b1Pos && !b2Pos) return -1;
                    if (!b1Pos && b2Pos) return 1;

                    // Otherwise pick lowest fatigue
                    double f1 = b1.getFatigueIndex() != null ? b1.getFatigueIndex() : 0.0;
                    double f2 = b2.getFatigueIndex() != null ? b2.getFatigueIndex() : 0.0;
                    return Double.compare(f1, f2);
                })
                .findFirst()
                .orElse(null);
    }

    /**
     * Broadcast squad tactical update via WebSocket
     */
    public void broadcastSquadTactics(SquadTacticalSummaryDTO summary) {
        if (messagingTemplate != null && summary != null) {
            try {
                messagingTemplate.convertAndSend("/topic/coach/teams/" + summary.getTeamId() + "/tactical", summary);
                messagingTemplate.convertAndSend("/topic/coach/tactical-stream", summary);
            } catch (Exception e) {
                log.warn("WebSocket publish coach tactical telemetry failed: {}", e.getMessage());
            }
        }
    }

    public TeamAthleteDTO toDTO(TeamAthlete entity) {
        double fatigue = entity.getFatigueIndex() != null ? entity.getFatigueIndex() : 0.0;
        int mins = entity.getMinutesPlayed() != null ? entity.getMinutesPlayed() : 0;
        int landings = entity.getHighImpactLandings() != null ? entity.getHighImpactLandings() : 0;
        String risk = determineInjuryRiskLevel(fatigue, mins, landings);

        return TeamAthleteDTO.builder()
                .id(entity.getId())
                .teamId(entity.getTeamId())
                .userId(entity.getUserId())
                .name(entity.getName())
                .jerseyNumber(entity.getJerseyNumber())
                .position(entity.getPosition())
                .deviceId(entity.getDeviceId())
                .status(entity.getStatus())
                .minutesPlayed(mins)
                .fatigueIndex(fatigue)
                .currentIntensity(entity.getCurrentIntensity() != null ? entity.getCurrentIntensity() : 0.0)
                .jumpCount(entity.getJumpCount() != null ? entity.getJumpCount() : 0)
                .highImpactLandings(landings)
                .heartRate(entity.getHeartRate() != null ? entity.getHeartRate() : 75)
                .injuryRiskLevel(risk)
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
