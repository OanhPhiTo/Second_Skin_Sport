package com.secondskin.sport.service;

import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.dto.AiInsightDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SensorDataService {
    private final SensorDataRepository sensorDataRepository;
    private final AiCoachService aiCoachService;

    public SensorDataService(SensorDataRepository sensorDataRepository, AiCoachService aiCoachService) {
        this.sensorDataRepository = sensorDataRepository;
        this.aiCoachService = aiCoachService;
    }

    public List<SensorData> getSensorDataBySessionId(Long sessionId) {
        return sensorDataRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }

    public SensorData saveSensorData(SensorData sensorData) {
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
        SportSession session = new SportSession(
                1L, deviceId, "Running",
                LocalDateTime.now().minusMinutes(30), LocalDateTime.now(),
                30, 24, 65, 2.8, 14.2, 78, 85, "Completed"
        );
        return aiCoachService.analyzeSession(session);
    }
}
