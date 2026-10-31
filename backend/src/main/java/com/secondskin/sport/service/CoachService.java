package com.secondskin.sport.service;

import com.secondskin.sport.dto.*;
import com.secondskin.sport.entity.AthleteStatus;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.entity.Team;
import com.secondskin.sport.entity.TeamAthlete;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.TeamAthleteRepository;
import com.secondskin.sport.repository.TeamRepository;
import com.secondskin.sport.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoachService {

    private static final Logger log = LoggerFactory.getLogger(CoachService.class);

    private final TeamRepository teamRepository;
    private final TeamAthleteRepository athleteRepository;
    private final TacticalRotationService tacticalRotationService;
    private final SensorDataRepository sensorDataRepository;

    /**
     * Asserts team existence and validates access rights.
     * Throws ResourceNotFoundException (404) if team does not exist.
     * Throws AccessDeniedException (403) if caller is a coach who does not own the team.
     */
    public Team validateTeamOwnership(Long teamId, User user) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with id: " + teamId));

        if (user == null) {
            throw new AccessDeniedException("Yêu cầu xác thực người dùng để truy cập thông tin đội.");
        }
        if (user.getRole() != Role.ADMIN && !team.getCoachId().equals(user.getId())) {
            log.warn("IDOR violation blocked: User ID {} (role {}) attempted unauthorized access to Team ID {} (owned by Coach ID {})",
                    user.getId(), user.getRole(), teamId, team.getCoachId());
            throw new AccessDeniedException("You do not have permission to access or manage team " + teamId);
        }
        return team;
    }

    /**
     * Get teams coached by a coach. Strictly returns only teams owned by this coach.
     */
    public List<TeamDTO> getTeamsByCoach(Long coachId) {
        if (coachId == null) {
            return Collections.emptyList();
        }
        List<Team> teams = teamRepository.findByCoachId(coachId);
        return teams.stream()
                .map(this::toTeamDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get all teams across the platform (ADMIN only).
     */
    public List<TeamDTO> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::toTeamDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get team by ID with ownership verification.
     */
    public Optional<TeamDTO> getTeamById(Long teamId, User user) {
        Team team = validateTeamOwnership(teamId, user);
        return Optional.of(toTeamDTO(team));
    }

    public Optional<TeamDTO> getTeamById(Long teamId) {
        return getTeamById(teamId, SecurityUtils.getCurrentUser().orElse(null));
    }

    /**
     * Create a new team
     */
    @Transactional
    public TeamDTO createTeam(Long coachId, String name, String sport, String description) {
        Team team = new Team(name, sport, coachId, description);
        Team saved = teamRepository.save(team);
        return toTeamDTO(saved);
    }

    /**
     * Get all athletes for a team
     */
    public List<TeamAthleteDTO> getTeamRoster(Long teamId, User user) {
        validateTeamOwnership(teamId, user);
        List<TeamAthlete> athletes = athleteRepository.findByTeamId(teamId);
        return athletes.stream()
                .map(tacticalRotationService::toDTO)
                .collect(Collectors.toList());
    }

    public List<TeamAthleteDTO> getTeamRoster(Long teamId) {
        return getTeamRoster(teamId, SecurityUtils.getCurrentUser().orElse(null));
    }

    /**
     * Add athlete to team roster
     */
    @Transactional
    public TeamAthleteDTO addAthleteToTeam(Long teamId, AddAthleteRequestDTO req, User user) {
        validateTeamOwnership(teamId, user);
        TeamAthlete athlete = new TeamAthlete(
                teamId,
                req.getUserId(),
                req.getName(),
                req.getJerseyNumber(),
                req.getPosition(),
                req.getDeviceId(),
                req.getStatus() != null ? req.getStatus() : AthleteStatus.BENCH
        );
        TeamAthlete saved = athleteRepository.save(athlete);
        // Refresh tactical evaluation for coach
        tacticalRotationService.evaluateSquadTactics(teamId);
        return tacticalRotationService.toDTO(saved);
    }

    @Transactional
    public TeamAthleteDTO addAthleteToTeam(Long teamId, AddAthleteRequestDTO req) {
        return addAthleteToTeam(teamId, req, SecurityUtils.getCurrentUser().orElse(null));
    }

    /**
     * Remove athlete from team
     */
    @Transactional
    public boolean removeAthlete(Long teamId, Long athleteId, User user) {
        validateTeamOwnership(teamId, user);
        Optional<TeamAthlete> athleteOpt = athleteRepository.findById(athleteId);
        if (athleteOpt.isPresent() && athleteOpt.get().getTeamId().equals(teamId)) {
            athleteRepository.delete(athleteOpt.get());
            tacticalRotationService.evaluateSquadTactics(teamId);
            return true;
        }
        return false;
    }

    @Transactional
    public boolean removeAthlete(Long teamId, Long athleteId) {
        return removeAthlete(teamId, athleteId, SecurityUtils.getCurrentUser().orElse(null));
    }

    /**
     * Update athlete status (e.g., ON_FIELD, BENCH, RESTING)
     */
    @Transactional
    public Optional<TeamAthleteDTO> updateAthleteStatus(Long teamId, Long athleteId, AthleteStatus status, User user) {
        validateTeamOwnership(teamId, user);
        Optional<TeamAthlete> opt = athleteRepository.findById(athleteId);
        if (opt.isPresent() && opt.get().getTeamId().equals(teamId)) {
            TeamAthlete athlete = opt.get();
            athlete.setStatus(status);
            athlete.setUpdatedAt(LocalDateTime.now());
            TeamAthlete saved = athleteRepository.save(athlete);
            tacticalRotationService.evaluateSquadTactics(teamId);
            return Optional.of(tacticalRotationService.toDTO(saved));
        }
        return Optional.empty();
    }

    @Transactional
    public Optional<TeamAthleteDTO> updateAthleteStatus(Long teamId, Long athleteId, AthleteStatus status) {
        return updateAthleteStatus(teamId, athleteId, status, SecurityUtils.getCurrentUser().orElse(null));
    }

    /**
     * Execute tactical rotation / player swap:
     * Swaps outAthlete (set to BENCH) with inAthlete (set to ON_FIELD)
     */
    @Transactional
    public SquadTacticalSummaryDTO executeTacticalSwap(Long teamId, Long outAthleteId, Long inAthleteId, User user) {
        validateTeamOwnership(teamId, user);
        Optional<TeamAthlete> outOpt = athleteRepository.findById(outAthleteId);
        Optional<TeamAthlete> inOpt = athleteRepository.findById(inAthleteId);

        if (outOpt.isEmpty() || !outOpt.get().getTeamId().equals(teamId)) {
            throw new ResourceNotFoundException("Out-athlete ID " + outAthleteId + " not found in team " + teamId);
        }
        if (inOpt.isEmpty() || !inOpt.get().getTeamId().equals(teamId)) {
            throw new ResourceNotFoundException("In-athlete ID " + inAthleteId + " not found in team " + teamId);
        }

        TeamAthlete outAthlete = outOpt.get();
        TeamAthlete inAthlete = inOpt.get();

        outAthlete.setStatus(AthleteStatus.BENCH);
        outAthlete.setUpdatedAt(LocalDateTime.now());

        inAthlete.setStatus(AthleteStatus.ON_FIELD);
        inAthlete.setUpdatedAt(LocalDateTime.now());

        athleteRepository.save(outAthlete);
        athleteRepository.save(inAthlete);

        log.info("Tactical Swap executed for Team {}: Out #{} {} -> In #{} {}",
                teamId, outAthlete.getJerseyNumber(), outAthlete.getName(),
                inAthlete.getJerseyNumber(), inAthlete.getName());

        return tacticalRotationService.evaluateSquadTactics(teamId);
    }

    @Transactional
    public SquadTacticalSummaryDTO executeTacticalSwap(Long teamId, Long outAthleteId, Long inAthleteId) {
        return executeTacticalSwap(teamId, outAthleteId, inAthleteId, SecurityUtils.getCurrentUser().orElse(null));
    }

    /**
     * Update telemetry from incoming sensor batch or simulation
     */
    @Transactional
    public void updateAthleteTelemetry(String deviceId, double intensity, int newJumps, int newImpacts, int heartRate) {
        Optional<TeamAthlete> opt = athleteRepository.findByDeviceId(deviceId);
        if (opt.isPresent()) {
            TeamAthlete athlete = opt.get();
            athlete.setCurrentIntensity(intensity);
            athlete.setJumpCount((athlete.getJumpCount() != null ? athlete.getJumpCount() : 0) + newJumps);
            athlete.setHighImpactLandings((athlete.getHighImpactLandings() != null ? athlete.getHighImpactLandings() : 0) + newImpacts);
            athlete.setHeartRate(heartRate > 0 ? heartRate : 85);
            athlete.setLastTelemetryTime(LocalDateTime.now());

            if (athlete.getStatus() == AthleteStatus.ON_FIELD) {
                athlete.setMinutesPlayed((athlete.getMinutesPlayed() != null ? athlete.getMinutesPlayed() : 0) + 1);
            }

            double newFatigue = tacticalRotationService.calculateFatigueIndex(
                    athlete.getCurrentIntensity(),
                    athlete.getMinutesPlayed() != null ? athlete.getMinutesPlayed() : 0,
                    athlete.getJumpCount() != null ? athlete.getJumpCount() : 0,
                    athlete.getHighImpactLandings() != null ? athlete.getHighImpactLandings() : 0
            );
            athlete.setFatigueIndex(newFatigue);
            athlete.setUpdatedAt(LocalDateTime.now());

            athleteRepository.save(athlete);

            // Re-evaluate tactics and broadcast
            tacticalRotationService.evaluateSquadTactics(athlete.getTeamId());
        }
    }

    /**
     * Get Real-time Squad Tactical Analysis
     */
    public SquadTacticalSummaryDTO getSquadTacticalAnalysis(Long teamId, User user) {
        validateTeamOwnership(teamId, user);
        return tacticalRotationService.evaluateSquadTactics(teamId);
    }

    public SquadTacticalSummaryDTO getSquadTacticalAnalysis(Long teamId) {
        return getSquadTacticalAnalysis(teamId, SecurityUtils.getCurrentUser().orElse(null));
    }

    /**
     * Get detailed biometrics and kinematic telemetry for a specific athlete
     * Follows workspace rule: Accelerations in m/s^2, Angular velocity in deg/s.
     */
    public Optional<AthleteDetailTelemetryDTO> getAthleteDetailTelemetry(Long teamId, Long athleteId, User user) {
        validateTeamOwnership(teamId, user);
        Optional<TeamAthlete> opt = athleteRepository.findById(athleteId);
        if (opt.isEmpty() || !opt.get().getTeamId().equals(teamId)) {
            return Optional.empty();
        }
        TeamAthlete athlete = opt.get();
        double fatigue = athlete.getFatigueIndex() != null ? athlete.getFatigueIndex() : 0.0;
        int mins = athlete.getMinutesPlayed() != null ? athlete.getMinutesPlayed() : 0;
        int highImpacts = athlete.getHighImpactLandings() != null ? athlete.getHighImpactLandings() : 0;
        int jumps = athlete.getJumpCount() != null ? athlete.getJumpCount() : 0;
        int hr = athlete.getHeartRate() != null ? athlete.getHeartRate() : 75;

        String riskLevel = tacticalRotationService.determineInjuryRiskLevel(fatigue, mins, highImpacts);

        String recoveryAdvice;
        String tacticalHint;
        if ("CRITICAL".equals(riskLevel)) {
            recoveryAdvice = "Cảnh báo quá tải tải trọng sinh học! Cần rút cầu thủ về ghế dự bị ngay lập tức để giãn cơ và bù nước/điện giải.";
            tacticalHint = "Đề xuất thay ra ngay - Cầu thủ đã chịu " + highImpacts + " lần tiếp đất xung chấn cao và nhịp tim đạt " + hr + " bpm.";
        } else if ("HIGH".equals(riskLevel)) {
            recoveryAdvice = "Chỉ số mệt mỏi ở ngưỡng cao (Fatigue " + fatigue + "%). Nên giới hạn các pha bứt tốc và chuẩn bị phương án xoay tua.";
            tacticalHint = "Khuyến nghị chuẩn bị xoay tua trong 2-3 phút tới để bảo toàn thể lực.";
        } else if ("MODERATE".equals(riskLevel)) {
            recoveryAdvice = "Thể lực đang trong ngưỡng kiểm soát, duy trì nhịp thở và kiểm soát tải trọng tiếp đất.";
            tacticalHint = "Duy trì vị trí trên sân, theo dõi thêm chỉ số biến thiên nhịp tim.";
        } else {
            recoveryAdvice = "Thể trạng tối ưu, sẵn sàng cho các pha bứt tốc và tranh chấp cường độ cao.";
            tacticalHint = "Thể lực sung mãn, có thể đẩy cao áp lực phòng ngự hoặc tấn công.";
        }

        // Fetch telemetry points if available, or generate realistic real-time window for charts
        List<TelemetryDataPointDTO> telemetryPoints = new ArrayList<>();
        if (athlete.getDeviceId() != null && sensorDataRepository != null) {
            List<SensorData> rawData = sensorDataRepository.findTop50ByDeviceIdOrderByTimestampDesc(athlete.getDeviceId());
            if (rawData != null && !rawData.isEmpty()) {
                // Reverse to chronological order for charts
                for (int i = rawData.size() - 1; i >= 0; i--) {
                    SensorData d = rawData.get(i);
                    telemetryPoints.add(TelemetryDataPointDTO.builder()
                            .timestamp(d.getTimestamp())
                            .accX(d.getAccelerometerX())
                            .accY(d.getAccelerometerY())
                            .accZ(d.getAccelerometerZ())
                            .gyroX(d.getGyroscopeX())
                            .gyroY(d.getGyroscopeY())
                            .gyroZ(d.getGyroscopeZ())
                            .heartRate(hr)
                            .intensity((double) d.getMovementIntensity())
                            .build());
                }
            }
        }

        // If no raw points in sensor_data yet (e.g. simulated live match), generate 10 baseline recent points
        if (telemetryPoints.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            double baseIntensity = athlete.getCurrentIntensity() != null ? athlete.getCurrentIntensity() : 50.0;
            for (int i = 10; i >= 0; i--) {
                LocalDateTime t = now.minusSeconds(i * 5L);
                telemetryPoints.add(TelemetryDataPointDTO.builder()
                        .timestamp(t)
                        .accX(Math.round((0.8 + (i % 3) * 0.4) * 100.0) / 100.0)
                        .accY(Math.round((-0.2 + (i % 2) * 0.3) * 100.0) / 100.0)
                        .accZ(Math.round((9.8 + (i % 4) * 0.9) * 100.0) / 100.0)
                        .gyroX(Math.round((12.0 + (i % 5) * 2.0) * 10.0) / 10.0)
                        .gyroY(Math.round((4.0 - (i % 3) * 1.5) * 10.0) / 10.0)
                        .gyroZ(Math.round((-2.0 + (i % 4) * 1.0) * 10.0) / 10.0)
                        .heartRate(hr - (i % 3) * 2)
                        .intensity(Math.min(100.0, Math.max(0.0, baseIntensity + (i % 4) * 3 - 5)))
                        .build());
            }
        }

        AthleteDetailTelemetryDTO dto = AthleteDetailTelemetryDTO.builder()
                .id(athlete.getId())
                .teamId(athlete.getTeamId())
                .userId(athlete.getUserId())
                .name(athlete.getName())
                .jerseyNumber(athlete.getJerseyNumber())
                .position(athlete.getPosition())
                .deviceId(athlete.getDeviceId())
                .status(athlete.getStatus())
                .minutesPlayed(mins)
                .fatigueIndex(fatigue)
                .currentIntensity(athlete.getCurrentIntensity() != null ? athlete.getCurrentIntensity() : 0.0)
                .jumpCount(jumps)
                .highImpactLandings(highImpacts)
                .heartRate(hr)
                .injuryRiskLevel(riskLevel)
                .recoveryAdvice(recoveryAdvice)
                .tacticalActionHint(tacticalHint)
                .lastTelemetryTime(athlete.getLastTelemetryTime() != null ? athlete.getLastTelemetryTime() : LocalDateTime.now())
                .recentTelemetry(telemetryPoints)
                .build();

        return Optional.of(dto);
    }

    public Optional<AthleteDetailTelemetryDTO> getAthleteDetailTelemetry(Long teamId, Long athleteId) {
        return getAthleteDetailTelemetry(teamId, athleteId, SecurityUtils.getCurrentUser().orElse(null));
    }

    private TeamDTO toTeamDTO(Team team) {
        List<TeamAthlete> athletes = athleteRepository.findByTeamId(team.getId());
        int onField = (int) athletes.stream().filter(a -> a.getStatus() == AthleteStatus.ON_FIELD).count();
        int bench = (int) athletes.stream().filter(a -> a.getStatus() == AthleteStatus.BENCH).count();

        return TeamDTO.builder()
                .id(team.getId())
                .name(team.getName())
                .sport(team.getSport())
                .coachId(team.getCoachId())
                .description(team.getDescription())
                .totalAthletes(athletes.size())
                .onFieldCount(onField)
                .benchCount(bench)
                .createdAt(team.getCreatedAt())
                .build();
    }
}
