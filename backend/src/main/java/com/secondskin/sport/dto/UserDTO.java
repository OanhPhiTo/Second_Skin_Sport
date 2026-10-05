package com.secondskin.sport.dto;

import com.secondskin.sport.entity.Role;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class UserDTO {
    private Long id;
    private String name;
    private String email;
    private Role role;
    private String preferredSport;
    private LocalDateTime createdAt;
    private boolean enabled;
}
