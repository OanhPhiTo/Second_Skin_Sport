package com.secondskin.sport.repository;

import com.secondskin.sport.entity.SportSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SportSessionRepository extends JpaRepository<SportSession, Long> {
    List<SportSession> findAllByOrderByStartTimeDesc();
    List<SportSession> findBySportIgnoreCaseOrderByStartTimeDesc(String sport);
    List<SportSession> findByUserIdOrderByStartTimeDesc(Long userId);
    List<SportSession> findByUserIdAndSportIgnoreCaseOrderByStartTimeDesc(Long userId, String sport);
    List<SportSession> findByUserId(Long userId);
    List<SportSession> findByStatus(String status);
}
