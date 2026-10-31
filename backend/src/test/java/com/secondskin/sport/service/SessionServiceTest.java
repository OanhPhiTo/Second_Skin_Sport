package com.secondskin.sport.service;

import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.repository.SportSessionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

public class SessionServiceTest {

    private SportSessionRepository sessionRepository;
    private AutoSessionService autoSessionService;
    private SensorDataService sensorDataService;
    private SessionService sessionService;

    private User testUser;

    @BeforeEach
    void setUp() {
        sessionRepository = Mockito.mock(SportSessionRepository.class);
        autoSessionService = Mockito.mock(AutoSessionService.class);
        sensorDataService = Mockito.mock(SensorDataService.class);
        sessionService = new SessionService(sessionRepository, autoSessionService, sensorDataService);

        testUser = new User("Athlete", "athlete@secondskin.io", "pass", Role.USER, "Basketball");
        testUser.setId(1L);

        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(testUser, null, testUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("createSession with null DTO or null entity returns null safely without NPE")
    void testCreateSession_NullSafety() {
        assertNull(sessionService.createSession((SportSessionDTO) null));
        assertNull(sessionService.createSession((SportSession) null));
    }

    @Test
    @DisplayName("createSession neutralizes spoofed userId for non-admin callers")
    void testCreateSession_NeutralizesSpoofedUserId() {
        SportSession session = new SportSession();
        session.setUserId(999L); // Spoofed foreign userId
        session.setSport("Basketball");

        ArgumentCaptor<SportSession> captor = ArgumentCaptor.forClass(SportSession.class);
        Mockito.when(sessionRepository.save(captor.capture())).thenAnswer(i -> i.getArgument(0));
        Mockito.when(autoSessionService.mapToDTO(any(), any())).thenReturn(new SportSessionDTO());

        sessionService.createSession(session);

        SportSession saved = captor.getValue();
        assertNotNull(saved);
        // Assert that spoofed 999L was neutralized and bound to authenticated user 1L
        assertEquals(1L, saved.getUserId());
    }

    @Test
    @DisplayName("getSessionById throws AccessDeniedException when caller is not owner and not staff")
    void testGetSessionById_UnauthorizedUser_ThrowsAccessDenied() {
        // Session belongs to User 2
        SportSession session = new SportSession(2L, "DEV-02", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 0, 10, 2.5, 12.0, 70, 80, "Completed");
        session.setId(20L);

        Mockito.when(sessionRepository.findById(20L)).thenReturn(Optional.of(session));

        // Caller is User 1 (role USER)
        assertThrows(AccessDeniedException.class, () -> sessionService.getSessionById(20L));
    }

    @Test
    @DisplayName("getSessionById succeeds for owner, coach, and admin")
    void testGetSessionById_OwnerOrCoachOrAdmin_Succeeds() {
        SportSession session = new SportSession(1L, "DEV-01", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 0, 10, 2.5, 12.0, 70, 80, "Completed");
        session.setId(10L);

        Mockito.when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        SportSessionDTO dto = new SportSessionDTO();
        dto.setId(10L);
        Mockito.when(autoSessionService.mapToDTO(eq(session), any())).thenReturn(dto);

        // 1. Owner succeeds
        Optional<SportSessionDTO> result = sessionService.getSessionById(10L);
        assertTrue(result.isPresent());

        // 2. Coach succeeds
        User coach = new User("Coach", "coach@secondskin.io", "pass", Role.COACH, "Basketball");
        coach.setId(5L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(coach, null, coach.getAuthorities()));
        assertTrue(sessionService.getSessionById(10L).isPresent());

        // 3. Admin succeeds
        User admin = new User("Admin", "admin@secondskin.io", "pass", Role.ADMIN, "Basketball");
        admin.setId(9L);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(admin, null, admin.getAuthorities()));
        assertTrue(sessionService.getSessionById(10L).isPresent());
    }

    @Test
    @DisplayName("updateSession throws AccessDeniedException when caller does not own session")
    void testUpdateSession_UnauthorizedUser_ThrowsAccessDenied() {
        // Session belongs to User 2
        SportSession existing = new SportSession(2L, "DEV-02", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 15, 8, 2.5, 12.0, 75, 80, "Completed");
        existing.setId(20L);

        Mockito.when(sessionRepository.findById(20L)).thenReturn(Optional.of(existing));

        // Caller is User 1
        assertThrows(AccessDeniedException.class, () -> sessionService.updateSession(20L, new SportSessionDTO()));
    }

    @Test
    @DisplayName("deleteSession throws AccessDeniedException when caller is not owner and not admin")
    void testDeleteSession_UnauthorizedUser_ThrowsAccessDenied() {
        // Session belongs to User 2
        SportSession existing = new SportSession(2L, "DEV-02", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 15, 8, 2.5, 12.0, 75, 80, "Completed");
        existing.setId(20L);

        Mockito.when(sessionRepository.findById(20L)).thenReturn(Optional.of(existing));

        // Caller is User 1
        assertThrows(AccessDeniedException.class, () -> sessionService.deleteSession(20L));
    }

    @Test
    @DisplayName("deleteSession succeeds for owner")
    void testDeleteSession_Owner_Succeeds() {
        SportSession existing = new SportSession(1L, "DEV-01", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 15, 8, 2.5, 12.0, 75, 80, "Completed");
        existing.setId(10L);

        Mockito.when(sessionRepository.findById(10L)).thenReturn(Optional.of(existing));

        sessionService.deleteSession(10L);
        Mockito.verify(sessionRepository).delete(existing);
    }

    @Test
    @DisplayName("getSessionSensorData throws AccessDeniedException when caller does not own session")
    void testGetSessionSensorData_UnauthorizedUser_ThrowsAccessDenied() {
        // Session belongs to User 2
        SportSession existing = new SportSession(2L, "DEV-02", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 15, 8, 2.5, 12.0, 75, 80, "Completed");
        existing.setId(20L);

        Mockito.when(sessionRepository.findById(20L)).thenReturn(Optional.of(existing));

        assertThrows(AccessDeniedException.class, () -> sessionService.getSessionSensorData(20L));
    }

    @Test
    @DisplayName("getSessionSensorData succeeds for owner")
    void testGetSessionSensorData_Owner_Succeeds() {
        SportSession existing = new SportSession(1L, "DEV-01", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 15, 8, 2.5, 12.0, 75, 80, "Completed");
        existing.setId(10L);

        SensorDataDTO point = SensorDataDTO.builder().sessionId(10L).ax(1.0).build();
        Mockito.when(sessionRepository.findById(10L)).thenReturn(Optional.of(existing));
        Mockito.when(sensorDataService.getSensorDataBySessionId(10L)).thenReturn(List.of(point));

        List<SensorDataDTO> result = sessionService.getSessionSensorData(10L);
        assertNotNull(result);
        assertEquals(1, result.size());
    }

    @Test
    @DisplayName("updateSession with null DTO safely returns existing session without NPE")
    void testUpdateSession_NullDto_ReturnsExistingWithoutNPE() {
        SportSession existing = new SportSession(1L, "DEV-01", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 15, 8, 2.5, 12.0, 75, 80, "Completed");
        existing.setId(10L);

        SportSessionDTO expectedDto = new SportSessionDTO();
        expectedDto.setId(10L);
        expectedDto.setSport("Running");

        Mockito.when(sessionRepository.findById(10L)).thenReturn(Optional.of(existing));
        Mockito.when(sessionRepository.save(any(SportSession.class))).thenAnswer(i -> i.getArgument(0));
        Mockito.when(autoSessionService.mapToDTO(any(SportSession.class), eq(null))).thenReturn(expectedDto);

        SportSessionDTO result = sessionService.updateSession(10L, (SportSessionDTO) null);
        assertNotNull(result);
        assertEquals(10L, result.getId());
    }

    @Test
    @DisplayName("updateSession preserves existing telemetry metrics when partial update has default zeros")
    void testUpdateSession_PreservesMetricsOnPartialUpdate() {
        SportSession existing = new SportSession(1L, "DEV-01", "Running", LocalDateTime.now(), LocalDateTime.now(),
                30, 25, 14, 3.2, 14.5, 85, 90, "Completed");
        existing.setId(20L);

        Mockito.when(sessionRepository.findById(20L)).thenReturn(Optional.of(existing));
        Mockito.when(sessionRepository.save(any(SportSession.class))).thenAnswer(i -> i.getArgument(0));
        Mockito.when(autoSessionService.mapToDTO(any(SportSession.class), eq(null))).thenAnswer(i -> {
            SportSession s = i.getArgument(0);
            SportSessionDTO d = new SportSessionDTO();
            d.setId(s.getId());
            d.setSport(s.getSport());
            d.setTotalJumps(s.getTotalJumps());
            d.setDirectionChanges(s.getDirectionChanges());
            d.setAverageAcceleration(s.getAverageAcceleration());
            d.setAverageSpeed(s.getAverageSpeed());
            d.setMovementIntensity(s.getMovementIntensity());
            d.setPerformanceScore(s.getPerformanceScore());
            return d;
        });

        // Partial update with only sport changed and metrics left at default 0 / 0.0
        SportSessionDTO partialUpdate = new SportSessionDTO();
        partialUpdate.setSport("Trail Running");
        partialUpdate.setTotalJumps(0);
        partialUpdate.setDirectionChanges(0);
        partialUpdate.setAverageAcceleration(0.0);
        partialUpdate.setAverageSpeed(0.0);
        partialUpdate.setMovementIntensity(0);
        partialUpdate.setPerformanceScore(0);

        SportSessionDTO updated = sessionService.updateSession(20L, partialUpdate);

        assertEquals("Trail Running", updated.getSport());
        // Verify historical metrics are NOT wiped out to 0
        assertEquals(25, updated.getTotalJumps());
        assertEquals(14, updated.getDirectionChanges());
        assertEquals(3.2, updated.getAverageAcceleration());
        assertEquals(14.5, updated.getAverageSpeed());
        assertEquals(85, updated.getMovementIntensity());
        assertEquals(90, updated.getPerformanceScore());
    }

    @Test
    @DisplayName("updateSession on non-existent session throws ResourceNotFoundException")
    void testUpdateSession_NotFound_ThrowsResourceNotFoundException() {
        Mockito.when(sessionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sessionService.updateSession(999L, new SportSessionDTO()));
    }

    @Test
    @DisplayName("deleteSession on non-existent session throws ResourceNotFoundException")
    void testDeleteSession_NotFound_ThrowsResourceNotFoundException() {
        Mockito.when(sessionRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sessionService.deleteSession(999L));
    }

    @Test
    @DisplayName("toEntity and toDTO handle null safely")
    void testNullConversions() {
        assertNull(sessionService.toEntity(null));
        assertNull(sessionService.toDTO(null));
    }
}
