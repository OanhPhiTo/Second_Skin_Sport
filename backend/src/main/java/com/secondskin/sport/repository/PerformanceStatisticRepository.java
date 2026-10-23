package com.secondskin.sport.repository;

import com.secondskin.sport.entity.PerformanceStatistic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PerformanceStatisticRepository extends JpaRepository<PerformanceStatistic, Long> {
    List<PerformanceStatistic> findAllByOrderByDateAsc();
    List<PerformanceStatistic> findBySportIgnoreCaseOrderByDateAsc(String sport);
    List<PerformanceStatistic> findByUserIdOrderByDateAsc(Long userId);
    List<PerformanceStatistic> findByUserIdAndSportIgnoreCaseOrderByDateAsc(Long userId, String sport);
    Optional<PerformanceStatistic> findBySessionId(Long sessionId);
}
