package com.secondskin.sport.service;

import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.dto.SensorDataDTO;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.exception.ResourceNotFoundException;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.SportSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SensorDataService {
    private final SensorDataRepository sensorDataRepository;
    private final AiCoachService aiCoachService;
    private final SportSessionRepository sessionRepository;

    @Autowired
    public SensorDataService(SensorDataRepository sensorDataRepository,
                             AiCoachService aiCoachService,
                             @Autowired(required = false) SportSessionRepository sessionRepository) {
        this.sensorDataRepository = sensorDataRepository;
        this.aiCoachService = aiCoachService;
        this.sessionRepository = sessionRepository;
    }

    public SensorDataService(SensorDataRepository sensorDataRepository, AiCoachService aiCoachService) {
        this(sensorDataRepository, aiCoachService, null);
    }

    public List<SensorDataDTO> getSensorDataBySessionId(Long sessionId) {
        return getSensorDataDTOBySessionId(sessionId);
    }

    public List<SensorDataDTO> getSensorDataDTOBySessionId(Long sessionId) {
        if (sessionRepository != null && sessionId != null && !sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Session not found: " + sessionId);
        }
        return sensorDataRepository.findBySessionIdOrderByTimestampAsc(sessionId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    public SensorDataDTO saveSensorDataDTO(SensorDataDTO dto) {
        if (dto == null) {
            return null;
        }
        SensorData entity = toEntity(dto);
        if (entity == null) {
            return null;
        }
        if (entity.getTimestamp() == null) {
            entity.setTimestamp(LocalDateTime.now());
        }
        SensorData saved = sensorDataRepository.save(entity);
        return toDTO(saved);
    }

    public Optional<SensorDataDTO> getLatestSensorDataDTO() {
        return sensorDataRepository.findTop1ByOrderByTimestampDesc()
                .map(this::toDTO);
    }

    public List<SensorDataDTO> getRecentDataPointsDTO(Long sessionId) {
        return sensorDataRepository.findTop60BySessionIdOrderByTimestampDesc(sessionId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    // Entity-based methods for internal service compatibility
    public List<SensorData> getRawSensorDataBySessionId(Long sessionId) {
        if (sessionRepository != null && sessionId != null && !sessionRepository.existsById(sessionId)) {
            throw new ResourceNotFoundException("Session not found: " + sessionId);
        }
        return sensorDataRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    public SensorData saveSensorData(SensorData sensorData) {
        if (sensorData == null) {
            return null;
        }
        if (sensorData.getTimestamp() == null) {
            sensorData.setTimestamp(LocalDateTime.now());
        }
        return sensorDataRepository.save(sensorData);
    }

    public Optional<SensorData> getLatestSensorData() {
        return sensorDataRepository.findTop1ByOrderByTimestampDesc();
    }

    public List<SensorData> getRecentDataPoints(Long sessionId) {
        return sensorDataRepository.findTop60BySessionIdOrderByTimestampDesc(sessionId);
    }

    public AiInsightDTO triggerAiAnalysisForSession(Long sessionId, String deviceId) {
        if (sessionRepository == null) {
            throw new IllegalStateException("SportSessionRepository not configured in SensorDataService");
        }
        SportSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        List<SensorData> rawData = sensorDataRepository.findBySessionIdOrderByTimestampAsc(sessionId);
        return aiCoachService.analyzeSession(session, rawData);
    }

    public SensorDataDTO toDTO(SensorData entity) {
        return SensorDataDTO.fromEntity(entity);
    }

    public SensorData toEntity(SensorDataDTO dto) {
        if (dto == null) return null;
        return dto.toEntity();
    }
}
