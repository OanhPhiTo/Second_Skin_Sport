package com.secondskin.sport.service;

import com.secondskin.sport.dto.AutoSessionDTO;
import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.entity.User;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.repository.SportSessionRepository;
import com.secondskin.sport.security.SecurityUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SessionService {
    private final SportSessionRepository sessionRepository;
    private final AutoSessionService autoSessionService;
    private final SensorDataService sensorDataService;
    private final NotificationService notificationService;

    @Autowired
    public SessionService(SportSessionRepository sessionRepository, 
                          AutoSessionService autoSessionService,
                          @Autowired(required = false) SensorDataService sensorDataService,
                          @Autowired(required = false) NotificationService notificationService) {
        this.sessionRepository = sessionRepository;
        this.autoSessionService = autoSessionService;
        this.sensorDataService = sensorDataService;
        this.notificationService = notificationService;
    }

    public SessionService(SportSessionRepository sessionRepository, 
                          AutoSessionService autoSessionService,
                          SensorDataService sensorDataService) {
        this(sessionRepository, autoSessionService, sensorDataService, null);
    }

    public SessionService(SportSessionRepository sessionRepository, AutoSessionService autoSessionService) {
        this(sessionRepository, autoSessionService, null, null);
    }

    public List<SportSessionDTO> getAllSessions(String sport) {
        Optional<User> currentUser = SecurityUtils.getCurrentUser();
        boolean isAdmin = SecurityUtils.isAdmin();
        boolean isStaff = SecurityUtils.isStaff();

        List<SportSession> list;
        if (isStaff || (currentUser.isEmpty() && isAdmin)) {
            if (sport != null && !sport.trim().isEmpty() && !sport.equalsIgnoreCase("all")) {
                list = sessionRepository.findBySportIgnoreCaseOrderByStartTimeDesc(sport);
            } else {
                list = sessionRepository.findAllByOrderByStartTimeDesc();
            }
        } else if (currentUser.isPresent()) {
            Long userId = currentUser.get().getId();
            if (sport != null && !sport.trim().isEmpty() && !sport.equalsIgnoreCase("all")) {
                list = sessionRepository.findByUserIdAndSportIgnoreCaseOrderByStartTimeDesc(userId, sport);
            } else {
                list = sessionRepository.findByUserIdOrderByStartTimeDesc(userId);
            }
        } else {
            return Collections.emptyList();
        }
        return list.stream().map(s -> autoSessionService.mapToDTO(s, null)).collect(Collectors.toList());
    }

    public Optional<SportSessionDTO> getSessionById(Long id) {
        if (id == null) return Optional.empty();
        Optional<SportSession> sessionOpt = sessionRepository.findById(id);
        if (sessionOpt.isEmpty()) {
            return Optional.empty();
        }
        SportSession session = sessionOpt.get();
        SecurityUtils.assertOwnerOrStaff(session.getUserId(), "Không có quyền truy cập thông tin buổi tập của người khác.");
        return Optional.of(autoSessionService.mapToDTO(session, null));
    }

    public SportSessionDTO createSession(SportSessionDTO dto) {
        if (dto == null) {
            return null;
        }
        SportSession session = toEntity(dto);
        return createSession(session);
    }

    public SportSessionDTO createSession(SportSession session) {
        if (session == null) {
            return null;
        }
        if (session.getStatus() == null || session.getStatus().trim().isEmpty()) {
            session.setStatus("Completed");
        }
        Optional<User> currentUser = SecurityUtils.getCurrentUser();
        if (currentUser.isPresent()) {
            User u = currentUser.get();
            if (u.getRole() == Role.ADMIN && session.getUserId() != null) {
                // Admin can record on behalf of athlete
            } else {
                session.setUserId(u.getId());
            }
        }
        SportSession saved = sessionRepository.save(session);

        if (notificationService != null && "Completed".equalsIgnoreCase(saved.getStatus())) {
            notificationService.sendSessionCompletedNotification(saved);
        }

        return autoSessionService.mapToDTO(saved, null);
    }

    public SportSessionDTO createAutoSession(AutoSessionDTO dto) {
        if (dto == null) {
            return null;
        }
        return autoSessionService.processAutoSession(dto);
    }

    public SportSessionDTO updateSession(Long id, SportSessionDTO dto) {
        if (id == null) {
            return null;
        }
        SportSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id " + id));

        SecurityUtils.assertOwnerOrStaff(session.getUserId(), "Không có quyền cập nhật buổi tập của người khác.");

        if (dto != null) {
            if (dto.getSport() != null) session.setSport(dto.getSport());
            if (dto.getDurationMinutes() > 0) session.setDurationMinutes(dto.getDurationMinutes());
            if (dto.getTotalJumps() > 0) session.setTotalJumps(dto.getTotalJumps());
            if (dto.getDirectionChanges() > 0) session.setDirectionChanges(dto.getDirectionChanges());
            if (dto.getAverageAcceleration() > 0.0) session.setAverageAcceleration(dto.getAverageAcceleration());
            if (dto.getAverageSpeed() > 0.0) session.setAverageSpeed(dto.getAverageSpeed());
            if (dto.getMovementIntensity() > 0) session.setMovementIntensity(dto.getMovementIntensity());
            if (dto.getPerformanceScore() > 0) session.setPerformanceScore(dto.getPerformanceScore());
            if (dto.getStatus() != null) session.setStatus(dto.getStatus());
        }
        SportSession saved = sessionRepository.save(session);

        if (notificationService != null && "Completed".equalsIgnoreCase(saved.getStatus())) {
            notificationService.sendSessionCompletedNotification(saved);
        }

        return autoSessionService.mapToDTO(saved, null);
    }

    public SportSessionDTO updateSession(Long id, SportSession updated) {
        if (id == null) {
            return null;
        }
        SportSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id " + id));

        SecurityUtils.assertOwnerOrStaff(session.getUserId(), "Không có quyền cập nhật buổi tập của người khác.");

        if (updated != null) {
            if (updated.getSport() != null) session.setSport(updated.getSport());
            if (updated.getDurationMinutes() > 0) session.setDurationMinutes(updated.getDurationMinutes());
            if (updated.getTotalJumps() > 0) session.setTotalJumps(updated.getTotalJumps());
            if (updated.getDirectionChanges() > 0) session.setDirectionChanges(updated.getDirectionChanges());
            if (updated.getAverageAcceleration() > 0.0) session.setAverageAcceleration(updated.getAverageAcceleration());
            if (updated.getAverageSpeed() > 0.0) session.setAverageSpeed(updated.getAverageSpeed());
            if (updated.getMovementIntensity() > 0) session.setMovementIntensity(updated.getMovementIntensity());
            if (updated.getPerformanceScore() > 0) session.setPerformanceScore(updated.getPerformanceScore());
            if (updated.getStatus() != null) session.setStatus(updated.getStatus());
        }
        SportSession saved = sessionRepository.save(session);

        if (notificationService != null && "Completed".equalsIgnoreCase(saved.getStatus())) {
            notificationService.sendSessionCompletedNotification(saved);
        }

        return autoSessionService.mapToDTO(saved, null);
    }

    public void deleteSession(Long id) {
        if (id == null) return;
        SportSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id " + id));

        boolean isOwner = SecurityUtils.getCurrentUser()
                .map(u -> session.getUserId() != null && session.getUserId().equals(u.getId()))
                .orElse(false);
        boolean isAdmin = SecurityUtils.isAdmin();

        if (!isOwner && !isAdmin) {
            throw new AccessDeniedException("Không có quyền xóa buổi tập của người khác.");
        }

        sessionRepository.delete(session);
    }

    public List<SensorDataDTO> getSessionSensorData(Long sessionId) {
        if (sessionId == null) return Collections.emptyList();
        SportSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id " + sessionId));

        SecurityUtils.assertOwnerOrStaff(session.getUserId(), "Không có quyền xem dữ liệu cảm biến buổi tập của người khác.");

        if (sensorDataService == null) {
            return Collections.emptyList();
        }
        return sensorDataService.getSensorDataBySessionId(sessionId);
    }

    public SportSession toEntity(SportSessionDTO dto) {
        if (dto == null) return null;
        return dto.toEntity();
    }

    public SportSessionDTO toDTO(SportSession entity) {
        if (entity == null) return null;
        return autoSessionService.mapToDTO(entity, null);
    }
}
