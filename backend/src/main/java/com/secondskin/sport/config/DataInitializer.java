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
    private final TeamRepository teamRepository;
    private final TeamAthleteRepository athleteRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           DeviceRepository deviceRepository,
                           SportSessionRepository sessionRepository,
                           SensorDataRepository sensorDataRepository,
                           PerformanceStatisticRepository statisticRepository,
                           TeamRepository teamRepository,
                           TeamAthleteRepository athleteRepository,
                           org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.deviceRepository = deviceRepository;
        this.sessionRepository = sessionRepository;
        this.sensorDataRepository = sensorDataRepository;
        this.statisticRepository = statisticRepository;
        this.teamRepository = teamRepository;
        this.athleteRepository = athleteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (sessionRepository.count() > 0) {
            return; // Data already exists
        }

        // 1. Create Default Athletes & Coach in Database (Admin is handled by AdminSeeder)
        User user = new User("Alex Johnson", "alex.athlete@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Basketball");
        User user2 = new User("Sarah Jenkins", "sarah.runner@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Running");
        User user3 = new User("Mike Torres", "mike.coach@secondskin.io", passwordEncoder.encode("password"), Role.COACH, "Basketball");
        User user4 = new User("Emma Watson", "emma.fitness@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Running");
        User user5 = new User("David Beckham", "david.swimmer@secondskin.io", passwordEncoder.encode("password"), Role.USER, "Basketball");
        userRepository.saveAll(List.of(user, user2, user3, user4, user5));

        // 2. Create Devices
        Device patch1 = new Device("Second Skin Patch #001", "SSS-PATCH-001", true, 82, "v2.4.1", "BLE 5.2");
        Device patch2 = new Device("Second Skin Patch #002", "SSS-PATCH-002", true, 78, "v2.3.8", "BLE 5.2");
        Device patch3 = new Device("Second Skin Patch #003", "SSS-PATCH-003", true, 91, "v2.4.1", "BLE 5.2");
        Device patch4 = new Device("Second Skin Patch #004", "SSS-PATCH-004", true, 95, "v2.4.1", "BLE 5.2");
        Device patch5 = new Device("Second Skin Patch #005", "SSS-PATCH-005", true, 88, "v2.4.1", "BLE 5.2");
        Device patch6 = new Device("Second Skin Patch #006", "SSS-PATCH-006", true, 90, "v2.4.1", "BLE 5.2");
        deviceRepository.saveAll(List.of(patch1, patch2, patch3, patch4, patch5, patch6));

        // 2.1 Create Default Squad for Coach Mike Torres
        Team dragons = new Team("Hanoi Dragons Pro", "Basketball", user3.getId(), "Đội tuyển bóng rổ chuyên nghiệp Second Skin");
        Team savedTeam = teamRepository.save(dragons);

        // Starters (ON_FIELD)
        TeamAthlete ath1 = new TeamAthlete(savedTeam.getId(), user.getId(), "Alex Johnson", 7, "PG", "SSS-PATCH-001", AthleteStatus.ON_FIELD);
        ath1.setMinutesPlayed(32);
        ath1.setFatigueIndex(82.5);
        ath1.setCurrentIntensity(88.0);
        ath1.setJumpCount(42);
        ath1.setHighImpactLandings(14);
        ath1.setHeartRate(168);

        TeamAthlete ath2 = new TeamAthlete(savedTeam.getId(), user2.getId(), "Sarah Jenkins", 23, "SG", "SSS-PATCH-002", AthleteStatus.ON_FIELD);
        ath2.setMinutesPlayed(24);
        ath2.setFatigueIndex(58.0);
        ath2.setCurrentIntensity(74.0);
        ath2.setJumpCount(28);
        ath2.setHighImpactLandings(6);
        ath2.setHeartRate(152);

        TeamAthlete ath3 = new TeamAthlete(savedTeam.getId(), user5.getId(), "David Beckham", 34, "C", "SSS-PATCH-003", AthleteStatus.ON_FIELD);
        ath3.setMinutesPlayed(29);
        ath3.setFatigueIndex(76.4);
        ath3.setCurrentIntensity(82.0);
        ath3.setJumpCount(35);
        ath3.setHighImpactLandings(11);
        ath3.setHeartRate(162);

        // Substitutes (BENCH)
        TeamAthlete ath4 = new TeamAthlete(savedTeam.getId(), null, "Chris Paul", 11, "PG", "SSS-PATCH-004", AthleteStatus.BENCH);
        ath4.setMinutesPlayed(0);
        ath4.setFatigueIndex(12.0);
        ath4.setCurrentIntensity(20.0);
        ath4.setJumpCount(0);
        ath4.setHighImpactLandings(0);
        ath4.setHeartRate(78);

        TeamAthlete ath5 = new TeamAthlete(savedTeam.getId(), user4.getId(), "Emma Watson", 15, "SG", "SSS-PATCH-005", AthleteStatus.BENCH);
        ath5.setMinutesPlayed(8);
        ath5.setFatigueIndex(22.0);
        ath5.setCurrentIntensity(35.0);
        ath5.setJumpCount(4);
        ath5.setHighImpactLandings(1);
        ath5.setHeartRate(88);

        TeamAthlete ath6 = new TeamAthlete(savedTeam.getId(), null, "Marcus Smart", 55, "C", "SSS-PATCH-006", AthleteStatus.BENCH);
        ath6.setMinutesPlayed(6);
        ath6.setFatigueIndex(18.5);
        ath6.setCurrentIntensity(30.0);
        ath6.setJumpCount(2);
        ath6.setHighImpactLandings(0);
        ath6.setHeartRate(82);

        athleteRepository.saveAll(List.of(ath1, ath2, ath3, ath4, ath5, ath6));

        // 3. Create Realistic Sport Sessions with dynamic recent dates relative to now
        LocalDateTime now = LocalDateTime.now();
        List<SportSession> sessions = new ArrayList<>();

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Basketball",
                now.minusHours(2).minusMinutes(42),
                now.minusHours(2),
                42, 56, 143, 3.21, 18.4, 88, 91, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Basketball",
                now.minusDays(1).withHour(16).withMinute(0),
                now.minusDays(1).withHour(16).withMinute(38),
                38, 43, 118, 2.89, 17.2, 84, 87, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Running",
                now.minusDays(2).withHour(6).withMinute(15),
                now.minusDays(2).withHour(6).withMinute(46),
                31, 0, 24, 2.41, 14.8, 79, 82, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Basketball",
                now.minusDays(3).withHour(15).withMinute(0),
                now.minusDays(3).withHour(15).withMinute(55),
                55, 48, 135, 3.12, 17.6, 88, 89, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Running",
                now.minusDays(5).withHour(18).withMinute(0),
                now.minusDays(5).withHour(18).withMinute(45),
                45, 0, 16, 2.35, 14.2, 80, 84, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Basketball",
                now.minusDays(7).withHour(17).withMinute(0),
                now.minusDays(7).withHour(17).withMinute(50),
                50, 62, 155, 3.35, 19.1, 90, 94, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Running",
                now.minusDays(9).withHour(7).withMinute(0),
                now.minusDays(9).withHour(7).withMinute(35),
                35, 0, 18, 2.38, 13.9, 76, 80, "Completed"
        ));

        sessions.add(new SportSession(
                user.getId(), patch1.getDeviceId(), "Running",
                now.minusDays(12).withHour(16).withMinute(30),
                now.minusDays(12).withHour(17).withMinute(30),
                60, 0, 20, 2.45, 15.1, 85, 88, "Completed"
        ));

        List<SportSession> savedSessions = sessionRepository.saveAll(sessions);
        Long mainSessionId = savedSessions.get(0).getId();

        // 4. Create Sensor Data Stream for the latest Session
        LocalDateTime baseTime = now.minusHours(2).minusMinutes(42);
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
                    (int) intensity
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
                82
        );
        sensorDataList.add(livePoint);
        sensorDataRepository.saveAll(sensorDataList);

        // 5. Create Performance Statistics (with dynamic dates and computed totalDistance)
        List<PerformanceStatistic> stats = List.of(
                new PerformanceStatistic(savedSessions.get(7).getId(), user.getId(), now.minusDays(12).toLocalDate(), "Running", 15.1, 2.45, 15.1, 0, 20, 85, 88),
                new PerformanceStatistic(savedSessions.get(6).getId(), user.getId(), now.minusDays(9).toLocalDate(), "Running", 13.9, 2.38, 8.1, 0, 18, 76, 80),
                new PerformanceStatistic(savedSessions.get(5).getId(), user.getId(), now.minusDays(7).toLocalDate(), "Basketball", 19.1, 3.35, 6.4, 62, 155, 90, 94),
                new PerformanceStatistic(savedSessions.get(4).getId(), user.getId(), now.minusDays(5).toLocalDate(), "Running", 14.2, 2.35, 10.6, 0, 16, 80, 84),
                new PerformanceStatistic(savedSessions.get(3).getId(), user.getId(), now.minusDays(3).toLocalDate(), "Basketball", 17.6, 3.12, 7.5, 48, 135, 88, 89),
                new PerformanceStatistic(savedSessions.get(2).getId(), user.getId(), now.minusDays(2).toLocalDate(), "Running", 14.8, 2.41, 7.6, 0, 24, 79, 82),
                new PerformanceStatistic(savedSessions.get(1).getId(), user.getId(), now.minusDays(1).toLocalDate(), "Basketball", 17.2, 2.89, 5.8, 43, 118, 84, 87),
                new PerformanceStatistic(savedSessions.get(0).getId(), user.getId(), now.toLocalDate(), "Basketball", 18.4, 3.21, 6.6, 56, 143, 88, 91)
        );
        statisticRepository.saveAll(stats);
    }
}
