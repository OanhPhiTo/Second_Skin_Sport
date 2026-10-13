package com.secondskin.sport.service;

import com.secondskin.sport.dto.AutoSessionDTO;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.repository.SportSessionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SessionService {
    private final SportSessionRepository sessionRepository;
    private final AutoSessionService autoSessionService;

    public SessionService(SportSessionRepository sessionRepository, AutoSessionService autoSessionService) {
        this.sessionRepository = sessionRepository;
        this.autoSessionService = autoSessionService;
    }

    public List<SportSessionDTO> getAllSessions(String sport) {
        List<SportSession> list;
        if (sport != null && !sport.trim().isEmpty() && !sport.equalsIgnoreCase("all")) {
            list = sessionRepository.findBySportIgnoreCaseOrderByStartTimeDesc(sport);
        } else {
            list = sessionRepository.findAllByOrderByStartTimeDesc();
        }
        return list.stream().map(s -> autoSessionService.mapToDTO(s, null)).collect(Collectors.toList());
    }

    public Optional<SportSessionDTO> getSessionById(Long id) {
        return sessionRepository.findById(id).map(s -> autoSessionService.mapToDTO(s, null));
    }

    public SportSessionDTO createSession(SportSession session) {
        if (session.getStatus() == null) {
            session.setStatus("Completed");
        }
        SportSession saved = sessionRepository.save(session);
        return autoSessionService.mapToDTO(saved, null);
    }

    public SportSessionDTO createAutoSession(AutoSessionDTO dto) {
        return autoSessionService.processAutoSession(dto);
    }

    public SportSessionDTO updateSession(Long id, SportSession updated) {
        return sessionRepository.findById(id).map(session -> {
            session.setSport(updated.getSport());
            session.setDurationMinutes(updated.getDurationMinutes());
            session.setTotalJumps(updated.getTotalJumps());
            session.setDirectionChanges(updated.getDirectionChanges());
            session.setAverageAcceleration(updated.getAverageAcceleration());
            session.setAverageSpeed(updated.getAverageSpeed());
            session.setMovementIntensity(updated.getMovementIntensity());
            session.setPerformanceScore(updated.getPerformanceScore());
            session.setStatus(updated.getStatus());
            SportSession saved = sessionRepository.save(session);
            return autoSessionService.mapToDTO(saved, null);
        }).orElseThrow(() -> new RuntimeException("Session not found with id " + id));
    }

    public void deleteSession(Long id) {
        sessionRepository.deleteById(id);
    }
}
