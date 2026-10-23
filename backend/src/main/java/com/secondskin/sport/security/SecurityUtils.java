package com.secondskin.sport.security;

import com.secondskin.sport.entity.Role;
import com.secondskin.sport.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public final class SecurityUtils {
    private SecurityUtils() {}

    public static Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            return Optional.of(user);
        }
        return Optional.empty();
    }

    public static boolean isAdmin() {
        return getCurrentUser().map(u -> u.getRole() == Role.ADMIN).orElse(false);
    }
}
