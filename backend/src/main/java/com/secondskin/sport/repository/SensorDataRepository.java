package com.secondskin.sport.repository;

import com.secondskin.sport.entity.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
    List<SensorData> findBySessionIdOrderByTimestampAsc(Long sessionId);
    Optional<SensorData> findTop1ByOrderByTimestampDesc();
    List<SensorData> findTop60BySessionIdOrderByTimestampDesc(Long sessionId);
    List<SensorData> findTop50ByDeviceIdOrderByTimestampDesc(String deviceId);
}
