package com.secondskin.sport.config;

import com.secondskin.sport.entity.*;
import com.secondskin.sport.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DeviceRepository deviceRepository;
    private final SportSessionRepository sessionRepository;
    private final SensorDataRepository sensorDataRepository;
    private final PerformanceStatisticRepository statisticRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           DeviceRepository deviceRepository,
                           SportSessionRepository sessionRepository,
                           SensorDataRepository sensorDataRepository,
                           PerformanceStatisticRepository statisticRepository,
                           org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
        this.sensorDataRepository = sensorDataRepository;
        this.statisticRepository = statisticRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (sessionRepository.count() > 0) {
            return; // Data already exists
        }

        // 1. Create Default Admin & Athletes in Database
        User admin = new User("System Administrator", "admin@secondskin.com", passwordEncoder.encode("admin123"), Role.ADMIN, "All");
        User user = new User("Alex Johnson", "alex.athlete@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Basketball");
        User user2 = new User("Sarah Jenkins", "sarah.runner@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Running");
        User user3 = new User("Mike Torres", "mike.coach@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Football");
        User user4 = new User("Emma Watson", "emma.fitness@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Gym");
        User user5 = new User("David Beckham", "david.swimmer@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Basketball");
        userRepository.saveAll(List.of(admin, user, user2, user3, user4, user5));

        // 2. Create Devices
        Device patch1 = new Device("Second Skin Patch #001", "SSS-PATCH-001", true, 82, "v2.4.1", "BLE 5.2");
        Device patch2 = new Device("Second Skin Patch #002", "SSS-PATCH-002", false, 45, "v2.3.8", "BLE 5.2");
        deviceRepository.saveAll(List.of(patch1, patch2));

        // 3. Create Realistic Sport Sessions
        List<SportSession> sessions = new ArrayList<>();

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Basketball",
                LocalDateTime.of(2026, 9, 16, 17, 30),
                LocalDateTime.of(2026, 9, 16, 18, 12),
                42, 56, 143, 3.21, 18.4, 88, 91, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Basketball",
                LocalDateTime.of(2026, 9, 15, 16, 0),
                LocalDateTime.of(2026, 9, 15, 16, 38),
                38, 43, 118, 2.89, 17.2, 84, 87, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Running",
                LocalDateTime.of(2026, 9, 14, 6, 15),
                LocalDateTime.of(2026, 9, 14, 6, 46),
                31, 0, 24, 2.41, 14.8, 79, 82, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Football",
                LocalDateTime.of(2026, 9, 13, 15, 0),
                LocalDateTime.of(2026, 9, 13, 15, 55),
                55, 34, 167, 3.12, 21.6, 92, 89, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Gym",
                LocalDateTime.of(2026, 9, 11, 18, 0),
                LocalDateTime.of(2026, 9, 11, 18, 45),
                45, 18, 42, 1.85, 6.2, 75, 78, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Basketball",
                LocalDateTime.of(2026, 9, 9, 17, 0),
                LocalDateTime.of(2026, 9, 9, 17, 50),
                50, 62, 155, 3.35, 19.1, 90, 94, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Running",
                LocalDateTime.of(2026, 9, 7, 7, 0),
                LocalDateTime.of(2026, 9, 7, 7, 35),
                35, 0, 18, 2.38, 13.9, 76, 80, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Football",
                LocalDateTime.of(2026, 9, 5, 16, 30),
                LocalDateTime.of(2026, 9, 5, 17, 30),
                60, 41, 172, 3.18, 22.1, 91, 92, "Completed"
        ));

        List<SportSession> savedSessions = sessionRepository.saveAll(sessions);
        Long mainSessionId = savedSessions.get(0).getId();

        // 4. Create Sensor Data Stream for the latest Session
        LocalDateTime baseTime = LocalDateTime.of(2026, 9, 16, 17, 30);
        List<SensorData> sensorDataList = new ArrayList<>();

        double[] sampleAccX = {0.82, 1.12, 1.45, 2.10, 3.42, 2.80, 1.65, 0.95, 0.45, 1.30, 2.85, 3.90, 2.10, 1.05, 0.78};
        double[] sampleAccY = {-0.21, 0.15, -0.40, 0.85, 1.20, -0.90, 0.35, -0.15, -0.55, 0.40, 1.10, -0.80, 0.20, -0.30, -0.18};
        double[] sampleAccZ = {9.73, 9.85, 10.45, 12.80, 14.60, 11.20, 9.90, 9.60, 9.70, 10.80, 13.50, 15.20, 10.40, 9.80, 9.75};

        for (int i = 0; i < sampleAccX.length; i++) {
            LocalDateTime ts = baseTime.plusMinutes(i * 2);
            double intensity = 60 + (i % 5) * 8 + (sampleAccX[i] * 5);
            if (intensity > 100) intensity = 95;
            
            SensorData data = new SensorData(
                    mainSessionId,
                    patch1.getDeviceId(),
                    ts,
                    sampleAccX[i],
                    sampleAccY[i],
                    sampleAccZ[i],
                    12.4 + (i * 1.2),
                    4.8 - (i * 0.8),
                    -2.1 + (i * 0.5),
                    12.0 + (i % 6),
                    4.0 + (i % 4),
                    82.0 + (i * 3),
                    (int) intensity,
                    135 + (i * 2)
            );
            sensorDataList.add(data);
        }

        // Add the current real-time instant sensor reading
        SensorData livePoint = new SensorData(
                mainSessionId,
                patch1.getDeviceId(),
                LocalDateTime.now(),
                0.82, -0.21, 9.73,
                12.4, 4.8, -2.1,
                12.0, 4.0, 82.0,
                82,
                142
        );
        sensorDataList.add(livePoint);
        sensorDataRepository.saveAll(sensorDataList);

        // 5. Create Performance Statistics (for historical chart)
        List<PerformanceStatistic> stats = List.of(
                new PerformanceStatistic(savedSessions.get(7).getId(), user.getId(), LocalDate.of(2026, 9, 5), "Football", 22.1, 3.18, 7.8, 41, 172, 91, 92),
                new PerformanceStatistic(savedSessions.get(6).getId(), user.getId(), LocalDate.of(2026, 9, 7), "Running", 13.9, 2.38, 5.2, 0, 18, 76, 80),
                new PerformanceStatistic(savedSessions.get(5).getId(), user.getId(), LocalDate.of(2026, 9, 9), "Basketball", 19.1, 3.35, 6.4, 62, 155, 90, 94),
                new PerformanceStatistic(savedSessions.get(4).getId(), user.getId(), LocalDate.of(2026, 9, 11), "Gym", 6.2, 1.85, 1.2, 18, 42, 75, 78),
                new PerformanceStatistic(savedSessions.get(3).getId(), user.getId(), LocalDate.of(2026, 9, 13), "Football", 21.6, 3.12, 8.4, 34, 167, 92, 89),
                new PerformanceStatistic(savedSessions.get(2).getId(), user.getId(), LocalDate.of(2026, 9, 14), "Running", 14.8, 2.41, 4.9, 0, 24, 79, 82),
                new PerformanceStatistic(savedSessions.get(1).getId(), user.getId(), LocalDate.of(2026, 9, 15), "Basketball", 17.2, 2.89, 5.8, 43, 118, 84, 87),
                new PerformanceStatistic(savedSessions.get(0).getId(), user.getId(), LocalDate.of(2026, 9, 16), "Basketball", 18.4, 3.21, 6.6, 56, 143, 88, 91)
        );
        statisticRepository.saveAll(stats);
    }
}
