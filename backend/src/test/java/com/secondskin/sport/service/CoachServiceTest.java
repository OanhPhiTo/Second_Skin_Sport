package com.secondskin.sport.service;

import com.secondskin.sport.dto.*;
import com.secondskin.sport.entity.AthleteStatus;
import com.secondskin.sport.entity.Team;
import com.secondskin.sport.entity.TeamAthlete;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.TeamAthleteRepository;
import com.secondskin.sport.repository.TeamRepository;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CoachServiceTest {

    @Mock
    private TeamRepository teamRepository;

    @Mock
    private TeamAthleteRepository athleteRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private SensorDataRepository sensorDataRepository;

    private TacticalRotationService tacticalRotationService;
    private CoachService coachService;

    @BeforeEach
    void setUp() {
        tacticalRotationService = new TacticalRotationService(teamRepository, athleteRepository, messagingTemplate);
        coachService = new CoachService(teamRepository, athleteRepository, tacticalRotationService, sensorDataRepository);

        User authCoach = new User("Coach", "coach@secondskin.io", "pass", Role.COACH, "Basketball");
        authCoach.setId(1L);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(authCoach, null, authCoach.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Calculate Fatigue Index strictly follows physical factors")
    void testCalculateFatigueIndex() {
        // intensity: 88, mins: 35, jumps: 35, highImpacts: 14
        double fatigue = tacticalRotationService.calculateFatigueIndex(88.0, 35, 35, 14);
        assertTrue(fatigue > 0 && fatigue <= 100.0, "Fatigue index must be between 0 and 100");
        assertTrue(fatigue >= 70.0, "High activity profile should yield high fatigue index");

        // Edge case: zeroes
        double zeroFatigue = tacticalRotationService.calculateFatigueIndex(0.0, 0, 0, 0);
        assertEquals(0.0, zeroFatigue, 0.01);

        // Edge case: overflow values capped at 100.0
        double overflowFatigue = tacticalRotationService.calculateFatigueIndex(200.0, 120, 500, 100);
        assertEquals(100.0, overflowFatigue, 0.01);
    }

    @Test
    @DisplayName("Determine Injury Risk Level correlates to fatigue and impact stress")
    void testDetermineInjuryRiskLevel() {
        assertEquals("CRITICAL", tacticalRotationService.determineInjuryRiskLevel(82.5, 30, 5));
        assertEquals("CRITICAL", tacticalRotationService.determineInjuryRiskLevel(60.0, 36, 14));
        assertEquals("HIGH", tacticalRotationService.determineInjuryRiskLevel(72.0, 20, 4));
        assertEquals("MODERATE", tacticalRotationService.determineInjuryRiskLevel(50.0, 15, 2));
        assertEquals("LOW", tacticalRotationService.determineInjuryRiskLevel(25.0, 10, 0));
    }

    @Test
    @DisplayName("Evaluate Squad Tactics generates smart rotation alerts")
    void testEvaluateSquadTactics() {
        Team mockTeam = new Team("Hanoi Dragons", "Basketball", 1L, "Desc");
        mockTeam.setId(1L);

        TeamAthlete exhaustedStarter = new TeamAthlete(1L, 10L, "Alex Johnson", 7, "PG", "SSS-PATCH-001", AthleteStatus.ON_FIELD);
        exhaustedStarter.setId(100L);
        exhaustedStarter.setFatigueIndex(82.5);
        exhaustedStarter.setMinutesPlayed(32);
        exhaustedStarter.setHighImpactLandings(14);

        TeamAthlete freshReserve = new TeamAthlete(1L, 11L, "Chris Paul", 11, "PG", "SSS-PATCH-004", AthleteStatus.BENCH);
        freshReserve.setId(101L);
        freshReserve.setFatigueIndex(10.0);
        freshReserve.setMinutesPlayed(0);

        when(teamRepository.findById(1L)).thenReturn(Optional.of(mockTeam));
        when(athleteRepository.findByTeamId(1L)).thenReturn(Arrays.asList(exhaustedStarter, freshReserve));

        SquadTacticalSummaryDTO summary = tacticalRotationService.evaluateSquadTactics(1L);

        assertNotNull(summary);
        assertEquals(1, summary.getActiveOnField().size());
        assertEquals(1, summary.getBenchSubstitutes().size());
        assertEquals(1, summary.getHighFatigueCount());
        assertFalse(summary.getActiveTacticalAlerts().isEmpty());

        TacticalRotationDTO alert = summary.getActiveTacticalAlerts().get(0);
        assertEquals(100L, alert.getOutAthleteId());
        assertEquals(101L, alert.getInAthleteId());
        assertEquals("CRITICAL", alert.getUrgency());
    }

    @Test
    @DisplayName("Execute Tactical Swap modifies starter and bench statuses")
    void testExecuteTacticalSwap() {
        Team mockTeam = new Team("Hanoi Dragons", "Basketball", 1L, "Desc");
        mockTeam.setId(1L);

        TeamAthlete starter = new TeamAthlete(1L, 10L, "Alex Johnson", 7, "PG", "SSS-PATCH-001", AthleteStatus.ON_FIELD);
        starter.setId(100L);

        TeamAthlete bench = new TeamAthlete(1L, 11L, "Chris Paul", 11, "PG", "SSS-PATCH-004", AthleteStatus.BENCH);
        bench.setId(101L);

        when(athleteRepository.findById(100L)).thenReturn(Optional.of(starter));
        when(athleteRepository.findById(101L)).thenReturn(Optional.of(bench));
        when(teamRepository.findById(1L)).thenReturn(Optional.of(mockTeam));
        when(athleteRepository.findByTeamId(1L)).thenReturn(Arrays.asList(starter, bench));

        coachService.executeTacticalSwap(1L, 100L, 101L);

        assertEquals(AthleteStatus.BENCH, starter.getStatus());
        assertEquals(AthleteStatus.ON_FIELD, bench.getStatus());
        verify(athleteRepository).save(starter);
        verify(athleteRepository).save(bench);
    }

    @Test
    @DisplayName("Get Athlete Detail Telemetry returns biometrics and kinematics")
    void testGetAthleteDetailTelemetry() {
        TeamAthlete athlete = new TeamAthlete(1L, 10L, "Alex Johnson", 7, "PG", "SSS-PATCH-001", AthleteStatus.ON_FIELD);
        athlete.setId(100L);
        athlete.setFatigueIndex(82.5);
        athlete.setMinutesPlayed(32);
        athlete.setHighImpactLandings(14);
        athlete.setJumpCount(42);
        athlete.setHeartRate(168);

        Team mockTeam = new Team("Hanoi Dragons", "Basketball", 1L, "Desc");
        mockTeam.setId(1L);

        when(athleteRepository.findById(100L)).thenReturn(Optional.of(athlete));
        when(sensorDataRepository.findTop50ByDeviceIdOrderByTimestampDesc("SSS-PATCH-001")).thenReturn(Collections.emptyList());
        when(teamRepository.findById(1L)).thenReturn(Optional.of(mockTeam));

        Optional<AthleteDetailTelemetryDTO> result = coachService.getAthleteDetailTelemetry(1L, 100L);

        assertTrue(result.isPresent());
        AthleteDetailTelemetryDTO dto = result.get();
        assertEquals("Alex Johnson", dto.getName());
        assertEquals(7, dto.getJerseyNumber());
        assertEquals(168, dto.getHeartRate());
        assertEquals("CRITICAL", dto.getInjuryRiskLevel());
        assertFalse(dto.getRecentTelemetry().isEmpty());
    }

    @Test
    @DisplayName("validateTeamOwnership allows team owner to access team")
    void testValidateTeamOwnership_OwnerSucceeds() {
        Team team = new Team("Hanoi Dragons", "Basketball", 10L, "Desc");
        team.setId(1L);
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

        com.secondskin.sport.entity.User ownerCoach = new com.secondskin.sport.entity.User(
                "Owner", "owner@secondskin.io", "pass", com.secondskin.sport.entity.Role.COACH, "Basketball");
        ownerCoach.setId(10L);

        Team result = coachService.validateTeamOwnership(1L, ownerCoach);
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    @DisplayName("validateTeamOwnership allows ADMIN to access any team")
    void testValidateTeamOwnership_AdminSucceeds() {
        Team team = new Team("Hanoi Dragons", "Basketball", 10L, "Desc");
        team.setId(1L);
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

        com.secondskin.sport.entity.User adminUser = new com.secondskin.sport.entity.User(
                "Admin", "admin@secondskin.io", "pass", com.secondskin.sport.entity.Role.ADMIN, "Basketball");
        adminUser.setId(99L);

        Team result = coachService.validateTeamOwnership(1L, adminUser);
        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    @DisplayName("validateTeamOwnership throws AccessDeniedException when Coach does not own team")
    void testValidateTeamOwnership_NonOwnerThrowsAccessDenied() {
        Team team = new Team("Hanoi Dragons", "Basketball", 10L, "Desc");
        team.setId(1L);
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

        com.secondskin.sport.entity.User attackerCoach = new com.secondskin.sport.entity.User(
                "Attacker", "attacker@secondskin.io", "pass", com.secondskin.sport.entity.Role.COACH, "Basketball");
        attackerCoach.setId(20L); // Different coach ID

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> coachService.validateTeamOwnership(1L, attackerCoach));
    }

    @Test
    @DisplayName("validateTeamOwnership throws AccessDeniedException when user is null")
    void testValidateTeamOwnership_NullUserThrowsAccessDenied() {
        Team team = new Team("Hanoi Dragons", "Basketball", 10L, "Desc");
        team.setId(1L);
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

        assertThrows(org.springframework.security.access.AccessDeniedException.class,
                () -> coachService.validateTeamOwnership(1L, null));
    }

    @Test
    @DisplayName("validateTeamOwnership throws ResourceNotFoundException when team does not exist")
    void testValidateTeamOwnership_NonExistentTeamThrows404() {
        when(teamRepository.findById(999L)).thenReturn(Optional.empty());

        com.secondskin.sport.entity.User coach = new com.secondskin.sport.entity.User(
                "Coach", "coach@secondskin.io", "pass", com.secondskin.sport.entity.Role.COACH, "Basketball");
        coach.setId(10L);

        assertThrows(com.secondskin.sport.exception.ResourceNotFoundException.class,
                () -> coachService.validateTeamOwnership(999L, coach));
    }

    @Test
    @DisplayName("getTeamsByCoach returns empty list when coach has no teams, without fallback to findAll")
    void testGetTeamsByCoach_EmptyReturnsEmptyListWithoutLeakingAllTeams() {
        when(teamRepository.findByCoachId(50L)).thenReturn(Collections.emptyList());

        List<TeamDTO> result = coachService.getTeamsByCoach(50L);

        assertNotNull(result);
        assertTrue(result.isEmpty());
        verify(teamRepository, never()).findAll(); // Verifies elimination of insecure fallback!
    }

    @Test
    @DisplayName("executeTacticalSwap throws ResourceNotFoundException if athletes do not belong to team")
    void testExecuteTacticalSwap_ForeignAthleteThrowsException() {
        Team team = new Team("Hanoi Dragons", "Basketball", 10L, "Desc");
        team.setId(1L);
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));

        com.secondskin.sport.entity.User ownerCoach = new com.secondskin.sport.entity.User(
                "Owner", "owner@secondskin.io", "pass", com.secondskin.sport.entity.Role.COACH, "Basketball");
        ownerCoach.setId(10L);

        // Athlete belongs to Team 2, not Team 1
        TeamAthlete foreignAthlete = new TeamAthlete(2L, 100L, "Outsider", 99, "PG", "DEV-99", AthleteStatus.ON_FIELD);
        foreignAthlete.setId(500L);

        when(athleteRepository.findById(500L)).thenReturn(Optional.of(foreignAthlete));

        assertThrows(com.secondskin.sport.exception.ResourceNotFoundException.class, () ->
                coachService.executeTacticalSwap(1L, 500L, 101L, ownerCoach));
    }
}
