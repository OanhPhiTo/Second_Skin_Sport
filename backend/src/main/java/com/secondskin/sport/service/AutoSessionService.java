package com.secondskin.sport.service;

import com.secondskin.sport.dto.AiInsightDTO;
import com.secondskin.sport.dto.AutoSessionDTO;
import com.secondskin.sport.dto.SportSessionDTO;
import com.secondskin.sport.dto.TrajectoryPointDTO;
import com.secondskin.sport.entity.PerformanceStatistic;
import com.secondskin.sport.entity.SensorData;
import com.secondskin.sport.entity.SportSession;
import com.secondskin.sport.repository.PerformanceStatisticRepository;
import com.secondskin.sport.repository.SensorDataRepository;
import com.secondskin.sport.repository.SportSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AutoSessionService {

    private final SportSessionRepository sessionRepository;
    private final SensorDataRepository sensorDataRepository;
    private final PerformanceStatisticRepository statisticRepository;
    private final AiCoachService aiCoachService;

    public AutoSessionService(SportSessionRepository sessionRepository,
                              SensorDataRepository sensorDataRepository,
                              PerformanceStatisticRepository statisticRepository,
                              AiCoachService aiCoachService) {
        this.sessionRepository = sessionRepository;
        this.sensorDataRepository = sensorDataRepository;
        this.statisticRepository = statisticRepository;
        this.aiCoachService = aiCoachService;
    }

    @Transactional
    public SportSessionDTO processAutoSession(AutoSessionDTO dto) {
        LocalDateTime start = dto.getStartTime() != null ? dto.getStartTime() : LocalDateTime.now().minusMinutes(30);
        LocalDateTime end = dto.getEndTime() != null ? dto.getEndTime() : LocalDateTime.now();

        int durationMinutes;
        if (dto.getDurationMinutes() != null && dto.getDurationMinutes() > 0) {
            durationMinutes = dto.getDurationMinutes();
        } else {
            long minutes = Duration.between(start, end).toMinutes();
            durationMinutes = (int) Math.max(1, minutes);
        }

        int jumps = dto.getTotalJumps() != null ? dto.getTotalJumps() : 0;
        int directionChanges = dto.getDirectionChanges() != null ? dto.getDirectionChanges() : 0;
        double avgAccel = dto.getAverageAcceleration() != null ? dto.getAverageAcceleration() : 2.85;
        double avgSpeed = dto.getAverageSpeed() != null ? dto.getAverageSpeed() : 16.5;
        int intensity = dto.getMovementIntensity() != null ? dto.getMovementIntensity() : 80;

        // Auto sport classification if not explicitly provided
        String sport = dto.getSport();
        if (sport == null || sport.trim().isEmpty() || sport.equalsIgnoreCase("Auto")) {
            sport = (jumps >= 15 || directionChanges >= 80) ? "Basketball" : "Running";
        }

        // Calculate performance score if not provided
        int score = dto.getPerformanceScore() != null ? dto.getPerformanceScore() :
                Math.min(100, Math.max(50, (int) Math.round(intensity * 0.5 + Math.min(scoreFromMetrics(sport, jumps, directionChanges, avgAccel), 50))));

        Long userId = dto.getUserId() != null ? dto.getUserId() :
                com.secondskin.sport.security.SecurityUtils.getCurrentUser().map(com.secondskin.sport.entity.User::getId).orElse(1L);
        String deviceId = dto.getDeviceId() != null ? dto.getDeviceId() : "ESP32-SUPERMINI-01";
        String status = dto.getStatus() != null ? dto.getStatus() : "Completed";

        SportSession session = new SportSession(
                userId, deviceId, sport, start, end, durationMinutes,
                jumps, directionChanges, avgAccel, avgSpeed, intensity, score, status
        );

        SportSession savedSession = sessionRepository.save(session);

        // Record real longitudinal performance statistics entry
        double totalDistance = Math.round((avgSpeed * (durationMinutes / 60.0)) * 10.0) / 10.0;
        PerformanceStatistic stat = new PerformanceStatistic(
                savedSession.getId(),
                userId,
                start.toLocalDate(),
                sport,
                avgSpeed,
                avgAccel,
                totalDistance,
                jumps,
                directionChanges,
                intensity,
                score
        );
        statisticRepository.save(stat);

        List<SensorData> entitiesToSave = new ArrayList<>();
        // Save representative trajectory points (up to 60 points) to sensor_data for plotting
        if (dto.getTrajectoryPoints() != null && !dto.getTrajectoryPoints().isEmpty()) {
            List<TrajectoryPointDTO> points = dto.getTrajectoryPoints();
            int maxPoints = 60;
            int step = Math.max(1, (int) Math.ceil((double) points.size() / maxPoints));

            for (int i = 0; i < points.size() && entitiesToSave.size() < maxPoints; i += step) {
                TrajectoryPointDTO pt = points.get(i);
                SensorData data = new SensorData(
                        savedSession.getId(),
                        deviceId,
                        pt.getTimestamp() != null ? pt.getTimestamp() : start.plusSeconds(i * 2L),
                        pt.getAccelerometerX(),
                        pt.getAccelerometerY(),
                        pt.getAccelerometerZ(),
                        pt.getGyroscopeX(),
                        pt.getGyroscopeY(),
                        pt.getGyroscopeZ(),
                        pt.getPitch(),
                        pt.getRoll(),
                        pt.getYaw(),
                        pt.getMovementIntensity()
                );
                entitiesToSave.add(data);
            }
            sensorDataRepository.saveAll(entitiesToSave);
        }

        // Run AI Coach Biomechanical Analysis with raw points
        AiInsightDTO aiInsight = aiCoachService.analyzeSession(savedSession, entitiesToSave);

        // Map to SportSessionDTO
        return mapToDTO(savedSession, aiInsight);
    }

    private double scoreFromMetrics(String sport, int jumps, int directionChanges, double avgAccel) {
        if ("Basketball".equalsIgnoreCase(sport)) {
            return (jumps * 0.6) + (directionChanges * 0.2) + (avgAccel * 4.0);
        } else {
            return (avgAccel * 10.0) + (directionChanges * 0.3);
        }
    }

    public SportSessionDTO mapToDTO(SportSession session, AiInsightDTO insight) {
        SportSessionDTO dto = new SportSessionDTO();
        dto.setId(session.getId());
        dto.setUserId(session.getUserId());
        dto.setDeviceId(session.getDeviceId());
        dto.setSport(session.getSport());
        dto.setStartTime(session.getStartTime());
        dto.setEndTime(session.getEndTime());
        dto.setDurationMinutes(session.getDurationMinutes());
        dto.setTotalJumps(session.getTotalJumps());
        dto.setDirectionChanges(session.getDirectionChanges());
        dto.setAverageAcceleration(session.getAverageAcceleration());
        dto.setAverageSpeed(session.getAverageSpeed());
        dto.setMovementIntensity(session.getMovementIntensity());
        dto.setPerformanceScore(session.getPerformanceScore());
        dto.setStatus(session.getStatus());
        dto.setAiInsight(insight);
        return dto;
    }
}
