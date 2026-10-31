package com.secondskin.sport.repository;

import com.secondskin.sport.entity.AthleteStatus;
import com.secondskin.sport.entity.TeamAthlete;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamAthleteRepository extends JpaRepository<TeamAthlete, Long> {
    List<TeamAthlete> findByTeamId(Long teamId);
    List<TeamAthlete> findByTeamIdAndStatus(Long teamId, AthleteStatus status);
    Optional<TeamAthlete> findByDeviceId(String deviceId);
    Optional<TeamAthlete> findByTeamIdAndJerseyNumber(Long teamId, Integer jerseyNumber);
}
