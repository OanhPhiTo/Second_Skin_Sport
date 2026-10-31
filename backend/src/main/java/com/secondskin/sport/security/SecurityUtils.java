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

    public static User getRequiredCurrentUser() {
        return getCurrentUser()
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Yêu cầu xác thực người dùng."));
    }

    public static boolean isAdmin() {
        return getCurrentUser().map(u -> u.getRole() == Role.ADMIN).orElse(false);
    }

    public static boolean isCoach() {
        return getCurrentUser().map(u -> u.getRole() == Role.COACH).orElse(false);
    }

    public static boolean isStaff() {
        return getCurrentUser().map(u -> u.getRole() == Role.ADMIN || u.getRole() == Role.COACH).orElse(false);
    }

    public static boolean isOwnerOrStaff(Long resourceUserId) {
        return getCurrentUser().map(u ->
                u.getRole() == Role.ADMIN ||
                u.getRole() == Role.COACH ||
                (resourceUserId != null && resourceUserId.equals(u.getId()))
        ).orElse(false);
    }

    public static void assertOwnerOrStaff(Long resourceUserId) {
        assertOwnerOrStaff(resourceUserId, "Không có quyền truy cập tài nguyên này.");
    }

    public static void assertOwnerOrStaff(Long resourceUserId, String errorMessage) {
        if (!isOwnerOrStaff(resourceUserId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    errorMessage != null ? errorMessage : "Không có quyền truy cập tài nguyên này.");
        }
    }
}
