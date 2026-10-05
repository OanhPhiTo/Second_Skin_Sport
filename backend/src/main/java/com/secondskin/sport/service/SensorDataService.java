package com.secondskin.sport.service;

import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.dto.ActivityAnalysisDTO;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class SensorDataService {
    private final SensorDataRepository sensorDataRepository;
    private final AiServiceClient aiServiceClient;

    public SensorDataService(SensorDataRepository sensorDataRepository, AiServiceClient aiServiceClient) {
        this.sensorDataRepository = sensorDataRepository;
        this.aiServiceClient = aiServiceClient;
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

    public ActivityAnalysisDTO triggerAiAnalysisForSession(Long sessionId, String deviceId) {
        List<SensorData> recentData = getRecentDataPoints(sessionId);
        
        List<Map<String, Object>> mappedSamples = recentData.stream().map(data -> {
            Map<String, Object> sample = new HashMap<>();
            sample.put("ax", data.getAccelerometerX());
            sample.put("ay", data.getAccelerometerY());
            sample.put("az", data.getAccelerometerZ());
            sample.put("gx", data.getGyroscopeX());
            sample.put("gy", data.getGyroscopeY());
            sample.put("gz", data.getGyroscopeZ());
            return sample;
        }).collect(Collectors.toList());

        return aiServiceClient.analyzeSensorData(String.valueOf(sessionId), deviceId, mappedSamples);
    }
}
