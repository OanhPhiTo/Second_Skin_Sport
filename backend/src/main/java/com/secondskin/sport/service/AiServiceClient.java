package com.secondskin.sport.service;

import com.secondskin.sport.dto.ActivityAnalysisDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class AiServiceClient {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000/api/v1}")
    private String aiServiceUrl;

    public AiServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    public ActivityAnalysisDTO analyzeSensorData(String sessionId, String deviceId, List<Map<String, Object>> sensorSamples) {
        String url = aiServiceUrl + "/analyze";
        
        Map<String, Object> requestPayload = Map.of(
            "sessionId", sessionId,
            "deviceId", deviceId,
            "samples", sensorSamples
        );

        try {
            return restTemplate.postForObject(url, requestPayload, ActivityAnalysisDTO.class);
        } catch (Exception e) {
            System.err.println("Failed to call AI Service: " + e.getMessage());
            // Return fallback or null
            return null;
        }
    }
}
